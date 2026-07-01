const { loadEnvConfig, logFeatureWarnings } = require('./config/env');

let env;
try {
  env = loadEnvConfig();
  logFeatureWarnings(env.warnings);
} catch (error) {
  console.error(`[env] ${error.message}`);
  process.exit(1);
}

const compression = require('compression');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const { ipKeyGenerator, rateLimit } = require('express-rate-limit');
const passport = require('./config/passport');
const { startBotScheduler } = require('./services/botScheduler');

const app = express();
if (env.nodeEnv === 'production' || process.env.VERCEL) {
  app.set('trust proxy', 1);
}

const frontendUrl = env.frontendUrl;
const defaultRateLimitWindowMs = env.rateLimits.windowMs;
const globalRateLimitMax = env.rateLimits.apiMax;
const sensitiveRateLimitMax = env.rateLimits.authMax;
const paymentRateLimitMax = env.rateLimits.paymentMax;
const paymentReadRateLimitMax = env.rateLimits.paymentReadMax;
const chatbotRateLimitMax = env.rateLimits.chatbotMax;
let mongoConnectionPromise = null;
const marketRoutes = require('./routes/market');
const paymentRoutes = require('./routes/Payment');

function normalizeOrigin(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';

  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;

  try {
    return new URL(withProtocol).origin.replace(/\/+$/, '');
  } catch {
    return raw.replace(/\/+$/, '');
  }
}

function parseOrigins(value) {
  return String(value || '')
    .split(',')
    .map(normalizeOrigin)
    .filter(Boolean);
}

const localCorsOrigins = env.nodeEnv === 'production'
  ? []
  : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000', 'http://localhost:5000'];

const allowedCorsOrigins = Array.from(new Set([
  ...localCorsOrigins,
  frontendUrl,
  ...(env.nodeEnv === 'production' ? [] : [process.env.FRONTEND_URL_ALT]),
  ...parseOrigins(process.env.FRONTEND_ORIGINS),
  ...(env.nodeEnv === 'production' ? [
    process.env.VERCEL_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
  ] : []),
].map(normalizeOrigin).filter(Boolean)));

function isCorsOriginAllowed(origin) {
  return allowedCorsOrigins.includes(normalizeOrigin(origin));
}

function logCorsConfiguration() {
  console.log(`[cors] allowed origins: ${allowedCorsOrigins.length > 0 ? allowedCorsOrigins.join(', ') : '(none)'}`);

  if (env.nodeEnv === 'production' && !isCorsOriginAllowed(frontendUrl)) {
    console.warn(`[cors] FRONTEND_URL is not allowed: ${frontendUrl || '(empty)'}`);
  }
}

function rejectDisallowedCorsOrigin(req, res, next) {
  const origin = req.headers.origin;

  if (!origin || isCorsOriginAllowed(origin)) {
    return next();
  }

  if (env.nodeEnv === 'production') {
    console.warn(`[cors] blocked origin: ${origin}`);
  }

  return res.status(403).json({
    success: false,
    message: 'CORS origin is not allowed.',
    error: 'cors_origin_not_allowed',
  });
}

function getForwardedHeaderIp(value) {
  const firstForwardedValue = String(value || '').split(',')[0]?.trim();
  if (!firstForwardedValue) return null;

  const match = firstForwardedValue.match(/(?:^|;)\s*for=(?:"([^"]+)"|([^;,\s]+))/i);
  let candidate = String(match?.[1] || match?.[2] || '').trim();
  if (!candidate || candidate.toLowerCase() === 'unknown' || candidate.startsWith('_')) return null;

  const bracketedIpv6 = candidate.match(/^\[([^\]]+)\](?::\d+)?$/);
  if (bracketedIpv6) return bracketedIpv6[1];

  if (/^\d{1,3}(?:\.\d{1,3}){3}:\d+$/.test(candidate)) {
    candidate = candidate.split(':')[0];
  }

  return candidate;
}

function getRateLimitKey(req) {
  return ipKeyGenerator(getForwardedHeaderIp(req.headers.forwarded) || req.ip);
}

logCorsConfiguration();

async function connectMongo() {
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  if (mongoConnectionPromise) return mongoConnectionPromise;

  if (!env.mongoUri) {
    throw new Error('MongoDB is not configured');
  }

  mongoConnectionPromise = mongoose.connect(env.mongoUri)
    .then((connection) => {
      console.log('MongoDB connected');
      return connection;
    })
    .catch((error) => {
      mongoConnectionPromise = null;
      throw error;
    });

  return mongoConnectionPromise;
}

async function ensureMongoConnection(req, res, next) {
  try {
    await connectMongo();
    return next();
  } catch (error) {
    return res.status(503).json({
      success: false,
      message: 'Database connection unavailable',
      error: 'database_unavailable',
    });
  }
}

function createRateLimitMessage(message) {
  return (req, res) => res.status(429).json({
    success: false,
    message,
    retryAfter: req.rateLimit?.resetTime || null,
  });
}

const apiLimiter = rateLimit({
  windowMs: defaultRateLimitWindowMs,
  limit: globalRateLimitMax,
  keyGenerator: getRateLimitKey,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.originalUrl.split('?')[0] === '/api/payment/webhook',
  handler: createRateLimitMessage('Too many API requests. Please retry later.'),
});

const authLimiter = rateLimit({
  windowMs: defaultRateLimitWindowMs,
  limit: sensitiveRateLimitMax,
  keyGenerator: getRateLimitKey,
  standardHeaders: true,
  legacyHeaders: false,
  handler: createRateLimitMessage('Too many authentication requests. Please retry later.'),
});

const forgotPasswordLimiter = rateLimit({
  windowMs: defaultRateLimitWindowMs,
  limit: Math.max(5, Math.floor(sensitiveRateLimitMax / 2)),
  keyGenerator: getRateLimitKey,
  standardHeaders: true,
  legacyHeaders: false,
  handler: createRateLimitMessage('Too many password reset requests. Please retry later.'),
});

const paymentLimiter = rateLimit({
  windowMs: defaultRateLimitWindowMs,
  limit: paymentRateLimitMax,
  keyGenerator: getRateLimitKey,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    if (req.originalUrl.split('?')[0] === '/api/payment/webhook') return true;
    if (req.method !== 'GET') return false;

    const path = req.originalUrl.split('?')[0];
    return [
      '/api/payment/plans',
      '/api/payment/status',
      '/api/payment/transactions',
      '/api/payment/features',
      '/api/payment/webhook-info',
    ].includes(path);
  },
  handler: createRateLimitMessage('Too many payment requests. Please retry later.'),
});

const paymentReadLimiter = rateLimit({
  windowMs: defaultRateLimitWindowMs,
  limit: paymentReadRateLimitMax,
  keyGenerator: getRateLimitKey,
  standardHeaders: true,
  legacyHeaders: false,
  handler: createRateLimitMessage('Too many payment read requests. Please retry later.'),
});

const chatbotLimiter = rateLimit({
  windowMs: defaultRateLimitWindowMs,
  limit: chatbotRateLimitMax,
  keyGenerator: getRateLimitKey,
  standardHeaders: true,
  legacyHeaders: false,
  handler: createRateLimitMessage('Too many chatbot requests. Please retry later.'),
});

// Market routes are public (home page ticker) but stricter than the global limit
const marketLimiter = rateLimit({
  windowMs: defaultRateLimitWindowMs,
  limit: Math.min(globalRateLimitMax, 120),
  keyGenerator: getRateLimitKey,
  standardHeaders: true,
  legacyHeaders: false,
  handler: createRateLimitMessage('Too many market data requests. Please retry later.'),
});

// Middleware
app.use(compression());
app.use(helmet());
app.use(rejectDisallowedCorsOrigin);
app.use(cors({
  origin(origin, callback) {
    return callback(null, !origin || isCorsOriginAllowed(origin));
  },
  credentials: true,
}));
app.use(cookieParser());
// Parse JSON for all routes except the Stripe webhook (which needs raw body)
app.use((req, res, next) => {
  if (req.originalUrl.split('?')[0] === '/api/payment/webhook') return next();
  return express.json()(req, res, next);
});
app.use(passport.initialize());
app.use('/api', apiLimiter);
app.use('/api/market', marketLimiter);
app.use('/api/auth', authLimiter);
app.use('/api/auth/forgot-password', forgotPasswordLimiter);
app.use('/api/payment/plans', paymentReadLimiter);
app.use('/api/payment/status', paymentReadLimiter);
app.use('/api/payment/transactions', paymentReadLimiter);
app.use('/api/payment/features', paymentReadLimiter);
app.use('/api/payment/webhook-info', paymentReadLimiter);
app.use('/api/payment', paymentLimiter);
app.use('/api/chatbot', chatbotLimiter);

// Routes
app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    service: 'Alpha Vision API',
  });
});

// Public runtime endpoints used by the production shell must not depend on MongoDB.
app.use('/api/market', marketRoutes);
app.get('/api/payment/plans', paymentRoutes.getPlans);
app.get('/api/payment/webhook-info', paymentRoutes.getWebhookInfo);

app.use('/api', ensureMongoConnection);

app.use('/api/auth', require('./routes/auth'));
app.use('/api/market', marketRoutes);
app.use('/api/news', require('./routes/news'));
app.use('/api/chatbot', require('./routes/chatbot'));
app.use('/api/ai-signal', require('./routes/aiSignal'));
app.use('/api/trade', require('./routes/trade'));
app.use('/api/portfolio', require('./routes/portfolio'));
app.use('/api/watchlist', require('./routes/watchlist'));
app.use('/api/bot', require('./routes/bot'));
app.use('/api/backtest', require('./routes/backtest'));
app.use('/api/payment', paymentRoutes);
app.use('/api/activity', require('./routes/activity'));
app.use('/api/alerts', require('./routes/alerts'));

app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);

  console.error('[server] unhandled API error:', err.message || err);

  if (req.originalUrl?.startsWith('/api')) {
    return res.status(err.status || 500).json({
      success: false,
      message: 'Internal server error',
      error: 'internal_server_error',
    });
  }

  return next(err);
});

const port = env.port;

async function startServer() {
  try {
    await connectMongo();

    startBotScheduler();
    app.listen(port, () => console.log(`Server running on port ${port}`));
  } catch (err) {
    console.error('MongoDB connection failed:', err.message || err);
    process.exit(1);
  }
}

if (!process.env.VERCEL) {
  startServer();
}

module.exports = app;
