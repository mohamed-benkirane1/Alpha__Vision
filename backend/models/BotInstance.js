const mongoose = require('mongoose');

const BotInstanceSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  isRunning: { type: Boolean, default: false, index: true },
  status: { type: String, enum: ['stopped', 'running', 'paused', 'error'], default: 'stopped', index: true },
  mode: { type: String, enum: ['paper'], default: 'paper' },
  strategy: { type: String, required: true },
  symbol: { type: String, required: true },
  quantity: { type: Number, default: null },
  positionSize: { type: Number, required: true },
  maxPositionSize: { type: Number, required: true },
  riskLevel: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  intervalSeconds: { type: Number, required: true },
  executeTrades: { type: Boolean, default: false },
  startedAt: { type: Date, default: null },
  stoppedAt: { type: Date, default: null },
  lastTickAt: { type: Date, default: null },
  lastRunAt: { type: Date, default: null },
  lastDecision: { type: mongoose.Schema.Types.Mixed, default: null },
  lastError: { type: String, default: null },
}, { timestamps: true });

BotInstanceSchema.index({ user: 1, updatedAt: -1 });

module.exports = mongoose.model('BotInstance', BotInstanceSchema);
