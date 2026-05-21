import api, { extractApiError } from './api'

const normalizeArray = (value) => (Array.isArray(value) ? value : [])

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
    const response = await api.post('/backtest', {
      symbol: params.symbol,
      strategy: params.strategy,
      initialCapital: params.initialCapital,
      positionSize: params.positionSize,
      startDate: params.startDate || null,
      endDate: params.endDate || null,
    })

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
  getBacktestCapabilities,
}
