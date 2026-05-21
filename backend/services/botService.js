const PROVIDER = 'internal-bot-controller';
const SOURCE = 'backend';
const VALID_STRATEGIES = ['rsi', 'macd', 'bollinger', 'multi'];
const VALID_SYMBOLS = ['BTC', 'ETH', 'SOL', 'XAU', 'AAPL'];
const ENGINE_WARNING = 'Real bot engine is not implemented yet. No orders, fake performance, or fake trades are generated.';

const activeBots = new Map();

function nowIso() {
  return new Date().toISOString();
}

function createDataQuality({ running = false } = {}) {
  const warnings = [ENGINE_WARNING];

  return {
    hasRealBotEngine: false,
    usesMockPerformance: false,
    isIndicative: true,
    warnings: running
      ? warnings
      : ['Bot engine is not active. No fake performance is shown.'],
  };
}

function createStatus(bot = null) {
  if (!bot) {
    return {
      isRunning: false,
      mode: 'unavailable',
      strategy: null,
      symbol: null,
      startedAt: null,
      stoppedAt: null,
    };
  }

  return {
    isRunning: true,
    mode: 'paper-controller',
    strategy: bot.strategy,
    symbol: bot.symbol,
    startedAt: bot.startedAt,
    stoppedAt: null,
  };
}

function createResponse({ message = null, bot = null, error = null, success = true } = {}) {
  const running = Boolean(bot);
  const warnings = running
    ? [ENGINE_WARNING, 'Paper controller is active only as backend state. It does not execute trades.']
    : ['Bot engine is not active. No fake performance is shown.'];

  return {
    success,
    timestamp: nowIso(),
    source: SOURCE,
    provider: PROVIDER,
    fallback: true,
    message,
    dataQuality: createDataQuality({ running }),
    status: createStatus(bot),
    performance: null,
    recentActions: [],
    warnings,
    error,
  };
}

function createErrorResponse(message) {
  return {
    success: false,
    timestamp: nowIso(),
    source: SOURCE,
    provider: PROVIDER,
    fallback: false,
    message: message || 'Unable to process bot request',
    dataQuality: createDataQuality(),
    status: null,
    performance: null,
    recentActions: [],
    warnings: [],
    error: message || 'Unable to process bot request',
  };
}

function validateStartConfig(config = {}) {
  const symbol = typeof config.symbol === 'string' ? config.symbol.trim().toUpperCase() : '';
  const strategy = typeof config.strategy === 'string' ? config.strategy.trim().toLowerCase() : '';
  const mode = typeof config.mode === 'string' ? config.mode.trim().toLowerCase() : 'paper';
  const positionSize = config.positionSize === undefined ? null : Number(config.positionSize);

  if (!symbol) return { error: 'symbol required' };
  if (!VALID_SYMBOLS.includes(symbol)) return { error: `Unsupported bot symbol: ${symbol}` };
  if (!strategy) return { error: 'strategy required' };
  if (!VALID_STRATEGIES.includes(strategy)) return { error: `Unsupported bot strategy: ${strategy}` };
  if (mode !== 'paper') return { error: 'Only paper mode is currently supported.' };
  if (positionSize !== null && (!Number.isFinite(positionSize) || positionSize <= 0)) {
    return { error: 'positionSize must be positive.' };
  }

  return { symbol, strategy, mode, positionSize };
}

function getBotStatus(userId) {
  const bot = activeBots.get(String(userId)) || null;
  return createResponse({
    message: bot ? 'Paper bot controller is active' : 'Bot engine is not active',
    bot,
  });
}

function startBot(userId, config = {}) {
  const input = validateStartConfig(config);
  if (input.error) return createErrorResponse(input.error);

  const key = String(userId);
  const existing = activeBots.get(key);
  if (existing) {
    return createResponse({
      message: 'Paper bot controller already active',
      bot: existing,
    });
  }

  const bot = {
    userId: key,
    symbol: input.symbol,
    strategy: input.strategy,
    mode: input.mode,
    positionSize: input.positionSize,
    startedAt: nowIso(),
  };

  activeBots.set(key, bot);

  return createResponse({
    message: 'Paper bot controller started. Real trading engine is not implemented yet.',
    bot,
  });
}

function stopBot(userId) {
  const key = String(userId);
  const existing = activeBots.get(key);

  if (!existing) {
    return createResponse({ message: 'No active paper bot controller' });
  }

  activeBots.delete(key);
  const response = createResponse({ message: 'Paper bot controller stopped' });
  response.status.stoppedAt = nowIso();
  return response;
}

module.exports = {
  getBotStatus,
  startBot,
  stopBot,
  createErrorResponse,
  VALID_STRATEGIES,
  VALID_SYMBOLS,
};
