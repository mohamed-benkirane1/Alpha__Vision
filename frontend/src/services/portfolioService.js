import api, { extractApiError } from './api'

const toNumberOrNull = (value) => {
  if (value === null || value === undefined || value === '') return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

const toBoolean = (value) => value === true

const normalizeHolding = (holding = {}) => ({
  ...holding,
  symbol: holding.symbol || '',
  name: holding.name || holding.symbol || '',
  type: holding.type || 'unknown',
  quantity: toNumberOrNull(holding.quantity),
  avgPrice: toNumberOrNull(holding.avgPrice),
  averagePrice: toNumberOrNull(holding.averagePrice ?? holding.avgPrice),
  currentPrice: toNumberOrNull(holding.currentPrice),
  currentValue: toNumberOrNull(holding.currentValue),
  investedValue: toNumberOrNull(holding.investedValue ?? holding.costBasis),
  profit: toNumberOrNull(holding.profit),
  profitPercent: toNumberOrNull(holding.profitPercent),
  allocation: toNumberOrNull(holding.allocation) ?? 0,
  priceAvailable: holding.priceAvailable === true,
  priceSource: holding.priceSource || null,
  priceProvider: holding.priceProvider || null,
  priceTimestamp: holding.priceTimestamp || null,
  priceCached: toBoolean(holding.priceCached),
  priceFallback: toBoolean(holding.priceFallback),
  priceStale: toBoolean(holding.priceStale),
  priceError: holding.priceError || null,
  warning: holding.warning || null,
  warnings: Array.isArray(holding.warnings) ? holding.warnings.filter(Boolean) : [],
})

const normalizeTotals = (totals = {}, legacy = {}) => ({
  cashBalance: toNumberOrNull(totals.cashBalance ?? legacy.balance) ?? 0,
  holdingsValue: toNumberOrNull(totals.holdingsValue ?? legacy.totalValue) ?? 0,
  totalPortfolioValue: toNumberOrNull(totals.totalPortfolioValue) ?? (
    (toNumberOrNull(totals.cashBalance ?? legacy.balance) ?? 0) +
    (toNumberOrNull(totals.holdingsValue ?? legacy.totalValue) ?? 0)
  ),
  totalInvested: toNumberOrNull(totals.totalInvested) ?? 0,
  totalProfit: toNumberOrNull(totals.totalProfit ?? legacy.totalProfit) ?? 0,
  totalProfitPercent: toNumberOrNull(totals.totalProfitPercent ?? legacy.totalProfitPercent) ?? 0,
})

const normalizeDataQuality = (dataQuality = {}, holdings = []) => ({
  hasUnavailablePrices: toBoolean(dataQuality.hasUnavailablePrices),
  hasFallbackPrices: toBoolean(dataQuality.hasFallbackPrices),
  hasStalePrices: toBoolean(dataQuality.hasStalePrices),
  hasCachedPrices: toBoolean(dataQuality.hasCachedPrices),
  pricedHoldings: toNumberOrNull(dataQuality.pricedHoldings) ?? holdings.filter((holding) => holding.priceAvailable).length,
  unpricedHoldings: toNumberOrNull(dataQuality.unpricedHoldings) ?? holdings.filter((holding) => !holding.priceAvailable).length,
  totalHoldings: toNumberOrNull(dataQuality.totalHoldings) ?? holdings.length,
  valuationReliable: dataQuality.valuationReliable !== false,
})

export const normalizePortfolioResponse = (payload = {}) => {
  const holdings = Array.isArray(payload.holdings) ? payload.holdings.map(normalizeHolding) : []
  const totals = normalizeTotals(payload.totals, payload)
  const dataQuality = normalizeDataQuality(payload.dataQuality, holdings)
  const warnings = Array.isArray(payload.warnings) ? payload.warnings.filter(Boolean) : []

  return {
    success: payload.success !== false,
    timestamp: payload.timestamp || null,
    lastUpdated: payload.lastUpdated || payload.timestamp || null,
    balance: toNumberOrNull(payload.balance) ?? totals.cashBalance,
    holdings,
    totals,
    dataQuality,
    warnings,
    totalValue: payload.totalValue ?? totals.holdingsValue,
    totalProfit: payload.totalProfit ?? totals.totalProfit,
    totalProfitPercent: payload.totalProfitPercent ?? totals.totalProfitPercent,
    raw: payload,
  }
}

export const getPortfolio = async () => {
  try {
    const response = await api.get('/portfolio')
    return normalizePortfolioResponse(response.data)
  } catch (error) {
    const apiError = extractApiError(error)
    throw Object.assign(error, {
      normalized: {
        success: false,
        message: apiError.message,
        status: apiError.status,
        raw: apiError.data,
      },
    })
  }
}

const normalizePortfolioHistoryPoint = (point = {}) => ({
  timestamp: point.timestamp || null,
  totalPortfolioValue: toNumberOrNull(point.totalPortfolioValue),
  cashBalance: toNumberOrNull(point.cashBalance),
  holdingsValue: toNumberOrNull(point.holdingsValue),
  totalInvested: toNumberOrNull(point.totalInvested),
  totalProfit: toNumberOrNull(point.totalProfit),
  totalProfitPercent: toNumberOrNull(point.totalProfitPercent),
  dataQuality: point.dataQuality || null,
  source: point.source || null,
})

export const normalizePortfolioHistoryResponse = (payload = {}) => {
  const data = Array.isArray(payload.data)
    ? payload.data.map(normalizePortfolioHistoryPoint)
    : []

  return {
    success: payload.success !== false,
    timestamp: payload.timestamp || null,
    range: payload.range || '30d',
    count: toNumberOrNull(payload.count) ?? data.length,
    dataQuality: {
      hasEnoughData: payload.dataQuality?.hasEnoughData === true,
      minRequiredPoints: toNumberOrNull(payload.dataQuality?.minRequiredPoints) ?? 2,
      usesRealSnapshots: payload.dataQuality?.usesRealSnapshots === true,
    },
    data,
    warnings: Array.isArray(payload.warnings) ? payload.warnings.filter(Boolean) : [],
    error: payload.error || null,
    raw: payload,
  }
}

export const getPortfolioHistory = async (range = '30d') => {
  try {
    const response = await api.get('/portfolio/history', { params: { range } })
    return normalizePortfolioHistoryResponse(response.data)
  } catch (error) {
    const apiError = extractApiError(error)
    throw Object.assign(error, {
      normalized: {
        success: false,
        message: apiError.message,
        status: apiError.status,
        raw: apiError.data,
      },
    })
  }
}

export const demoDeposit = async (amount) => {
  const response = await api.post('/payment/demo-deposit', { amount })
  return {
    success: response.data?.success === true,
    message: response.data?.message || '',
    balance: toNumberOrNull(response.data?.balance),
    raw: response.data,
  }
}
