const mongoose = require('mongoose');

const TradeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  symbol: { type: String, required: true },
  type: { type: String, enum: ['BUY', 'SELL'], required: true },
  orderType: { type: String, enum: ['market'], default: 'market' },
  mode: { type: String, enum: ['paper'], default: 'paper' },
  status: { type: String, enum: ['executed', 'rejected'], default: 'executed' },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  executedPrice: { type: Number },
  fees: { type: Number, default: 0 },
  realizedPnl: { type: Number, default: null },
  balanceBefore: { type: Number, default: null },
  balanceAfter: { type: Number, default: null },
  holdingQuantityBefore: { type: Number, default: null },
  holdingQuantityAfter: { type: Number, default: null },
  avgPriceBefore: { type: Number, default: null },
  avgPriceAfter: { type: Number, default: null },
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
  priceError: { type: String, default: null },
  total: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

TradeSchema.index({ userId: 1, createdAt: -1 });
TradeSchema.index({ userId: 1, symbol: 1, createdAt: -1 });

module.exports = mongoose.model('Trade', TradeSchema);
