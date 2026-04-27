const axios = require('axios');
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 10 });

async function getPrice(symbol) {
  const cached = cache.get(`price_${symbol}`);
  if (cached) return cached;
  
  try {
    const response = await axios.get(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}USDT`);
    const result = { symbol, price: parseFloat(response.data.price), source: 'binance' };
    cache.set(`price_${symbol}`, result);
    return result;
  } catch {
    const fallback = { BTC: 43000, ETH: 2200, SOL: 95 };
    return { symbol, price: fallback[symbol] || 100, source: 'fallback' };
  }
}

async function getAllPrices() {
  const symbols = ['BTC', 'ETH', 'SOL'];
  const prices = await Promise.all(symbols.map(s => getPrice(s)));
  return prices;
}

module.exports = { getPrice, getAllPrices };