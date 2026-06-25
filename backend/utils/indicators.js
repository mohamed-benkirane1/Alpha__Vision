// ── Existing indicators (array-based EMA, used by backtestEngine) ────────────

/**
 * Returns the full EMA series as an array (used by backtestEngine MACD calc).
 */
function calculateEMA(values, period) {
  if (!values.length) return [];
  const multiplier = 2 / (period + 1);
  const ema = [values[0]];
  for (let i = 1; i < values.length; i += 1) {
    ema.push((values[i] - ema[i - 1]) * multiplier + ema[i - 1]);
  }
  return ema;
}

/**
 * MACD using array-based EMA — returns {macd, signal, histogram} or zeros.
 * Used by backtestEngine's existing MACD strategy.
 */
function calculateMACD(prices, fast = 12, slow = 26, signal = 9) {
  if (prices.length < slow + signal) {
    return { macd: 0, signal: 0, histogram: 0 };
  }
  const emaFast = calculateEMA(prices, fast);
  const emaSlow = calculateEMA(prices, slow);
  const macdLine = emaFast.map((v, i) => v - emaSlow[i]);
  const signalLine = calculateEMA(macdLine, signal);
  const last = macdLine.length - 1;
  return {
    macd: parseFloat(macdLine[last].toFixed(4)),
    signal: parseFloat(signalLine[last].toFixed(4)),
    histogram: parseFloat((macdLine[last] - signalLine[last]).toFixed(4)),
  };
}

/**
 * Bollinger Bands — returns {upper, middle, lower} or zeros.
 * Used by backtestEngine's existing Bollinger strategy.
 */
function calculateBollinger(prices, period = 20, stdDev = 2) {
  if (prices.length < period) {
    return { upper: 0, middle: 0, lower: 0 };
  }
  const slice = prices.slice(-period);
  const mean = slice.reduce((a, b) => a + b, 0) / period;
  const variance = slice.reduce((acc, v) => acc + (v - mean) ** 2, 0) / period;
  const std = Math.sqrt(variance);
  return { upper: mean + stdDev * std, middle: mean, lower: mean - stdDev * std };
}

// ── New scalar indicators (null on insufficient data) ─────────────────────────

/**
 * Returns the final EMA value as a scalar.
 * Returns null if prices.length < period.
 */
function calculateEMAScalar(prices, period) {
  if (!Array.isArray(prices) || prices.length < period) return null;
  const k = 2 / (period + 1);
  let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < prices.length; i++) {
    ema = prices[i] * k + ema * (1 - k);
  }
  return ema;
}

/**
 * MACD indicator returning {macd, signal, histogram} or null on insufficient data.
 * Null-safe version for bot strategies.
 */
function calculateMACDResult(prices, fast = 12, slow = 26, signalPeriod = 9) {
  if (!Array.isArray(prices) || prices.length < slow + signalPeriod) return null;
  const emaFast = calculateEMA(prices, fast);
  const emaSlow = calculateEMA(prices, slow);
  const macdLine = emaFast.map((v, i) => v - emaSlow[i]);
  const signalLine = calculateEMA(macdLine, signalPeriod);
  const last = macdLine.length - 1;
  return {
    macd: macdLine[last],
    signal: signalLine[last],
    histogram: macdLine[last] - signalLine[last],
  };
}

/**
 * Bollinger Bands returning {upper, middle, lower} or null on insufficient data.
 */
function calculateBollingerBands(prices, period = 20, stdDev = 2) {
  if (!Array.isArray(prices) || prices.length < period) return null;
  const slice = prices.slice(-period);
  const sma = slice.reduce((a, b) => a + b, 0) / period;
  const std = Math.sqrt(slice.reduce((s, p) => s + (p - sma) ** 2, 0) / period);
  return { upper: sma + stdDev * std, middle: sma, lower: sma - stdDev * std };
}

/**
 * Stochastic Oscillator returning {k, d} or null on insufficient data.
 * @param {number[]} highs
 * @param {number[]} lows
 * @param {number[]} closes
 * @param {number} kPeriod
 * @param {number} dPeriod
 */
function calculateStochastic(highs, lows, closes, kPeriod = 14, dPeriod = 3) {
  if (!Array.isArray(closes) || closes.length < kPeriod + dPeriod - 1) return null;

  const kValues = [];
  for (let i = kPeriod - 1; i < closes.length; i++) {
    const highSlice = highs.slice(i - kPeriod + 1, i + 1);
    const lowSlice = lows.slice(i - kPeriod + 1, i + 1);
    const high = Math.max(...highSlice);
    const low = Math.min(...lowSlice);
    kValues.push(high === low ? 50 : ((closes[i] - low) / (high - low)) * 100);
  }

  if (kValues.length < dPeriod) return null;
  const k = kValues[kValues.length - 1];
  const d = kValues.slice(-dPeriod).reduce((a, b) => a + b, 0) / dPeriod;
  return { k, d };
}

/**
 * EMA Crossover detector returning crossover state or null on insufficient data.
 * @param {number[]} prices   Close price series
 * @param {number} fastPeriod Fast EMA period (default 9)
 * @param {number} slowPeriod Slow EMA period (default 21)
 */
function calculateEMACross(prices, fastPeriod = 9, slowPeriod = 21) {
  if (!Array.isArray(prices) || prices.length < slowPeriod + 1) return null;

  const fast = calculateEMAScalar(prices, fastPeriod);
  const slow = calculateEMAScalar(prices, slowPeriod);
  const prevPrices = prices.slice(0, -1);
  const prevFast = calculateEMAScalar(prevPrices, fastPeriod);
  const prevSlow = calculateEMAScalar(prevPrices, slowPeriod);

  if (fast === null || slow === null || prevFast === null || prevSlow === null) return null;

  return {
    fastEMA: fast,
    slowEMA: slow,
    crossUp: prevFast <= prevSlow && fast > slow,
    crossDown: prevFast >= prevSlow && fast < slow,
    trend: fast > slow ? 'bullish' : 'bearish',
  };
}

module.exports = {
  // Array-based (backtestEngine)
  calculateEMA,
  calculateMACD,
  calculateBollinger,
  // Scalar / null-safe (bot strategies + new backtest strategies)
  calculateEMAScalar,
  calculateMACDResult,
  calculateBollingerBands,
  calculateStochastic,
  calculateEMACross,
};
