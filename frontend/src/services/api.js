import axios from 'axios'
import { getErrorMessage } from '../utils/errorMessage'

const LOCAL_API_BASE_URL = 'http://localhost:5000/api'

const normalizeApiBaseUrl = (value) => {
  const url = String(value || '').trim().replace(/\/+$/, '')
  if (!url) return ''
  if (url.endsWith('/api') || url.includes('/api/')) return url
  return `${url}/api`
}

const resolveApiBaseUrl = () => {
  const configuredUrl = normalizeApiBaseUrl(import.meta.env.VITE_API_URL)
  if (configuredUrl) return configuredUrl

  if (import.meta.env.PROD) {
    throw new Error('VITE_API_URL is required in production')
  }

  return LOCAL_API_BASE_URL
}

export const API_BASE_URL = resolveApiBaseUrl()
export const AUTH_SESSION_EXPIRED_EVENT = 'alpha-vision:auth-session-expired'

// Token now lives in an httpOnly cookie set by the backend.
// These stubs keep backward-compatible imports working without breaking anything.
export const getToken = () => null
export const setToken = () => {}
export const removeToken = () => {}
export const getCurrentUserFromStorage = () => null

export class ApiError extends Error {
  constructor(message, { status, data } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
    this.priceStatus = data?.priceStatus
  }
}

export const extractApiError = (error) => {
  const data = error?.data ?? error?.response?.data ?? null

  return {
    message: getErrorMessage(data?.error || data?.message || error) || 'Erreur API',
    status: error?.status ?? error?.response?.status ?? null,
    data,
    priceStatus: error?.priceStatus ?? error?.data?.priceStatus ?? error?.response?.data?.priceStatus ?? null,
  }
}

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// No Authorization header injection — authentication is via httpOnly cookie
api.interceptors.request.use((config) => config)

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const data = error.response?.data
    const requestUrl = error.config?.url || ''
    const publicAuthEndpoints = [
      '/auth/login',
      '/auth/signup',
      '/auth/forgot-password',
      '/auth/reset-password',
    ]

    if (
      status === 401 &&
      typeof window !== 'undefined' &&
      !publicAuthEndpoints.some((endpoint) => requestUrl.includes(endpoint))
    ) {
      window.dispatchEvent(new CustomEvent(AUTH_SESSION_EXPIRED_EVENT))
    }

    const message = getErrorMessage(data?.message || data?.error || error) || 'Erreur API'

    return Promise.reject(new ApiError(message, { status, data }))
  },
)

export const get = (...args) => api.get(...args)
export const post = (...args) => api.post(...args)
export const put = (...args) => api.put(...args)
export const patch = (...args) => api.patch(...args)
export const del = (...args) => api.delete(...args)

export default api
