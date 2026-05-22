const BotAction = require('../models/BotAction');
const BotInstance = require('../models/BotInstance');
const { getPrice } = require('./marketService');

const PROVIDER = 'internal-paper-bot';
const SOURCE = 'backend';
const VALID_STRATEGIES = ['momentum-24h'];
const VALID_RISK_LEVELS = ['low', 'medium', 'high'];
const DEFAULT_INTERVAL_SECONDS = Number.parseInt(process.env.BOT_DEFAULT_INTERVAL_SECONDS, 10) || 60;
const MAX_POSITION_SIZE = Number.parseFloat(process.env.BOT_MAX_POSITION_SIZE) || 1000;
const MIN_INTERVAL_SECONDS = 15;
const MAX_INTERVAL_SECONDS = 3600;

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

function serializeAction(action) {
  if (!action) return null;
  const data = action.toObject ? action.toObject() : action;

  return {
    id: data._id || data.id || null,
    bot: data.bot || null,
    symbol: data.symbol || null,
    action: data.action || null,
    reason: data.reason || '',
    quantity: toFiniteNumber(data.quantity),
    price: toFiniteNumber(data.price),
    priceSource: data.priceSource || null,
    priceProvider: data.priceProvider || null,
    priceTimestamp: data.priceTimestamp || null,
    confidence: toFiniteNumber(data.confidence),
    strategy: data.strategy || null,
    executed: data.executed === true,
    trade: data.trade || null,
    error: data.error || null,
    createdAt: data.createdAt || null,
    timestamp: data.createdAt || null,
  };
}

function createStatus(bot = null) {
  if (!bot) {
    return {
      isRunning: false,
      mode: 'paper',
      strategy: null,
      symbol: null,
      startedAt: null,
      stoppedAt: null,
      lastTickAt: null,
      positionSize: null,
      maxPositionSize: MAX_POSITION_SIZE,
      riskLevel: null,
      intervalSeconds: DEFAULT_INTERVAL_SECONDS,
      lastDecision: null,
    };
  }

  return {
    isRunning: bot.isRunning === true,
    mode: bot.mode || 'paper',
    strategy: bot.strategy || null,
    symbol: bot.symbol || null,
    startedAt: bot.startedAt || null,
    stoppedAt: bot.stoppedAt || null,
    lastTickAt: bot.lastTickAt || null,
    positionSize: toFiniteNumber(bot.positionSize),
    maxPositionSize: toFiniteNumber(bot.maxPositionSize, MAX_POSITION_SIZE),
    riskLevel: bot.riskLevel || 'medium',
    intervalSeconds: toFiniteNumber(bot.intervalSeconds, DEFAULT_INTERVAL_SECONDS),
    lastDecision: bot.lastDecision || null,
  };
}

function createDataQuality(warnings = []) {
  return {
    hasRealBotEngine: true,
    usesMockPerformance: false,
    isIndicative: false,
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
  return {
    success,
    timestamp: nowIso(),
    source: SOURCE,
    provider: PROVIDER,
    fallback: false,
    message,
    dataQuality: createDataQuality(warnings),
    status: createStatus(bot),
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
    timestamp: nowIso(),
    source: SOURCE,
    provider: PROVIDER,
    fallback: false,
    message: message || 'Unable to process bot request',
    dataQuality: createDataQuality(warnings),
    status,
    performance: null,
    recentActions: [],
    warnings: warnings.filter(Boolean),
    error: message || 'Unable to process bot request',
  };
}

function createServiceError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function getPriceWarning(quote) {
  if (quote?.priceAvailable !== true || quote?.price === null) {
    return 'Live bot tick skipped because the market price is unavailable.';
  }
  if (quote?.fallback === true) {
    return 'Live bot tick skipped because the market price is fallback data.';
  }
  if (quote?.stale === true) {
    return 'Live bot tick skipped because the market price is stale.';
  }
  return null;
}

function getQuoteMetadata(quote = {}) {
  return {
    price: toFiniteNumber(quote.price),
    priceSource: quote.source || null,
    priceProvider: quote.provider || null,
    priceTimestamp: dateOrNull(quote.timestamp),
  };
}

function roundQuantity(value) {
  const number = toFiniteNumber(value);
  if (number === null || number <= 0) return null;
  return Number(number.toFixed(8));
}

function getDefaultInterval(value) {
  const interval = toFiniteNumber(value, DEFAULT_INTERVAL_SECONDS);
  return Math.trunc(interval);
}

async function validateStartConfig(config = {}) {
  const symbol = cleanSymbol(config.symbol);
  const strategy = cleanStrategy(config.strategy);
  const mode = typeof config.mode === 'string' ? config.mode.trim().toLowerCase() : 'paper';
  const positionSize = toFiniteNumber(config.positionSize);
  const intervalSeconds = getDefaultInterval(config.intervalSeconds);
  const riskLevel = typeof config.riskLevel === 'string'
    ? config.riskLevel.trim().toLowerCase()
    : 'medium';

  if (!symbol) return { error: 'symbol is required' };
  if (!strategy) return { error: 'strategy is required' };
  if (!VALID_STRATEGIES.includes(strategy)) return { error: `Unsupported bot strategy: ${strategy}` };
  if (mode !== 'paper') return { error: 'Only paper mode is supported.' };
  if (positionSize === null || positionSize <= 0) return { error: 'positionSize must be a positive number.' };
  if (positionSize > MAX_POSITION_SIZE) {
    return { error: `positionSize cannot exceed ${MAX_POSITION_SIZE}.` };
  }
  if (!VALID_RISK_LEVELS.includes(riskLevel)) return { error: `Unsupported bot riskLevel: ${riskLevel}` };
  if (intervalSeconds < MIN_INTERVAL_SECONDS || intervalSeconds > MAX_INTERVAL_SECONDS) {
    return { error: `intervalSeconds must be between ${MIN_INTERVAL_SECONDS} and ${MAX_INTERVAL_SECONDS}.` };
  }

  const quote = await getPrice(symbol);
  if (quote?.priceAvailable !== true || quote?.price === null || quote?.source === 'error') {
    return { error: `Unsupported bot symbol or price unavailable: ${symbol}` };
  }

  return {
    symbol,
    strategy,
    mode,
    positionSize,
    maxPositionSize: MAX_POSITION_SIZE,
    intervalSeconds,
    riskLevel,
  };
}

async function getCurrentBot(userId) {
  return BotInstance.findOne({ user: userId, isRunning: true }).sort({ updatedAt: -1 });
}

async function getLatestBot(userId) {
  return BotInstance.findOne({ user: userId }).sort({ updatedAt: -1 });
}

async function getRecentBotActions(userId, limit = 20) {
  const safeLimit = Math.min(Math.max(Math.trunc(toFiniteNumber(limit, 20)), 1), 100);
  return BotAction.find({ user: userId }).sort({ createdAt: -1 }).limit(safeLimit);
}

async function computeBotPerformance(userId) {
  const [buyCount, sellCount, holdCount, skipCount] = await Promise.all(
    ['BUY', 'SELL', 'HOLD', 'SKIP'].map((action) => BotAction.countDocuments({ user: userId, action })),
  );

  return {
    actionsCount: buyCount + sellCount + holdCount + skipCount,
    buyCount,
    sellCount,
    holdCount,
    skipCount,
    realizedPnl: null,
    pnlAvailable: false,
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
    mode: input.mode,
    strategy: input.strategy,
    symbol: input.symbol,
    positionSize: input.positionSize,
    maxPositionSize: input.maxPositionSize,
    riskLevel: input.riskLevel,
    intervalSeconds: input.intervalSeconds,
    startedAt: new Date(),
    stoppedAt: null,
  });

  return buildStatusResponse(userId, 'Paper bot started.');
}

async function stopBot(userId) {
  const bot = await getCurrentBot(userId);
  if (!bot) return buildStatusResponse(userId, 'No running paper bot found.');

  bot.isRunning = false;
  bot.stoppedAt = new Date();
  await bot.save();

  return buildStatusResponse(userId, 'Paper bot stopped.');
}

function evaluateStrategy(bot, quote) {
  if (bot.strategy !== 'momentum-24h') {
    throw createServiceError(`Unsupported bot strategy: ${bot.strategy}`);
  }

  const change = toFiniteNumber(quote.change24h, 0);
  const threshold = 3;
  const price = toFiniteNumber(quote.price);
  const quantity = roundQuantity(bot.positionSize / price);

  if (change >= threshold) {
    return {
      action: 'BUY',
      quantity,
      confidence: 62,
      reason: `24h change ${change.toFixed(2)}% meets the +${threshold}% momentum threshold.`,
    };
  }
  if (change <= -threshold) {
    return {
      action: 'SELL',
      quantity,
      confidence: 62,
      reason: `24h change ${change.toFixed(2)}% meets the -${threshold}% momentum threshold.`,
    };
  }

  return {
    action: 'HOLD',
    quantity: null,
    confidence: 55,
    reason: `24h change ${change.toFixed(2)}% stays inside the momentum hold band.`,
  };
}

async function recordBotAction(bot, action) {
  return BotAction.create({
    user: bot.user,
    bot: bot._id,
    symbol: bot.symbol,
    strategy: bot.strategy,
    executed: false,
    ...action,
  });
}

async function recordSkippedTick(bot, quote, warning) {
  return recordBotAction(bot, {
    action: 'SKIP',
    reason: warning,
    quantity: null,
    confidence: null,
    error: quote?.error || warning,
    ...getQuoteMetadata(quote),
  });
}

async function runBotTick(userId) {
  const bot = await getCurrentBot(userId);
  if (!bot) throw createServiceError('No running paper bot found.', 409);

  const quote = await getPrice(bot.symbol);
  const warning = getPriceWarning(quote);
  const action = warning
    ? await recordSkippedTick(bot, quote, warning)
    : await recordBotAction(bot, {
      ...evaluateStrategy(bot, quote),
      error: null,
      ...getQuoteMetadata(quote),
    });

  bot.lastTickAt = new Date();
  bot.lastDecision = {
    action: action.action,
    reason: action.reason,
    actionId: action._id,
    price: action.price,
    createdAt: action.createdAt,
  };
  await bot.save();

  const response = await buildStatusResponse(
    userId,
    warning ? 'Paper bot tick skipped.' : 'Paper bot tick recorded.',
  );
  response.decision = serializeAction(action);
  if (warning) {
    response.warnings = [warning];
    response.dataQuality = createDataQuality([warning]);
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
  evaluateStrategy,
  getBotActionsResponse,
  getBotStatus,
  getRecentBotActions,
  recordBotAction,
  runBotTick,
  startBot,
  stopBot,
  validateStartConfig,
};
