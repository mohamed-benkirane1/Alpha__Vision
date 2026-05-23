const axios = require('axios');

const PROVIDER = 'gemini';
const DEFAULT_MODEL = 'gemini-2.5-flash';
const API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

function getGeminiModel() {
  return String(process.env.GEMINI_MODEL || DEFAULT_MODEL).trim().replace(/^models\//, '') || DEFAULT_MODEL;
}

function hasGeminiKey() {
  const apiKey = process.env.GEMINI_API_KEY;
  return Boolean(apiKey && apiKey.trim() && apiKey.trim() !== 'your_gemini_api_key_here');
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
  timeout = 15000,
} = {}) {
  if (!hasGeminiKey()) {
    const error = new Error('Gemini API key is missing.');
    error.providerStatus = 'missing_key';
    throw error;
  }

  const model = getGeminiModel();
  const response = await axios.post(
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
  );

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
