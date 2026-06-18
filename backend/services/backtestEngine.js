const axios = require('axios');
const { calculateRSI } = require('../utils/rsi');
const { calculateEMA, calculateBollinger } = require('../utils/indicators');

const PROVIDER = 'internal-backtest-engine';
const REAL_SOURCE = 'binance-historical-klines';
const DEMO_SOURCE = 'demo';
const VALID_STRATEGIES = ['rsi', 'macd', 'bollinger', 'multi'];
const SUPPORTED_SYMBOLS = ['BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'ADA', 'DOGE'];

function nowIso() {
  return new Date().toISOString();
}

function toNumber(value, fallback = null) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function round(value, decimals = 2) {
  const number = toNumber(value, 0);
  return Number(number.toFixed(decimals));
}

function buildDataQuality({ real = false, mock = false, indicative = false, warnings = [] } = {}) {
  return {
    usesRealHistoricalData: real,
    usesMockData: mock,
    isIndicative: indicative,
    warnings,
  };
}

function createUnavailableBacktest(params, warning) {
  const warnings = [warning || 'Historical data provider not configured. No real backtest was executed.'];

  return {
    success: true,
    timestamp: nowIso(),
    source: DEMO_SOURCE,
    provider: 'simulated-backtest',
    fallback: true,
    dataQuality: buildDataQuality({ mock: true, indicative: true, warnings }),
    params,
    results: null,
    trades: [],
    equityCurve: [],
    warnings,
    error: null,
  };
}

function createErrorBacktest(error, params = null) {
  return {
    success: false,
    timestamp: nowIso(),
    source: 'backend',
    provider: PROVIDER,
    fallback: false,
    dataQuality: buildDataQuality(),
    params,
    results: null,
    trades: [],
    equityCurve: [],
    warnings: [],
    error: error || 'Unable to run backtest.',
  };
}

function calculateSignal(strategy, prices) {
  const current = prices[prices.length - 1];

  if (strategy === 'rsi') {
    const rsi = calculateRSI(prices);
    if (rsi < 30) return 'BUY';
    if (rsi > 70) return 'SELL';
    return 'HOLD';
  }

  if (strategy === 'macd') {
    if (prices.length < 35) return 'HOLD';
    const ema12 = calculateEMA(prices, 12);
    const ema26 = calculateEMA(prices, 26);
    const macd = ema12.map((value, index) => value - ema26[index]);
    const signal = calculateEMA(macd.slice(26), 9);
    const currentMacd = macd[macd.length - 1];
    const previousMacd = macd[macd.length - 2];
    const currentSignal = signal[signal.length - 1];
    const previousSignal = signal[signal.length - 2];
    if (previousMacd <= previousSignal && currentMacd > currentSignal) return 'BUY';
    if (previousMacd >= previousSignal && currentMacd < currentSignal) return 'SELL';
    return 'HOLD';
  }

  if (strategy === 'bollinger') {
    if (prices.length < 20) return 'HOLD';
    const { upper, lower } = calculateBollinger(prices, 20, 2);
    if (current < lower) return 'BUY';
    if (current > upper) return 'SELL';
    return 'HOLD';
  }

  if (strategy === 'multi') {
    const rsi = calculateSignal('rsi', prices);
    const bollinger = calculateSignal('bollinger', prices);
    if (rsi === 'BUY' && bollinger === 'BUY') return 'BUY';
    if (rsi === 'SELL' || bollinger === 'SELL') return 'SELL';
    return 'HOLD';
  }

  return 'HOLD';
}

async function getHistoricalPrices(symbol, limit = 120) {
  const response = await axios.get('https://api.binance.com/api/v3/klines', {
    params: { symbol: `${symbol}USDT`, interval: '1d', limit },
    timeout: 10000,
  });

  if (!Array.isArray(response.data) || response.data.length < 30) {
    throw new Error(`Insufficient historical data for ${symbol}.`);
  }

  return response.data
    .map((kline) => ({
      timestamp: new Date(kline[0]).toISOString(),
      open: toNumber(kline[1]),
      high: toNumber(kline[2]),
      low: toNumber(kline[3]),
      close: toNumber(kline[4]),
    }))
    .filter((point) => point.close && point.close > 0);
}

function runStrategy({ prices, strategy, initialCapital, positionSize, stopLoss, takeProfit }) {
  let cash = initialCapital;
  let quantity = 0;
  let entryPrice = 0;
  let entryIndex = 0;
  let wins = 0;
  let losses = 0;
  let peak = initialCapital;
  let maxDrawdown = 0;
  let grossProfit = 0;
  let grossLoss = 0;
  let tradesClosedByStopLoss = 0;
  let tradesClosedByTakeProfit = 0;
  let tradesClosedBySignal = 0;
  let totalHoldingCandles = 0;
  let closedTradesCount = 0;
  const trades = [];
  const equityCurve = [];

  const hasStopLoss = Number.isFinite(stopLoss) && stopLoss > 0;
  const hasTakeProfit = Number.isFinite(takeProfit) && takeProfit > 0;

  function closeTrade(closePrice, closeTimestamp, reason, closeIndex) {
    const total = quantity * closePrice;
    const profit = quantity * (closePrice - entryPrice);
    cash += total;
    trades.push({
      type: 'SELL',
      symbol: null,
      price: round(closePrice),
      quantity: round(quantity, 8),
      total: round(total),
      profit: round(profit),
      timestamp: closeTimestamp,
      reason,
    });
    if (profit > 0) {
      wins += 1;
      grossProfit += profit;
    } else {
      losses += 1;
      grossLoss += Math.abs(profit);
    }
    if (reason === 'stop_loss') tradesClosedByStopLoss += 1;
    else if (reason === 'take_profit') tradesClosedByTakeProfit += 1;
    else if (reason === 'signal') tradesClosedBySignal += 1;
    if (typeof closeIndex === 'number') {
      totalHoldingCandles += closeIndex - entryIndex;
      closedTradesCount += 1;
    }
    quantity = 0;
    entryPrice = 0;
    entryIndex = 0;
  }

  for (let i = 20; i < prices.length; i += 1) {
    const history = prices.slice(0, i + 1).map((point) => point.close);
    const current = prices[i];
    const price = current.close;
    const low = toNumber(current.low, price);
    const high = toNumber(current.high, price);

    // ── 1. SL/TP checks — priority: stop loss before take profit ─────
    let slTpExited = false;

    if (quantity > 0) {
      if (hasStopLoss) {
        const stopLossPrice = entryPrice * (1 - stopLoss / 100);
        if (low <= stopLossPrice) {
          closeTrade(stopLossPrice, current.timestamp, 'stop_loss', i);
          slTpExited = true;
        }
      }
      if (quantity > 0 && hasTakeProfit) {
        const takeProfitPrice = entryPrice * (1 + takeProfit / 100);
        if (high >= takeProfitPrice) {
          closeTrade(takeProfitPrice, current.timestamp, 'take_profit', i);
          slTpExited = true;
        }
      }
    }

    // ── 2. Strategy signal ────────────────────────────────────────────
    const signal = calculateSignal(strategy, history);
    const equity = cash + quantity * price;

    if (signal === 'BUY' && quantity === 0 && cash > 0 && !slTpExited) {
      const investment = cash * positionSize;
      quantity = investment / price;
      entryPrice = price;
      entryIndex = i;
      cash -= investment;
      trades.push({
        type: 'BUY',
        symbol: null,
        price: round(price),
        quantity: round(quantity, 8),
        total: round(investment),
        timestamp: current.timestamp,
      });
    } else if (signal === 'SELL' && quantity > 0) {
      closeTrade(price, current.timestamp, 'signal', i);
    }

    // ── 3. Equity curve & drawdown ────────────────────────────────────
    const updatedEquity = cash + quantity * price;
    peak = Math.max(peak, updatedEquity);
    maxDrawdown = Math.max(maxDrawdown, peak > 0 ? ((peak - updatedEquity) / peak) * 100 : 0);
    equityCurve.push({
      timestamp: current.timestamp,
      day: `D${equityCurve.length + 1}`,
      value: round(updatedEquity),
      price: round(price),
      signal,
    });

    if (!Number.isFinite(equity)) {
      throw new Error('Backtest generated invalid equity value.');
    }
  }

  // ── Force-close open position at end of period ────────────────────
  if (quantity > 0) {
    const final = prices[prices.length - 1];
    closeTrade(final.close, final.timestamp, 'end_of_period', prices.length - 1);
  }

  const finalCapital = cash;
  const totalReturn = initialCapital > 0 ? ((finalCapital - initialCapital) / initialCapital) * 100 : 0;
  const sellTrades = trades.filter((trade) => trade.type === 'SELL');
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : (grossProfit > 0 ? grossProfit : null);
  const riskRewardRatio = hasStopLoss && hasTakeProfit ? round(takeProfit / stopLoss, 2) : null;
  const averageHoldingPeriod = closedTradesCount > 0 ? round(totalHoldingCandles / closedTradesCount, 1) : null;

  return {
    results: {
      finalCapital: round(finalCapital),
      totalReturn: round(totalReturn),
      totalProfit: round(finalCapital - initialCapital),
      totalTrades: trades.length,
      winRate: sellTrades.length ? round((wins / sellTrades.length) * 100, 1) : 0,
      wins,
      losses,
      maxDrawdown: round(maxDrawdown, 1),
      profitFactor: profitFactor === null ? null : round(profitFactor, 2),
      tradesClosedByStopLoss,
      tradesClosedByTakeProfit,
      tradesClosedBySignal,
      averageHoldingPeriod,
      riskRewardRatio,
    },
    trades,
    equityCurve,
  };
}

async function runBacktest(params) {
  const symbol = String(params.symbol || '').trim().toUpperCase();
  const strategy = String(params.strategy || 'rsi').trim().toLowerCase();
  const initialCapital = toNumber(params.initialCapital, 10000);
  const positionSize = toNumber(params.positionSize, 0.2);

  const stopLoss = toNumber(params.stopLoss, null);
  const takeProfit = toNumber(params.takeProfit, null);

  const normalizedParams = {
    symbol,
    strategy,
    startDate: params.startDate || null,
    endDate: params.endDate || null,
    initialCapital,
    positionSize,
    stopLoss,
    takeProfit,
  };

  if (!symbol) return createErrorBacktest('symbol required', normalizedParams);
  if (!SUPPORTED_SYMBOLS.includes(symbol)) {
    return createErrorBacktest(
      `${symbol} is not supported by the current Binance historical backtest provider.`,
      normalizedParams,
    );
  }
  if (!VALID_STRATEGIES.includes(strategy)) return createErrorBacktest('Invalid strategy.', normalizedParams);
  if (!initialCapital || initialCapital <= 0) return createErrorBacktest('initialCapital must be positive.', normalizedParams);
  if (!positionSize || positionSize <= 0 || positionSize > 1) return createErrorBacktest('positionSize must be between 0 and 1.', normalizedParams);

  try {
    const prices = await getHistoricalPrices(symbol, 120);
    const { results, trades, equityCurve } = runStrategy({ prices, strategy, initialCapital, positionSize, stopLoss, takeProfit });

    return {
      success: true,
      timestamp: nowIso(),
      source: REAL_SOURCE,
      provider: PROVIDER,
      fallback: false,
      dataQuality: buildDataQuality({ real: true }),
      params: normalizedParams,
      results,
      trades: trades.map((trade) => ({ ...trade, symbol })),
      equityCurve,
      warnings: [],
      error: null,
    };
  } catch (error) {
    return createUnavailableBacktest(
      normalizedParams,
      error?.message
        ? `Historical data unavailable for ${symbol}: ${error.message}. No simulated performance is shown.`
        : `Historical data unavailable for ${symbol}. No simulated performance is shown.`,
    );
  }
}

module.exports = {
  runBacktest,
  createErrorBacktest,
  VALID_STRATEGIES,
  SUPPORTED_SYMBOLS,
};
