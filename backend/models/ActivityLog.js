const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  type: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    maxlength: 80,
    index: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 140,
  },
  description: {
    type: String,
    trim: true,
    maxlength: 600,
    default: '',
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

activityLogSchema.index({ user: 1, createdAt: -1 });
activityLogSchema.index({ user: 1, type: 1, createdAt: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
