import api, { extractApiError } from './api'
import { getErrorMessage } from '../utils/errorMessage'

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
  side: trade.type || '',
  mode: trade.mode || 'paper',
  status: trade.status || 'executed',
  orderType: trade.orderType || 'market',
  quantity: toNumberOrNull(trade.quantity),
  price: toNumberOrNull(trade.price),
  executedPrice: toNumberOrNull(trade.executedPrice ?? trade.price),
  fees: toNumberOrNull(trade.fees) ?? 0,
  realizedPnl: toNumberOrNull(trade.realizedPnl),
  balanceBefore: toNumberOrNull(trade.balanceBefore),
  balanceAfter: toNumberOrNull(trade.balanceAfter),
  holdingQuantityBefore: toNumberOrNull(trade.holdingQuantityBefore),
  holdingQuantityAfter: toNumberOrNull(trade.holdingQuantityAfter),
  avgPriceBefore: toNumberOrNull(trade.avgPriceBefore),
  avgPriceAfter: toNumberOrNull(trade.avgPriceAfter),
  total: toNumberOrNull(trade.total),
  priceSource: trade.priceSource || null,
  priceProvider: trade.priceProvider || null,
  priceProviderSymbol: trade.priceProviderSymbol || null,
  priceTimestamp: trade.priceTimestamp || null,
  priceFetchedAt: trade.priceFetchedAt || trade.priceTimestamp || null,
  priceCached: toBooleanOrNull(trade.priceCached),
  priceFallback: toBooleanOrNull(trade.priceFallback),
  priceStale: toBooleanOrNull(trade.priceStale),
  priceIsLive: toBooleanOrNull(trade.priceIsLive),
  priceIsStale: toBooleanOrNull(trade.priceIsStale ?? trade.priceStale),
  priceError: getErrorMessage(trade.priceError) || null,
})

const normalizeExecution = (execution = {}, trade = {}) => ({
  symbol: execution.symbol || trade.symbol || '',
  mode: execution.mode || trade.mode || 'paper',
  status: execution.status || trade.status || 'executed',
  orderType: execution.orderType || trade.orderType || 'market',
  action: execution.action || trade.type || '',
  quantity: toNumberOrNull(execution.quantity ?? trade.quantity),
  executedPrice: toNumberOrNull(execution.executedPrice ?? trade.executedPrice ?? trade.price),
  total: toNumberOrNull(execution.total ?? trade.total),
  fees: toNumberOrNull(execution.fees ?? trade.fees) ?? 0,
  realizedPnl: toNumberOrNull(execution.realizedPnl ?? trade.realizedPnl),
  priceSource: execution.priceSource || trade.priceSource || null,
  priceProvider: execution.priceProvider || trade.priceProvider || null,
  priceProviderSymbol: execution.priceProviderSymbol || trade.priceProviderSymbol || null,
  priceTimestamp: execution.priceTimestamp || trade.priceTimestamp || null,
  priceFetchedAt: execution.priceFetchedAt || trade.priceFetchedAt || execution.priceTimestamp || trade.priceTimestamp || null,
  priceCached: execution.priceCached === true || trade.priceCached === true,
  priceFallback: execution.priceFallback === true || trade.priceFallback === true,
  priceStale: execution.priceStale === true || execution.priceIsStale === true || trade.priceStale === true || trade.priceIsStale === true,
  priceIsLive: execution.priceIsLive === true || trade.priceIsLive === true,
  priceIsStale: execution.priceIsStale === true || execution.priceStale === true || trade.priceIsStale === true || trade.priceStale === true,
  priceError: getErrorMessage(execution.priceError || trade.priceError) || null,
})

const normalizePriceStatus = (priceStatus = null) => {
  if (!priceStatus) return null

  return {
    symbol: priceStatus.symbol || '',
    price: toNumberOrNull(priceStatus.price),
    priceAvailable: priceStatus.priceAvailable === true,
    source: priceStatus.source || null,
    provider: priceStatus.provider || null,
    providerSymbol: priceStatus.providerSymbol || null,
    timestamp: priceStatus.timestamp || null,
    fetchedAt: priceStatus.fetchedAt || priceStatus.timestamp || null,
    cacheTtlSeconds: toNumberOrNull(priceStatus.cacheTtlSeconds),
    cached: priceStatus.cached === true,
    fallback: priceStatus.fallback === true,
    stale: priceStatus.stale === true || priceStatus.isStale === true,
    isLive: priceStatus.isLive === true,
    isStale: priceStatus.isStale === true || priceStatus.stale === true,
    error: getErrorMessage(priceStatus.error) || null,
  }
}

export const normalizeTradeResponse = (payload = {}) => {
  const trade = normalizeTrade(payload.trade)
  const execution = normalizeExecution(payload.execution, trade)

  return {
    success: payload.success === true,
    mode: payload.mode || trade.mode || 'paper',
    status: payload.status || trade.status || 'executed',
    orderType: payload.orderType || trade.orderType || 'market',
    message: getErrorMessage(payload.message) || '',
    trade,
    execution,
    portfolio: payload.portfolio || null,
    balance: toNumberOrNull(payload.balance ?? payload.portfolio?.balance),
    holding: payload.holding ?? payload.portfolio?.holding ?? null,
    holdingRemoved: payload.holdingRemoved ?? payload.portfolio?.holdingRemoved ?? false,
    priceStatus: normalizePriceStatus(payload.priceStatus),
    writeIntegrity: payload.writeIntegrity || null,
    warnings: Array.isArray(payload.warnings) ? payload.warnings.map(getErrorMessage).filter(Boolean) : [],
    raw: payload,
  }
}

export const createTrade = async ({ symbol, type, quantity, orderType = 'market' }) => {
  try {
    const response = await api.post('/trade/order', { symbol, type, quantity, orderType })
    return normalizeTradeResponse(response.data)
  } catch (error) {
    const apiError = extractApiError(error)
    const normalized = {
      success: false,
      message: getErrorMessage(apiError.message),
      trade: null,
      execution: null,
      portfolio: null,
      balance: null,
      holding: null,
      holdingRemoved: false,
      priceStatus: normalizePriceStatus(apiError.priceStatus),
      writeIntegrity: null,
      warnings: [],
      status: apiError.status,
      raw: apiError.data,
    }

    throw Object.assign(error, { normalized, priceStatus: normalized.priceStatus })
  }
}

export const getTradeHistory = async () => {
  const response = await api.get('/trade/history')
  const payload = response.data
  const trades = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload?.trades)
        ? payload.trades
        : []

  return trades.map(normalizeTrade)
}
