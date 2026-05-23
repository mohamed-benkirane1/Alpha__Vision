const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['deposit', 'subscription', 'demo_deposit'], required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'eur', lowercase: true },
  plan: {
    type: String,
    enum: ['free', 'pro', 'elite'],
    set: (value) => (value === null ? undefined : value),
    required() {
      return this.type === 'subscription';
    },
  },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  provider: { type: String, enum: ['stripe', 'internal-demo-funding'], default: 'stripe' },
  mode: { type: String, enum: ['stripe_test', 'stripe_live', 'demo'], default: 'stripe_test' },
  paymentMethod: { type: String, enum: ['card', 'stripe_checkout', 'demo', 'crypto', 'paypal'], required: true },
  transactionId: { type: String, unique: true },
  stripeSessionId: { type: String },
  stripeSubscriptionId: { type: String, default: null },
  stripeCustomerId: { type: String, default: null },
  description: { type: String, default: null },
  metadata: { type: mongoose.Schema.Types.Mixed, default: null },
  createdAt: { type: Date, default: Date.now }
});

TransactionSchema.pre('validate', function normalizeOptionalPlan(next) {
  if (this.type !== 'subscription') {
    this.plan = undefined;
  }

  next();
});

module.exports = mongoose.model('Transaction', TransactionSchema);
