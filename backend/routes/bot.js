const router = require('express').Router();
const auth = require('../middleware/auth');
const { checkPlan } = require('../middleware/CheckPlan');
const { getPrice } = require('../services/marketService');
const { getSignalForBot } = require('../services/botService');

const activeBots = {};

// Trading bot nécessite plan Elite
router.post('/start', auth, checkPlan('elite'), async (req, res) => {
  try {
    const { symbol = 'BTC', strategy = 'multi' } = req.body;
    
    if (activeBots[req.user.id]) {
      return res.json({ message: 'Bot already running', bot: activeBots[req.user.id] });
    }
    
    const { price } = await getPrice(symbol);
    
    const bot = {
      userId: req.user.id,
      symbol: symbol.toUpperCase(),
      strategy: strategy,
      status: 'running',
      entryPrice: price,
      currentPrice: price,
      quantity: parseFloat((1000 / price).toFixed(6)),
      stopLoss: parseFloat((price * 0.95).toFixed(2)),
      takeProfit: parseFloat((price * 1.10).toFixed(2)),
      profit: 0,
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
      
      try {
        const { price: newPrice } = await getPrice(currentBot.symbol);
        currentBot.currentPrice = newPrice;
        currentBot.profit = parseFloat(((newPrice - currentBot.entryPrice) * currentBot.quantity).toFixed(2));
        
        if (newPrice <= currentBot.stopLoss) {
          currentBot.status = 'stopped';
          currentBot.stopReason = 'Stop Loss triggered';
          clearInterval(bot.interval);
        } else if (newPrice >= currentBot.takeProfit) {
          currentBot.status = 'stopped';
          currentBot.stopReason = 'Take Profit reached';
          clearInterval(bot.interval);
        }
      } catch (err) {
        console.log('Bot error:', err.message);
      }
    }, 10000);
    
    res.json({ message: `Bot started on ${symbol} with ${strategy} strategy`, bot });
  } catch (err) { 
    res.status(500).json({ message: err.message }); 
  }
});

router.post('/stop', auth, checkPlan('elite'), (req, res) => {
  const bot = activeBots[req.user.id];
  if (!bot) return res.status(404).json({ message: 'No active bot' });
  
  clearInterval(bot.interval);
  bot.status = 'stopped';
  bot.stopReason = 'Manually stopped';
  delete activeBots[req.user.id];
  
  res.json({ message: 'Bot stopped', bot });
});

router.get('/status', auth, (req, res) => {
  const bot = activeBots[req.user.id];
  if (!bot) return res.json({ status: 'stopped', message: 'No active bot' });
  res.json(bot);
});

module.exports = router;
