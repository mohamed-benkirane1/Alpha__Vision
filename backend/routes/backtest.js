const router = require('express').Router();
const auth = require('../middleware/auth');
const { runBacktest } = require('../services/backtestEngine');

router.post('/', auth, async (req, res) => {
  try {
    const { symbol, strategy, startDate, endDate, initialCapital, positionSize, stopLoss, takeProfit } = req.body;
    
    if (!symbol) {
      return res.status(400).json({ message: 'symbol required' });
    }
    
    const result = await runBacktest({
      symbol: symbol.toUpperCase(),
      strategy: strategy || 'rsi',
      startDate,
      endDate,
      initialCapital: initialCapital || 10000,
      positionSize: positionSize || 0.2,
      stopLoss: stopLoss || 0.05,
      takeProfit: takeProfit || 0.10
    });
    
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;