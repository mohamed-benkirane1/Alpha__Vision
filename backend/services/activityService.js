const ActivityLog = require('../models/ActivityLog');

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function cleanString(value, fallback = '') {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function cleanType(value) {
  return cleanString(value, 'general').toLowerCase().replace(/[^a-z0-9:_-]/g, '_').slice(0, 80);
}

function toPositiveInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function serializeActivity(activity) {
  const data = activity?.toObject ? activity.toObject() : activity;
  if (!data) return null;

  return {
    id: data._id ? String(data._id) : data.id ? String(data.id) : null,
    _id: data._id ? String(data._id) : data.id ? String(data.id) : null,
    user: data.user ? String(data.user) : null,
    type: data.type || 'general',
    title: data.title || '',
    description: data.description || '',
    metadata: data.metadata || {},
    createdAt: data.createdAt || null,
  };
}

async function logActivity({
  user,
  userId,
  type = 'general',
  title,
  description = '',
  metadata = {},
} = {}) {
  const targetUser = user || userId;
  if (!targetUser) return null;

  const cleanTitle = cleanString(title);
  if (!cleanTitle) return null;

  const activity = await ActivityLog.create({
    user: targetUser,
    type: cleanType(type),
    title: cleanTitle,
    description: cleanString(description),
    metadata: metadata && typeof metadata === 'object' ? metadata : {},
  });

  return serializeActivity(activity);
}

async function logActivitySafe(input) {
  try {
    return await logActivity(input);
  } catch (error) {
    console.warn('[activity] log failed:', error.message || error);
    return null;
  }
}

async function getUserActivities(userId, query = {}) {
  const page = toPositiveInt(query.page, 1);
  const limit = Math.min(MAX_LIMIT, toPositiveInt(query.limit, DEFAULT_LIMIT));
  const skip = (page - 1) * limit;
  const type = cleanString(query.type);
  const filter = {
    user: userId,
    ...(type ? { type: cleanType(type) } : {}),
  };

  const [items, total] = await Promise.all([
    ActivityLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    ActivityLog.countDocuments(filter),
  ]);

  return {
    activities: items.map(serializeActivity).filter(Boolean),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
}

module.exports = {
  getUserActivities,
  logActivity,
  logActivitySafe,
  serializeActivity,
};
