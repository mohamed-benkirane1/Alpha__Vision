const router = require('express').Router();
const auth = require('../middleware/auth');
const Trade = require('../models/trade');
const Portfolio = require('../models/portfolio');
const User = require('../models/user');
const { getPrice } = require('../services/marketService');

// Limites par plan
const TRADE_LIMITS = { free: 5, pro: 50, elite: 1000 };

router.post('/', auth, async (req, res) => {
  try {
    const { symbol, type, quantity } = req.body;
    if (!symbol || !type || !quantity) {
      return res.status(400).json({ message: 'symbol, type, quantity required' });
    }
    
    // Vérifier le nombre de trades aujourd'hui
    const user = await User.findById(req.user.id);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tradesToday = await Trade.countDocuments({
      userId: req.user.id,
      createdAt: { $gte: today }
    });
    
    if (tradesToday >= TRADE_LIMITS[user.plan]) {
      return res.status(429).json({ 
        message: `Limite de ${TRADE_LIMITS[user.plan]} trades par jour atteinte. Upgradez votre plan !`
      });
    }
    
    const { price } = await getPrice(symbol);
    const total = quantity * price;
    
    // Vérifier le solde pour un achat
    if (type.toUpperCase() === 'BUY') {
      if (user.balance < total) {
        return res.status(400).json({ message: `Solde insuffisant. Vous avez ${user.balance} €, besoin de ${total} €.` });
      }
      // Débiter le solde
      await User.findByIdAndUpdate(req.user.id, { $inc: { balance: -total } });
    }
    
    const trade = await Trade.create({
      userId: req.user.id,
      symbol: symbol.toUpperCase(),
      type: type.toUpperCase(),
      quantity: parseFloat(quantity),
      price,
      total
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
      // Pour une vente, créditer le solde
      await User.findByIdAndUpdate(req.user.id, { $inc: { balance: total } });
      
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
    
    res.status(201).json({ trade, message: `${type} ${quantity} ${symbol} at $${price}`, balance: user.balance - (type.toUpperCase() === 'BUY' ? total : 0) });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/history', auth, async (req, res) => {
  try {
    const trades = await Trade.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(50);
    res.json(trades);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
