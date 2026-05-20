const axios = require('axios');

const PROVIDER = 'DeepSeek';
const SOURCE = 'deepseek';
const MODEL = 'deepseek-chat';
const FALLBACK_PROVIDER = 'static-fallback';
const FALLBACK_SOURCE = 'fallback';
const SYSTEM_PROMPT = [
  'You are Alpha Vision AI, an expert trading assistant.',
  'Only answer questions about trading, crypto markets, stock markets, technical analysis, risk management, and portfolio optimization.',
  'If the user asks about unrelated topics, say you can only answer questions about trading, cryptocurrencies, stocks, and financial markets.',
  'Do not claim to know private account data unless it is explicitly provided in the conversation context.',
].join(' ');

function nowIso() {
  return new Date().toISOString();
}

function cleanMessage(message) {
  return typeof message === 'string' ? message.trim() : '';
}

function createSuccessResponse(answer, { model = MODEL, usage = null } = {}) {
  return {
    success: true,
    timestamp: nowIso(),
    provider: PROVIDER,
    source: SOURCE,
    fallback: false,
    data: {
      answer,
      message: answer,
      model,
      usage,
    },
    warnings: [],
    error: null,
  };
}

function createFallbackResponse(reason) {
  const answer = 'Assistant temporarily unavailable.';

  return {
    success: true,
    timestamp: nowIso(),
    provider: FALLBACK_PROVIDER,
    source: FALLBACK_SOURCE,
    fallback: true,
    data: {
      answer,
      message: answer,
      model: null,
      usage: null,
    },
    warnings: [reason || 'AI provider unavailable or API key missing. This response is fallback.'],
    error: null,
  };
}

function createErrorResponse(error) {
  return {
    success: false,
    timestamp: nowIso(),
    provider: PROVIDER,
    source: SOURCE,
    fallback: false,
    data: null,
    warnings: [],
    error: error || 'Unable to contact AI provider.',
  };
}

function mapConversationHistory(history = []) {
  if (!Array.isArray(history)) return [];

  return history
    .slice(-20)
    .map((item) => {
      const role = item?.role === 'assistant' ? 'assistant' : 'user';
      const content = cleanMessage(item?.content);
      return content ? { role, content } : null;
    })
    .filter(Boolean);
}

async function chat(message, history = []) {
  const userMessage = cleanMessage(message);
  if (!userMessage) {
    return createErrorResponse('Message required.');
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey || apiKey === 'sk_placeholder') {
    return createFallbackResponse('DeepSeek API key is not configured. This response is fallback.');
  }

  try {
    const response = await axios.post(
      'https://api.deepseek.com/v1/chat/completions',
      {
        model: MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...mapConversationHistory(history),
          { role: 'user', content: userMessage },
        ],
        max_tokens: 500,
      },
      {
        headers: { Authorization: `Bearer ${apiKey}` },
        timeout: 15000,
      },
    );

    const answer = cleanMessage(response.data?.choices?.[0]?.message?.content);
    if (!answer) {
      return createErrorResponse('AI provider returned an empty response.');
    }

    return createSuccessResponse(answer, {
      model: response.data?.model || MODEL,
      usage: response.data?.usage || null,
    });
  } catch (error) {
    const status = error?.response?.status;
    const providerMessage = error?.response?.data?.error?.message || error?.message;
    const message = status
      ? `AI provider error (${status}): ${providerMessage || 'request failed'}`
      : providerMessage || 'Unable to contact AI provider.';

    return createErrorResponse(message);
  }
}

module.exports = {
  chat,
  createErrorResponse,
  createFallbackResponse,
};
