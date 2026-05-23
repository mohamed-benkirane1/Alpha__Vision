const mongoose = require('mongoose');

const BotActionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  bot: { type: mongoose.Schema.Types.ObjectId, ref: 'BotInstance', required: true, index: true },
  symbol: { type: String, required: true },
  action: { type: String, enum: ['BUY', 'SELL', 'HOLD', 'SKIP'], required: true },
  decision: { type: String, enum: ['BUY', 'SELL', 'HOLD', 'SKIP'], default: null },
  mode: { type: String, enum: ['paper'], default: 'paper' },
  reason: { type: String, required: true },
  quantity: { type: Number, default: null },
  price: { type: Number, default: null },
  priceSource: { type: String, default: null },
  priceProvider: { type: String, default: null },
  priceProviderSymbol: { type: String, default: null },
  priceTimestamp: { type: Date, default: null },
  priceFetchedAt: { type: Date, default: null },
  priceCached: { type: Boolean, default: null },
  priceFallback: { type: Boolean, default: null },
  priceStale: { type: Boolean, default: null },
  priceIsLive: { type: Boolean, default: null },
  priceIsStale: { type: Boolean, default: null },
  confidence: { type: Number, default: null },
  strategy: { type: String, required: true },
  executed: { type: Boolean, default: false },
  trade: { type: mongoose.Schema.Types.ObjectId, ref: 'Trade', default: null },
  execution: { type: mongoose.Schema.Types.Mixed, default: null },
  error: { type: String, default: null },
}, { timestamps: true });

BotActionSchema.index({ user: 1, createdAt: -1 });
BotActionSchema.index({ bot: 1, createdAt: -1 });

module.exports = mongoose.model('BotAction', BotActionSchema);
