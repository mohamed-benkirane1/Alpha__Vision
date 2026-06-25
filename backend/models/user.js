const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  googleId: { type: String, sparse: true },
  avatar: { type: String, default: null },
  balance: { type: Number, default: 0 },
  plan: { type: String, enum: ['free', 'pro', 'elite'], default: 'free' },
  planExpiresAt: { type: Date, default: null },
  stripeCustomerId: { type: String, default: null },
  stripeSubscriptionId: { type: String, default: null },
  stripeSubscriptionStatus: { type: String, default: null },
  resetPasswordTokenHash: { type: String, default: null, select: false },
  resetPasswordExpires: { type: Date, default: null, select: false },
  passwordChangedAt: { type: Date, default: null },
}, { timestamps: true });

UserSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();

  try {
    if (!this.isNew) {
      this.passwordChangedAt = new Date();
    }
    this.password = await bcrypt.hash(this.password, 10);
    return next();
  } catch (error) {
    return next(error);
  }
});

UserSchema.methods.comparePassword = function comparePassword(candidatePassword) {
  if (typeof candidatePassword !== 'string' || typeof this.password !== 'string') {
    return Promise.resolve(false);
  }

  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
