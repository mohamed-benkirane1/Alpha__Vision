import api, { extractApiError } from './api'

const toNumberOrNull = (value) => {
  if (value === null || value === undefined || value === '') return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

const toBoolean = (value) => value === true

export const normalizeMarketSymbol = (symbol) => {
  const value = String(symbol || '').trim().toUpperCase()
  return value.endsWith('USDT') && value.length > 4 ? value.slice(0, -4) : value
}

const normalizeSymbolList = (symbols = []) => (
  Array.isArray(symbols)
    ? [...new Set(symbols.map(normalizeMarketSymbol).filter(Boolean))]
    : []
)

export const normalizeQuote = (quote = {}) => {
  const price = toNumberOrNull(quote.price)
  const fallback = toBoolean(quote.fallback)
  const priceAvailable = quote.priceAvailable === true && price !== null
  const stale = toBoolean(quote.stale) || toBoolean(quote.isStale) || fallback || !priceAvailable
  const isLive = quote.isLive === true && priceAvailable && !fallback && !stale

  return {
    symbol: typeof quote.symbol === 'string' ? quote.symbol : '',
    name: quote.name || quote.symbol || '',
    type: quote.type || 'unknown',
    price,
    change24h: toNumberOrNull(quote.change24h),
    volume: toNumberOrNull(quote.volume),
    marketCap: toNumberOrNull(quote.marketCap),
    source: quote.source || null,
    provider: quote.provider || null,
    providerSymbol: quote.providerSymbol || null,
    timestamp: quote.timestamp || null,
    fetchedAt: quote.fetchedAt || quote.timestamp || null,
    cacheTtlSeconds: toNumberOrNull(quote.cacheTtlSeconds),
    cached: toBoolean(quote.cached),
    stale,
    isStale: stale,
    isLive,
    fallback,
    priceAvailable,
    error: quote.error || null,
  }
}

const normalizeDataQuality = (dataQuality = {}) => ({
  hasFallbacks: toBoolean(dataQuality.hasFallbacks),
  hasStale: toBoolean(dataQuality.hasStale),
  hasErrors: toBoolean(dataQuality.hasErrors),
  hasUnavailable: toBoolean(dataQuality.hasUnavailable),
  allLive: toBoolean(dataQuality.allLive),
  liveCount: toNumberOrNull(dataQuality.liveCount) ?? 0,
  staleCount: toNumberOrNull(dataQuality.staleCount) ?? 0,
  fallbackCount: toNumberOrNull(dataQuality.fallbackCount) ?? 0,
  unavailableCount: toNumberOrNull(dataQuality.unavailableCount) ?? 0,
  cachedCount: toNumberOrNull(dataQuality.cachedCount) ?? 0,
})

const normalizeMeta = (meta = {}) => ({
  provider: meta.provider || null,
  providers: Array.isArray(meta.providers) ? meta.providers : [],
  isLive: toBoolean(meta.isLive),
  isStale: toBoolean(meta.isStale),
  hasFallbacks: toBoolean(meta.hasFallbacks),
  hasUnavailable: toBoolean(meta.hasUnavailable),
  fetchedAt: meta.fetchedAt || null,
  cacheTtlSeconds: toNumberOrNull(meta.cacheTtlSeconds),
})

export const normalizeMarketResponse = (payload = {}) => {
  const quotes = Array.isArray(payload.data) ? payload.data.map(normalizeQuote) : []

  return {
    success: payload.success !== false,
    count: Number.isFinite(Number(payload.count)) ? Number(payload.count) : quotes.length,
    timestamp: payload.timestamp || null,
    dataQuality: normalizeDataQuality(payload.dataQuality),
    meta: normalizeMeta(payload.meta),
    quotes,
    data: quotes, // Temporary legacy alias for pages still expecting an array in response.data.
    raw: payload,
  }
}

export const normalizeSingleMarketResponse = (payload = {}) => {
  const quote = normalizeQuote(payload.data || payload)

  return {
    success: payload.success !== false && quote.priceAvailable !== false,
    timestamp: payload.timestamp || quote.timestamp || null,
    meta: normalizeMeta(payload.meta),
    quote,
    data: quote, // Temporary legacy alias for older consumers.
    raw: payload,
  }
}

const normalizeMarketError = (error) => {
  const apiError = extractApiError(error)
  return {
    success: false,
    timestamp: apiError.data?.timestamp || null,
    dataQuality: {
      hasFallbacks: false,
      hasStale: false,
      hasErrors: true,
      hasUnavailable: true,
    },
    meta: normalizeMeta(apiError.data?.meta),
    quotes: [],
    data: [],
    error: apiError.message,
    status: apiError.status,
    raw: apiError.data,
  }
}

const requestMarketList = async (request) => {
  try {
    const response = await request()
    return normalizeMarketResponse(response.data)
  } catch (error) {
    const normalized = normalizeMarketError(error)
    normalized.originalError = error
    throw Object.assign(error, { normalized })
  }
}

export const getMarketPrices = (symbols) => {
  const normalizedSymbols = normalizeSymbolList(symbols)

  return requestMarketList(() => api.get('/market/prices', {
    params: normalizedSymbols.length > 0 ? { symbols: normalizedSymbols.join(',') } : undefined,
    skipAuth: true,
  }))
}

export const getMarketPrice = async (symbol) => {
  try {
    const normalizedSymbol = normalizeMarketSymbol(symbol)
    const response = await api.get(`/market/price/${encodeURIComponent(normalizedSymbol)}`, { skipAuth: true })
    return normalizeSingleMarketResponse(response.data)
  } catch (error) {
    const apiError = extractApiError(error)
    throw Object.assign(error, {
      normalized: {
        success: false,
        timestamp: apiError.data?.timestamp || null,
        quote: null,
        data: null,
        error: apiError.message,
        status: apiError.status,
        raw: apiError.data,
      },
    })
  }
}

export const getTopMarkets = (limit = 100) =>
  requestMarketList(() => api.get('/market/top', { params: { limit }, skipAuth: true }))

export const getSpecificMarketPrices = (symbols) =>
  requestMarketList(() => api.post('/market/specific', { symbols: normalizeSymbolList(symbols) }, { skipAuth: true }))

export const getMultiMarketPrices = (symbols) =>
  requestMarketList(() => api.get('/market/multi', { params: { symbols: normalizeSymbolList(symbols).join(',') }, skipAuth: true }))

// Legacy names kept for current pages until Live T6/T7.
export const getAllPrices = getMarketPrices
export const getPrice = getMarketPrice
export const getTopCryptos = getTopMarkets
export const getSpecificCryptos = getSpecificMarketPrices
export const getMultiAssets = getMultiMarketPrices
