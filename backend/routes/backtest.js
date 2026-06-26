const router = require('express').Router();
const { body } = require('express-validator');
const auth = require('../middleware/auth');
const { checkPlan } = require('../middleware/CheckPlan');
const { validate } = require('../middleware/validate');
const {
  runBacktest,
  createErrorBacktest,
  VALID_STRATEGIES,
  SUPPORTED_SYMBOLS,
} = require('../services/backtestEngine');
const { logActivitySafe } = require('../services/activityService');

const backtestValidator = require('../validators/backtestValidator');

const OPTIONAL_BACKTEST_PARAMS = [
  'stopLoss',
  'takeProfit',
  'rsiPeriod',
  'rsiOversold',
  'rsiOverbought',
  'bbPeriod',
  'bbStdDev',
  'emaFast',
  'emaSlow',
  'stochK',
  'stochD',
  'stochOversold',
  'stochOverbought',
];

function hasValue(value) {
  return value !== undefined && value !== null && value !== '';
}

function buildBacktestParams(body = {}, strategyOverride = null) {
  const symbol = typeof body.symbol === 'string' ? body.symbol.trim().toUpperCase() : '';
  const strategy = strategyOverride || (typeof body.strategy === 'string' ? body.strategy.trim().toLowerCase() : 'rsi');
  const params = {
    symbol,
    strategy,
    startDate: body.startDate || null,
    endDate: body.endDate || null,
    initialCapital: Number(body.initialCapital),
    positionSize: body.positionSize === undefined ? 0.2 : Number(body.positionSize),
  };

  OPTIONAL_BACKTEST_PARAMS.forEach((key) => {
    if (hasValue(body[key])) params[key] = Number(body[key]);
  });

  return params;
}

function summarizeComparisonResult(result, strategy) {
  const results = result?.results || null;

  return {
    strategy,
    success: result?.success === true,
    fallback: result?.fallback === true,
    source: result?.source || null,
    provider: result?.provider || null,
    error: result?.error || null,
    warnings: Array.isArray(result?.warnings) ? result.warnings.filter(Boolean) : [],
    totalReturn: results ? Number(results.totalReturn) : null,
    winRate: results ? Number(results.winRate) : null,
    maxDrawdown: results ? Number(results.maxDrawdown) : null,
    numberOfTrades: results ? Number(results.totalTrades) : 0,
    finalBalance: results ? Number(results.finalCapital) : null,
    finalCapital: results ? Number(results.finalCapital) : null,
    totalProfit: results ? Number(results.totalProfit) : null,
    equityCurve: Array.isArray(result?.equityCurve) ? result.equityCurve : [],
    results,
  };
}

// Extend the base validator with optional date fields
const fullBacktestValidator = [
  ...backtestValidator,
  body('startDate')
    .optional({ nullable: true })
    .isISO8601().withMessage('startDate must be a valid ISO 8601 date (e.g. 2024-01-01).'),
  body('endDate')
    .optional({ nullable: true })
    .isISO8601().withMessage('endDate must be a valid ISO 8601 date.')
    .custom((value, { req }) => {
      if (req.body.startDate && value) {
        const start = new Date(req.body.startDate);
        const end = new Date(value);
        if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && end <= start) {
          throw new Error('endDate must be after startDate.');
        }
      }
      return true;
    }),
];

router.post('/', auth, checkPlan('pro'), validate(fullBacktestValidator), async (req, res) => {
  try {
    const params = buildBacktestParams(req.body);
    const result = await runBacktest(params);
    await logActivitySafe({
      user: req.user.id,
      type: 'backtest:run',
      title: 'Backtest executed',
      description: `${params.strategy.toUpperCase()} backtest executed for ${params.symbol}.`,
      metadata: {
        symbol: params.symbol,
        strategy: params.strategy,
        success: result.success === true,
        fallback: result.fallback === true,
        totalReturn: result.results?.totalReturn ?? null,
      },
    });
    return res.status(result.success ? 200 : 400).json(result);
  } catch (err) {
    return res.status(500).json(createErrorBacktest(err.message || 'Unable to run backtest.'));
  }
});

const compareBacktestValidator = [
  body('symbol')
    .exists({ checkFalsy: true }).withMessage('symbol is required.')
    .isString().withMessage('symbol must be a string.')
    .trim()
    .toUpperCase()
    .isIn(SUPPORTED_SYMBOLS).withMessage(`symbol must be one of: ${SUPPORTED_SYMBOLS.join(', ')}.`),
  body('strategies')
    .isArray({ min: 2, max: 3 }).withMessage('strategies must contain 2 or 3 strategies.'),
  body('strategies.*')
    .isString().withMessage('each strategy must be a string.')
    .trim()
    .toLowerCase()
    .isIn(VALID_STRATEGIES).withMessage(`strategy must be one of: ${VALID_STRATEGIES.join(', ')}.`),
  body('initialCapital')
    .optional()
    .isFloat({ gt: 0 }).withMessage('initialCapital must be positive.')
    .toFloat()
    .custom((value) => {
      if (value > 10_000_000) throw new Error('initialCapital must not exceed 10,000,000.');
      return true;
    }),
  body('positionSize')
    .optional()
    .isFloat({ min: 0.01, max: 1.0 }).withMessage('positionSize must be between 0.01 and 1.0.')
    .toFloat(),
  body('startDate')
    .optional({ nullable: true })
    .isISO8601().withMessage('startDate must be a valid ISO 8601 date.'),
  body('endDate')
    .optional({ nullable: true })
    .isISO8601().withMessage('endDate must be a valid ISO 8601 date.')
    .custom((value, { req }) => {
      if (req.body.startDate && value) {
        const start = new Date(req.body.startDate);
        const end = new Date(value);
        if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && end <= start) {
          throw new Error('endDate must be after startDate.');
        }
      }
      return true;
    }),
];

router.post('/compare', auth, checkPlan('pro'), validate(compareBacktestValidator), async (req, res) => {
  try {
    const strategies = [...new Set((req.body.strategies || []).map((strategy) => String(strategy).trim().toLowerCase()))];
    if (strategies.length < 2) {
      return res.status(400).json(createErrorBacktest('At least two different strategies are required.'));
    }

    const rawResults = await Promise.all(strategies.map((strategy) => runBacktest(buildBacktestParams(req.body, strategy))));
    const comparisons = rawResults.map((result, index) => summarizeComparisonResult(result, strategies[index]));
    const ranked = comparisons
      .filter((item) => Number.isFinite(item.finalBalance))
      .sort((a, b) => b.finalBalance - a.finalBalance);
    const best = ranked[0] || null;

    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      source: 'backend',
      provider: 'internal-backtest-engine',
      fallback: comparisons.every((item) => item.fallback),
      params: {
        symbol: String(req.body.symbol || '').trim().toUpperCase(),
        strategies,
        startDate: req.body.startDate || null,
        endDate: req.body.endDate || null,
        initialCapital: req.body.initialCapital === undefined ? 10000 : Number(req.body.initialCapital),
        positionSize: req.body.positionSize === undefined ? 0.2 : Number(req.body.positionSize),
      },
      bestStrategy: best ? best.strategy : null,
      comparisons,
      warnings: comparisons.flatMap((item) => item.warnings || []),
      error: null,
    };

    await logActivitySafe({
      user: req.user.id,
      type: 'backtest:compare',
      title: 'Backtest comparison executed',
      description: `${strategies.length} strategies compared for ${response.params.symbol}.`,
      metadata: {
        symbol: response.params.symbol,
        strategies,
        bestStrategy: response.bestStrategy,
      },
    });

    return res.json(response);
  } catch (err) {
    return res.status(500).json(createErrorBacktest(err.message || 'Unable to compare backtests.'));
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
