import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { AlertTriangle, ShieldCheck } from 'lucide-react'
import { useAuth } from '../context/useAuth'
import { getCurrentUser } from '../services/authService'
import { removeToken, setToken } from '../services/api'

const normalizeUser = (payload) => payload?.user || payload || null

export default function AuthCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { login } = useAuth()
  const [error, setError] = useState('')
  const token = searchParams.get('token')

  useEffect(() => {
    let active = true

    async function finishGoogleLogin() {
      if (!token) {
        setError('OAuth callback token is missing.')
        return
      }

      try {
        setToken(token)
        const response = await getCurrentUser()
        const user = normalizeUser(response.data)

        if (!user) throw new Error('Unable to load OAuth user.')
        if (!active) return

        login(user, token)
        navigate('/dashboard', { replace: true })
      } catch (err) {
        removeToken()
        if (active) setError(err?.message || 'OAuth login failed.')
      }
    }

    finishGoogleLogin()
    return () => {
      active = false
    }
  }, [login, navigate, token])

  return (
    <div className="min-h-screen bg-[#06020c] flex items-center justify-center px-6">
      <div className="w-full max-w-sm rounded-2xl border border-white/[0.08] bg-[#0a0d16]/88 p-7 text-center shadow-[0_8px_60px_rgba(0,0,0,0.55)]">
        <div className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border ${
          error ? 'border-amber-500/25 bg-amber-500/10' : 'border-emerald-500/25 bg-emerald-500/10'
        }`}>
          {error ? <AlertTriangle size={20} className="text-amber-300" /> : <ShieldCheck size={20} className="text-emerald-400" />}
        </div>
        <h1 className="text-lg font-black text-white">{error ? 'OAuth login failed' : 'Completing Google login'}</h1>
        <p className="mt-2 text-xs font-medium text-slate-500">
          {error || 'Loading your authenticated backend user.'}
        </p>
        {error ? (
          <Link to="/login" className="mt-5 inline-flex rounded-xl border border-white/[0.08] px-4 py-2 text-xs font-black text-rose-300 transition hover:border-rose-500/30 hover:text-white">
            Back to login
          </Link>
        ) : (
          <span className="mx-auto mt-5 block h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-rose-400" />
        )}
      </div>
    </div>
  )
}
