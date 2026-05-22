import api, { extractApiError } from './api'

const AI_SIGNAL_DEFAULT_SYMBOL = 'BTC'

const normalizeWarnings = (warnings) =>
  Array.isArray(warnings) ? warnings.filter((warning) => typeof warning === 'string' && warning.trim()) : []

const normalizeSignalResponse = (payload = {}) => ({
  success: payload.success === true,
  timestamp: payload.timestamp || null,
  symbol: payload.symbol || null,
  source: payload.source || null,
  provider: payload.provider || null,
  fallback: payload.fallback === true,
  dataQuality: payload.dataQuality || null,
  signal: payload.signal || null,
  warnings: normalizeWarnings(payload.warnings),
  error: payload.error || null,
  raw: payload,
})

export const getAiSignal = async (symbol = AI_SIGNAL_DEFAULT_SYMBOL) => {
  try {
    const response = await api.get('/ai-signal', {
      params: { symbol: symbol || AI_SIGNAL_DEFAULT_SYMBOL },
    })

    return normalizeSignalResponse(response.data)
  } catch (error) {
    const apiError = extractApiError(error)
    const payload = apiError.data || {}

    throw Object.assign(error, {
      normalized: {
        ...normalizeSignalResponse(payload),
        success: false,
        symbol: payload.symbol || symbol || AI_SIGNAL_DEFAULT_SYMBOL,
        error: payload.error || apiError.message,
        status: apiError.status,
      },
    })
  }
}

export default {
  getAiSignal,
}
