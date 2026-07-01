const mongoose = require('mongoose');

const BotInstanceSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  isRunning: { type: Boolean, default: false, index: true },
  status: { type: String, enum: ['stopped', 'running', 'paused', 'error'], default: 'stopped', index: true },
  mode: { type: String, enum: ['paper'], default: 'paper' },
  strategy: {
    type: String,
    required: true,
    enum: ['ma_cross', 'ema_cross', 'rsi', 'macd', 'bollinger', 'stochastic'],
  },
  symbol: { type: String, required: true },
  quantity: { type: Number, default: null },
  positionSize: { type: Number, required: true },
  maxPositionSize: { type: Number, required: true },
  riskLevel: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  intervalSeconds: { type: Number, required: true },
  executeTrades: { type: Boolean, default: false },

  // RSI params
  rsiPeriod: { type: Number, default: 14 },
  rsiOverbought: { type: Number, default: 70 },
  rsiOversold: { type: Number, default: 30 },

  // MACD params
  macdFast: { type: Number, default: 12 },
  macdSlow: { type: Number, default: 26 },
  macdSignal: { type: Number, default: 9 },

  // Bollinger params
  bbPeriod: { type: Number, default: 20 },
  bbStdDev: { type: Number, default: 2 },

  // EMA Cross params
  emaFast: { type: Number, default: 9 },
  emaSlow: { type: Number, default: 21 },

  // Stochastic params
  stochK: { type: Number, default: 14 },
  stochD: { type: Number, default: 3 },
  stochOverbought: { type: Number, default: 80 },
  stochOversold: { type: Number, default: 20 },

  startedAt: { type: Date, default: null },
  stoppedAt: { type: Date, default: null },
  lastTickAt: { type: Date, default: null },
  lastRunAt: { type: Date, default: null },
  lastDecision: { type: mongoose.Schema.Types.Mixed, default: null },
  lastError: { type: String, default: null },
}, { timestamps: true });

BotInstanceSchema.index({ user: 1, updatedAt: -1 });

module.exports = mongoose.model('BotInstance', BotInstanceSchema);
