import axios from 'axios'

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
export const AUTH_SESSION_EXPIRED_EVENT = 'alpha-vision:auth-session-expired'

export const getToken = () => localStorage.getItem('token')

export const setToken = (token) => {
  if (token) localStorage.setItem('token', token)
}

export const removeToken = () => {
  localStorage.removeItem('token')
}

export const getCurrentUserFromStorage = () => {
  const rawUser = localStorage.getItem('user')
  if (!rawUser) return null

  try {
    return JSON.parse(rawUser)
  } catch {
    return null
  }
}

export class ApiError extends Error {
  constructor(message, { status, data } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
    this.priceStatus = data?.priceStatus
  }
}

export const extractApiError = (error) => ({
  message: error?.message || 'Erreur API',
  status: error?.status ?? error?.response?.status ?? null,
  data: error?.data ?? error?.response?.data ?? null,
  priceStatus: error?.priceStatus ?? error?.data?.priceStatus ?? error?.response?.data?.priceStatus ?? null,
})

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = getToken()

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  } else if (config.headers.Authorization) {
    delete config.headers.Authorization
  }

  return config
})

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
      getToken() &&
      typeof window !== 'undefined' &&
      !publicAuthEndpoints.some((endpoint) => requestUrl.includes(endpoint))
    ) {
      window.dispatchEvent(new CustomEvent(AUTH_SESSION_EXPIRED_EVENT))
    }

    const message =
      data?.message ||
      data?.error ||
      error.message ||
      'Erreur API'

    return Promise.reject(new ApiError(message, { status, data }))
  },
)

export const get = (...args) => api.get(...args)
export const post = (...args) => api.post(...args)
export const put = (...args) => api.put(...args)
export const patch = (...args) => api.patch(...args)
export const del = (...args) => api.delete(...args)

export default api
