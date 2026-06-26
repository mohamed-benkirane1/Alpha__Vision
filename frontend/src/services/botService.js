import api, { extractApiError } from './api'

const normalizeArray = (value) => (Array.isArray(value) ? value.filter(Boolean) : [])

const OPTIONAL_BOT_PARAMS = [
  'quantity',
  'intervalSeconds',
  'riskLevel',
  'rsiPeriod',
  'rsiOversold',
  'rsiOverbought',
  'macdFast',
  'macdSlow',
  'macdSignal',
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

const toNumberOrNull = (value) => {
  if (value === null || value === undefined || value === '') return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

const normalizeStatus = (status = null) => ({
  isRunning: Boolean(status?.isRunning),
  status: status?.status || (status?.isRunning ? 'running' : 'stopped'),
  mode: status?.mode || 'paper',
  strategy: status?.strategy || null,
  symbol: status?.symbol || null,
  executeTrades: status?.executeTrades === true,
  quantity: toNumberOrNull(status?.quantity),
  startedAt: status?.startedAt || null,
  stoppedAt: status?.stoppedAt || null,
  lastTickAt: status?.lastTickAt || null,
  lastRunAt: status?.lastRunAt || status?.lastTickAt || null,
  positionSize: toNumberOrNull(status?.positionSize),
  maxPositionSize: toNumberOrNull(status?.maxPositionSize),
  riskLevel: status?.riskLevel || null,
  intervalSeconds: toNumberOrNull(status?.intervalSeconds),
  lastDecision: status?.lastDecision || null,
  lastError: status?.lastError || null,
})

const normalizeAction = (action = {}) => ({
  id: action.id || action._id || null,
  bot: action.bot || null,
  symbol: action.symbol || null,
  action: action.action || null,
  decision: action.decision || action.action || null,
  mode: action.mode || 'paper',
  reason: action.reason || '',
  quantity: toNumberOrNull(action.quantity),
  price: toNumberOrNull(action.price),
  priceSource: action.priceSource || null,
  priceProvider: action.priceProvider || null,
  priceProviderSymbol: action.priceProviderSymbol || null,
  priceTimestamp: action.priceTimestamp || null,
  priceFetchedAt: action.priceFetchedAt || action.priceTimestamp || null,
  priceCached: action.priceCached === true,
  priceFallback: action.priceFallback === true,
  priceStale: action.priceStale === true || action.priceIsStale === true,
  priceIsLive: action.priceIsLive === true,
  priceIsStale: action.priceIsStale === true || action.priceStale === true,
  confidence: toNumberOrNull(action.confidence),
  strategy: action.strategy || null,
  executed: action.executed === true,
  trade: action.trade || null,
  execution: action.execution || null,
  error: action.error || null,
  createdAt: action.createdAt || action.timestamp || null,
  timestamp: action.timestamp || action.createdAt || null,
})

const normalizePerformance = (performance = null) => {
  if (!performance) return null

  return {
    actionsCount: toNumberOrNull(performance.actionsCount) ?? 0,
    buyCount: toNumberOrNull(performance.buyCount) ?? 0,
    sellCount: toNumberOrNull(performance.sellCount) ?? 0,
    holdCount: toNumberOrNull(performance.holdCount) ?? 0,
    skipCount: toNumberOrNull(performance.skipCount) ?? 0,
    executedCount: toNumberOrNull(performance.executedCount) ?? 0,
    realizedPnl: toNumberOrNull(performance.realizedPnl),
    pnlAvailable: performance.pnlAvailable === true,
  }
}

const normalizeBotResponse = (payload = {}) => {
  const status = normalizeStatus(payload.status || payload.bot)

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
      strategyUsesRealCandles: Boolean(payload.dataQuality?.strategyUsesRealCandles),
      canExecutePaperTrades: Boolean(payload.dataQuality?.canExecutePaperTrades),
      warnings: normalizeArray(payload.dataQuality?.warnings),
    },
    bot: status,
    status,
    performance: normalizePerformance(payload.performance),
    recentActions: normalizeArray(payload.recentActions).map(normalizeAction),
    decision: payload.decision ? normalizeAction(payload.decision) : null,
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
    provider: payload.provider || 'internal-paper-bot',
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

export const startBot = async ({
  symbol,
  strategy,
  positionSize,
  executeTrades,
  mode = 'paper',
  ...params
} = {}) => {
  try {
    const payload = {
      symbol,
      strategy,
      mode,
      positionSize,
      executeTrades: executeTrades === true,
    }

    OPTIONAL_BOT_PARAMS.forEach((key) => {
      if (hasValue(params[key])) payload[key] = params[key]
    })

    const response = await api.post('/bot/start', payload)
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

export const runBotTick = async () => {
  try {
    const response = await api.post('/bot/tick')
    return normalizeBotResponse(response.data)
  } catch (error) {
    return normalizeError(error, 'Unable to run bot tick.')
  }
}

export const getBotActions = async (limit = 20) => {
  try {
    const response = await api.get('/bot/history', { params: { limit } })
    return normalizeBotResponse(response.data)
  } catch (error) {
    return normalizeError(error, 'Unable to load bot actions.')
  }
}

export const getBotHistory = getBotActions

export default {
  getBotStatus,
  startBot,
  stopBot,
  runBotTick,
  getBotActions,
  getBotHistory,
}
