import api, { extractApiError } from './api'

const normalizeArray = (value) => (Array.isArray(value) ? value : [])

const OPTIONAL_BACKTEST_PARAMS = [
  'stopLoss',
  'takeProfit',
  'rsiPeriod',
  'rsiOversold',
  'rsiOverbought',
  'bbPeriod',
  'bbStdDev',
  'emaFast',
  'emaSlow',
  'stochK',
  'stochD',
  'stochOversold',
  'stochOverbought',
]

const hasValue = (value) => value !== undefined && value !== null && value !== ''

const buildBacktestPayload = (params = {}) => {
  const payload = {
    symbol: params.symbol,
    strategy: params.strategy,
    initialCapital: params.initialCapital,
    positionSize: params.positionSize,
    startDate: params.startDate || null,
    endDate: params.endDate || null,
  }

  OPTIONAL_BACKTEST_PARAMS.forEach((key) => {
    if (hasValue(params[key])) payload[key] = params[key]
  })

  return payload
}

export const normalizeBacktestResponse = (payload = {}) => ({
  success: Boolean(payload.success),
  timestamp: payload.timestamp || null,
  source: payload.source || null,
  provider: payload.provider || null,
  fallback: Boolean(payload.fallback),
  dataQuality: {
    usesRealHistoricalData: Boolean(payload.dataQuality?.usesRealHistoricalData),
    usesMockData: Boolean(payload.dataQuality?.usesMockData),
    isIndicative: Boolean(payload.dataQuality?.isIndicative),
    warnings: normalizeArray(payload.dataQuality?.warnings).filter(Boolean),
  },
  params: payload.params || null,
  results: payload.results || null,
  trades: normalizeArray(payload.trades),
  equityCurve: normalizeArray(payload.equityCurve),
  warnings: normalizeArray(payload.warnings).filter(Boolean),
  error: payload.error || payload.message || null,
  raw: payload,
})

export const runBacktest = async (params = {}) => {
  try {
    const response = await api.post('/backtest', buildBacktestPayload(params))

    return normalizeBacktestResponse(response.data)
  } catch (error) {
    const apiError = extractApiError(error)
    const payload = apiError.data || {}

    return normalizeBacktestResponse({
      success: false,
      timestamp: payload.timestamp || null,
      source: payload.source || 'backend',
      provider: payload.provider || 'internal-backtest-engine',
      fallback: Boolean(payload.fallback),
      dataQuality: payload.dataQuality,
      params: payload.params || params,
      results: null,
      trades: [],
      equityCurve: [],
      warnings: payload.warnings || [],
      error: payload.error || payload.message || apiError.message || 'Unable to run backtest.',
    })
  }
}

const normalizeComparisonRow = (row = {}) => ({
  strategy: row.strategy || null,
  success: row.success === true,
  fallback: row.fallback === true,
  source: row.source || null,
  provider: row.provider || null,
  error: row.error || null,
  warnings: normalizeArray(row.warnings).filter(Boolean),
  totalReturn: Number.isFinite(Number(row.totalReturn)) ? Number(row.totalReturn) : null,
  winRate: Number.isFinite(Number(row.winRate)) ? Number(row.winRate) : null,
  maxDrawdown: Number.isFinite(Number(row.maxDrawdown)) ? Number(row.maxDrawdown) : null,
  numberOfTrades: Number.isFinite(Number(row.numberOfTrades)) ? Number(row.numberOfTrades) : 0,
  finalBalance: Number.isFinite(Number(row.finalBalance)) ? Number(row.finalBalance) : null,
  finalCapital: Number.isFinite(Number(row.finalCapital)) ? Number(row.finalCapital) : null,
  totalProfit: Number.isFinite(Number(row.totalProfit)) ? Number(row.totalProfit) : null,
  equityCurve: normalizeArray(row.equityCurve),
  results: row.results || null,
})

export const normalizeBacktestCompareResponse = (payload = {}) => ({
  success: payload.success === true,
  timestamp: payload.timestamp || null,
  source: payload.source || null,
  provider: payload.provider || null,
  fallback: payload.fallback === true,
  params: payload.params || null,
  bestStrategy: payload.bestStrategy || null,
  comparisons: normalizeArray(payload.comparisons).map(normalizeComparisonRow),
  warnings: normalizeArray(payload.warnings).filter(Boolean),
  error: payload.error || payload.message || null,
  raw: payload,
})

export const compareBacktests = async (params = {}) => {
  try {
    const response = await api.post('/backtest/compare', {
      ...buildBacktestPayload(params),
      strategies: Array.isArray(params.strategies) ? params.strategies : [],
    })
    return normalizeBacktestCompareResponse(response.data)
  } catch (error) {
    const apiError = extractApiError(error)
    const payload = apiError.data || {}

    return normalizeBacktestCompareResponse({
      success: false,
      timestamp: payload.timestamp || null,
      source: payload.source || 'backend',
      provider: payload.provider || 'internal-backtest-engine',
      params,
      comparisons: [],
      warnings: payload.warnings || [],
      error: payload.error || payload.message || apiError.message || 'Unable to compare backtests.',
    })
  }
}

export const getBacktestCapabilities = async () => {
  try {
    const response = await api.get('/backtest/strategies')
    const payload = response.data || {}

    return {
      success: payload.success !== false,
      timestamp: payload.timestamp || null,
      strategies: normalizeArray(payload.strategies).filter(Boolean),
      supportedSymbols: normalizeArray(payload.supportedSymbols).filter(Boolean),
      historicalProvider: payload.historicalProvider || null,
      marketType: payload.marketType || null,
      error: payload.error || null,
    }
  } catch (error) {
    const apiError = extractApiError(error)
    const payload = apiError.data || {}

    return {
      success: false,
      timestamp: payload.timestamp || null,
      strategies: [],
      supportedSymbols: [],
      historicalProvider: payload.historicalProvider || null,
      marketType: payload.marketType || null,
      error: payload.error || payload.message || apiError.message || 'Unable to load backtest capabilities.',
    }
  }
}

export default {
  runBacktest,
  compareBacktests,
  getBacktestCapabilities,
}
