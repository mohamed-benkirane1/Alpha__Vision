const mongoose = require('mongoose');

const PortfolioSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  symbol: { type: String, required: true },
  quantity: { type: Number, required: true, default: 0 },
  avgPrice: { type: Number, required: true }
});

module.exports = mongoose.model('Portfolio', PortfolioSchema);