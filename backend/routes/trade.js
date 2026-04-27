const router = require('express').Router();
const auth = require('../middleware/auth');
const Trade = require('../models/Trade');
const Portfolio = require('../models/Portfolio');
const { getPrice } = require('../services/marketService');

router.post('/', auth, async (req, res) => {
  try {
    const { symbol, type, quantity } = req.body;
    if (!symbol || !type || !quantity) {
      return res.status(400).json({ message: 'symbol, type, quantity required' });
    }
    
    const { price } = await getPrice(symbol);
    const trade = await Trade.create({
      userId: req.user.id,
      symbol: symbol.toUpperCase(),
      type: type.toUpperCase(),
      quantity: parseFloat(quantity),
      price
    });
    
    const portfolio = await Portfolio.findOne({ userId: req.user.id, symbol: symbol.toUpperCase() });
    
    if (type.toUpperCase() === 'BUY') {
      if (portfolio) {
        const newQty = portfolio.quantity + parseFloat(quantity);
        const newAvg = (portfolio.avgPrice * portfolio.quantity + price * parseFloat(quantity)) / newQty;
        portfolio.quantity = newQty;
        portfolio.avgPrice = newAvg;
        await portfolio.save();
      } else {
        await Portfolio.create({ userId: req.user.id, symbol: symbol.toUpperCase(), quantity: parseFloat(quantity), avgPrice: price });
      }
    } else {
      if (!portfolio || portfolio.quantity < parseFloat(quantity)) {
        return res.status(400).json({ message: 'Insufficient holdings' });
      }
      portfolio.quantity -= parseFloat(quantity);
      if (portfolio.quantity < 0.0001) {
        await Portfolio.deleteOne({ userId: req.user.id, symbol: symbol.toUpperCase() });
      } else {
        await portfolio.save();
      }
    }
    
    res.status(201).json({ trade, message: `${type} ${quantity} ${symbol} at $${price}` });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/history', auth, async (req, res) => {
  try {
    const trades = await Trade.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(50);
    res.json(trades);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;