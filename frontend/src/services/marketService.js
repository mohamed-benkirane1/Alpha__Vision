import api, { extractApiError } from './api'

const toNumberOrNull = (value) => {
  if (value === null || value === undefined || value === '') return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

const toBoolean = (value) => value === true

export const normalizeQuote = (quote = {}) => {
  const price = toNumberOrNull(quote.price)

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
    timestamp: quote.timestamp || null,
    cached: toBoolean(quote.cached),
    stale: toBoolean(quote.stale),
    fallback: toBoolean(quote.fallback),
    priceAvailable: quote.priceAvailable === true,
    error: quote.error || null,
  }
}

const normalizeDataQuality = (dataQuality = {}) => ({
  hasFallbacks: toBoolean(dataQuality.hasFallbacks),
  hasStale: toBoolean(dataQuality.hasStale),
  hasErrors: toBoolean(dataQuality.hasErrors),
})

export const normalizeMarketResponse = (payload = {}) => {
  const quotes = Array.isArray(payload.data) ? payload.data.map(normalizeQuote) : []

  return {
    success: payload.success !== false,
    count: Number.isFinite(Number(payload.count)) ? Number(payload.count) : quotes.length,
    timestamp: payload.timestamp || null,
    dataQuality: normalizeDataQuality(payload.dataQuality),
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
    },
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

export const getMarketPrices = () =>
  requestMarketList(() => api.get('/market/prices'))

export const getMarketPrice = async (symbol) => {
  try {
    const response = await api.get(`/market/price/${encodeURIComponent(symbol)}`)
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
  requestMarketList(() => api.get('/market/top', { params: { limit } }))

export const getSpecificMarketPrices = (symbols) =>
  requestMarketList(() => api.post('/market/specific', { symbols }))

export const getMultiMarketPrices = (symbols) =>
  requestMarketList(() => api.get('/market/multi', { params: { symbols: symbols.join(',') } }))

// Legacy names kept for current pages until Live T6/T7.
export const getAllPrices = getMarketPrices
export const getPrice = getMarketPrice
export const getTopCryptos = getTopMarkets
export const getSpecificCryptos = getSpecificMarketPrices
export const getMultiAssets = getMultiMarketPrices
