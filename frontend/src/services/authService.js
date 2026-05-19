import api, { removeToken } from './api'

export const signup = (userData) =>
  api.post('/auth/signup', userData)

export const login = (credentials) =>
  api.post('/auth/login', credentials)

export const getCurrentUser = () =>
  api.get('/auth/me')

export const getMe = getCurrentUser

export const logout = () => {
  removeToken()
  localStorage.removeItem('user')
}
