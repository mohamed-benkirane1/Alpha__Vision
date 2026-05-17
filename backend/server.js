require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const passport = require('./config/passport');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(passport.initialize());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/market', require('./routes/market'));
app.use('/api/news', require('./routes/news'));
app.use('/api/chatbot', require('./routes/chatbot'));
app.use('/api/trade', require('./routes/trade'));
app.use('/api/portfolio', require('./routes/portfolio'));
app.use('/api/bot', require('./routes/bot'));
app.use('/api/backtest', require('./routes/backtest'));
app.use('/api/payment', require('./routes/payment'));  // ← NOUVEAU

// Webhook Stripe (doit être avant express.json pour cette route)
app.post('/api/payment/webhook', express.raw({ type: 'application/json' }), require('./routes/payment'));

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`✅ Server on port ${port}`));

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.log('❌ MongoDB error:', err));