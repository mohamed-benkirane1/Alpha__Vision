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

function createPriceStatus(quote = {}, symbol) {
  const statusQuote = quote || {};
  return {
    symbol: statusQuote.symbol || symbol,
    price: statusQuote.price ?? null,
    priceAvailable: statusQuote.priceAvailable === true,
    source: statusQuote.source || null,
    provider: statusQuote.provider || null,
    timestamp: statusQuote.timestamp || null,
    cached: statusQuote.cached === true,
    fallback: statusQuote.fallback === true,
    stale: statusQuote.stale === true,
    error: statusQuote.error || null
  };
}

function rejectTradeForQuote(message, quote, symbol) {
  const error = new Error(message);
  error.statusCode = 400;
  error.priceStatus = createPriceStatus(quote, symbol);
  return error;
}

async function resolveTradeQuote(symbol) {
  try {
    const quote = await getPrice(symbol);
    const price = Number(quote?.price);

    if (quote?.priceAvailable === false || quote?.price === null || !Number.isFinite(price) || price <= 0) {
      throw rejectTradeForQuote(`Price unavailable for ${symbol}. Trade rejected.`, quote, symbol);
    }

    if (quote?.fallback === true) {
      throw rejectTradeForQuote(`Fallback price detected for ${symbol}. Trade rejected.`, quote, symbol);
    }

    if (quote?.stale === true) {
      throw rejectTradeForQuote(`Stale price detected for ${symbol}. Trade rejected.`, quote, symbol);
    }

    return { quote, price };
  } catch (err) {
    err.statusCode = err.statusCode || 400;
    err.priceStatus = err.priceStatus || createPriceStatus(null, symbol);
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

function createExecutionPayload({ symbol, type, quantity, price, total, quote }) {
  return {
    symbol,
    action: type,
    quantity,
    executedPrice: price,
    total,
    priceSource: quote.source || null,
    priceProvider: quote.provider || null,
    priceTimestamp: quote.timestamp || null,
    priceCached: quote.cached === true,
    priceFallback: quote.fallback === true,
    priceStale: quote.stale === true,
    priceError: quote.error || null
  };
}

function serializeTrade(trade) {
  const data = trade.toObject ? trade.toObject() : trade;
  return {
    ...data,
    executedPrice: data.executedPrice ?? data.price ?? null,
    priceSource: data.priceSource ?? null,
    priceProvider: data.priceProvider ?? null,
    priceTimestamp: data.priceTimestamp ?? null,
    priceCached: data.priceCached ?? null,
    priceFallback: data.priceFallback ?? null,
    priceStale: data.priceStale ?? null,
    priceError: data.priceError ?? null
  };
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

    const { quote, price } = await resolveTradeQuote(symbol);
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
      executedPrice: price,
      priceSource: quote.source || null,
      priceProvider: quote.provider || null,
      priceTimestamp: quote.timestamp ? new Date(quote.timestamp) : null,
      priceCached: quote.cached === true,
      priceFallback: quote.fallback === true,
      priceStale: quote.stale === true,
      priceError: quote.error || null,
      total
    });

    const execution = createExecutionPayload({ symbol, type, quantity, price, total, quote });

    res.status(201).json({
      success: true,
      message: `${type} ${quantity} ${symbol} at $${price}`,
      trade: serializeTrade(trade),
      execution,
      portfolio: {
        balance: user.balance,
        holding: serializeHolding(portfolio),
        holdingRemoved
      },
      balance: user.balance,
      holding: serializeHolding(portfolio),
      holdingRemoved
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || 'Server error',
      ...(err.priceStatus ? { priceStatus: err.priceStatus } : {})
    });
  }
});

router.get('/history', auth, async (req, res) => {
  try {
    const trades = await Trade.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(50);
    res.json(trades.map(serializeTrade));
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
