const mongoose = require('mongoose');

const WatchlistSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  symbol: { type: String, required: true, trim: true, uppercase: true },
}, { timestamps: true });

WatchlistSchema.index({ userId: 1, symbol: 1 }, { unique: true });
WatchlistSchema.index({ userId: 1 });

module.exports = mongoose.model('Watchlist', WatchlistSchema);
