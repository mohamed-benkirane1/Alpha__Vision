const mongoose = require('mongoose');
const Trade = require('../models/trade');
const Portfolio = require('../models/portfolio');
const User = require('../models/user');
const { getPrice } = require('./marketService');
const { createPortfolioSnapshotFromState } = require('./portfolioSnapshotService');
const { getSubscriptionAccess } = require('../utils/subscription');

const TRADE_LIMITS = { free: 5, pro: 50, elite: 1000 };
const MIN_HOLDING_QUANTITY = 0.0001;
const PAPER_TRADING_MODE = 'paper';
const SUPPORTED_ORDER_TYPES = ['market'];
const PAPER_FEES = 0;

function parseTradeInput(body = {}) {
  const symbol = typeof body.symbol === 'string' ? body.symbol.trim().toUpperCase() : '';
  const rawSide = body.side ?? body.type ?? body.action;
  const type = typeof rawSide === 'string' ? rawSide.trim().toUpperCase() : '';
  const rawOrderType = body.orderType ?? body.executionType ?? 'market';
  const orderType = typeof rawOrderType === 'string' ? rawOrderType.trim().toLowerCase() : '';
  const rawQuantity = body.quantity;
  const quantity = typeof rawQuantity === 'number' || typeof rawQuantity === 'string'
    ? Number(rawQuantity)
    : NaN;

  if (!symbol) return { error: 'symbol is required' };
  if (!type) return { error: 'side is required' };
  if (!['BUY', 'SELL'].includes(type)) return { error: 'side must be BUY or SELL' };
  if (!SUPPORTED_ORDER_TYPES.includes(orderType)) return { error: 'Only market paper orders are supported right now.' };
  if (!Number.isFinite(quantity) || quantity <= 0) {
    return { error: 'quantity must be a positive number' };
  }

  return { symbol, type, quantity, orderType };
}

function createPriceStatus(quote = {}, symbol) {
  const statusQuote = quote || {};
  const isStale = statusQuote.stale === true || statusQuote.isStale === true;
  return {
    symbol: statusQuote.symbol || symbol,
    price: statusQuote.price ?? null,
    priceAvailable: statusQuote.priceAvailable === true,
    source: statusQuote.source || null,
    provider: statusQuote.provider || null,
    providerSymbol: statusQuote.providerSymbol || null,
    timestamp: statusQuote.timestamp || null,
    fetchedAt: statusQuote.fetchedAt || statusQuote.timestamp || null,
    cacheTtlSeconds: statusQuote.cacheTtlSeconds ?? null,
    cached: statusQuote.cached === true,
    fallback: statusQuote.fallback === true,
    stale: isStale,
    isLive: statusQuote.isLive === true,
    isStale,
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

    if (quote?.stale === true || quote?.isStale === true) {
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

function roundQuantity(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Number(number.toFixed(8)) : 0;
}

function serializeHolding(holding) {
  return holding ? holding.toObject() : null;
}

function toDateOrNull(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function createExecutionPayload({ symbol, type, quantity, orderType, price, total, quote, fees, realizedPnl }) {
  return {
    symbol,
    mode: PAPER_TRADING_MODE,
    status: 'executed',
    orderType,
    action: type,
    quantity,
    executedPrice: price,
    total,
    fees,
    realizedPnl,
    priceSource: quote.source || null,
    priceProvider: quote.provider || null,
    priceProviderSymbol: quote.providerSymbol || null,
    priceTimestamp: quote.timestamp || null,
    priceFetchedAt: quote.fetchedAt || quote.timestamp || null,
    priceCached: quote.cached === true,
    priceFallback: quote.fallback === true,
    priceStale: quote.stale === true || quote.isStale === true,
    priceIsLive: quote.isLive === true,
    priceIsStale: quote.stale === true || quote.isStale === true,
    priceError: quote.error || null,
  };
}

function serializeTrade(trade) {
  const data = trade.toObject ? trade.toObject() : trade;
  return {
    ...data,
    mode: data.mode || PAPER_TRADING_MODE,
    status: data.status || 'executed',
    orderType: data.orderType || 'market',
    executedPrice: data.executedPrice ?? data.price ?? null,
    fees: data.fees ?? 0,
    realizedPnl: data.realizedPnl ?? null,
    balanceBefore: data.balanceBefore ?? null,
    balanceAfter: data.balanceAfter ?? null,
    holdingQuantityBefore: data.holdingQuantityBefore ?? null,
    holdingQuantityAfter: data.holdingQuantityAfter ?? null,
    avgPriceBefore: data.avgPriceBefore ?? null,
    avgPriceAfter: data.avgPriceAfter ?? null,
    priceSource: data.priceSource ?? null,
    priceProvider: data.priceProvider ?? null,
    priceProviderSymbol: data.priceProviderSymbol ?? null,
    priceTimestamp: data.priceTimestamp ?? null,
    priceFetchedAt: data.priceFetchedAt ?? data.priceTimestamp ?? null,
    priceCached: data.priceCached ?? null,
    priceFallback: data.priceFallback ?? null,
    priceStale: data.priceStale ?? null,
    priceIsLive: data.priceIsLive ?? null,
    priceIsStale: data.priceIsStale ?? data.priceStale ?? null,
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

async function performTradeWrite({ userId, symbol, type, quantity, orderType, quote, price, total }, session = null) {
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
  const fees = PAPER_FEES;
  let realizedPnl = null;
  const balanceBefore = roundMoney(user.balance);
  let balanceAfter = balanceBefore;
  const holdingQuantityBefore = roundQuantity(portfolio?.quantity || 0);
  const avgPriceBefore = portfolio ? Number(portfolio.avgPrice) : null;
  let holdingQuantityAfter = holdingQuantityBefore;
  let avgPriceAfter = avgPriceBefore;

  if (type === 'SELL') {
    if (!portfolio) {
      throw tradeError(400, `No ${symbol} holding found to sell.`);
    }
    if (portfolio.quantity < quantity) {
      throw tradeError(400, `Insufficient ${symbol} holdings. Available: ${portfolio.quantity}, requested: ${quantity}.`);
    }
  }

  if (type === 'BUY') {
    if (balanceBefore < total + fees) {
      throw tradeError(400, `Insufficient virtual balance. Available: ${balanceBefore}, required: ${roundMoney(total + fees)}.`);
    }

    if (portfolio) {
      const oldQuantity = portfolio.quantity;
      const newQuantity = roundQuantity(oldQuantity + quantity);
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

    holdingQuantityAfter = roundQuantity(portfolio.quantity);
    avgPriceAfter = Number(portfolio.avgPrice);
    balanceAfter = roundMoney(balanceBefore - total - fees);
    user.balance = balanceAfter;
    await saveWithSession(user, session);
  } else {
    realizedPnl = Number.isFinite(avgPriceBefore) ? roundMoney((price - avgPriceBefore) * quantity) : null;
    portfolio.quantity = roundQuantity(portfolio.quantity - quantity);
    holdingQuantityAfter = roundQuantity(portfolio.quantity);

    if (portfolio.quantity < MIN_HOLDING_QUANTITY) {
      await applySession(Portfolio.deleteOne({ _id: portfolio._id, userId }), session);
      portfolio = null;
      holdingRemoved = true;
      holdingQuantityAfter = 0;
      avgPriceAfter = null;
    } else {
      await saveWithSession(portfolio, session);
      avgPriceAfter = Number(portfolio.avgPrice);
    }

    balanceAfter = roundMoney(balanceBefore + total - fees);
    user.balance = balanceAfter;
    await saveWithSession(user, session);
  }

  const trade = new Trade({
    userId,
    symbol,
    type,
    orderType,
    mode: PAPER_TRADING_MODE,
    status: 'executed',
    quantity,
    price,
    executedPrice: price,
    fees,
    realizedPnl,
    balanceBefore,
    balanceAfter,
    holdingQuantityBefore,
    holdingQuantityAfter,
    avgPriceBefore,
    avgPriceAfter,
    priceSource: quote.source || null,
    priceProvider: quote.provider || null,
    priceProviderSymbol: quote.providerSymbol || null,
    priceTimestamp: toDateOrNull(quote.timestamp),
    priceFetchedAt: toDateOrNull(quote.fetchedAt || quote.timestamp),
    priceCached: quote.cached === true,
    priceFallback: quote.fallback === true,
    priceStale: quote.stale === true || quote.isStale === true,
    priceIsLive: quote.isLive === true,
    priceIsStale: quote.stale === true || quote.isStale === true,
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

async function executePaperTrade({ userId, symbol, type, quantity, orderType = 'market', snapshotSource = 'trade' }) {
  if (!userId) throw tradeError(401, 'Authenticated user is required.');

  const input = parseTradeInput({ symbol, type, quantity, orderType });
  if (input.error) throw tradeError(400, input.error);

  const { quote, price } = await resolveTradeQuote(input.symbol);
  const total = roundMoney(input.quantity * price);
  if (total <= 0) {
    throw tradeError(400, 'Order total is too small for paper execution.');
  }

  const result = await executeTradeWrite({
    userId,
    symbol: input.symbol,
    type: input.type,
    quantity: input.quantity,
    orderType: input.orderType,
    quote,
    price,
    total,
  });

  const tradePayload = serializeTrade(result.trade);
  const execution = createExecutionPayload({
    symbol: input.symbol,
    type: input.type,
    quantity: input.quantity,
    orderType: input.orderType,
    price,
    total,
    quote,
    fees: tradePayload.fees,
    realizedPnl: tradePayload.realizedPnl,
  });
  const warnings = [];

  try {
    await createPortfolioSnapshotFromState(userId, snapshotSource);
  } catch (snapshotError) {
    warnings.push('Paper trade executed, but its portfolio performance snapshot could not be recorded.');
  }

  return {
    success: true,
    mode: PAPER_TRADING_MODE,
    status: 'executed',
    orderType: input.orderType,
    message: `Paper ${input.type} ${input.quantity} ${input.symbol} at $${price}`,
    trade: tradePayload,
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
  };
}

async function getTradeHistory(userId, requestedLimit = 50) {
  const parsedLimit = Number.parseInt(requestedLimit, 10);
  const limit = Math.min(Math.max(Number.isFinite(parsedLimit) ? parsedLimit : 50, 1), 100);
  const trades = await Trade.find({ userId }).sort({ createdAt: -1 }).limit(limit);
  const data = trades.map(serializeTrade);

  return {
    success: true,
    mode: PAPER_TRADING_MODE,
    count: data.length,
    limit,
    timestamp: new Date().toISOString(),
    data,
    trades: data,
  };
}

module.exports = {
  PAPER_TRADING_MODE,
  createPriceStatus,
  executePaperTrade,
  getTradeHistory,
  parseTradeInput,
  resolveTradeQuote,
  serializeTrade,
};
