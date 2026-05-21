import api, { extractApiError, removeToken } from './api'

export const signup = (userData) =>
  api.post('/auth/signup', userData)

export const login = (credentials) =>
  api.post('/auth/login', credentials)

export const getCurrentUser = () =>
  api.get('/auth/me')

export const getMe = getCurrentUser

const normalizeProfileResponse = (payload = {}) => ({
  success: Boolean(payload.success),
  timestamp: payload.timestamp || null,
  user: payload.user || null,
  message: payload.message || '',
  warnings: Array.isArray(payload.warnings) ? payload.warnings.filter(Boolean) : [],
  error: payload.error || payload.message || null,
  raw: payload,
})

const normalizeProfileError = (error, fallbackMessage) => {
  const apiError = extractApiError(error)
  const payload = apiError.data || {}

  return normalizeProfileResponse({
    success: false,
    timestamp: payload.timestamp || null,
    user: payload.user || null,
    message: payload.message || '',
    warnings: payload.warnings || [],
    error: payload.error || payload.message || apiError.message || fallbackMessage,
  })
}

export const getProfile = async () => {
  try {
    const response = await getCurrentUser()
    return normalizeProfileResponse(response.data)
  } catch (error) {
    return normalizeProfileError(error, 'Unable to load profile.')
  }
}

export const updateProfile = async (profile = {}) => {
  try {
    const response = await api.patch('/auth/profile', {
      name: profile.name,
    })
    return normalizeProfileResponse(response.data)
  } catch (error) {
    return normalizeProfileError(error, 'Unable to update profile.')
  }
}

export const logout = () => {
  removeToken()
  localStorage.removeItem('user')
}
