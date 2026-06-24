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

const backtestValidator = require('../validators/backtestValidator');

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
    const body = req.body;
    const symbol = typeof body.symbol === 'string' ? body.symbol.trim().toUpperCase() : '';
    const strategy = typeof body.strategy === 'string' ? body.strategy.trim().toLowerCase() : 'rsi';

    const params = {
      symbol,
      strategy,
      startDate: body.startDate || null,
      endDate: body.endDate || null,
      initialCapital: Number(body.initialCapital),
      positionSize: body.positionSize === undefined ? 0.2 : Number(body.positionSize),
      stopLoss: body.stopLoss !== undefined ? Number(body.stopLoss) : undefined,
      takeProfit: body.takeProfit !== undefined ? Number(body.takeProfit) : undefined,
    };

    const result = await runBacktest(params);
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
