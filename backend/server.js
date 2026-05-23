const { loadEnvConfig, logFeatureWarnings } = require('./config/env');

let env;
try {
  env = loadEnvConfig();
  logFeatureWarnings(env.warnings);
} catch (error) {
  console.error(`[env] ${error.message}`);
  process.exit(1);
}

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');
const { rateLimit } = require('express-rate-limit');
const passport = require('./config/passport');

const app = express();
const frontendUrl = env.frontendUrl;
const defaultRateLimitWindowMs = env.rateLimits.windowMs;
const globalRateLimitMax = env.rateLimits.apiMax;
const sensitiveRateLimitMax = env.rateLimits.authMax;
const paymentRateLimitMax = env.rateLimits.paymentMax;
const paymentReadRateLimitMax = env.rateLimits.paymentReadMax;
const chatbotRateLimitMax = env.rateLimits.chatbotMax;

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
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.originalUrl.split('?')[0] === '/api/payment/webhook',
  handler: createRateLimitMessage('Too many API requests. Please retry later.'),
});

const authLimiter = rateLimit({
  windowMs: defaultRateLimitWindowMs,
  limit: sensitiveRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  handler: createRateLimitMessage('Too many authentication requests. Please retry later.'),
});

const forgotPasswordLimiter = rateLimit({
  windowMs: defaultRateLimitWindowMs,
  limit: Math.max(5, Math.floor(sensitiveRateLimitMax / 2)),
  standardHeaders: true,
  legacyHeaders: false,
  handler: createRateLimitMessage('Too many password reset requests. Please retry later.'),
});

const paymentLimiter = rateLimit({
  windowMs: defaultRateLimitWindowMs,
  limit: paymentRateLimitMax,
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
  standardHeaders: true,
  legacyHeaders: false,
  handler: createRateLimitMessage('Too many payment read requests. Please retry later.'),
});

const chatbotLimiter = rateLimit({
  windowMs: defaultRateLimitWindowMs,
  limit: chatbotRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  handler: createRateLimitMessage('Too many chatbot requests. Please retry later.'),
});

// Middleware
app.use(helmet());
app.use(cors({ origin: frontendUrl }));
app.post('/api/payment/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());
app.use(passport.initialize());
app.use('/api', apiLimiter);
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
  res.status(200).json({ success: true, message: 'Backend is running' });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/market', require('./routes/market'));
app.use('/api/news', require('./routes/news'));
app.use('/api/chatbot', require('./routes/chatbot'));
app.use('/api/ai-signal', require('./routes/aiSignal'));
app.use('/api/trade', require('./routes/trade'));
app.use('/api/portfolio', require('./routes/portfolio'));
app.use('/api/watchlist', require('./routes/watchlist'));
app.use('/api/bot', require('./routes/bot'));
app.use('/api/backtest', require('./routes/backtest'));
app.use('/api/payment', require('./routes/Payment'));

const port = env.port;
app.listen(port, () => console.log(`✅ Server on port ${port}`));

mongoose.connect(env.mongoUri)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.log('❌ MongoDB error:', err));
