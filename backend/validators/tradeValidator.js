const { body } = require('express-validator');

const VALID_SIDES = ['BUY', 'SELL'];
const MAX_QUANTITY = 1_000_000;

const tradeValidator = [
  // symbol
  body('symbol')
    .exists({ checkFalsy: true }).withMessage('symbol is required.')
    .isString().withMessage('symbol must be a string.')
    .trim()
    .isLength({ min: 1, max: 20 }).withMessage('symbol must be between 1 and 20 characters.'),

  // side / type / action  (the service accepts all three field names)
  body('side').custom((value, { req }) => {
    const raw = req.body.side ?? req.body.type ?? req.body.action;
    if (raw === undefined || raw === null || String(raw).trim() === '') {
      throw new Error('side (or type / action) is required.');
    }
    if (!VALID_SIDES.includes(String(raw).trim().toUpperCase())) {
      throw new Error(`side must be one of: ${VALID_SIDES.join(', ')}.`);
    }
    return true;
  }),

  // quantity
  body('quantity')
    .exists({ checkNull: true }).withMessage('quantity is required.')
    .isFloat({ gt: 0 }).withMessage('quantity must be a positive number greater than 0.')
    .toFloat()
    .custom((value) => {
      if (value > MAX_QUANTITY) {
        throw new Error(`quantity must not exceed ${MAX_QUANTITY.toLocaleString()}.`);
      }
      return true;
    }),
];

module.exports = tradeValidator;
