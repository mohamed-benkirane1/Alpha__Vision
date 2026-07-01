import api, { extractApiError } from './api'
import { getErrorMessage } from '../utils/errorMessage'

const normalizeChatbotResponse = (payload = {}) => {
  const data = payload.data || null
  const answer = getErrorMessage(data?.answer || data?.message || payload.response || payload.answer || payload.reply) || ''

  return {
    success: Boolean(payload.success),
    mode: payload.mode || null,
    timestamp: payload.timestamp || null,
    provider: payload.provider || null,
    providerStatus: payload.providerStatus || null,
    source: payload.source || null,
    fallback: Boolean(payload.fallback) || payload.mode === 'fallback',
    answer,
    message: answer,
    data,
    contextUsed: data?.contextUsed || null,
    warnings: Array.isArray(payload.warnings) ? payload.warnings.map(getErrorMessage).filter(Boolean) : [],
    error: getErrorMessage(payload.error || payload.message) || null,
    notFinancialAdvice: payload.notFinancialAdvice !== false && data?.notFinancialAdvice !== false,
    raw: payload,
  }
}

const normalizeHistoryResponse = (payload = {}) => ({
  success: Boolean(payload.success),
  mode: payload.mode || 'history',
  timestamp: payload.timestamp || null,
  provider: payload.provider || null,
  providerStatus: payload.providerStatus || null,
  source: payload.source || null,
  messages: Array.isArray(payload.data?.messages) ? payload.data.messages : [],
  warnings: Array.isArray(payload.warnings) ? payload.warnings.map(getErrorMessage).filter(Boolean) : [],
  error: getErrorMessage(payload.error || payload.message) || null,
  raw: payload,
})

const normalizeContextResponse = (payload = {}) => ({
  success: Boolean(payload.success),
  mode: payload.mode || 'context',
  timestamp: payload.timestamp || null,
  provider: payload.provider || null,
  providerStatus: payload.providerStatus || null,
  source: payload.source || null,
  context: payload.data?.context || null,
  warnings: Array.isArray(payload.warnings) ? payload.warnings.map(getErrorMessage).filter(Boolean) : [],
  error: getErrorMessage(payload.error || payload.message) || null,
  raw: payload,
})

export const sendChatMessage = async (message, context = null) => {
  const text = typeof message === 'string' ? message.trim() : ''

  if (!text) {
    return {
      success: false,
      timestamp: null,
      mode: 'fallback',
      provider: null,
      providerStatus: null,
      source: null,
      fallback: false,
      answer: '',
      message: '',
      data: null,
      warnings: [],
      error: 'Message required.',
      notFinancialAdvice: true,
    }
  }

  try {
    const response = await api.post('/chatbot/message', {
      message: text,
      ...(context ? { context } : {}),
    })

    return normalizeChatbotResponse(response.data)
  } catch (error) {
    const apiError = extractApiError(error)
    const payload = apiError.data || {}

    return normalizeChatbotResponse({
      success: false,
      timestamp: payload.timestamp || null,
      mode: payload.mode || 'fallback',
      provider: payload.provider || null,
      providerStatus: payload.providerStatus || null,
      source: payload.source || null,
      fallback: Boolean(payload.fallback),
      data: payload.data || null,
      warnings: payload.warnings || [],
      error: getErrorMessage(payload.error || payload.message || apiError.message || 'Unable to contact chatbot.'),
    })
  }
}

export const getChatHistory = async () => {
  try {
    const response = await api.get('/chatbot/history')
    return normalizeHistoryResponse(response.data)
  } catch (error) {
    const apiError = extractApiError(error)
    const payload = apiError.data || {}

    return normalizeHistoryResponse({
      success: false,
      timestamp: payload.timestamp || null,
      provider: payload.provider || null,
      providerStatus: payload.providerStatus || null,
      source: payload.source || null,
      data: payload.data || null,
      warnings: payload.warnings || [],
      error: getErrorMessage(payload.error || payload.message || apiError.message || 'Unable to load chatbot history.'),
    })
  }
}

export const getChatContext = async () => {
  try {
    const response = await api.get('/chatbot/context')
    return normalizeContextResponse(response.data)
  } catch (error) {
    const apiError = extractApiError(error)
    const payload = apiError.data || {}

    return normalizeContextResponse({
      success: false,
      timestamp: payload.timestamp || null,
      provider: payload.provider || null,
      providerStatus: payload.providerStatus || null,
      source: payload.source || null,
      data: payload.data || null,
      warnings: payload.warnings || [],
      error: getErrorMessage(payload.error || payload.message || apiError.message || 'Unable to load chatbot context.'),
    })
  }
}

export const sendMessage = sendChatMessage

export default {
  getChatContext,
  getChatHistory,
  sendChatMessage,
  sendMessage,
}
