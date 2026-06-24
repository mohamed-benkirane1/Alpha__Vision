const axios = require('axios');

const PROVIDER = 'gemini';
const DEFAULT_MODEL = 'gemini-2.5-flash';
const API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';
const DEFAULT_TIMEOUT_MS = 30000;
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1200;
const PLACEHOLDER_API_KEYS = new Set([
  'your_gemini_api_key',
  'your_gemini_api_key_here',
]);

function getGeminiModel() {
  return String(process.env.GEMINI_MODEL || DEFAULT_MODEL).trim().replace(/^models\//, '') || DEFAULT_MODEL;
}

function hasGeminiKey() {
  const apiKey = process.env.GEMINI_API_KEY;
  const normalized = String(apiKey || '').trim().toLowerCase();
  return Boolean(normalized && !PLACEHOLDER_API_KEYS.has(normalized));
}

function getGeminiProviderStatus(error = null) {
  if (!hasGeminiKey()) return 'missing_key';
  if (!error) return 'available';

  const status = Number(error?.response?.status || error?.status);
  if (status === 429) return 'rate_limited';
  return 'error';
}

function getGeminiErrorMessage(error) {
  const status = Number(error?.response?.status || error?.status);
  const providerMessage = error?.response?.data?.error?.message;

  if (status === 429) return 'Gemini provider rate limit reached.';
  if (typeof providerMessage === 'string' && providerMessage.trim()) return providerMessage.trim();
  return error?.message || 'Gemini provider request failed.';
}

function isRetryable(error) {
  const status = Number(error?.response?.status || error?.status);
  const code = error?.code;
  // Retry on timeout, network errors, or 503 (service unavailable)
  return (
    code === 'ECONNABORTED' ||
    code === 'ETIMEDOUT' ||
    code === 'ECONNRESET' ||
    status === 503 ||
    status === 502
  );
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetry(fn, retries = MAX_RETRIES, delay = RETRY_DELAY_MS) {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < retries && isRetryable(err)) {
        await sleep(delay * (attempt + 1));
      } else {
        throw err;
      }
    }
  }
  throw lastError;
}

function normalizeContents(contents) {
  if (Array.isArray(contents)) return contents;

  return [
    {
      role: 'user',
      parts: [{ text: String(contents || '') }],
    },
  ];
}

function extractGeminiText(responseData) {
  const parts = responseData?.candidates?.[0]?.content?.parts;
  const text = Array.isArray(parts)
    ? parts.map((part) => part?.text).filter(Boolean).join('\n').trim()
    : '';

  if (!text) {
    const blockReason = responseData?.promptFeedback?.blockReason;
    throw new Error(blockReason ? `Gemini response blocked: ${blockReason}` : 'Gemini returned an empty response.');
  }

  return text;
}

async function generateGeminiContent({
  systemInstruction,
  contents,
  generationConfig = {},
  timeout = DEFAULT_TIMEOUT_MS,
} = {}) {
  if (!hasGeminiKey()) {
    const error = new Error('Gemini API key is missing.');
    error.providerStatus = 'missing_key';
    throw error;
  }

  const model = getGeminiModel();

  const response = await withRetry(() => axios.post(
    `${API_BASE_URL}/models/${encodeURIComponent(model)}:generateContent`,
    {
      ...(systemInstruction ? {
        system_instruction: {
          parts: [{ text: systemInstruction }],
        },
      } : {}),
      contents: normalizeContents(contents),
      generationConfig,
    },
    {
      headers: {
        'x-goog-api-key': process.env.GEMINI_API_KEY,
        'Content-Type': 'application/json',
      },
      timeout,
    },
  ));

  return {
    provider: PROVIDER,
    model,
    text: extractGeminiText(response.data),
    usage: response.data?.usageMetadata || null,
    raw: response.data,
  };
}

async function generateGeminiText(options = {}) {
  return generateGeminiContent({
    ...options,
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 700,
      ...(options.generationConfig || {}),
    },
  });
}

async function generateGeminiJson(options = {}) {
  return generateGeminiContent({
    ...options,
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 500,
      responseMimeType: 'application/json',
      ...(options.generationConfig || {}),
    },
  });
}

module.exports = {
  DEFAULT_MODEL,
  PROVIDER,
  generateGeminiContent,
  generateGeminiJson,
  generateGeminiText,
  getGeminiErrorMessage,
  getGeminiModel,
  getGeminiProviderStatus,
  hasGeminiKey,
};
