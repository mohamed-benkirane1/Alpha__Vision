require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');
const { rateLimit } = require('express-rate-limit');
const passport = require('./config/passport');

const app = express();
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
const defaultRateLimitWindowMs = Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000;
const globalRateLimitMax = Number(process.env.RATE_LIMIT_MAX) || 300;
const sensitiveRateLimitMax = Number(process.env.AUTH_RATE_LIMIT_MAX) || 30;

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
  skip: (req) => req.originalUrl.startsWith('/api/payment/webhook'),
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
  limit: sensitiveRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.originalUrl.startsWith('/api/payment/webhook'),
  handler: createRateLimitMessage('Too many payment requests. Please retry later.'),
});

const chatbotLimiter = rateLimit({
  windowMs: defaultRateLimitWindowMs,
  limit: sensitiveRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  handler: createRateLimitMessage('Too many chatbot requests. Please retry later.'),
});

// Middleware
app.use(helmet());
app.use(cors({ origin: frontendUrl }));
app.use('/api/payment/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());
app.use(passport.initialize());
app.use('/api', apiLimiter);
app.use('/api/auth', authLimiter);
app.use('/api/auth/forgot-password', forgotPasswordLimiter);
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
app.use('/api/bot', require('./routes/bot'));
app.use('/api/backtest', require('./routes/backtest'));
app.use('/api/payment', require('./routes/Payment'));

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`✅ Server on port ${port}`));

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.log('❌ MongoDB error:', err));
