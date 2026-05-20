const mongoose = require('mongoose');

const TradeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  symbol: { type: String, required: true },
  type: { type: String, enum: ['BUY', 'SELL'], required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  executedPrice: { type: Number },
  priceSource: { type: String, default: null },
  priceProvider: { type: String, default: null },
  priceTimestamp: { type: Date, default: null },
  priceCached: { type: Boolean, default: null },
  priceFallback: { type: Boolean, default: null },
  priceStale: { type: Boolean, default: null },
  priceError: { type: String, default: null },
  total: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Trade', TradeSchema);
