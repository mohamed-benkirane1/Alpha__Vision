const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const MIN_JWT_SECRET_LENGTH = 32;
const UNSAFE_JWT_SECRET_VALUES = new Set([
  'secret',
  'jwtsecret',
  'changeme',
  'yourjwtsecrethere',
  'defaultsecret',
  'test',
]);
const PLACEHOLDER_API_KEYS = new Set([
  'your_gemini_api_key',
  'your_gemini_api_key_here',
]);

function hasValue(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function parseBoolean(value) {
  return String(value || '').trim().toLowerCase() === 'true';
}

function normalizeNodeEnv(env = process.env) {
  return String(env.NODE_ENV || 'development').trim().toLowerCase();
}

function positiveInteger(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function normalizeSecretCandidate(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function isPlaceholderApiKey(value) {
  return PLACEHOLDER_API_KEYS.has(String(value || '').trim().toLowerCase());
}

function getHostname(value) {
  const raw = String(value || '').trim();
  if (!raw) return null;

  try {
    const normalized = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    return new URL(normalized).hostname.toLowerCase();
  } catch {
    return null;
  }
}

function isHttpsUrl(value) {
  return /^https:\/\//i.test(String(value || '').trim());
}

function getBackendHostname(env = process.env) {
  return getHostname(env.BACKEND_URL || env.API_URL || env.VERCEL_URL);
}

function isCrossDomainHttpsDeployment(env = process.env) {
  const frontendUrl = String(env.FRONTEND_URL || '').trim();
  const frontendHost = getHostname(frontendUrl);
  const backendHost = getBackendHostname(env);

  return isHttpsUrl(frontendUrl)
    && Boolean(frontendHost)
    && Boolean(backendHost)
    && frontendHost !== backendHost;
}

function requireEnvValue(env, variableName) {
  if (!hasValue(env[variableName])) {
    throw new Error(`Missing required environment variable: ${variableName}`);
  }
}

function validateJwtSecret(env) {
  const secret = String(env.JWT_SECRET || '').trim();
  const normalized = normalizeSecretCandidate(secret);

  if (UNSAFE_JWT_SECRET_VALUES.has(normalized)) {
    throw new Error('Unsafe JWT_SECRET. Please configure a strong secret.');
  }

  if (secret.length < MIN_JWT_SECRET_LENGTH) {
    throw new Error(`JWT_SECRET must be at least ${MIN_JWT_SECRET_LENGTH} characters long.`);
  }
}

function validateEnvironment(env = process.env) {
  const nodeEnv = normalizeNodeEnv(env);

  if (nodeEnv === 'production') {
    requireEnvValue(env, 'MONGO_URI');
    requireEnvValue(env, 'JWT_SECRET');
    validateJwtSecret(env);
    requireEnvValue(env, 'FRONTEND_URL');

    if (parseBoolean(env.ALLOW_DEMO_FUNDING)) {
      console.warn('WARNING: ALLOW_DEMO_FUNDING=true is enabled in production for demo/soutenance mode. Disable it for real public production.');
    }

    return;
  }

  const allowPublicRuntimeOnVercel = Boolean(env.VERCEL);

  if (!allowPublicRuntimeOnVercel || hasValue(env.MONGO_URI)) {
    requireEnvValue(env, 'MONGO_URI');
  }

  if (!allowPublicRuntimeOnVercel || hasValue(env.JWT_SECRET)) {
    requireEnvValue(env, 'JWT_SECRET');
    validateJwtSecret(env);
  }
}

function isSmtpConfigured(env) {
  return hasValue(env.SMTP_HOST)
    && positiveInteger(env.SMTP_PORT, 0) > 0
    && hasValue(env.SMTP_USER)
    && hasValue(env.SMTP_PASS)
    && hasValue(env.EMAIL_FROM);
}

function buildFeatureWarnings(env = process.env) {
  const warnings = [];
  const nodeEnv = normalizeNodeEnv(env);

  if (!hasValue(env.MONGO_URI)) {
    warnings.push('Database unavailable: MONGO_URI is not configured. Public fallback endpoints can still respond on Vercel.');
  }

  if (!hasValue(env.JWT_SECRET)) {
    warnings.push('Cookie auth unavailable: JWT_SECRET is not configured. Authenticated routes will fail until it is set.');
  }

  if (nodeEnv === 'production' && !hasValue(env.FRONTEND_URL)) {
    warnings.push('FRONTEND_URL is not configured. Same-origin Vercel rewrites can work, but cross-domain cookies/CORS require FRONTEND_URL.');
  }

  if (!hasValue(env.GOOGLE_CLIENT_ID) || !hasValue(env.GOOGLE_CLIENT_SECRET)) {
    warnings.push('Google OAuth disabled: GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are not fully configured.');
  }

  if (!hasValue(env.STRIPE_SECRET_KEY) || !hasValue(env.STRIPE_WEBHOOK_SECRET)) {
    warnings.push('Stripe disabled: STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET are not fully configured.');
  }

  if (!isSmtpConfigured(env)) {
    warnings.push('Email reset delivery disabled: SMTP settings are not fully configured.');
  }

  // Groq is now the primary AI provider
  if (!hasValue(env.GROQ_API_KEY)) {
    warnings.push('AI fallback mode: GROQ_API_KEY is not configured. Rules-based signals will be used.');
  }

  // Legacy provider warnings (kept for backward compat if someone switches back)
  const aiProvider = String(env.AI_PROVIDER || 'groq').trim().toLowerCase();
  const aiSignalProvider = String(env.AI_SIGNAL_PROVIDER || aiProvider).trim().toLowerCase();

  if ((aiProvider === 'gemini' || aiSignalProvider === 'gemini')
    && (!hasValue(env.GEMINI_API_KEY) || isPlaceholderApiKey(env.GEMINI_API_KEY))) {
    warnings.push('Legacy: GEMINI_API_KEY is not configured (Groq is now the primary provider).');
  }

  if ((aiProvider === 'deepseek' || aiSignalProvider === 'deepseek')
    && (!hasValue(env.DEEPSEEK_API_KEY) || String(env.DEEPSEEK_API_KEY).trim() === 'sk_placeholder')) {
    warnings.push('AI fallback mode: DEEPSEEK_API_KEY is not configured.');
  }

  if (!hasValue(env.GNEWS_API_KEY)) {
    warnings.push('News unavailable/fallback: GNEWS_API_KEY is not configured.');
  }

  const authCookieSameSite = String(env.AUTH_COOKIE_SAME_SITE || '').trim().toLowerCase();
  if (
    nodeEnv === 'production'
    && authCookieSameSite !== 'none'
    && (isCrossDomainHttpsDeployment(env) || (isHttpsUrl(env.FRONTEND_URL) && !getBackendHostname(env)))
  ) {
    warnings.push('AUTH_COOKIE_SAME_SITE is not set to "none". Cross-domain HTTPS frontend/backend cookies may fail; use AUTH_COOKIE_SAME_SITE=none for separate Vercel projects.');
  }

  return warnings;
}

function createConfig(env = process.env) {
  const authRateLimitMax = positiveInteger(env.AUTH_RATE_LIMIT_MAX, 30);

  return Object.freeze({
    nodeEnv: normalizeNodeEnv(env),
    port: hasValue(env.PORT) ? env.PORT.trim() : 5000,
    frontendUrl: hasValue(env.FRONTEND_URL) ? env.FRONTEND_URL.trim() : 'http://localhost:5173',
    mongoUri: hasValue(env.MONGO_URI) ? env.MONGO_URI.trim() : null,
    allowDemoFunding: parseBoolean(env.ALLOW_DEMO_FUNDING),
    rateLimits: Object.freeze({
      windowMs: positiveInteger(env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
      apiMax: positiveInteger(env.RATE_LIMIT_MAX, 300),
      authMax: authRateLimitMax,
      paymentMax: positiveInteger(env.PAYMENT_RATE_LIMIT_MAX, authRateLimitMax),
      paymentReadMax: positiveInteger(env.PAYMENT_READ_RATE_LIMIT_MAX, positiveInteger(env.RATE_LIMIT_MAX, 300)),
      chatbotMax: positiveInteger(env.CHATBOT_RATE_LIMIT_MAX, authRateLimitMax),
    }),
    warnings: Object.freeze(buildFeatureWarnings(env)),
  });
}

function loadEnvConfig() {
  validateEnvironment(process.env);
  return createConfig(process.env);
}

function logFeatureWarnings(warnings = []) {
  warnings.forEach((warning) => {
    console.warn(`[env] ${warning}`);
  });
}

if (require.main === module) {
  try {
    const config = loadEnvConfig();
    logFeatureWarnings(config.warnings);
    console.log('[env] Environment validation passed.');
  } catch (error) {
    console.error(`[env] ${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = {
  MIN_JWT_SECRET_LENGTH,
  buildFeatureWarnings,
  loadEnvConfig,
  logFeatureWarnings,
  validateEnvironment,
};
