import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AlertCircle, BadgeCheck, KeyRound, Lock } from 'lucide-react'
import { resetPassword } from '../services/authService'

const fieldClass = 'w-full rounded-xl border border-white/[0.09] bg-[#06020c]/70 px-3.5 py-2.5 text-sm text-white placeholder-slate-700 outline-none transition focus:border-rose-500/50'

function validatePassword(password) {
  if (password.length < 8) return 'Password must be at least 8 characters.'
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return 'Password must include at least one letter and one number.'
  }
  return ''
}

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const email = searchParams.get('email') || ''
  const token = searchParams.get('token') || ''
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const linkError = !email || !token ? 'Reset link is missing required data.' : ''

  const handleSubmit = async (event) => {
    event.preventDefault()
    const passwordError = validatePassword(password)

    if (linkError) {
      setError(linkError)
      return
    }
    if (passwordError) {
      setError(passwordError)
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')
    const response = await resetPassword({ email, token, newPassword: password })
    setLoading(false)

    if (!response.success) {
      setError(response.error || 'Unable to reset password.')
      return
    }

    setSuccess(response.message || 'Password reset successfully.')
    setPassword('')
    setConfirmPassword('')
  }

  return (
    <div className="min-h-screen bg-[#06020c] flex items-center justify-center px-6">
      <div className="w-full max-w-sm rounded-2xl border border-white/[0.08] bg-[#0a0d16]/88 p-7 shadow-[0_8px_60px_rgba(0,0,0,0.55)]">
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-rose-500/25 bg-rose-500/10">
          <KeyRound size={20} className="text-rose-300" />
        </div>
        <h1 className="text-xl font-black text-white">Set new password</h1>
        <p className="mt-1 text-xs font-medium text-slate-500">Reset links are validated by the backend before password changes.</p>

        {(error || linkError) && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/8 px-3 py-2 text-xs font-semibold text-amber-300">
            <AlertCircle size={13} className="mt-0.5 shrink-0" />
            <span>{error || linkError}</span>
          </div>
        )}

        {success && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/8 px-3 py-2 text-xs font-semibold text-emerald-300">
            <BadgeCheck size={13} className="mt-0.5 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-500">New password</label>
            <div className="relative">
              <Lock size={13} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600" />
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className={`${fieldClass} pl-10`}
                placeholder="At least 8 characters"
                disabled={loading || Boolean(success)}
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-500">Confirm password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className={fieldClass}
              placeholder="Repeat password"
              disabled={loading || Boolean(success)}
            />
          </div>
          <button
            type="submit"
            disabled={loading || Boolean(success) || Boolean(linkError)}
            className="w-full rounded-xl bg-gradient-to-r from-rose-600 to-red-600 py-3 text-sm font-black text-white shadow-[0_0_22px_rgba(225,29,72,0.28)] transition hover:from-rose-500 hover:to-red-500 disabled:cursor-not-allowed disabled:opacity-55"
          >
            {loading ? 'Resetting...' : 'Reset password'}
          </button>
        </form>

        <p className="mt-5 text-center text-[11px] font-medium text-slate-600">
          Back to{' '}
          <Link to="/login" className="font-black text-rose-400 hover:text-rose-300">
            sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
