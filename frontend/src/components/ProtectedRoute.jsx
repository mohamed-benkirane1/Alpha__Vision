import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

function AuthLoader() {
  return (
    <div className="min-h-screen bg-[#06020c] flex items-center justify-center">
      <div className="w-5 h-5 border-2 border-rose-500/20 border-t-rose-500/80 rounded-full animate-spin" />
    </div>
  )
}

export default function ProtectedRoute({ children }) {
  const location = useLocation()
  const { loading, isAuthenticated } = useAuth()

  if (loading) return <AuthLoader />

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return children || <Outlet />
}
