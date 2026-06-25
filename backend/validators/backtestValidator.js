const { body } = require('express-validator');
const { VALID_STRATEGIES, SUPPORTED_SYMBOLS } = require('../services/backtestEngine');

const backtestValidator = [
  // symbol — must be one of the Binance-supported symbols
  body('symbol')
    .exists({ checkFalsy: true }).withMessage('symbol is required.')
    .isString().withMessage('symbol must be a string.')
    .trim()
    .toUpperCase()
    .isIn(SUPPORTED_SYMBOLS)
    .withMessage(`symbol must be one of: ${SUPPORTED_SYMBOLS.join(', ')}.`),

  // strategy — all 6 strategies supported
  body('strategy')
    .exists({ checkFalsy: true }).withMessage('strategy is required.')
    .isString().withMessage('strategy must be a string.')
    .trim()
    .toLowerCase()
    .isIn(VALID_STRATEGIES)
    .withMessage(`strategy must be one of: ${VALID_STRATEGIES.join(', ')}.`),

  // initialCapital
  body('initialCapital')
    .exists({ checkNull: true }).withMessage('initialCapital is required.')
    .isFloat({ gt: 0 }).withMessage('initialCapital must be a positive number.')
    .toFloat()
    .custom((value) => {
      if (value > 10_000_000) throw new Error('initialCapital must not exceed 10,000,000.');
      return true;
    }),

  // positionSize (fraction: 0.01–1.0)
  body('positionSize')
    .optional()
    .isFloat({ min: 0.01, max: 1.0 })
    .withMessage('positionSize must be between 0.01 and 1.0.')
    .toFloat(),

  // stopLoss / takeProfit
  body('stopLoss')
    .optional()
    .isFloat({ min: 0.5, max: 20 })
    .withMessage('stopLoss must be between 0.5 and 20 (%).')
    .toFloat(),

  body('takeProfit')
    .optional()
    .isFloat({ min: 1, max: 50 })
    .withMessage('takeProfit must be between 1 and 50 (%).')
    .toFloat()
    .custom((value, { req }) => {
      const sl = parseFloat(req.body.stopLoss);
      const tp = parseFloat(value);
      if (Number.isFinite(sl) && Number.isFinite(tp) && tp <= sl) {
        throw new Error('takeProfit must be greater than stopLoss.');
      }
      return true;
    }),

  // Date range
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

  // RSI params
  body('rsiPeriod').optional().isInt({ min: 2, max: 50 }).withMessage('rsiPeriod must be 2–50.').toInt(),
  body('rsiOversold').optional().isInt({ min: 10, max: 45 }).withMessage('rsiOversold must be 10–45.').toInt(),
  body('rsiOverbought').optional().isInt({ min: 55, max: 90 }).withMessage('rsiOverbought must be 55–90.').toInt(),

  // Bollinger params
  body('bbPeriod').optional().isInt({ min: 5, max: 50 }).withMessage('bbPeriod must be 5–50.').toInt(),
  body('bbStdDev').optional().isFloat({ min: 1, max: 3 }).withMessage('bbStdDev must be 1–3.').toFloat(),

  // EMA Cross params
  body('emaFast').optional().isInt({ min: 3, max: 50 }).withMessage('emaFast must be 3–50.').toInt(),
  body('emaSlow').optional().isInt({ min: 5, max: 200 }).withMessage('emaSlow must be 5–200.').toInt(),

  // Stochastic params
  body('stochK').optional().isInt({ min: 5, max: 30 }).withMessage('stochK must be 5–30.').toInt(),
  body('stochD').optional().isInt({ min: 2, max: 10 }).withMessage('stochD must be 2–10.').toInt(),
  body('stochOversold').optional().isInt({ min: 5, max: 40 }).withMessage('stochOversold must be 5–40.').toInt(),
  body('stochOverbought').optional().isInt({ min: 60, max: 95 }).withMessage('stochOverbought must be 60–95.').toInt(),
];

module.exports = backtestValidator;
