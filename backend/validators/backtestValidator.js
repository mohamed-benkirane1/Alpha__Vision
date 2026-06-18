const { body } = require('express-validator');
const { VALID_STRATEGIES, SUPPORTED_SYMBOLS } = require('../services/backtestEngine');

const backtestValidator = [
  // symbol — must be one of the 7 Binance-supported symbols
  body('symbol')
    .exists({ checkFalsy: true }).withMessage('symbol is required.')
    .isString().withMessage('symbol must be a string.')
    .trim()
    .toUpperCase()
    .isIn(SUPPORTED_SYMBOLS)
    .withMessage(`symbol must be one of: ${SUPPORTED_SYMBOLS.join(', ')}.`),

  // strategy
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

  // positionSize  (fraction of capital: 0.01 = 1%, 1.0 = 100%)
  body('positionSize')
    .optional()
    .isFloat({ min: 0.01, max: 1.0 })
    .withMessage('positionSize must be between 0.01 and 1.0 (fraction of capital).')
    .toFloat(),

  // stopLoss (percentage: 0.5 = 0.5%, 20 = 20%)
  body('stopLoss')
    .optional()
    .isFloat({ min: 0.5, max: 20 })
    .withMessage('stopLoss must be between 0.5 and 20 (percentage).')
    .toFloat(),

  // takeProfit (percentage: 1 = 1%, 50 = 50%)
  body('takeProfit')
    .optional()
    .isFloat({ min: 1, max: 50 })
    .withMessage('takeProfit must be between 1 and 50 (percentage).')
    .toFloat(),

  // Cross-validation: takeProfit must be greater than stopLoss when both are provided
  body('takeProfit').custom((value, { req }) => {
    const sl = parseFloat(req.body.stopLoss);
    const tp = parseFloat(value);
    if (Number.isFinite(sl) && Number.isFinite(tp) && tp <= sl) {
      throw new Error('takeProfit must be greater than stopLoss.');
    }
    return true;
  }),

  // period (optional future param: lookback window in days)
  body('period')
    .optional()
    .isInt({ min: 7, max: 365 })
    .withMessage('period must be between 7 and 365 days.')
    .toInt(),
];

module.exports = backtestValidator;
