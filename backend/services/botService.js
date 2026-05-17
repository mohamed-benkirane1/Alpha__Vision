const { getPrice } = require('./marketService');
const { calculateRSI } = require('../utils/rsi');
const { calculateMACD, calculateBollinger } = require('../utils/indicators');
const { generateOHLC } = require('../utils/priceGenerator');

function getSignalForBot(symbol, strategy) {
  const candles = generateOHLC(symbol, 60);
  const closes = candles.map(c => c.close);
  const highs = candles.map(c => c.high);
  const lows = candles.map(c => c.low);
  const price = closes[closes.length - 1];

  let rsi = 50;
  let macd = { macd: 0, signal: 0 };
  let boll = { upper: 0, lower: 0 };

  try {
    rsi = calculateRSI(closes);
    macd = calculateMACD(closes);
    boll = calculateBollinger(closes);
  } catch (e) {
    console.log('Indicator error:', e.message);
  }

  let signal = 'HOLD';
  
  switch (strategy) {
    case 'rsi':
      if (rsi < 30) signal = 'BUY';
      else if (rsi > 70) signal = 'SELL';
      break;
      
    case 'macd':
      if (macd.macd > macd.signal) signal = 'BUY';
      else if (macd.macd < macd.signal) signal = 'SELL';
      break;
      
    case 'bollinger':
      if (price <= boll.lower) signal = 'BUY';
      else if (price >= boll.upper) signal = 'SELL';
      break;
      
    case 'multi':
      let buy = 0, sell = 0;
      if (rsi < 40) buy++;
      else if (rsi > 60) sell++;
      if (macd.macd > macd.signal) buy++;
      else if (macd.macd < macd.signal) sell++;
      if (price <= boll.lower) buy++;
      else if (price >= boll.upper) sell++;
      if (buy >= 2) signal = 'BUY';
      else if (sell >= 2) signal = 'SELL';
      break;
      
    default:
      signal = 'HOLD';
  }
  
  return { signal, rsi: parseFloat(rsi.toFixed(2)), price };
}

module.exports = { getSignalForBot };