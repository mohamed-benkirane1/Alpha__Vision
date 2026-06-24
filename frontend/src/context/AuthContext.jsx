import { useCallback, useEffect, useMemo, useState } from 'react'
import AuthContext from './authContextCore'
import { AUTH_SESSION_EXPIRED_EVENT } from '../services/api'
import { getCurrentUser, logout as logoutRequest } from '../services/authService'

const normalizeUser = (data) => data?.user || data || null

export function AuthProvider({ children }) {
  // User lives in React state only — no localStorage (token is an httpOnly cookie)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const clearSession = useCallback(() => {
    setUser(null)
  }, [])

  const login = useCallback((nextUser) => {
    if (!nextUser) {
      clearSession()
      throw new Error('Invalid authentication response.')
    }
    setUser(nextUser)
  }, [clearSession])

  const logout = useCallback(async () => {
    try {
      await logoutRequest()
    } catch {
      // Keep logout local-first: an expired network session must not trap the user.
    } finally {
      clearSession()
    }
  }, [clearSession])

  const loadCurrentUser = useCallback(async () => {
    setLoading(true)

    try {
      const { data } = await getCurrentUser()
      const currentUser = normalizeUser(data)

      if (currentUser) {
        setUser(currentUser)
      } else {
        clearSession()
      }

      return currentUser
    } catch (err) {
      if (err.status === 401) {
        clearSession()
      }
      return null
    } finally {
      setLoading(false)
    }
  }, [clearSession])

  useEffect(() => {
    const handleSessionExpired = () => {
      clearSession()
    }

    window.addEventListener(AUTH_SESSION_EXPIRED_EVENT, handleSessionExpired)
    return () => window.removeEventListener(AUTH_SESSION_EXPIRED_EVENT, handleSessionExpired)
  }, [clearSession])

  // Restore session from httpOnly cookie on mount
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      loadCurrentUser()
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [loadCurrentUser])

  const value = useMemo(() => ({
    user,
    token: null,
    loading,
    isAuthenticated: Boolean(user),
    login,
    logout,
    refreshUser: loadCurrentUser,
    loadCurrentUser,
  }), [loading, login, logout, loadCurrentUser, user])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
