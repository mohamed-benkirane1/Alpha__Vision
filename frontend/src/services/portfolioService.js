import api, { extractApiError } from './api'
import { addDemoFunds } from './paymentService'
import { getErrorMessage } from '../utils/errorMessage'

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
  currentValue: toNumberOrNull(holding.marketValue ?? holding.currentValue),
  marketValue: toNumberOrNull(holding.marketValue ?? holding.currentValue),
  investedValue: toNumberOrNull(holding.investedValue ?? holding.costBasisValue ?? holding.costBasis),
  costBasisValue: toNumberOrNull(holding.costBasisValue ?? holding.investedValue ?? holding.costBasis),
  profit: toNumberOrNull(holding.unrealizedPnl ?? holding.profit),
  unrealizedPnl: toNumberOrNull(holding.unrealizedPnl ?? holding.profit),
  profitPercent: toNumberOrNull(holding.unrealizedPnlPercent ?? holding.profitPercent),
  unrealizedPnlPercent: toNumberOrNull(holding.unrealizedPnlPercent ?? holding.profitPercent),
  allocation: toNumberOrNull(holding.allocation) ?? 0,
  priceAvailable: holding.priceAvailable === true,
  priceSource: holding.priceSource || null,
  priceProvider: holding.priceProvider || null,
  priceProviderSymbol: holding.priceProviderSymbol || null,
  priceTimestamp: holding.priceTimestamp || null,
  priceFetchedAt: holding.priceFetchedAt || holding.priceTimestamp || null,
  priceCached: toBoolean(holding.priceCached),
  priceFallback: toBoolean(holding.priceFallback),
  priceStale: toBoolean(holding.priceStale) || toBoolean(holding.priceIsStale),
  priceIsLive: toBoolean(holding.priceIsLive),
  priceIsStale: toBoolean(holding.priceIsStale) || toBoolean(holding.priceStale),
  priceMeta: {
    source: holding.priceMeta?.source || holding.priceSource || null,
    provider: holding.priceMeta?.provider || holding.priceProvider || null,
    providerSymbol: holding.priceMeta?.providerSymbol || holding.priceProviderSymbol || null,
    isLive: toBoolean(holding.priceMeta?.isLive) || toBoolean(holding.priceIsLive),
    isStale: toBoolean(holding.priceMeta?.isStale) || toBoolean(holding.priceIsStale) || toBoolean(holding.priceStale),
    cached: toBoolean(holding.priceMeta?.cached) || toBoolean(holding.priceCached),
    fallback: toBoolean(holding.priceMeta?.fallback) || toBoolean(holding.priceFallback),
    fetchedAt: holding.priceMeta?.fetchedAt || holding.priceFetchedAt || holding.priceTimestamp || null,
    timestamp: holding.priceMeta?.timestamp || holding.priceTimestamp || null,
    error: getErrorMessage(holding.priceMeta?.error || holding.priceError) || null,
  },
  priceError: getErrorMessage(holding.priceError) || null,
  warning: getErrorMessage(holding.warning) || null,
  warnings: Array.isArray(holding.warnings) ? holding.warnings.map(getErrorMessage).filter(Boolean) : [],
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
        message: getErrorMessage(apiError.message),
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
    warnings: Array.isArray(payload.warnings) ? payload.warnings.map(getErrorMessage).filter(Boolean) : [],
    error: getErrorMessage(payload.error) || null,
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
        message: getErrorMessage(apiError.message),
        status: apiError.status,
        raw: apiError.data,
      },
    })
  }
}

const normalizeArray = (items) => (Array.isArray(items) ? items.filter(Boolean).map(String) : [])

export const normalizePortfolioAnalysisResponse = (payload = {}) => ({
  success: payload.success === true,
  timestamp: payload.timestamp || null,
  provider: payload.provider || null,
  providerStatus: payload.providerStatus || null,
  fallback: payload.fallback === true,
  analysis: payload.analysis ? {
    summary: payload.analysis.summary || '',
    allocation: payload.analysis.allocation || '',
    diversification: payload.analysis.diversification || '',
    dominantAssets: normalizeArray(payload.analysis.dominantAssets),
    risks: normalizeArray(payload.analysis.risks),
    positives: normalizeArray(payload.analysis.positives),
    notes: normalizeArray(payload.analysis.notes),
    disclaimer: payload.analysis.disclaimer || 'This is an educational analysis, not financial advice.',
  } : null,
  portfolioContext: payload.portfolioContext || null,
  warnings: Array.isArray(payload.warnings) ? payload.warnings.map(getErrorMessage).filter(Boolean) : [],
  error: getErrorMessage(payload.error || payload.message) || null,
  notFinancialAdvice: payload.notFinancialAdvice !== false,
  raw: payload,
})

export const analyzePortfolio = async () => {
  try {
    const response = await api.post('/portfolio/analyze')
    return normalizePortfolioAnalysisResponse(response.data)
  } catch (error) {
    const apiError = extractApiError(error)
    return normalizePortfolioAnalysisResponse({
      success: false,
      provider: 'portfolio-analysis',
      analysis: null,
      warnings: [],
      error: getErrorMessage(apiError.message || 'Unable to analyze portfolio.'),
    })
  }
}

export const normalizePortfolioRiskScoreResponse = (payload = {}) => ({
  success: payload.success === true,
  timestamp: payload.timestamp || null,
  provider: payload.provider || null,
  score: toNumberOrNull(payload.score),
  level: payload.level || null,
  summary: payload.summary || '',
  positivePoints: normalizeArray(payload.positivePoints),
  riskFactors: normalizeArray(payload.riskFactors),
  suggestions: normalizeArray(payload.suggestions),
  disclaimer: payload.disclaimer || 'This is an educational risk estimate, not financial advice.',
  portfolioContext: payload.portfolioContext || null,
  dataQuality: payload.dataQuality || null,
  warnings: Array.isArray(payload.warnings) ? payload.warnings.map(getErrorMessage).filter(Boolean) : [],
  error: getErrorMessage(payload.error || payload.message) || null,
  notFinancialAdvice: payload.notFinancialAdvice !== false,
  raw: payload,
})

export const getPortfolioRiskScore = async () => {
  try {
    const response = await api.get('/portfolio/risk-score')
    return normalizePortfolioRiskScoreResponse(response.data)
  } catch (error) {
    const apiError = extractApiError(error)
    return normalizePortfolioRiskScoreResponse({
      success: false,
      provider: 'rules-based-risk-score',
      score: null,
      level: null,
      positivePoints: [],
      riskFactors: [],
      suggestions: [],
      warnings: [],
      error: getErrorMessage(apiError.message || 'Unable to calculate portfolio risk score.'),
    })
  }
}

export const demoDeposit = async (amount) => {
  const response = await addDemoFunds(amount)

  return {
    success: response.success === true,
    message: getErrorMessage(response.message) || '',
    balance: toNumberOrNull(response.balance),
    raw: response.raw,
  }
}
