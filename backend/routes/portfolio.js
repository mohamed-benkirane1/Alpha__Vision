const router = require('express').Router();
const auth = require('../middleware/auth');
const Portfolio = require('../models/portfolio');
const { getPrice } = require('../services/marketService');

router.get('/', auth, async (req, res) => {
  try {
    const holdings = await Portfolio.find({ userId: req.user.id });
    
    const enriched = await Promise.all(holdings.map(async (holding) => {
      const { price } = await getPrice(holding.symbol);
      const currentValue = holding.quantity * price;
      const costBasis = holding.quantity * holding.avgPrice;
      const profit = currentValue - costBasis;
      const profitPercent = costBasis > 0 ? (profit / costBasis) * 100 : 0;
      
      return {
        ...holding.toObject(),
        currentPrice: price,
        currentValue: currentValue.toFixed(2),
        costBasis: costBasis.toFixed(2),
        profit: profit.toFixed(2),
        profitPercent: profitPercent.toFixed(2)
      };
    }));
    
    const totalValue = enriched.reduce((sum, h) => sum + parseFloat(h.currentValue), 0);
    const totalProfit = enriched.reduce((sum, h) => sum + parseFloat(h.profit), 0);
    
    res.json({
      holdings: enriched,
      totalValue: totalValue.toFixed(2),
      totalProfit: totalProfit.toFixed(2),
      totalProfitPercent: totalValue > 0 ? ((totalProfit / (totalValue - totalProfit)) * 100).toFixed(2) : 0
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
