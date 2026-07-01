const Groq = require('groq-sdk');

const MODEL = 'llama-3.3-70b-versatile';
const TIMEOUT_MS = 30000;
const RETRY_DELAY_MS = 1200;

function isAvailable() {
  return Boolean(process.env.GROQ_API_KEY);
}

function getGroqClient() {
  if (!isAvailable()) {
    const err = new Error('Groq API key is missing.');
    err.providerStatus = 'missing_key';
    throw err;
  }
  return new Groq({ apiKey: process.env.GROQ_API_KEY, timeout: TIMEOUT_MS });
}

function isRetryable(err) {
  const status = Number(err?.status || err?.response?.status);
  const code = err?.code;
  return code === 'ECONNABORTED' || code === 'ETIMEDOUT' || code === 'ECONNRESET'
    || status === 502 || status === 503 || status === 429;
}

async function withRetry(fn, retries = 2) {
  let lastErr;
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (i < retries && isRetryable(err)) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * (i + 1)));
      } else {
        throw err;
      }
    }
  }
  throw lastErr;
}

/**
 * Generate free-form text using Groq (for chatbot).
 * @param {string} prompt  - User message
 * @param {string} [systemPrompt] - Optional system instruction
 * @returns {Promise<string>}
 */
async function generateContent(prompt, systemPrompt = '') {
  return withRetry(async () => {
    const groq = getGroqClient();
    const messages = [];
    if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
    messages.push({ role: 'user', content: String(prompt) });

    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages,
      temperature: 0.3,
      max_tokens: 1024,
    });

    const text = completion.choices[0]?.message?.content || '';
    if (!text) throw new Error('Groq returned an empty response.');
    return text;
  });
}

/**
 * Generate a guaranteed JSON object using Groq (for AI signals).
 * Groq response_format json_object eliminates fragile regex-based parsing.
 * @param {string} prompt
 * @param {string} [systemPrompt]
 * @returns {Promise<object>}
 */
async function generateJSON(prompt, systemPrompt = '') {
  return withRetry(async () => {
    const groq = getGroqClient();
    const messages = [];
    if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
    messages.push({ role: 'user', content: String(prompt) });

    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages,
      temperature: 0.1,
      max_tokens: 1024,
      response_format: { type: 'json_object' },
    });

    const raw = completion.choices[0]?.message?.content || '{}';
    return JSON.parse(raw);
  });
}

function getProviderStatus(err = null) {
  if (!isAvailable()) return 'missing_key';
  if (!err) return 'available';
  const status = Number(err?.status || err?.response?.status);
  if (status === 429) return 'rate_limited';
  return 'error';
}

function getErrorMessage(err) {
  const status = Number(err?.status || err?.response?.status);
  if (status === 429) return 'Groq provider rate limit reached.';
  return err?.message || 'Groq provider request failed.';
}

module.exports = {
  generateContent,
  generateJSON,
  getErrorMessage,
  getProviderStatus,
  isAvailable,
  MODEL,
};
