function generateOHLC(symbol, days = 60) {
  const basePrices = { BTC: 76000, ETH: 2400, SOL: 90, BNB: 305, XRP: 0.62 };
  const base = basePrices[symbol] || 100;
  const candles = [];
  let price = base * (0.8 + Math.random() * 0.4);
  
  for (let i = 0; i < days; i++) {
    const change = 1 + (Math.random() * 2 - 1) * 0.02;
    const open = price;
    const close = parseFloat((open * change).toFixed(2));
    const high = parseFloat((Math.max(open, close) * (1 + Math.random() * 0.01)).toFixed(2));
    const low = parseFloat((Math.min(open, close) * (1 - Math.random() * 0.01)).toFixed(2));
    const date = new Date();
    date.setDate(date.getDate() - (days - i));
    
    candles.push({
      date: date.toISOString().split('T')[0],
      open: open,
      high: high,
      low: low,
      close: close
    });
    price = close;
  }
  
  return candles;
}

module.exports = { generateOHLC };