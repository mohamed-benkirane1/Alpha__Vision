const Portfolio = require('../models/portfolio');
const PortfolioSnapshot = require('../models/PortfolioSnapshot');
const User = require('../models/user');
const { getPrice } = require('./marketService');

const DEFAULT_MIN_INTERVAL_SECONDS = 300;
const MIN_REQUIRED_HISTORY_POINTS = 2;
const RANGE_DAYS = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
  '1y': 365,
};

function toFiniteNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function round(value, decimals = 2) {
  return Number(toFiniteNumber(value).toFixed(decimals));
}

function getMinIntervalMs() {
  const configured = Number.parseInt(process.env.PORTFOLIO_SNAPSHOT_MIN_INTERVAL_SECONDS, 10);
  const seconds = Number.isFinite(configured) && configured > 0
    ? configured
    : DEFAULT_MIN_INTERVAL_SECONDS;
  return seconds * 1000;
}

function normalizeSnapshotDataQuality(dataQuality = {}) {
  return {
    hasUnavailablePrices: dataQuality.hasUnavailablePrices === true,
    hasFallbackPrices: dataQuality.hasFallbackPrices === true,
    hasStalePrices: dataQuality.hasStalePrices === true,
    hasCachedPrices: dataQuality.hasCachedPrices === true,
    pricedHoldings: toFiniteNumber(dataQuality.pricedHoldings),
    unpricedHoldings: toFiniteNumber(dataQuality.unpricedHoldings),
    totalHoldings: toFiniteNumber(dataQuality.totalHoldings),
    valuationReliable: dataQuality.valuationReliable !== false,
  };
}

function createSnapshotValues(portfolioData = {}) {
  const totals = portfolioData.totals || portfolioData;

  return {
    cashBalance: round(totals.cashBalance ?? portfolioData.balance),
    holdingsValue: round(totals.holdingsValue ?? portfolioData.totalValue),
    totalPortfolioValue: round(totals.totalPortfolioValue),
    totalInvested: round(totals.totalInvested),
    totalProfit: round(totals.totalProfit ?? portfolioData.totalProfit),
    totalProfitPercent: round(totals.totalProfitPercent ?? portfolioData.totalProfitPercent),
    dataQuality: normalizeSnapshotDataQuality(portfolioData.dataQuality),
  };
}

function hasMeaningfulValueChange(snapshot, values) {
  return [
    'cashBalance',
    'holdingsValue',
    'totalPortfolioValue',
    'totalInvested',
    'totalProfit',
    'totalProfitPercent',
  ].some((field) => Math.abs(toFiniteNumber(snapshot[field]) - toFiniteNumber(values[field])) >= 0.01);
}

async function maybeSkipDuplicateSnapshot(userId, portfolioData, source = 'portfolio-refresh') {
  if (source === 'trade') return false;

  const values = createSnapshotValues(portfolioData);
  const latestRecent = await PortfolioSnapshot.findOne({
    user: userId,
    createdAt: { $gte: new Date(Date.now() - getMinIntervalMs()) },
  }).sort({ createdAt: -1 });

  if (!latestRecent) return false;
  return !hasMeaningfulValueChange(latestRecent, values);
}

async function createPortfolioSnapshot(userId, portfolioData, source = 'portfolio-refresh') {
  if (!userId) {
    throw new Error('userId is required for portfolio snapshot.');
  }

  const values = createSnapshotValues(portfolioData);
  const skipped = await maybeSkipDuplicateSnapshot(userId, portfolioData, source);

  if (skipped) {
    return { created: false, skipped: true, snapshot: null };
  }

  const snapshot = await PortfolioSnapshot.create({
    user: userId,
    ...values,
    source,
  });

  return { created: true, skipped: false, snapshot };
}

function createDataQualityFromValuations(valuations) {
  const totalHoldings = valuations.length;
  const unpricedHoldings = valuations.filter((valuation) => !valuation.priceAvailable).length;
  const hasUnavailablePrices = unpricedHoldings > 0;
  const hasFallbackPrices = valuations.some((valuation) => valuation.priceFallback);
  const hasStalePrices = valuations.some((valuation) => valuation.priceStale);

  return {
    hasUnavailablePrices,
    hasFallbackPrices,
    hasStalePrices,
    hasCachedPrices: valuations.some((valuation) => valuation.priceCached),
    pricedHoldings: totalHoldings - unpricedHoldings,
    unpricedHoldings,
    totalHoldings,
    valuationReliable: !hasUnavailablePrices && !hasFallbackPrices && !hasStalePrices,
  };
}

async function valueHoldingForSnapshot(holding) {
  const quantity = toFiniteNumber(holding.quantity);
  const averagePrice = toFiniteNumber(holding.avgPrice);
  const investedValue = quantity * averagePrice;

  try {
    const quote = await getPrice(holding.symbol);
    const price = Number(quote?.price);
    const priceAvailable = quote?.priceAvailable === true
      && quote?.price !== null
      && Number.isFinite(price)
      && price > 0;

    if (!priceAvailable) {
      return {
        investedValue,
        currentValue: null,
        profit: null,
        priceAvailable: false,
        priceCached: quote?.cached === true,
        priceFallback: quote?.fallback === true,
        priceStale: quote?.stale === true,
      };
    }

    const currentValue = quantity * price;
    return {
      investedValue,
      currentValue,
      profit: currentValue - investedValue,
      priceAvailable: true,
      priceCached: quote.cached === true,
      priceFallback: quote.fallback === true,
      priceStale: quote.stale === true,
    };
  } catch {
    return {
      investedValue,
      currentValue: null,
      profit: null,
      priceAvailable: false,
      priceCached: false,
      priceFallback: false,
      priceStale: false,
    };
  }
}

async function buildPortfolioDataFromState(userId) {
  const [user, holdings] = await Promise.all([
    User.findById(userId).select('balance'),
    Portfolio.find({ userId }),
  ]);

  if (!user) {
    throw new Error('User not found for portfolio snapshot.');
  }

  const valuations = await Promise.all(holdings.map(valueHoldingForSnapshot));
  const holdingsValue = valuations.reduce((sum, valuation) => (
    valuation.priceAvailable ? sum + toFiniteNumber(valuation.currentValue) : sum
  ), 0);
  const totalInvested = valuations.reduce((sum, valuation) => sum + toFiniteNumber(valuation.investedValue), 0);
  const pricedInvested = valuations.reduce((sum, valuation) => (
    valuation.priceAvailable ? sum + toFiniteNumber(valuation.investedValue) : sum
  ), 0);
  const totalProfit = valuations.reduce((sum, valuation) => (
    valuation.priceAvailable ? sum + toFiniteNumber(valuation.profit) : sum
  ), 0);
  const cashBalance = round(user.balance);

  return {
    balance: cashBalance,
    totals: {
      cashBalance,
      holdingsValue: round(holdingsValue),
      totalPortfolioValue: round(cashBalance + holdingsValue),
      totalInvested: round(totalInvested),
      totalProfit: round(totalProfit),
      totalProfitPercent: pricedInvested > 0 ? round((totalProfit / pricedInvested) * 100) : 0,
    },
    dataQuality: createDataQualityFromValuations(valuations),
  };
}

async function createPortfolioSnapshotFromState(userId, source = 'trade') {
  const portfolioData = await buildPortfolioDataFromState(userId);
  return createPortfolioSnapshot(userId, portfolioData, source);
}

function normalizeRange(range) {
  return RANGE_DAYS[range] ? range : '30d';
}

function isSupportedRange(range) {
  return Boolean(RANGE_DAYS[range]);
}

async function getPortfolioHistory(userId, range = '30d') {
  const normalizedRange = normalizeRange(range);
  const since = new Date(Date.now() - RANGE_DAYS[normalizedRange] * 24 * 60 * 60 * 1000);

  const snapshots = await PortfolioSnapshot.find({
    user: userId,
    createdAt: { $gte: since },
  }).sort({ createdAt: 1 }).limit(1000);

  return {
    range: normalizedRange,
    snapshots,
  };
}

function serializePortfolioSnapshot(snapshot) {
  return {
    timestamp: snapshot.createdAt?.toISOString?.() || snapshot.createdAt || null,
    totalPortfolioValue: toFiniteNumber(snapshot.totalPortfolioValue),
    cashBalance: toFiniteNumber(snapshot.cashBalance),
    holdingsValue: toFiniteNumber(snapshot.holdingsValue),
    totalInvested: toFiniteNumber(snapshot.totalInvested),
    totalProfit: toFiniteNumber(snapshot.totalProfit),
    totalProfitPercent: toFiniteNumber(snapshot.totalProfitPercent),
    dataQuality: normalizeSnapshotDataQuality(snapshot.dataQuality),
    source: snapshot.source || null,
  };
}

module.exports = {
  MIN_REQUIRED_HISTORY_POINTS,
  createPortfolioSnapshot,
  createPortfolioSnapshotFromState,
  getPortfolioHistory,
  isSupportedRange,
  maybeSkipDuplicateSnapshot,
  serializePortfolioSnapshot,
};
