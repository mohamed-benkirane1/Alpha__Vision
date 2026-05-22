const router = require('express').Router();
const auth = require('../middleware/auth');
const { generateAiSignal } = require('../services/aiSignalService');

router.get('/', auth, async (req, res) => {
  try {
    const symbol = typeof req.query.symbol === 'string' ? req.query.symbol : undefined;
    const response = await generateAiSignal({
      userId: req.user.id,
      symbol,
    });

    return res.status(200).json(response);
  } catch (err) {
    return res.status(500).json({
      success: false,
      timestamp: new Date().toISOString(),
      symbol: typeof req.query.symbol === 'string' ? req.query.symbol.trim().toUpperCase() : null,
      source: 'backend',
      provider: null,
      fallback: false,
      dataQuality: {
        usesLiveMarketData: false,
        usesNewsData: false,
        usesLLM: false,
        marketReliable: false,
        newsAvailable: false,
        isIndicative: false,
        warnings: ['AI signal service failed before a signal could be generated.'],
      },
      signal: null,
      warnings: ['Cannot generate a signal right now.'],
      error: err.message || 'Unable to generate AI signal.',
    });
  }
});

module.exports = router;
