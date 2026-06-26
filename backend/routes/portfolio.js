const router = require('express').Router();
const auth = require('../middleware/auth');
const Portfolio = require('../models/portfolio');
const User = require('../models/user');
const { getPrice, getPricesBatch } = require('../services/marketService');
const groqService = require('../services/groqService');
const { logActivitySafe } = require('../services/activityService');
const {
  MIN_REQUIRED_HISTORY_POINTS,
  createPortfolioSnapshot,
  getPortfolioHistory,
  isSupportedRange,
  serializePortfolioSnapshot,
} = require('../services/portfolioSnapshotService');

function roundMoney(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Number(number.toFixed(2)) : 0;
}

function formatMoney(value) {
  return roundMoney(value).toFixed(2);
}

function formatPercent(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number.toFixed(2) : null;
}

function roundPercent(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Number(number.toFixed(2)) : 0;
}

function getQuoteMetadata(quote = {}) {
  return {
    priceSource: quote.source || null,
    priceProvider: quote.provider || null,
    priceProviderSymbol: quote.providerSymbol || null,
    priceTimestamp: quote.timestamp || null,
    priceFetchedAt: quote.fetchedAt || quote.timestamp || null,
    priceCached: quote.cached === true,
    priceFallback: quote.fallback === true,
    priceStale: quote.stale === true || quote.isStale === true,
    priceIsLive: quote.isLive === true,
    priceIsStale: quote.stale === true || quote.isStale === true,
    priceError: quote.error || null
  };
}

function createPriceMeta(quote = {}) {
  return {
    source: quote.source || null,
    provider: quote.provider || null,
    providerSymbol: quote.providerSymbol || null,
    isLive: quote.isLive === true,
    isStale: quote.stale === true || quote.isStale === true,
    cached: quote.cached === true,
    fallback: quote.fallback === true,
    fetchedAt: quote.fetchedAt || quote.timestamp || null,
    timestamp: quote.timestamp || null,
    error: quote.error || null
  };
}

function buildUnavailableWarning(symbol, reason) {
  return `Price unavailable for ${symbol || 'unknown symbol'}: ${reason}`;
}

function buildQualityWarnings(symbol, quote) {
  const warnings = [];

  if (quote?.fallback === true) {
    warnings.push(`${symbol} is valued using fallback price. Totals may be inaccurate.`);
  }

  if (quote?.stale === true || quote?.isStale === true) {
    warnings.push(`${symbol} is valued using stale price. Totals may be inaccurate.`);
  }

  return warnings;
}

function createDataQuality(holdings) {
  const totalHoldings = holdings.length;
  const unpricedHoldings = holdings.filter((holding) => holding.priceAvailable === false).length;
  const pricedHoldings = totalHoldings - unpricedHoldings;
  const hasUnavailablePrices = unpricedHoldings > 0;
  const hasFallbackPrices = holdings.some((holding) => holding.priceFallback === true);
  const hasStalePrices = holdings.some((holding) => holding.priceStale === true);
  const hasCachedPrices = holdings.some((holding) => holding.priceCached === true);

  return {
    hasUnavailablePrices,
    hasFallbackPrices,
    hasStalePrices,
    hasCachedPrices,
    pricedHoldings,
    unpricedHoldings,
    totalHoldings,
    valuationReliable: !hasUnavailablePrices && !hasFallbackPrices && !hasStalePrices
  };
}

async function enrichHolding(holding, quoteMap = null) {
  const baseHolding = holding.toObject();
  const symbol = typeof baseHolding.symbol === 'string' ? baseHolding.symbol.trim().toUpperCase() : '';
  const quantity = Number(baseHolding.quantity);
  const avgPrice = Number(baseHolding.avgPrice);
  const costBasis = Number.isFinite(quantity) && Number.isFinite(avgPrice) ? quantity * avgPrice : 0;

  const unavailable = (reason, quote = {}) => ({
    ...baseHolding,
    symbol: symbol || baseHolding.symbol,
    name: quote.name || symbol || baseHolding.symbol,
    type: quote.type || 'unknown',
    currentPrice: null,
    currentValue: null,
    marketValue: null,
    investedValue: roundMoney(costBasis),
    costBasis: formatMoney(costBasis),
    costBasisValue: roundMoney(costBasis),
    avgPrice: Number.isFinite(avgPrice) ? avgPrice : null,
    averagePrice: Number.isFinite(avgPrice) ? avgPrice : null,
    profit: null,
    unrealizedPnl: null,
    profitPercent: null,
    unrealizedPnlPercent: null,
    allocation: 0,
    priceAvailable: false,
    ...getQuoteMetadata(quote),
    priceMeta: createPriceMeta(quote),
    priceError: quote.error || reason,
    warning: buildUnavailableWarning(symbol || baseHolding.symbol, quote.error || reason),
    warnings: [buildUnavailableWarning(symbol || baseHolding.symbol, quote.error || reason)]
  });

  if (!symbol) {
    return unavailable('missing symbol');
  }

  if (!Number.isFinite(quantity) || quantity < 0) {
    return unavailable('invalid quantity');
  }

  try {
    const quote = quoteMap?.has(symbol) ? quoteMap.get(symbol) : await getPrice(symbol);
    const price = Number(quote?.price);

    if (quote?.priceAvailable === false || quote?.price === null || !Number.isFinite(price) || price <= 0) {
      return unavailable('invalid market price', quote);
    }

    const currentValue = quantity * price;
    const profit = currentValue - costBasis;
    const profitPercent = costBasis > 0 ? (profit / costBasis) * 100 : 0;
    const qualityWarnings = buildQualityWarnings(symbol, quote);

    return {
      ...baseHolding,
      symbol,
      name: quote.name || symbol,
      type: quote.type || 'unknown',
      currentPrice: price,
      currentValue: roundMoney(currentValue),
      marketValue: roundMoney(currentValue),
      investedValue: roundMoney(costBasis),
      costBasis: formatMoney(costBasis),
      costBasisValue: roundMoney(costBasis),
      avgPrice: Number.isFinite(avgPrice) ? avgPrice : null,
      averagePrice: Number.isFinite(avgPrice) ? avgPrice : null,
      profit: roundMoney(profit),
      unrealizedPnl: roundMoney(profit),
      profitPercent: roundPercent(profitPercent),
      unrealizedPnlPercent: roundPercent(profitPercent),
      allocation: 0,
      priceAvailable: true,
      ...getQuoteMetadata(quote),
      priceMeta: createPriceMeta(quote),
      warning: qualityWarnings[0] || null,
      warnings: qualityWarnings
    };
  } catch (err) {
    return unavailable(err.message || 'market service error');
  }
}

function createHistoryPayload({ range, data = [], warnings = [], error = null, success = true }) {
  return {
    success,
    timestamp: new Date().toISOString(),
    range,
    count: data.length,
    dataQuality: {
      hasEnoughData: data.length >= MIN_REQUIRED_HISTORY_POINTS,
      minRequiredPoints: MIN_REQUIRED_HISTORY_POINTS,
      usesRealSnapshots: true
    },
    data,
    warnings,
    error
  };
}

async function buildPortfolioState(userId) {
  const user = await User.findById(userId).select('balance');
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  const holdings = await Portfolio.find({ userId });
  const symbols = holdings.map((h) => {
    const s = typeof h.symbol === 'string' ? h.symbol.trim().toUpperCase() : '';
    return s;
  }).filter(Boolean);
  const quotesArray = symbols.length > 0 ? await getPricesBatch(symbols) : [];
  const quoteMap = new Map(symbols.map((sym, i) => [sym, quotesArray[i]]));
  const enriched = await Promise.all(holdings.map((h) => enrichHolding(h, quoteMap)));
  const warnings = enriched.flatMap((holding) => Array.isArray(holding.warnings) ? holding.warnings : []);

  const holdingsValue = enriched.reduce((sum, holding) => {
    if (!holding.priceAvailable) return sum;
    const value = Number(holding.currentValue);
    return Number.isFinite(value) ? sum + value : sum;
  }, 0);

  const totalProfit = enriched.reduce((sum, holding) => {
    if (!holding.priceAvailable) return sum;
    const profit = Number(holding.profit);
    return Number.isFinite(profit) ? sum + profit : sum;
  }, 0);

  const totalInvested = enriched.reduce((sum, holding) => {
    const invested = Number(holding.investedValue);
    return Number.isFinite(invested) ? sum + invested : sum;
  }, 0);

  const pricedInvested = enriched.reduce((sum, holding) => {
    if (!holding.priceAvailable) return sum;
    const invested = Number(holding.investedValue);
    return Number.isFinite(invested) ? sum + invested : sum;
  }, 0);

  const holdingsWithAllocation = enriched.map((holding) => {
    const currentValue = Number(holding.currentValue);
    const allocation = holdingsValue > 0 && Number.isFinite(currentValue)
      ? (currentValue / holdingsValue) * 100
      : 0;

    return {
      ...holding,
      allocation: Number(allocation.toFixed(2)),
    };
  });

  const cashBalance = roundMoney(user.balance);
  const totals = {
    cashBalance,
    holdingsValue: roundMoney(holdingsValue),
    totalPortfolioValue: roundMoney(cashBalance + holdingsValue),
    totalInvested: roundMoney(totalInvested),
    totalProfit: roundMoney(totalProfit),
    totalProfitPercent: pricedInvested > 0 ? roundPercent((totalProfit / pricedInvested) * 100) : 0,
  };

  return {
    timestamp: new Date().toISOString(),
    user,
    holdings: holdingsWithAllocation,
    totals,
    dataQuality: createDataQuality(holdingsWithAllocation),
    warnings,
  };
}

function normalizeAnalysisObject(value = {}) {
  const safeArray = (items) => (Array.isArray(items) ? items.filter(Boolean).map(String).slice(0, 6) : []);

  return {
    summary: typeof value.summary === 'string' && value.summary.trim()
      ? value.summary.trim()
      : 'Portfolio analysis generated from current paper portfolio data.',
    allocation: typeof value.allocation === 'string' ? value.allocation.trim() : '',
    diversification: typeof value.diversification === 'string' ? value.diversification.trim() : '',
    dominantAssets: safeArray(value.dominantAssets),
    risks: safeArray(value.risks),
    positives: safeArray(value.positives),
    notes: safeArray(value.notes),
    disclaimer: 'This is an educational analysis, not financial advice.',
  };
}

function createFallbackPortfolioAnalysis(portfolioState, reason = '') {
  const holdings = Array.isArray(portfolioState.holdings) ? portfolioState.holdings : [];
  const pricedHoldings = holdings.filter((holding) => holding.priceAvailable);
  const sorted = [...pricedHoldings].sort((a, b) => Number(b.allocation || 0) - Number(a.allocation || 0));
  const largest = sorted[0] || null;
  const risks = [];
  const positives = [];
  const notes = [];

  if (holdings.length === 0) {
    risks.push('No open holdings are available to analyze yet.');
    notes.push('Place paper trades first to build a portfolio for analysis.');
  }
  if (holdings.length > 0 && holdings.length < 3) {
    risks.push('The portfolio has few holdings, so diversification is limited.');
  }
  if (largest && Number(largest.allocation) >= 50) {
    risks.push(`${largest.symbol} represents ${Number(largest.allocation).toFixed(1)}% of holdings value, which indicates concentration risk.`);
  }
  if (portfolioState.dataQuality?.valuationReliable === false) {
    risks.push('Some holdings use unavailable, stale, or fallback prices, so valuation quality is imperfect.');
  }
  if (portfolioState.totals.cashBalance > 0) {
    positives.push('The portfolio keeps available virtual cash, which helps maintain flexibility in paper trading.');
  }
  if (holdings.length >= 3) {
    positives.push('The portfolio contains multiple holdings, which improves basic diversification compared with a single-asset portfolio.');
  }
  if (Number(portfolioState.totals.totalProfit) >= 0 && holdings.length > 0) {
    positives.push('Current unrealized performance is non-negative based on available backend valuations.');
  }
  if (reason) notes.push(reason);

  return normalizeAnalysisObject({
    summary: holdings.length > 0
      ? `Current portfolio contains ${holdings.length} holding${holdings.length === 1 ? '' : 's'} with a total virtual value of ${formatMoney(portfolioState.totals.totalPortfolioValue)}.`
      : 'Current portfolio has no open holdings yet.',
    allocation: largest
      ? `Largest allocation is ${largest.symbol} at ${Number(largest.allocation).toFixed(1)}% of holdings value.`
      : 'No priced holdings are available for allocation analysis.',
    diversification: holdings.length >= 3 ? 'Basic diversification is present.' : 'Diversification is limited because there are fewer than three holdings.',
    dominantAssets: sorted.slice(0, 3).map((holding) => `${holding.symbol}: ${Number(holding.allocation || 0).toFixed(1)}%`),
    risks,
    positives,
    notes,
  });
}

async function generatePortfolioAnalysis(portfolioState) {
  const promptPayload = {
    totals: portfolioState.totals,
    dataQuality: portfolioState.dataQuality,
    holdings: portfolioState.holdings.map((holding) => ({
      symbol: holding.symbol,
      name: holding.name,
      type: holding.type,
      quantity: holding.quantity,
      currentValue: holding.currentValue,
      investedValue: holding.investedValue,
      profit: holding.profit,
      profitPercent: holding.profitPercent,
      allocation: holding.allocation,
      priceAvailable: holding.priceAvailable,
    })),
    warnings: portfolioState.warnings,
  };
  const systemPrompt = [
    'You are a cautious portfolio education assistant.',
    'Analyze only the provided paper trading portfolio context.',
    'Do not give direct buy or sell orders.',
    'Return valid JSON with keys: summary, allocation, diversification, dominantAssets, risks, positives, notes, disclaimer.',
    'The disclaimer must be exactly: This is an educational analysis, not financial advice.',
  ].join(' ');

  try {
    const ai = await groqService.generateJSON(
      `Analyze this Alpha Vision paper portfolio context:\n${JSON.stringify(promptPayload)}`,
      systemPrompt,
    );
    return {
      provider: 'groq',
      providerStatus: groqService.getProviderStatus(),
      fallback: false,
      analysis: normalizeAnalysisObject(ai),
      warnings: [],
    };
  } catch (error) {
    const reason = groqService.getErrorMessage(error);
    return {
      provider: 'rules-based',
      providerStatus: groqService.getProviderStatus(error),
      fallback: true,
      analysis: createFallbackPortfolioAnalysis(portfolioState, reason),
      warnings: [reason],
    };
  }
}

router.get('/history', auth, async (req, res) => {
  const requestedRange = typeof req.query.range === 'string' ? req.query.range.trim() : '30d';

  if (!isSupportedRange(requestedRange)) {
    return res.status(400).json(createHistoryPayload({
      range: requestedRange,
      success: false,
      error: 'range must be one of 7d, 30d, 90d, or 1y.'
    }));
  }

  try {
    const history = await getPortfolioHistory(req.user.id, requestedRange);
    const data = history.snapshots.map(serializePortfolioSnapshot);
    const warnings = [];

    if (data.length < MIN_REQUIRED_HISTORY_POINTS) {
      warnings.push('Not enough real portfolio history yet.');
    }

    if (data.some((snapshot) => snapshot.dataQuality?.valuationReliable === false)) {
      warnings.push('Some snapshots were recorded with partial portfolio valuation quality.');
    }

    return res.json(createHistoryPayload({
      range: history.range,
      data,
      warnings
    }));
  } catch (err) {
    return res.status(500).json(createHistoryPayload({
      range: requestedRange,
      success: false,
      error: err.message || 'Unable to load portfolio history.'
    }));
  }
});

router.post('/analyze', auth, async (req, res) => {
  try {
    const portfolioState = await buildPortfolioState(req.user.id);
    const generated = await generatePortfolioAnalysis(portfolioState);
    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      source: 'backend',
      provider: generated.provider,
      providerStatus: generated.providerStatus,
      fallback: generated.fallback,
      analysis: generated.analysis,
      portfolioContext: {
        totals: portfolioState.totals,
        holdingsCount: portfolioState.holdings.length,
        dataQuality: portfolioState.dataQuality,
      },
      warnings: generated.warnings,
      error: null,
      notFinancialAdvice: true,
    };

    await logActivitySafe({
      user: req.user.id,
      type: 'portfolio:analysis',
      title: 'Portfolio AI analysis generated',
      description: generated.fallback
        ? 'A rules-based portfolio analysis was generated because the AI provider was unavailable.'
        : 'An AI portfolio analysis was generated.',
      metadata: {
        provider: generated.provider,
        fallback: generated.fallback,
        holdingsCount: portfolioState.holdings.length,
        totalPortfolioValue: portfolioState.totals.totalPortfolioValue,
      },
    });

    return res.json(response);
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      timestamp: new Date().toISOString(),
      source: 'backend',
      provider: 'portfolio-analysis',
      fallback: false,
      analysis: null,
      portfolioContext: null,
      warnings: [],
      error: err.message || 'Unable to analyze portfolio.',
      notFinancialAdvice: true,
    });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('balance');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        timestamp: new Date().toISOString(),
        holdings: [],
        totals: {
          cashBalance: 0,
          holdingsValue: 0,
          totalPortfolioValue: 0,
          totalInvested: 0,
          totalProfit: 0,
          totalProfitPercent: 0
        },
        dataQuality: createDataQuality([]),
        totalValue: 0,
        totalProfit: 0,
        totalProfitPercent: 0,
        warnings: []
      });
    }

    const holdings = await Portfolio.find({ userId: req.user.id });

    // Batch-fetch all prices in a single Binance call for crypto symbols
    const symbols = holdings.map((h) => {
      const s = typeof h.symbol === 'string' ? h.symbol.trim().toUpperCase() : '';
      return s;
    }).filter(Boolean);
    const quotesArray = symbols.length > 0 ? await getPricesBatch(symbols) : [];
    const quoteMap = new Map(symbols.map((sym, i) => [sym, quotesArray[i]]));

    const enriched = await Promise.all(holdings.map((h) => enrichHolding(h, quoteMap)));
    const warnings = enriched.flatMap((holding) => Array.isArray(holding.warnings) ? holding.warnings : []);

    const holdingsValue = enriched.reduce((sum, holding) => {
      if (!holding.priceAvailable) return sum;
      const value = Number(holding.currentValue);
      return Number.isFinite(value) ? sum + value : sum;
    }, 0);

    const totalProfit = enriched.reduce((sum, holding) => {
      if (!holding.priceAvailable) return sum;
      const profit = Number(holding.profit);
      return Number.isFinite(profit) ? sum + profit : sum;
    }, 0);

    const totalInvested = enriched.reduce((sum, holding) => {
      const invested = Number(holding.investedValue);
      return Number.isFinite(invested) ? sum + invested : sum;
    }, 0);

    const pricedInvested = enriched.reduce((sum, holding) => {
      if (!holding.priceAvailable) return sum;
      const invested = Number(holding.investedValue);
      return Number.isFinite(invested) ? sum + invested : sum;
    }, 0);

    const holdingsWithAllocation = enriched.map((holding) => {
      const currentValue = Number(holding.currentValue);
      const allocation = holdingsValue > 0 && Number.isFinite(currentValue)
        ? (currentValue / holdingsValue) * 100
        : 0;

      return {
        ...holding,
        allocation: Number(allocation.toFixed(2))
      };
    });

    const cashBalance = roundMoney(user.balance);
    const roundedHoldingsValue = roundMoney(holdingsValue);
    const roundedTotalProfit = roundMoney(totalProfit);
    const totalProfitPercent = pricedInvested > 0 ? roundPercent((totalProfit / pricedInvested) * 100) : 0;
    const totals = {
      cashBalance,
      holdingsValue: roundedHoldingsValue,
      totalPortfolioValue: roundMoney(cashBalance + holdingsValue),
      totalInvested: roundMoney(totalInvested),
      totalProfit: roundedTotalProfit,
      totalProfitPercent
    };

    const timestamp = new Date().toISOString();
    const response = {
      success: true,
      timestamp,
      lastUpdated: timestamp,
      balance: cashBalance,
      holdings: holdingsWithAllocation,
      totals,
      dataQuality: createDataQuality(holdingsWithAllocation),
      totalValue: formatMoney(holdingsValue),
      holdingsValue: roundedHoldingsValue,
      totalPortfolioValue: totals.totalPortfolioValue,
      totalProfit: formatMoney(totalProfit),
      totalProfitPercent: pricedInvested > 0 ? formatPercent((totalProfit / pricedInvested) * 100) : 0,
      warnings
    };

    try {
      await createPortfolioSnapshot(req.user.id, response, 'portfolio-refresh');
    } catch (snapshotError) {
      console.warn('Portfolio snapshot refresh failed:', snapshotError.message);
      response.warnings.push('Portfolio loaded, but its performance snapshot could not be recorded.');
    }

    return res.json(response);
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Unable to load portfolio',
      error: err.message || 'Portfolio could not be loaded',
      timestamp: new Date().toISOString(),
      holdings: [],
      totals: {
        cashBalance: 0,
        holdingsValue: 0,
        totalPortfolioValue: 0,
        totalInvested: 0,
        totalProfit: 0,
        totalProfitPercent: 0
      },
      dataQuality: createDataQuality([]),
      totalValue: 0,
      totalProfit: 0,
      totalProfitPercent: 0,
      warnings: [err.message || 'Portfolio could not be loaded']
    });
  }
});

module.exports = router;
