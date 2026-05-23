const BotAction = require('../models/BotAction');
const BotInstance = require('../models/BotInstance');
const Portfolio = require('../models/portfolio');
const { getMarketHistory, getPrice } = require('./marketService');
const { executePaperTrade } = require('./paperTradingService');

const PROVIDER = 'internal-paper-bot';
const SOURCE = 'backend';
const PAPER_MODE = 'paper';
const VALID_STRATEGIES = ['ma_cross'];
const VALID_RISK_LEVELS = ['low', 'medium', 'high'];
const DEFAULT_INTERVAL_SECONDS = Number.parseInt(process.env.BOT_DEFAULT_INTERVAL_SECONDS, 10) || 60;
const MAX_POSITION_SIZE = Number.parseFloat(process.env.BOT_MAX_POSITION_SIZE) || 1000;
const MIN_INTERVAL_SECONDS = 15;
const MAX_INTERVAL_SECONDS = 3600;
const HISTORY_INTERVAL = '1h';
const HISTORY_RANGE = '30d';
const MIN_CANDLES_FOR_MA = 50;

function nowIso() {
  return new Date().toISOString();
}

function toFiniteNumber(value, fallback = null) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function cleanSymbol(value) {
  return typeof value === 'string' ? value.trim().toUpperCase() : '';
}

function cleanStrategy(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function dateOrNull(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function roundQuantity(value) {
  const number = toFiniteNumber(value);
  if (number === null || number <= 0) return null;
  return Number(number.toFixed(8));
}

function createServiceError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function serializeAction(action) {
  if (!action) return null;
  const data = action.toObject ? action.toObject() : action;

  return {
    id: data._id || data.id || null,
    bot: data.bot || null,
    symbol: data.symbol || null,
    action: data.action || data.decision || null,
    decision: data.decision || data.action || null,
    mode: data.mode || PAPER_MODE,
    reason: data.reason || '',
    quantity: toFiniteNumber(data.quantity),
    price: toFiniteNumber(data.price),
    priceSource: data.priceSource || null,
    priceProvider: data.priceProvider || null,
    priceProviderSymbol: data.priceProviderSymbol || null,
    priceTimestamp: data.priceTimestamp || null,
    priceFetchedAt: data.priceFetchedAt || data.priceTimestamp || null,
    priceCached: data.priceCached === true,
    priceFallback: data.priceFallback === true,
    priceStale: data.priceStale === true || data.priceIsStale === true,
    priceIsLive: data.priceIsLive === true,
    priceIsStale: data.priceIsStale === true || data.priceStale === true,
    confidence: toFiniteNumber(data.confidence),
    strategy: data.strategy || null,
    executed: data.executed === true,
    trade: data.trade || null,
    execution: data.execution || null,
    error: data.error || null,
    createdAt: data.createdAt || null,
    timestamp: data.createdAt || null,
  };
}

function createStatus(bot = null) {
  if (!bot) {
    return {
      status: 'stopped',
      isRunning: false,
      mode: PAPER_MODE,
      strategy: null,
      symbol: null,
      executeTrades: false,
      quantity: null,
      startedAt: null,
      stoppedAt: null,
      lastTickAt: null,
      lastRunAt: null,
      positionSize: null,
      maxPositionSize: MAX_POSITION_SIZE,
      riskLevel: null,
      intervalSeconds: DEFAULT_INTERVAL_SECONDS,
      lastDecision: null,
      lastError: null,
    };
  }

  const isRunning = bot.status === 'running' || bot.isRunning === true;

  return {
    status: isRunning ? 'running' : bot.status || 'stopped',
    isRunning,
    mode: bot.mode || PAPER_MODE,
    strategy: bot.strategy || null,
    symbol: bot.symbol || null,
    executeTrades: bot.executeTrades === true,
    quantity: toFiniteNumber(bot.quantity),
    startedAt: bot.startedAt || null,
    stoppedAt: bot.stoppedAt || null,
    lastTickAt: bot.lastTickAt || null,
    lastRunAt: bot.lastRunAt || bot.lastTickAt || null,
    positionSize: toFiniteNumber(bot.positionSize),
    maxPositionSize: toFiniteNumber(bot.maxPositionSize, MAX_POSITION_SIZE),
    riskLevel: bot.riskLevel || 'medium',
    intervalSeconds: toFiniteNumber(bot.intervalSeconds, DEFAULT_INTERVAL_SECONDS),
    lastDecision: bot.lastDecision || null,
    lastError: bot.lastError || null,
  };
}

function createDataQuality(warnings = []) {
  return {
    hasRealBotEngine: true,
    usesMockPerformance: false,
    isIndicative: false,
    strategyUsesRealCandles: true,
    canExecutePaperTrades: true,
    warnings: warnings.filter(Boolean),
  };
}

function createResponse({
  success = true,
  message = '',
  bot = null,
  performance = null,
  recentActions = [],
  warnings = [],
  error = null,
  decision = null,
} = {}) {
  const status = createStatus(bot);

  return {
    success,
    mode: PAPER_MODE,
    timestamp: nowIso(),
    source: SOURCE,
    provider: PROVIDER,
    fallback: false,
    message,
    dataQuality: createDataQuality(warnings),
    bot: status,
    status,
    performance,
    recentActions: recentActions.map(serializeAction).filter(Boolean),
    decision: serializeAction(decision),
    warnings: warnings.filter(Boolean),
    error,
  };
}

function createErrorResponse(message, { status = null, warnings = [] } = {}) {
  return {
    success: false,
    mode: PAPER_MODE,
    timestamp: nowIso(),
    source: SOURCE,
    provider: PROVIDER,
    fallback: false,
    message: message || 'Unable to process bot request',
    dataQuality: createDataQuality(warnings),
    bot: status || createStatus(null),
    status: status || createStatus(null),
    performance: null,
    recentActions: [],
    warnings: warnings.filter(Boolean),
    error: message || 'Unable to process bot request',
  };
}

function getQuoteWarning(quote) {
  if (quote?.priceAvailable !== true || quote?.price === null) {
    return 'Paper bot tick skipped because the market price is unavailable.';
  }
  if (quote?.fallback === true) {
    return 'Paper bot tick skipped because the market price is fallback data.';
  }
  if (quote?.stale === true || quote?.isStale === true) {
    return 'Paper bot tick skipped because the market price is stale.';
  }
  return null;
}

function getQuoteMetadata(quote = {}) {
  const isStale = quote.stale === true || quote.isStale === true;

  return {
    price: toFiniteNumber(quote.price),
    priceSource: quote.source || null,
    priceProvider: quote.provider || null,
    priceProviderSymbol: quote.providerSymbol || null,
    priceTimestamp: dateOrNull(quote.timestamp),
    priceFetchedAt: dateOrNull(quote.fetchedAt || quote.timestamp),
    priceCached: quote.cached === true,
    priceFallback: quote.fallback === true,
    priceStale: isStale,
    priceIsLive: quote.isLive === true,
    priceIsStale: isStale,
  };
}

function getDefaultInterval(value) {
  const interval = toFiniteNumber(value, DEFAULT_INTERVAL_SECONDS);
  return Math.trunc(interval);
}

function movingAverage(candles, period) {
  if (!Array.isArray(candles) || candles.length < period) return null;
  const slice = candles.slice(-period);
  const total = slice.reduce((sum, candle) => sum + toFiniteNumber(candle.close, 0), 0);
  return total / period;
}

async function validateStartConfig(config = {}) {
  const symbol = cleanSymbol(config.symbol);
  const strategy = cleanStrategy(config.strategy || 'ma_cross');
  const mode = typeof config.mode === 'string' ? config.mode.trim().toLowerCase() : PAPER_MODE;
  const quantity = toFiniteNumber(config.quantity);
  const positionSize = toFiniteNumber(config.positionSize);
  const executeTrades = config.executeTrades === true;
  const intervalSeconds = getDefaultInterval(config.intervalSeconds);
  const riskLevel = typeof config.riskLevel === 'string'
    ? config.riskLevel.trim().toLowerCase()
    : 'medium';

  if (!symbol) return { error: 'symbol is required' };
  if (!strategy) return { error: 'strategy is required' };
  if (!VALID_STRATEGIES.includes(strategy)) return { error: `Unsupported bot strategy: ${strategy}` };
  if (mode !== PAPER_MODE) return { error: 'Only paper mode is supported.' };
  if (quantity !== null && quantity <= 0) return { error: 'quantity must be a positive number when provided.' };
  if (positionSize === null || positionSize <= 0) return { error: 'positionSize must be a positive number.' };
  if (positionSize > MAX_POSITION_SIZE) {
    return { error: `positionSize cannot exceed ${MAX_POSITION_SIZE}.` };
  }
  if (!VALID_RISK_LEVELS.includes(riskLevel)) return { error: `Unsupported bot riskLevel: ${riskLevel}` };
  if (intervalSeconds < MIN_INTERVAL_SECONDS || intervalSeconds > MAX_INTERVAL_SECONDS) {
    return { error: `intervalSeconds must be between ${MIN_INTERVAL_SECONDS} and ${MAX_INTERVAL_SECONDS}.` };
  }

  const [quote, history] = await Promise.all([
    getPrice(symbol),
    getMarketHistory(symbol, HISTORY_INTERVAL, HISTORY_RANGE),
  ]);
  const priceWarning = getQuoteWarning(quote);
  if (priceWarning || quote?.source === 'error') {
    return { error: `Unsupported bot symbol or price unavailable: ${symbol}` };
  }
  if (history?.success !== true || !Array.isArray(history.data) || history.data.length < MIN_CANDLES_FOR_MA) {
    return { error: `Not enough OHLC history for ${symbol} to run the MA strategy.` };
  }

  return {
    symbol,
    strategy,
    mode,
    quantity,
    positionSize,
    maxPositionSize: MAX_POSITION_SIZE,
    intervalSeconds,
    riskLevel,
    executeTrades,
  };
}

async function getCurrentBot(userId) {
  return BotInstance.findOne({
    user: userId,
    $or: [{ status: 'running' }, { isRunning: true }],
  }).sort({ updatedAt: -1 });
}

async function getLatestBot(userId) {
  return BotInstance.findOne({ user: userId }).sort({ updatedAt: -1 });
}

async function getRecentBotActions(userId, limit = 20) {
  const safeLimit = Math.min(Math.max(Math.trunc(toFiniteNumber(limit, 20)), 1), 100);
  return BotAction.find({ user: userId }).sort({ createdAt: -1 }).limit(safeLimit);
}

async function computeBotPerformance(userId) {
  const [buyCount, sellCount, holdCount, skipCount, executedActions] = await Promise.all([
    BotAction.countDocuments({ user: userId, action: 'BUY' }),
    BotAction.countDocuments({ user: userId, action: 'SELL' }),
    BotAction.countDocuments({ user: userId, action: 'HOLD' }),
    BotAction.countDocuments({ user: userId, action: 'SKIP' }),
    BotAction.find({ user: userId, executed: true }).select('execution'),
  ]);
  const realizedPnlValues = executedActions
    .map((action) => toFiniteNumber(action.execution?.realizedPnl))
    .filter((value) => value !== null);
  const realizedPnl = realizedPnlValues.reduce((sum, value) => sum + value, 0);

  return {
    actionsCount: buyCount + sellCount + holdCount + skipCount,
    buyCount,
    sellCount,
    holdCount,
    skipCount,
    executedCount: executedActions.length,
    realizedPnl: realizedPnlValues.length > 0 ? Number(realizedPnl.toFixed(2)) : null,
    pnlAvailable: realizedPnlValues.length > 0,
  };
}

async function buildStatusResponse(userId, message) {
  const [bot, recentActions, performance] = await Promise.all([
    getCurrentBot(userId).then(async (runningBot) => runningBot || getLatestBot(userId)),
    getRecentBotActions(userId),
    computeBotPerformance(userId),
  ]);

  return createResponse({
    message,
    bot,
    performance,
    recentActions,
  });
}

async function getBotStatus(userId) {
  return buildStatusResponse(userId, 'Paper bot status loaded.');
}

async function startBot(userId, config = {}) {
  const input = await validateStartConfig(config);
  if (input.error) return createErrorResponse(input.error);

  const existing = await getCurrentBot(userId);
  if (existing) {
    return buildStatusResponse(userId, 'Paper bot is already running.');
  }

  await BotInstance.create({
    user: userId,
    isRunning: true,
    status: 'running',
    mode: input.mode,
    strategy: input.strategy,
    symbol: input.symbol,
    quantity: input.quantity,
    positionSize: input.positionSize,
    maxPositionSize: input.maxPositionSize,
    riskLevel: input.riskLevel,
    intervalSeconds: input.intervalSeconds,
    executeTrades: input.executeTrades,
    startedAt: new Date(),
    stoppedAt: null,
    lastError: null,
  });

  return buildStatusResponse(userId, 'Paper bot started. No broker orders are sent.');
}

async function stopBot(userId) {
  const bot = await getCurrentBot(userId);
  if (!bot) return buildStatusResponse(userId, 'No running paper bot found.');

  bot.isRunning = false;
  bot.status = 'stopped';
  bot.stoppedAt = new Date();
  await bot.save();

  return buildStatusResponse(userId, 'Paper bot stopped.');
}

function getDecisionQuantity(bot, price, holdingQuantity = 0) {
  const configuredQuantity = toFiniteNumber(bot.quantity);
  if (configuredQuantity !== null && configuredQuantity > 0) return roundQuantity(configuredQuantity);

  const positionSize = toFiniteNumber(bot.positionSize);
  const computedQuantity = positionSize && price > 0 ? positionSize / price : null;
  const rounded = roundQuantity(computedQuantity);

  if (holdingQuantity > 0 && rounded !== null) {
    return Math.min(rounded, roundQuantity(holdingQuantity));
  }

  return rounded;
}

function evaluateMaCrossStrategy({ bot, candles, holding }) {
  if (bot.strategy !== 'ma_cross') {
    throw createServiceError(`Unsupported bot strategy: ${bot.strategy}`);
  }

  if (!Array.isArray(candles) || candles.length < MIN_CANDLES_FOR_MA) {
    return {
      action: 'HOLD',
      quantity: null,
      confidence: 40,
      reason: `MA strategy needs at least ${MIN_CANDLES_FOR_MA} candles.`,
    };
  }

  const ma20 = movingAverage(candles, 20);
  const ma50 = movingAverage(candles, 50);
  const lastClose = toFiniteNumber(candles[candles.length - 1]?.close);
  const holdingQuantity = toFiniteNumber(holding?.quantity, 0);
  const hasPosition = holdingQuantity > 0;
  const quantity = getDecisionQuantity(bot, lastClose, holdingQuantity);

  if (ma20 === null || ma50 === null || lastClose === null || quantity === null) {
    return {
      action: 'HOLD',
      quantity: null,
      confidence: 40,
      reason: 'MA strategy could not calculate a valid signal.',
    };
  }

  const spreadPercent = ma50 > 0 ? ((ma20 - ma50) / ma50) * 100 : 0;
  const confidence = Math.min(88, Math.max(52, 55 + Math.abs(spreadPercent) * 8));

  if (ma20 > ma50 && !hasPosition) {
    return {
      action: 'BUY',
      quantity,
      confidence: Number(confidence.toFixed(1)),
      reason: `MA20 (${ma20.toFixed(2)}) is above MA50 (${ma50.toFixed(2)}) and no ${bot.symbol} position exists.`,
    };
  }

  if (ma20 < ma50 && hasPosition) {
    return {
      action: 'SELL',
      quantity,
      confidence: Number(confidence.toFixed(1)),
      reason: `MA20 (${ma20.toFixed(2)}) is below MA50 (${ma50.toFixed(2)}) and a ${bot.symbol} position exists.`,
    };
  }

  return {
    action: 'HOLD',
    quantity: null,
    confidence: Number(confidence.toFixed(1)),
    reason: hasPosition
      ? `MA20 (${ma20.toFixed(2)}) remains above MA50 (${ma50.toFixed(2)}); existing paper position is held.`
      : `MA20 (${ma20.toFixed(2)}) is not above MA50 (${ma50.toFixed(2)}); no paper position is opened.`,
  };
}

async function recordBotAction(bot, action) {
  return BotAction.create({
    user: bot.user,
    bot: bot._id,
    symbol: bot.symbol,
    strategy: bot.strategy,
    mode: PAPER_MODE,
    action: action.action,
    decision: action.action,
    executed: false,
    ...action,
  });
}

async function runPaperExecution(bot, decision) {
  if (!['BUY', 'SELL'].includes(decision.action)) {
    return {
      executed: false,
      trade: null,
      execution: null,
      error: null,
    };
  }

  if (!bot.executeTrades) {
    return {
      executed: false,
      trade: null,
      execution: null,
      error: null,
    };
  }

  try {
    const result = await executePaperTrade({
      userId: String(bot.user),
      symbol: bot.symbol,
      type: decision.action,
      quantity: decision.quantity,
      orderType: 'market',
      snapshotSource: 'bot',
    });

    return {
      executed: result.success === true,
      trade: result.trade?._id || result.trade?.id || null,
      execution: result.execution || null,
      error: null,
    };
  } catch (error) {
    return {
      executed: false,
      trade: null,
      execution: null,
      error: error.message || 'Paper trade execution failed.',
    };
  }
}

async function runBotTick(userId) {
  const bot = await getCurrentBot(userId);
  if (!bot) throw createServiceError('No running paper bot found.', 409);

  const [quote, history, holding] = await Promise.all([
    getPrice(bot.symbol),
    getMarketHistory(bot.symbol, HISTORY_INTERVAL, HISTORY_RANGE),
    Portfolio.findOne({ userId, symbol: bot.symbol }),
  ]);
  const warning = getQuoteWarning(quote);
  const candles = Array.isArray(history?.data) ? history.data : [];
  const warnings = [];
  let decision = null;

  if (warning) {
    warnings.push(warning);
    decision = {
      action: 'HOLD',
      quantity: null,
      confidence: null,
      reason: warning,
      error: quote?.error || warning,
    };
  } else if (history?.success !== true || candles.length === 0) {
    const message = history?.message || 'No OHLC history available for bot strategy.';
    warnings.push(message);
    decision = {
      action: 'HOLD',
      quantity: null,
      confidence: null,
      reason: message,
      error: message,
    };
  } else {
    decision = evaluateMaCrossStrategy({ bot, candles, holding });
  }

  const executionResult = await runPaperExecution(bot, decision);
  const action = await recordBotAction(bot, {
    ...decision,
    ...getQuoteMetadata(quote),
    executed: executionResult.executed,
    trade: executionResult.trade,
    execution: executionResult.execution,
    error: executionResult.error || decision.error || null,
  });

  bot.lastTickAt = new Date();
  bot.lastRunAt = bot.lastTickAt;
  bot.lastError = action.error || null;
  bot.lastDecision = {
    action: action.action,
    decision: action.decision,
    reason: action.reason,
    actionId: action._id,
    price: action.price,
    executed: action.executed,
    trade: action.trade,
    createdAt: action.createdAt,
  };
  await bot.save();

  const response = await buildStatusResponse(
    userId,
    action.executed
      ? 'Paper bot tick executed a simulated trade.'
      : 'Paper bot tick recorded a decision.',
  );
  response.decision = serializeAction(action);
  if (warnings.length > 0) {
    response.warnings = warnings;
    response.dataQuality = createDataQuality(warnings);
  }
  return response;
}

async function getBotActionsResponse(userId, limit) {
  const [actions, performance, bot] = await Promise.all([
    getRecentBotActions(userId, limit),
    computeBotPerformance(userId),
    getCurrentBot(userId).then(async (runningBot) => runningBot || getLatestBot(userId)),
  ]);

  return createResponse({
    message: 'Paper bot actions loaded.',
    bot,
    performance,
    recentActions: actions,
  });
}

module.exports = {
  VALID_STRATEGIES,
  computeBotPerformance,
  createErrorResponse,
  evaluateMaCrossStrategy,
  getBotActionsResponse,
  getBotStatus,
  getRecentBotActions,
  recordBotAction,
  runBotTick,
  startBot,
  stopBot,
  validateStartConfig,
};
