const router = require('express').Router();
const auth = require('../middleware/auth');
const Portfolio = require('../models/portfolio');
const User = require('../models/user');
const { getPrice } = require('../services/marketService');

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
    priceTimestamp: quote.timestamp || null,
    priceCached: quote.cached === true,
    priceFallback: quote.fallback === true,
    priceStale: quote.stale === true,
    priceError: quote.error || null
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

  if (quote?.stale === true) {
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

async function enrichHolding(holding) {
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
    investedValue: roundMoney(costBasis),
    costBasis: formatMoney(costBasis),
    averagePrice: Number.isFinite(avgPrice) ? avgPrice : null,
    profit: null,
    profitPercent: null,
    allocation: 0,
    priceAvailable: false,
    ...getQuoteMetadata(quote),
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
    const quote = await getPrice(symbol);
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
      investedValue: roundMoney(costBasis),
      costBasis: formatMoney(costBasis),
      averagePrice: Number.isFinite(avgPrice) ? avgPrice : null,
      profit: roundMoney(profit),
      profitPercent: roundPercent(profitPercent),
      allocation: 0,
      priceAvailable: true,
      ...getQuoteMetadata(quote),
      warning: qualityWarnings[0] || null,
      warnings: qualityWarnings
    };
  } catch (err) {
    return unavailable(err.message || 'market service error');
  }
}

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

    const enriched = await Promise.all(holdings.map(enrichHolding));
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

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      balance: cashBalance,
      holdings: holdingsWithAllocation,
      totals,
      dataQuality: createDataQuality(holdingsWithAllocation),
      totalValue: formatMoney(holdingsValue),
      totalProfit: formatMoney(totalProfit),
      totalProfitPercent: pricedInvested > 0 ? formatPercent((totalProfit / pricedInvested) * 100) : 0,
      warnings
    });
  } catch (err) {
    res.status(500).json({
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
