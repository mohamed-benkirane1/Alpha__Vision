import api, { extractApiError } from './api'

const toNumberOrNull = (value) => {
  if (value === null || value === undefined || value === '') return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

const toBooleanOrNull = (value) => (typeof value === 'boolean' ? value : null)

const normalizeTrade = (trade = {}) => ({
  ...trade,
  symbol: trade.symbol || '',
  type: trade.type || '',
  quantity: toNumberOrNull(trade.quantity),
  price: toNumberOrNull(trade.price),
  executedPrice: toNumberOrNull(trade.executedPrice ?? trade.price),
  total: toNumberOrNull(trade.total),
  priceSource: trade.priceSource || null,
  priceProvider: trade.priceProvider || null,
  priceTimestamp: trade.priceTimestamp || null,
  priceCached: toBooleanOrNull(trade.priceCached),
  priceFallback: toBooleanOrNull(trade.priceFallback),
  priceStale: toBooleanOrNull(trade.priceStale),
  priceError: trade.priceError || null,
})

const normalizeExecution = (execution = {}, trade = {}) => ({
  symbol: execution.symbol || trade.symbol || '',
  action: execution.action || trade.type || '',
  quantity: toNumberOrNull(execution.quantity ?? trade.quantity),
  executedPrice: toNumberOrNull(execution.executedPrice ?? trade.executedPrice ?? trade.price),
  total: toNumberOrNull(execution.total ?? trade.total),
  priceSource: execution.priceSource || trade.priceSource || null,
  priceProvider: execution.priceProvider || trade.priceProvider || null,
  priceTimestamp: execution.priceTimestamp || trade.priceTimestamp || null,
  priceCached: execution.priceCached === true || trade.priceCached === true,
  priceFallback: execution.priceFallback === true || trade.priceFallback === true,
  priceStale: execution.priceStale === true || trade.priceStale === true,
  priceError: execution.priceError || trade.priceError || null,
})

const normalizePriceStatus = (priceStatus = null) => {
  if (!priceStatus) return null

  return {
    symbol: priceStatus.symbol || '',
    price: toNumberOrNull(priceStatus.price),
    priceAvailable: priceStatus.priceAvailable === true,
    source: priceStatus.source || null,
    provider: priceStatus.provider || null,
    timestamp: priceStatus.timestamp || null,
    cached: priceStatus.cached === true,
    fallback: priceStatus.fallback === true,
    stale: priceStatus.stale === true,
    error: priceStatus.error || null,
  }
}

export const normalizeTradeResponse = (payload = {}) => {
  const trade = normalizeTrade(payload.trade)
  const execution = normalizeExecution(payload.execution, trade)

  return {
    success: payload.success === true,
    message: payload.message || '',
    trade,
    execution,
    portfolio: payload.portfolio || null,
    balance: toNumberOrNull(payload.balance ?? payload.portfolio?.balance),
    holding: payload.holding ?? payload.portfolio?.holding ?? null,
    holdingRemoved: payload.holdingRemoved ?? payload.portfolio?.holdingRemoved ?? false,
    priceStatus: normalizePriceStatus(payload.priceStatus),
    raw: payload,
  }
}

export const createTrade = async ({ symbol, type, quantity }) => {
  try {
    const response = await api.post('/trade', { symbol, type, quantity })
    return normalizeTradeResponse(response.data)
  } catch (error) {
    const apiError = extractApiError(error)
    const normalized = {
      success: false,
      message: apiError.message,
      trade: null,
      execution: null,
      portfolio: null,
      balance: null,
      holding: null,
      holdingRemoved: false,
      priceStatus: normalizePriceStatus(apiError.priceStatus),
      status: apiError.status,
      raw: apiError.data,
    }

    throw Object.assign(error, { normalized, priceStatus: normalized.priceStatus })
  }
}

export const getTradeHistory = async () => {
  const response = await api.get('/trade/history')
  return Array.isArray(response.data) ? response.data.map(normalizeTrade) : []
}
