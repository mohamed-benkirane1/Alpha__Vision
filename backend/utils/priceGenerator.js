/**
 * @deprecated Ce fichier n'est utilisé nulle part dans le code de production.
 *
 * Raisons :
 * - Non-déterministe (Math.random()) → résultats de backtest non reproductibles
 * - Prix de base codés en dur et périmés (BTC: 76000, etc.)
 * - Le backtestEngine utilise les vraies données historiques Binance
 *
 * Peut être supprimé sans impact.
 */
function generateOHLC(symbol, days = 60) {
  const basePrices = { BTC: 76000, ETH: 2400, SOL: 90, BNB: 305, XRP: 0.62 };
  const base = basePrices[symbol] || 100;
  const candles = [];
  let price = base * (0.8 + Math.random() * 0.4);

  for (let i = 0; i < days; i += 1) {
    const change = 1 + (Math.random() * 2 - 1) * 0.02;
    const open = price;
    const close = parseFloat((open * change).toFixed(2));
    const high = parseFloat((Math.max(open, close) * (1 + Math.random() * 0.01)).toFixed(2));
    const low = parseFloat((Math.min(open, close) * (1 - Math.random() * 0.01)).toFixed(2));
    const date = new Date();
    date.setDate(date.getDate() - (days - i));

    candles.push({
      date: date.toISOString().split('T')[0],
      open,
      high,
      low,
      close,
    });
    price = close;
  }

  return candles;
}

module.exports = { generateOHLC };
