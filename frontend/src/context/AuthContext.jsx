import { useCallback, useEffect, useMemo, useState } from 'react'
import AuthContext from './authContextCore'
import { getCurrentUserFromStorage, getToken, removeToken, setToken } from '../services/api'
import { getCurrentUser } from '../services/authService'

const normalizeUser = (data) => data?.user || data || null

function storeUser(user) {
  if (user) {
    localStorage.setItem('user', JSON.stringify(user))
  } else {
    localStorage.removeItem('user')
  }
}

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(() => getToken())
  const [user, setUser] = useState(() => getCurrentUserFromStorage())
  const [loading, setLoading] = useState(true)

  const clearSession = useCallback(() => {
    removeToken()
    storeUser(null)
    setTokenState(null)
    setUser(null)
  }, [])

  const login = useCallback((nextUser, nextToken) => {
    if (nextToken) setToken(nextToken)
    if (nextUser) storeUser(nextUser)

    setTokenState(nextToken || getToken())
    setUser(nextUser || getCurrentUserFromStorage())
  }, [])

  const logout = useCallback(() => {
    clearSession()
  }, [clearSession])

  const loadCurrentUser = useCallback(async () => {
    const storedToken = getToken()

    if (!storedToken) {
      clearSession()
      setLoading(false)
      return null
    }

    setLoading(true)
    setTokenState(storedToken)

    const storedUser = getCurrentUserFromStorage()
    if (storedUser) setUser(storedUser)

    try {
      const { data } = await getCurrentUser()
      const currentUser = normalizeUser(data)

      if (currentUser) {
        storeUser(currentUser)
        setUser(currentUser)
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
    const timeoutId = window.setTimeout(() => {
      loadCurrentUser()
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [loadCurrentUser])

  const value = useMemo(() => ({
    user,
    token,
    loading,
    isAuthenticated: Boolean(token && user),
    login,
    logout,
    refreshUser: loadCurrentUser,
    loadCurrentUser,
  }), [loadCurrentUser, loading, login, logout, token, user])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
