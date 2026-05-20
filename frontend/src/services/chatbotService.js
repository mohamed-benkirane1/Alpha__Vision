import api, { extractApiError } from './api'

const normalizeChatbotResponse = (payload = {}) => {
  const data = payload.data || null
  const answer = data?.answer || data?.message || payload.answer || payload.reply || ''

  return {
    success: Boolean(payload.success),
    timestamp: payload.timestamp || null,
    provider: payload.provider || null,
    source: payload.source || null,
    fallback: Boolean(payload.fallback),
    answer,
    message: answer,
    data,
    warnings: Array.isArray(payload.warnings) ? payload.warnings.filter(Boolean) : [],
    error: payload.error || payload.message || null,
    raw: payload,
  }
}

export const sendChatMessage = async (message, context = null) => {
  const text = typeof message === 'string' ? message.trim() : ''

  if (!text) {
    return {
      success: false,
      timestamp: null,
      provider: null,
      source: null,
      fallback: false,
      answer: '',
      message: '',
      data: null,
      warnings: [],
      error: 'Message required.',
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
      provider: payload.provider || null,
      source: payload.source || null,
      fallback: Boolean(payload.fallback),
      data: payload.data || null,
      warnings: payload.warnings || [],
      error: payload.error || payload.message || apiError.message || 'Unable to contact chatbot.',
    })
  }
}

export const sendMessage = sendChatMessage

export default {
  sendChatMessage,
  sendMessage,
}
