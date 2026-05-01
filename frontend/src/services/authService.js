import api from './api'

export const signup = (userData) =>
  api.post('/auth/signup', userData)

export const login = (credentials) =>
  api.post('/auth/login', credentials)

export const getMe = () =>
  api.get('/auth/me')

export const logout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}
