const mongoose = require('mongoose');

const PortfolioSnapshotSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  cashBalance: { type: Number, default: 0 },
  holdingsValue: { type: Number, default: 0 },
  totalPortfolioValue: { type: Number, default: 0 },
  totalInvested: { type: Number, default: 0 },
  totalProfit: { type: Number, default: 0 },
  totalProfitPercent: { type: Number, default: 0 },
  dataQuality: { type: mongoose.Schema.Types.Mixed, default: {} },
  source: { type: String, default: 'portfolio-refresh' },
  createdAt: { type: Date, default: Date.now },
});

PortfolioSnapshotSchema.index({ user: 1, createdAt: 1 });

module.exports = mongoose.model('PortfolioSnapshot', PortfolioSnapshotSchema);
