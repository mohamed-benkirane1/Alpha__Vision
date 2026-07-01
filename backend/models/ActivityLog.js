const mongoose = require('mongoose');

const ACTIVITY_LOG_RETENTION_SECONDS = 60 * 60 * 24 * 180;
const ACTIVITY_LOG_RETENTION_MS = ACTIVITY_LOG_RETENTION_SECONDS * 1000;

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
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + ACTIVITY_LOG_RETENTION_MS),
    expires: 0,
    select: false,
  },
});

activityLogSchema.index({ user: 1, createdAt: -1 });
activityLogSchema.index({ user: 1, type: 1, createdAt: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
