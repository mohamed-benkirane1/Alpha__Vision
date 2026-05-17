const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['deposit', 'subscription'], required: true },
  amount: { type: Number, required: true },
  plan: { type: String, enum: ['free', 'pro', 'elite'], default: null },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  paymentMethod: { type: String, enum: ['card', 'crypto', 'paypal'], required: true },
  transactionId: { type: String, unique: true },
  stripeSessionId: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Transaction', TransactionSchema);