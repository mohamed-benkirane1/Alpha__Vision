function calculateEMA(values, period) {
  if (!values.length) return [];

  const multiplier = 2 / (period + 1);
  const ema = [values[0]];

  for (let i = 1; i < values.length; i += 1) {
    ema.push((values[i] - ema[i - 1]) * multiplier + ema[i - 1]);
  }

  return ema;
}

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

function calculateBollinger(prices, period = 20, stdDev = 2) {
  if (prices.length < period) {
    return { upper: 0, middle: 0, lower: 0 };
  }

  const slice = prices.slice(-period);
  const mean = slice.reduce((a, b) => a + b, 0) / period;
  const variance = slice.reduce((acc, v) => acc + (v - mean) ** 2, 0) / period;
  const std = Math.sqrt(variance);

  return {
    upper: mean + stdDev * std,
    middle: mean,
    lower: mean - stdDev * std,
  };
}

module.exports = { calculateEMA, calculateMACD, calculateBollinger };
