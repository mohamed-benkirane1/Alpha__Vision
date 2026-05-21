import api, { extractApiError } from './api'

const normalizeArray = (value) => (Array.isArray(value) ? value.filter(Boolean) : [])

const normalizeStatus = (status = null) => ({
  isRunning: Boolean(status?.isRunning),
  mode: status?.mode || 'unavailable',
  strategy: status?.strategy || null,
  symbol: status?.symbol || null,
  startedAt: status?.startedAt || null,
  stoppedAt: status?.stoppedAt || null,
})

const normalizeBotResponse = (payload = {}) => {
  const status = normalizeStatus(payload.status)

  return {
    success: Boolean(payload.success),
    timestamp: payload.timestamp || null,
    source: payload.source || null,
    provider: payload.provider || null,
    fallback: Boolean(payload.fallback),
    dataQuality: {
      hasRealBotEngine: Boolean(payload.dataQuality?.hasRealBotEngine),
      usesMockPerformance: Boolean(payload.dataQuality?.usesMockPerformance),
      isIndicative: Boolean(payload.dataQuality?.isIndicative),
      warnings: normalizeArray(payload.dataQuality?.warnings),
    },
    status,
    performance: payload.performance || null,
    recentActions: normalizeArray(payload.recentActions),
    warnings: normalizeArray(payload.warnings),
    error: payload.error || null,
    message: payload.message || '',
    raw: payload,

    // Temporary top-level aliases for existing consumers.
    running: status.isRunning,
    symbol: status.symbol,
    strategy: status.strategy,
    mode: status.mode,
    statusText: status.isRunning ? 'running' : 'stopped',
  }
}

const normalizeError = (error, fallbackMessage) => {
  const apiError = extractApiError(error)
  const payload = apiError.data || {}

  return normalizeBotResponse({
    success: false,
    timestamp: payload.timestamp || null,
    source: payload.source || 'backend',
    provider: payload.provider || 'internal-bot-controller',
    fallback: Boolean(payload.fallback),
    dataQuality: payload.dataQuality,
    status: payload.status || null,
    performance: null,
    recentActions: [],
    warnings: payload.warnings || [],
    message: payload.message || fallbackMessage,
    error: payload.error || payload.message || apiError.message || fallbackMessage,
  })
}

export const getBotStatus = async () => {
  try {
    const response = await api.get('/bot/status')
    return normalizeBotResponse(response.data)
  } catch (error) {
    return normalizeError(error, 'Unable to load bot status.')
  }
}

export const startBot = async ({ symbol, strategy, positionSize, mode = 'paper' } = {}) => {
  try {
    const response = await api.post('/bot/start', {
      symbol,
      strategy,
      mode,
      ...(positionSize ? { positionSize } : {}),
    })
    return normalizeBotResponse(response.data)
  } catch (error) {
    return normalizeError(error, 'Unable to start bot.')
  }
}

export const stopBot = async () => {
  try {
    const response = await api.post('/bot/stop')
    return normalizeBotResponse(response.data)
  } catch (error) {
    return normalizeError(error, 'Unable to stop bot.')
  }
}

export default {
  getBotStatus,
  startBot,
  stopBot,
}
