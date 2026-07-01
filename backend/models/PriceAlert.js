const mongoose = require('mongoose');

const PriceAlertSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  symbol: { type: String, required: true, trim: true, uppercase: true },
  condition: { type: String, enum: ['above', 'below'], required: true },
  targetPrice: {
    type: Number,
    required: true,
    validate: {
      validator: (value) => Number.isFinite(value) && value > 0,
      message: 'targetPrice must be greater than 0.',
    },
  },
  currentPriceAtCreation: { type: Number, default: null },
  lastCheckedPrice: { type: Number, default: null },
  lastCheckedAt: { type: Date, default: null },
  status: { type: String, enum: ['active', 'triggered', 'disabled'], default: 'active', index: true },
  triggeredAt: { type: Date, default: null },
}, { timestamps: true });

PriceAlertSchema.index({ user: 1, status: 1, createdAt: -1 });
PriceAlertSchema.index({ user: 1, symbol: 1, status: 1 });

module.exports = mongoose.model('PriceAlert', PriceAlertSchema);
