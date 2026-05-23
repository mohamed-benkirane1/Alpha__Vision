import api, { extractApiError } from './api'

const toNumberOrNull = (value) => {
  if (value === null || value === undefined || value === '') return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

const toBoolean = (value) => value === true

const normalizeSymbol = (symbol) => String(symbol || '').trim().toUpperCase()

const normalizePriceMeta = (meta = {}) => ({
  source: meta.source || null,
  provider: meta.provider || null,
  providerSymbol: meta.providerSymbol || null,
  isLive: toBoolean(meta.isLive),
  isStale: toBoolean(meta.isStale),
  cached: toBoolean(meta.cached),
  fallback: toBoolean(meta.fallback),
  fetchedAt: meta.fetchedAt || meta.timestamp || null,
  timestamp: meta.timestamp || null,
  error: meta.error || null,
})

export const normalizeWatchlistItem = (item = {}) => ({
  _id: item._id || null,
  symbol: normalizeSymbol(item.symbol),
  name: item.name || item.symbol || '',
  type: item.type || 'unknown',
  currentPrice: toNumberOrNull(item.currentPrice),
  change24h: toNumberOrNull(item.change24h),
  volume: toNumberOrNull(item.volume),
  marketCap: toNumberOrNull(item.marketCap),
  priceAvailable: item.priceAvailable === true && toNumberOrNull(item.currentPrice) !== null,
  priceMeta: normalizePriceMeta(item.priceMeta),
  warning: item.warning || null,
  createdAt: item.createdAt || null,
  updatedAt: item.updatedAt || null,
})

const normalizeDataQuality = (dataQuality = {}, items = []) => ({
  hasUnavailablePrices: toBoolean(dataQuality.hasUnavailablePrices),
  hasFallbackPrices: toBoolean(dataQuality.hasFallbackPrices),
  hasStalePrices: toBoolean(dataQuality.hasStalePrices),
  hasCachedPrices: toBoolean(dataQuality.hasCachedPrices),
  liveCount: toNumberOrNull(dataQuality.liveCount) ?? items.filter((item) => item.priceMeta.isLive).length,
  totalItems: toNumberOrNull(dataQuality.totalItems) ?? items.length,
  valuationReliable: dataQuality.valuationReliable !== false,
})

export const normalizeWatchlistResponse = (payload = {}) => {
  const items = Array.isArray(payload.watchlist)
    ? payload.watchlist.map(normalizeWatchlistItem)
    : Array.isArray(payload.data)
      ? payload.data.map(normalizeWatchlistItem)
      : []

  return {
    success: payload.success !== false,
    timestamp: payload.timestamp || null,
    count: toNumberOrNull(payload.count) ?? items.length,
    items,
    data: items,
    watchlist: items,
    dataQuality: normalizeDataQuality(payload.dataQuality, items),
    message: payload.message || null,
    duplicate: payload.duplicate === true,
    raw: payload,
  }
}

const normalizeWatchlistError = (error) => {
  const apiError = extractApiError(error)
  return {
    success: false,
    message: apiError.message,
    status: apiError.status,
    items: [],
    data: [],
    watchlist: [],
    dataQuality: normalizeDataQuality(),
    raw: apiError.data,
  }
}

export const getWatchlist = async () => {
  try {
    const response = await api.get('/watchlist')
    return normalizeWatchlistResponse(response.data)
  } catch (error) {
    throw Object.assign(error, { normalized: normalizeWatchlistError(error) })
  }
}

export const addWatchlistSymbol = async (symbol) => {
  try {
    const response = await api.post('/watchlist', { symbol: normalizeSymbol(symbol) })
    return normalizeWatchlistResponse(response.data)
  } catch (error) {
    throw Object.assign(error, { normalized: normalizeWatchlistError(error) })
  }
}

export const removeWatchlistSymbol = async (symbol) => {
  try {
    const response = await api.delete(`/watchlist/${encodeURIComponent(normalizeSymbol(symbol))}`)
    return normalizeWatchlistResponse(response.data)
  } catch (error) {
    throw Object.assign(error, { normalized: normalizeWatchlistError(error) })
  }
}
