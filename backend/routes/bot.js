const router = require('express').Router();
const auth = require('../middleware/auth');
const { getPrice } = require('../services/marketService');

const activeBots = {};

router.post('/start', auth, async (req, res) => {
  try {
    const { symbol = 'BTC' } = req.body;
    
    if (activeBots[req.user.id]) {
      return res.json({ message: 'Bot already running', bot: activeBots[req.user.id] });
    }
    
    const { price } = await getPrice(symbol);
    
    const bot = {
      symbol: symbol.toUpperCase(),
      status: 'running',
      entryPrice: price,
      currentPrice: price,
      startTime: new Date(),
      trades: []
    };
    
    activeBots[req.user.id] = bot;
    
    bot.interval = setInterval(async () => {
      const currentBot = activeBots[req.user.id];
      if (!currentBot || currentBot.status !== 'running') {
        clearInterval(bot.interval);
        return;
      }
      const { price: newPrice } = await getPrice(currentBot.symbol);
      currentBot.currentPrice = newPrice;
    }, 10000);
    
    res.json({ message: `Bot started on ${symbol}`, bot });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/stop', auth, (req, res) => {
  const bot = activeBots[req.user.id];
  if (!bot) return res.status(404).json({ message: 'No active bot' });
  
  clearInterval(bot.interval);
  bot.status = 'stopped';
  delete activeBots[req.user.id];
  
  res.json({ message: 'Bot stopped', bot });
});

router.get('/status', auth, (req, res) => {
  const bot = activeBots[req.user.id];
  if (!bot) return res.json({ status: 'stopped', message: 'No active bot' });
  res.json(bot);
});

module.exports = router;