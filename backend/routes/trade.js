const router = require('express').Router();
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const Trade = require('../models/trade');
const Portfolio = require('../models/portfolio');
const User = require('../models/user');
const { getPrice } = require('../services/marketService');
const { createPortfolioSnapshotFromState } = require('../services/portfolioSnapshotService');
const { getSubscriptionAccess } = require('../utils/subscription');

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
    error: statusQuote.error || null,
  };
}

function rejectTradeForQuote(message, quote, symbol) {
  const error = new Error(message);
  error.statusCode = 400;
  error.priceStatus = createPriceStatus(quote, symbol);
  return error;
}

function tradeError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
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
    priceError: quote.error || null,
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
    priceError: data.priceError ?? null,
  };
}

function applySession(query, session) {
  return session ? query.session(session) : query;
}

function saveWithSession(document, session) {
  return document.save(session ? { session } : undefined);
}

function isTransactionUnsupported(error) {
  const message = String(error?.message || '').toLowerCase();
  return message.includes('transaction numbers are only allowed')
    || message.includes('transactions are not supported')
    || message.includes('replica set member or mongos')
    || message.includes('transaction is not supported');
}

async function performTradeWrite({ userId, symbol, type, quantity, quote, price, total }, session = null) {
  const user = await applySession(User.findById(userId), session);
  if (!user) throw tradeError(404, 'User not found');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tradesToday = await applySession(Trade.countDocuments({
    userId,
    createdAt: { $gte: today },
  }), session);

  const access = getSubscriptionAccess(user);
  const planLimit = TRADE_LIMITS[access.effectivePlan] || TRADE_LIMITS.free;

  if (tradesToday >= planLimit) {
    throw tradeError(429, `Daily limit of ${planLimit} trades reached for your plan.`);
  }

  let portfolio = await applySession(Portfolio.findOne({ userId, symbol }), session);
  let holdingRemoved = false;

  if (type === 'SELL') {
    if (!portfolio) {
      throw tradeError(400, `No ${symbol} holding found to sell.`);
    }
    if (portfolio.quantity < quantity) {
      throw tradeError(400, `Insufficient ${symbol} holdings. Available: ${portfolio.quantity}, requested: ${quantity}.`);
    }
  }

  if (type === 'BUY') {
    const currentBalance = roundMoney(user.balance);
    if (currentBalance < total) {
      throw tradeError(400, `Insufficient balance. Available: ${currentBalance}, required: ${total}.`);
    }

    if (portfolio) {
      const oldQuantity = portfolio.quantity;
      const newQuantity = oldQuantity + quantity;
      portfolio.avgPrice = ((oldQuantity * portfolio.avgPrice) + (quantity * price)) / newQuantity;
      portfolio.quantity = newQuantity;
      await saveWithSession(portfolio, session);
    } else {
      portfolio = new Portfolio({
        userId,
        symbol,
        quantity,
        avgPrice: price,
      });
      await saveWithSession(portfolio, session);
    }

    user.balance = roundMoney(currentBalance - total);
    await saveWithSession(user, session);
  } else {
    const currentBalance = roundMoney(user.balance);
    portfolio.quantity -= quantity;

    if (portfolio.quantity < MIN_HOLDING_QUANTITY) {
      await applySession(Portfolio.deleteOne({ _id: portfolio._id, userId }), session);
      portfolio = null;
      holdingRemoved = true;
    } else {
      await saveWithSession(portfolio, session);
    }

    user.balance = roundMoney(currentBalance + total);
    await saveWithSession(user, session);
  }

  const trade = new Trade({
    userId,
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
    total,
  });
  await saveWithSession(trade, session);

  return {
    user,
    trade,
    portfolio,
    holdingRemoved,
  };
}

async function executeTradeWrite(params) {
  let session = null;

  try {
    session = await mongoose.startSession();
    let result = null;

    await session.withTransaction(async () => {
      result = await performTradeWrite(params, session);
    });

    return {
      ...result,
      writeIntegrity: {
        transactionUsed: true,
        fallback: false,
      },
    };
  } catch (err) {
    if (!isTransactionUnsupported(err)) throw err;

    const result = await performTradeWrite(params);
    return {
      ...result,
      writeIntegrity: {
        transactionUsed: false,
        fallback: true,
        warning: 'MongoDB transactions are unavailable in this deployment. Trade writes used the compatibility path.',
      },
    };
  } finally {
    if (session) await session.endSession();
  }
}

router.post('/', auth, async (req, res) => {
  try {
    const input = parseTradeInput(req.body);
    if (input.error) return res.status(400).json({ success: false, message: input.error });

    const { symbol, type, quantity } = input;
    const { quote, price } = await resolveTradeQuote(symbol);
    const total = roundMoney(quantity * price);
    const result = await executeTradeWrite({
      userId: req.user.id,
      symbol,
      type,
      quantity,
      quote,
      price,
      total,
    });
    const execution = createExecutionPayload({ symbol, type, quantity, price, total, quote });
    const warnings = [];

    try {
      await createPortfolioSnapshotFromState(req.user.id, 'trade');
    } catch (snapshotError) {
      console.warn('Trade portfolio snapshot failed:', snapshotError.message);
      warnings.push('Trade executed, but its portfolio performance snapshot could not be recorded.');
    }

    return res.status(201).json({
      success: true,
      message: `${type} ${quantity} ${symbol} at $${price}`,
      trade: serializeTrade(result.trade),
      execution,
      portfolio: {
        balance: result.user.balance,
        holding: serializeHolding(result.portfolio),
        holdingRemoved: result.holdingRemoved,
      },
      balance: result.user.balance,
      holding: serializeHolding(result.portfolio),
      holdingRemoved: result.holdingRemoved,
      writeIntegrity: result.writeIntegrity,
      warnings,
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || 'Server error',
      ...(err.priceStatus ? { priceStatus: err.priceStatus } : {}),
    });
  }
});

router.get('/history', auth, async (req, res) => {
  try {
    const trades = await Trade.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(50);
    return res.json(trades.map(serializeTrade));
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
