import api, { extractApiError } from './api'
import { getErrorMessage } from '../utils/errorMessage'

const normalizeActivities = (items) => (
  Array.isArray(items)
    ? items.filter(Boolean).map((item) => ({
      id: item.id || item._id || `${item.type}-${item.createdAt}`,
      type: item.type || 'general',
      title: item.title || 'Activity',
      description: item.description || '',
      metadata: item.metadata || {},
      createdAt: item.createdAt || null,
    }))
    : []
)

export const getActivities = async ({ limit = 12, page = 1, type = '' } = {}) => {
  try {
    const response = await api.get('/activity', {
      params: {
        limit,
        page,
        ...(type ? { type } : {}),
      },
    })
    const payload = response.data || {}

    return {
      success: payload.success !== false,
      timestamp: payload.timestamp || null,
      activities: normalizeActivities(payload.activities),
      pagination: payload.pagination || { page, limit, total: 0, pages: 0 },
      warnings: Array.isArray(payload.warnings) ? payload.warnings.map(getErrorMessage).filter(Boolean) : [],
      error: getErrorMessage(payload.error) || null,
      raw: payload,
    }
  } catch (error) {
    const apiError = extractApiError(error)
    return {
      success: false,
      timestamp: null,
      activities: [],
      pagination: { page, limit, total: 0, pages: 0 },
      warnings: [],
      error: getErrorMessage(apiError.message || 'Unable to load activity.'),
      raw: apiError.data,
    }
  }
}

export default {
  getActivities,
}
