const mongoose = require('mongoose');

const BotInstanceSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  isRunning: { type: Boolean, default: false, index: true },
  mode: { type: String, enum: ['paper'], default: 'paper' },
  strategy: { type: String, required: true },
  symbol: { type: String, required: true },
  positionSize: { type: Number, required: true },
  maxPositionSize: { type: Number, required: true },
  riskLevel: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  intervalSeconds: { type: Number, required: true },
  startedAt: { type: Date, default: null },
  stoppedAt: { type: Date, default: null },
  lastTickAt: { type: Date, default: null },
  lastDecision: { type: mongoose.Schema.Types.Mixed, default: null },
}, { timestamps: true });

BotInstanceSchema.index({ user: 1, updatedAt: -1 });

module.exports = mongoose.model('BotInstance', BotInstanceSchema);
