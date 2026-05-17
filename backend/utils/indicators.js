function calculateMACD(prices, fast = 12, slow = 26, signal = 9) {
  if (prices.length < slow + signal) {
    return { macd: 0, signal: 0, histogram: 0 };
  }
  
  function ema(data, period) {
    const k = 2 / (period + 1);
    const result = [data[0]];
    for (let i = 1; i < data.length; i++) {
      result.push(data[i] * k + result[i - 1] * (1 - k));
    }
    return result;
  }
  
  const emaFast = ema(prices, fast);
  const emaSlow = ema(prices, slow);
  const macdLine = emaFast.map((v, i) => v - emaSlow[i]);
  const signalLine = ema(macdLine, signal);
  const last = macdLine.length - 1;
  
  return {
    macd: parseFloat(macdLine[last].toFixed(4)),
    signal: parseFloat(signalLine[last].toFixed(4)),
    histogram: parseFloat((macdLine[last] - signalLine[last]).toFixed(4))
  };
}

function calculateBollinger(prices, period = 20, stdDev = 2) {
  if (prices.length < period) {
    return { upper: 0, middle: 0, lower: 0 };
  }
  
  const slice = prices.slice(-period);
  const mean = slice.reduce((a, b) => a + b, 0) / period;
  const variance = slice.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / period;
  const std = Math.sqrt(variance);
  
  return {
    upper: parseFloat((mean + stdDev * std).toFixed(2)),
    middle: parseFloat(mean.toFixed(2)),
    lower: parseFloat((mean - stdDev * std).toFixed(2))
  };
}

module.exports = { calculateMACD, calculateBollinger };