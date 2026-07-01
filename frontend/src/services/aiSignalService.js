import api, { extractApiError } from './api'

const AI_SIGNAL_DEFAULT_SYMBOL = 'BTC'

const normalizeWarnings = (warnings) =>
  Array.isArray(warnings) ? warnings.filter((warning) => typeof warning === 'string' && warning.trim()) : []

const normalizeConfidencePercent = (value) => {
  const number = Number(value)
  if (!Number.isFinite(number)) return null
  return number <= 1 ? Math.round(number * 100) : Math.round(number)
}

const normalizeSignal = (payload = {}) => {
  const rawSignal = payload.signal

  if (rawSignal && typeof rawSignal === 'object') {
    return {
      ...rawSignal,
      label: rawSignal.label || payload.label || null,
      confidence: normalizeConfidencePercent(rawSignal.confidence ?? payload.confidence),
      summary: rawSignal.summary || rawSignal.analysis || payload.analysis || null,
      analysis: rawSignal.analysis || rawSignal.summary || payload.analysis || null,
      reasons: Array.isArray(rawSignal.reasons) ? rawSignal.reasons : normalizeWarnings(payload.reasons),
      disclaimer: rawSignal.disclaimer || 'Educational analysis only, not financial advice.',
      notFinancialAdvice: rawSignal.notFinancialAdvice !== false,
    }
  }

  if (typeof rawSignal === 'string' || payload.label || payload.analysis) {
    return {
      label: typeof rawSignal === 'string' ? rawSignal : payload.label || null,
      confidence: normalizeConfidencePercent(payload.confidence),
      summary: payload.analysis || null,
      analysis: payload.analysis || null,
      reasons: normalizeWarnings(payload.reasons),
      disclaimer: 'Educational analysis only, not financial advice.',
      notFinancialAdvice: true,
    }
  }

  return null
}

const normalizeSignalResponse = (payload = {}) => {
  const signal = normalizeSignal(payload)

  return {
    success: payload.success === true,
    mode: payload.mode || null,
    timestamp: payload.timestamp || null,
    symbol: payload.symbol || null,
    source: payload.source || null,
    provider: payload.provider || null,
    providerStatus: payload.providerStatus || null,
    fallback: payload.fallback === true || payload.mode === 'fallback' || payload.mode === 'rules',
    dataQuality: payload.dataQuality || null,
    signal,
    label: payload.label || signal?.label || null,
    confidence: normalizeConfidencePercent(payload.confidence ?? signal?.confidence),
    analysis: payload.analysis || signal?.analysis || signal?.summary || null,
    reasons: normalizeWarnings(payload.reasons || signal?.reasons),
    warnings: normalizeWarnings(payload.warnings),
    error: payload.error || payload.message || null,
    notFinancialAdvice: payload.notFinancialAdvice !== false,
    raw: payload,
  }
}

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
