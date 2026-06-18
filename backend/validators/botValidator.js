const { body } = require('express-validator');
const { VALID_STRATEGIES } = require('../services/botService');

// Matches botService: MIN_INTERVAL_SECONDS=15, MAX_INTERVAL_SECONDS=3600
const MIN_INTERVAL = 15;
const MAX_INTERVAL = 3600;

// Matches botService: BOT_MAX_POSITION_SIZE=1000 (USD amount, not a percentage)
const MIN_POSITION_SIZE = 1;
const MAX_POSITION_SIZE = 1000;

const VALID_RISK_LEVELS = ['low', 'medium', 'high'];

const botStartValidator = [
  // symbol
  body('symbol')
    .exists({ checkFalsy: true }).withMessage('symbol is required.')
    .isString().withMessage('symbol must be a string.')
    .trim()
    .isLength({ min: 1, max: 20 }).withMessage('symbol must be between 1 and 20 characters.'),

  // strategy
  body('strategy')
    .optional()
    .isString().withMessage('strategy must be a string.')
    .trim()
    .toLowerCase()
    .isIn(VALID_STRATEGIES).withMessage(`strategy must be one of: ${VALID_STRATEGIES.join(', ')}.`),

  // positionSize  (USD amount: how much capital to risk per trade)
  body('positionSize')
    .exists({ checkNull: true }).withMessage('positionSize is required.')
    .isFloat({ min: MIN_POSITION_SIZE, max: MAX_POSITION_SIZE })
    .withMessage(`positionSize must be between ${MIN_POSITION_SIZE} and ${MAX_POSITION_SIZE} (USD).`),

  // intervalSeconds
  body('intervalSeconds')
    .optional()
    .isInt({ min: MIN_INTERVAL, max: MAX_INTERVAL })
    .withMessage(`intervalSeconds must be between ${MIN_INTERVAL} and ${MAX_INTERVAL}.`)
    .toInt(),

  // riskLevel
  body('riskLevel')
    .optional()
    .isString().withMessage('riskLevel must be a string.')
    .trim()
    .toLowerCase()
    .isIn(VALID_RISK_LEVELS).withMessage(`riskLevel must be one of: ${VALID_RISK_LEVELS.join(', ')}.`),

  // executeTrades
  body('executeTrades')
    .optional()
    .isBoolean().withMessage('executeTrades must be a boolean.')
    .toBoolean(),

  // quantity (optional fixed lot size)
  body('quantity')
    .optional()
    .isFloat({ gt: 0 }).withMessage('quantity must be a positive number.')
    .toFloat(),
];

module.exports = botStartValidator;
