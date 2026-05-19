const router = require('express').Router();
const auth = require('../middleware/auth');
const Trade = require('../models/trade');
const Portfolio = require('../models/portfolio');
const User = require('../models/user');
const { getPrice } = require('../services/marketService');

const TRADE_LIMITS = { free: 5, pro: 50, elite: 1000 };
const MIN_HOLDING_QUANTITY = 0.0001;

function parseTradeInput(body) {
  const symbol = typeof body.symbol === 'string' ? body.symbol.trim().toUpperCase() : '';
  const type = typeof body.type === 'string' ? body.type.trim().toUpperCase() : '';
  const rawQuantity = body.quantity;
  const quantity = typeof rawQuantity === 'number' || typeof rawQuantity === 'string'
    ? Number(rawQuantity)
    : NaN;

  if (!symbol) return { error: 'symbol is required' };
  if (!type) return { error: 'type is required' };
  if (!['BUY', 'SELL'].includes(type)) return { error: 'type must be BUY or SELL' };
  if (!Number.isFinite(quantity) || quantity <= 0) {
    return { error: 'quantity must be a positive number' };
  }

  return { symbol, type, quantity };
}

async function resolveTradePrice(symbol) {
  try {
    const quote = await getPrice(symbol);
    const price = Number(quote?.price);

    if (!Number.isFinite(price) || price <= 0) {
      const error = new Error(`No valid market price available for ${symbol}`);
      error.statusCode = 400;
      throw error;
    }

    return price;
  } catch (err) {
    err.statusCode = err.statusCode || 400;
    throw err;
  }
}

function roundMoney(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Number(number.toFixed(2)) : 0;
}

function serializeHolding(holding) {
  return holding ? holding.toObject() : null;
}

router.post('/', auth, async (req, res) => {
  try {
    const input = parseTradeInput(req.body);
    if (input.error) return res.status(400).json({ success: false, message: input.error });

    const { symbol, type, quantity } = input;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tradesToday = await Trade.countDocuments({
      userId: req.user.id,
      createdAt: { $gte: today }
    });

    const planLimit = TRADE_LIMITS[user.plan] || TRADE_LIMITS.free;

    if (tradesToday >= planLimit) {
      return res.status(429).json({
        success: false,
        message: `Daily limit of ${planLimit} trades reached for your plan.`
      });
    }

    let portfolio = await Portfolio.findOne({ userId: req.user.id, symbol });
    let holdingRemoved = false;

    if (type === 'SELL') {
      if (!portfolio) {
        return res.status(400).json({
          success: false,
          message: `No ${symbol} holding found to sell.`
        });
      }

      if (portfolio.quantity < quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient ${symbol} holdings. Available: ${portfolio.quantity}, requested: ${quantity}.`
        });
      }
    }

    const price = await resolveTradePrice(symbol);
    const total = roundMoney(quantity * price);

    if (type === 'BUY') {
      const currentBalance = roundMoney(user.balance);

      if (currentBalance < total) {
        return res.status(400).json({
          success: false,
          message: `Insufficient balance. Available: ${currentBalance}, required: ${total}.`
        });
      }

      if (portfolio) {
        const oldQuantity = portfolio.quantity;
        const newQuantity = oldQuantity + quantity;
        portfolio.avgPrice = ((oldQuantity * portfolio.avgPrice) + (quantity * price)) / newQuantity;
        portfolio.quantity = newQuantity;
        await portfolio.save();
      } else {
        portfolio = await Portfolio.create({
          userId: req.user.id,
          symbol,
          quantity,
          avgPrice: price
        });
      }

      user.balance = roundMoney(currentBalance - total);
      await user.save();
    } else {
      const currentBalance = roundMoney(user.balance);

      portfolio.quantity -= quantity;

      if (portfolio.quantity < MIN_HOLDING_QUANTITY) {
        await Portfolio.deleteOne({ _id: portfolio._id, userId: req.user.id });
        portfolio = null;
        holdingRemoved = true;
      } else {
        await portfolio.save();
      }

      user.balance = roundMoney(currentBalance + total);
      await user.save();
    }

    const trade = await Trade.create({
      userId: req.user.id,
      symbol,
      type,
      quantity,
      price,
      total
    });

    res.status(201).json({
      success: true,
      message: `${type} ${quantity} ${symbol} at $${price}`,
      trade,
      balance: user.balance,
      holding: serializeHolding(portfolio),
      holdingRemoved
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || 'Server error'
    });
  }
});

router.get('/history', auth, async (req, res) => {
  try {
    const trades = await Trade.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(50);
    res.json(trades);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
