const router = require('express').Router();
const auth = require('../middleware/auth');
const { checkPlan } = require('../middleware/CheckPlan');
const {
  runBacktest,
  createErrorBacktest,
  VALID_STRATEGIES,
  SUPPORTED_SYMBOLS,
} = require('../services/backtestEngine');

function normalizeInput(body = {}) {
  const symbol = typeof body.symbol === 'string' ? body.symbol.trim().toUpperCase() : '';
  const strategy = typeof body.strategy === 'string' ? body.strategy.trim().toLowerCase() : 'rsi';
  const initialCapital = Number(body.initialCapital);
  const positionSize = body.positionSize === undefined ? 0.2 : Number(body.positionSize);

  if (!symbol) return { error: 'symbol required' };
  if (!SUPPORTED_SYMBOLS.includes(symbol)) {
    return {
      error: `${symbol} is not supported by the current Binance historical backtest provider.`,
    };
  }
  if (!VALID_STRATEGIES.includes(strategy)) return { error: 'Invalid strategy.' };
  if (!Number.isFinite(initialCapital) || initialCapital <= 0) return { error: 'initialCapital must be positive.' };
  if (!Number.isFinite(positionSize) || positionSize <= 0 || positionSize > 1) {
    return { error: 'positionSize must be between 0 and 1.' };
  }

  return {
    symbol,
    strategy,
    startDate: body.startDate || null,
    endDate: body.endDate || null,
    initialCapital,
    positionSize,
    stopLoss: body.stopLoss,
    takeProfit: body.takeProfit,
  };
}

router.post('/', auth, checkPlan('pro'), async (req, res) => {
  try {
    const input = normalizeInput(req.body);

    if (input.error) {
      return res.status(400).json(createErrorBacktest(input.error));
    }

    const result = await runBacktest(input);
    return res.status(result.success ? 200 : 400).json(result);
  } catch (err) {
    return res.status(500).json(createErrorBacktest(err.message || 'Unable to run backtest.'));
  }
});

router.get('/strategies', auth, async (req, res) => {
  res.json({
    success: true,
    timestamp: new Date().toISOString(),
    strategies: VALID_STRATEGIES,
    supportedSymbols: SUPPORTED_SYMBOLS,
    historicalProvider: 'Binance historical klines',
    marketType: 'crypto',
  });
});

module.exports = router;
