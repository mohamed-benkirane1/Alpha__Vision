const router = require('express').Router();
const auth = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const tradeValidator = require('../validators/tradeValidator');
const {
  PAPER_TRADING_MODE,
  executePaperTrade,
  getTradeHistory,
  parseTradeInput,
} = require('../services/paperTradingService');

async function handlePaperTradeOrder(req, res) {
  try {
    const input = parseTradeInput(req.body);
    if (input.error) {
      return res.status(400).json({
        success: false,
        mode: PAPER_TRADING_MODE,
        message: input.error,
      });
    }

    const payload = await executePaperTrade({
      userId: req.user.id,
      symbol: input.symbol,
      type: input.type,
      quantity: input.quantity,
      orderType: input.orderType,
      snapshotSource: 'trade',
    });

    return res.status(201).json(payload);
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      mode: PAPER_TRADING_MODE,
      message: err.message || 'Server error',
      ...(err.priceStatus ? { priceStatus: err.priceStatus } : {}),
    });
  }
}

router.post('/', auth, validate(tradeValidator), handlePaperTradeOrder);
router.post('/order', auth, validate(tradeValidator), handlePaperTradeOrder);

router.get('/history', auth, async (req, res) => {
  try {
    return res.json(await getTradeHistory(req.user.id, req.query.limit));
  } catch (err) {
    return res.status(500).json({
      success: false,
      mode: PAPER_TRADING_MODE,
      message: err.message || 'Unable to load paper trade history.',
      data: [],
      trades: [],
    });
  }
});

module.exports = router;
