import api, { extractApiError } from './api'

const toNumberOrNull = (value) => {
  if (value === null || value === undefined || value === '') return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

const normalizeSymbol = (symbol) => String(symbol || '').trim().toUpperCase()

const normalizeAlert = (item = {}) => ({
  id: item.id || item._id || null,
  _id: item._id || item.id || null,
  symbol: normalizeSymbol(item.symbol),
  condition: item.condition || 'above',
  targetPrice: toNumberOrNull(item.targetPrice),
  currentPriceAtCreation: toNumberOrNull(item.currentPriceAtCreation),
  currentPrice: toNumberOrNull(item.currentPrice),
  lastCheckedPrice: toNumberOrNull(item.lastCheckedPrice),
  lastCheckedAt: item.lastCheckedAt || null,
  status: item.status || 'active',
  triggeredAt: item.triggeredAt || null,
  createdAt: item.createdAt || null,
  updatedAt: item.updatedAt || null,
  priceAvailable: item.priceAvailable === true,
  priceMeta: item.priceMeta || null,
  warning: item.warning || null,
})

const normalizeAlerts = (items) => (
  Array.isArray(items) ? items.filter(Boolean).map(normalizeAlert) : []
)

const normalizeAlertResponse = (payload = {}) => {
  const alerts = normalizeAlerts(
    Array.isArray(payload.alerts) ? payload.alerts : payload.data,
  )

  return {
    success: payload.success !== false,
    timestamp: payload.timestamp || null,
    count: toNumberOrNull(payload.count) ?? alerts.length,
    alerts,
    data: alerts,
    alert: payload.alert ? normalizeAlert(payload.alert) : null,
    checkedCount: toNumberOrNull(payload.checkedCount) ?? 0,
    triggeredCount: toNumberOrNull(payload.triggeredCount) ?? 0,
    triggered: normalizeAlerts(payload.triggered),
    warnings: Array.isArray(payload.warnings) ? payload.warnings.filter(Boolean) : [],
    message: payload.message || null,
    error: payload.error || null,
    raw: payload,
  }
}

const normalizeAlertError = (error, fallback) => {
  const apiError = extractApiError(error)
  return {
    success: false,
    timestamp: null,
    count: 0,
    alerts: [],
    data: [],
    alert: null,
    checkedCount: 0,
    triggeredCount: 0,
    triggered: [],
    warnings: [],
    message: apiError.message || fallback,
    error: apiError.message || fallback,
    raw: apiError.data,
  }
}

export const getAlerts = async () => {
  try {
    const response = await api.get('/alerts')
    return normalizeAlertResponse(response.data)
  } catch (error) {
    return normalizeAlertError(error, 'Unable to load price alerts.')
  }
}

export const createAlert = async ({ symbol, condition, targetPrice }) => {
  try {
    const response = await api.post('/alerts', {
      symbol: normalizeSymbol(symbol),
      condition,
      targetPrice,
    })
    return normalizeAlertResponse(response.data)
  } catch (error) {
    return normalizeAlertError(error, 'Unable to create price alert.')
  }
}

export const updateAlert = async (id, payload = {}) => {
  try {
    const response = await api.patch(`/alerts/${encodeURIComponent(id)}`, {
      ...payload,
      ...(payload.symbol !== undefined ? { symbol: normalizeSymbol(payload.symbol) } : {}),
    })
    return normalizeAlertResponse(response.data)
  } catch (error) {
    return normalizeAlertError(error, 'Unable to update price alert.')
  }
}

export const deleteAlert = async (id) => {
  try {
    const response = await api.delete(`/alerts/${encodeURIComponent(id)}`)
    return normalizeAlertResponse(response.data)
  } catch (error) {
    return normalizeAlertError(error, 'Unable to delete price alert.')
  }
}

export const checkAlerts = async () => {
  try {
    const response = await api.post('/alerts/check')
    return normalizeAlertResponse(response.data)
  } catch (error) {
    return normalizeAlertError(error, 'Unable to check price alerts.')
  }
}

export default {
  getAlerts,
  createAlert,
  updateAlert,
  deleteAlert,
  checkAlerts,
}
