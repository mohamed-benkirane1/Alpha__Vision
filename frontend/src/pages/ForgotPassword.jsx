import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AlertCircle, ArrowLeft, ArrowRight, CheckCircle, Mail } from 'lucide-react'
import { requestPasswordReset } from '../services/authService'
import LogoMark from '../components/ui/LogoMark'

const fadeUp = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } } }
const stagger = { visible: { transition: { staggerChildren: 0.07 } } }

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const validate = () => {
    if (!email.trim()) return 'Email is required'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Enter a valid email address'
    return ''
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setError('')
    setLoading(true)
    const response = await requestPasswordReset(email.trim())
    setLoading(false)

    if (!response.success) {
      setError(response.error || 'Unable to request password reset.')
      return
    }

    setResult(response)
  }

  const handleChange = (event) => {
    setEmail(event.target.value)
    if (error) setError('')
  }

  const isValid = email && !error
  const inputClass =
    `w-full bg-[#06020c]/70 border ${
      error
        ? 'border-rose-500/50 focus:border-rose-500/70 focus:shadow-[0_0_12px_rgba(225,29,72,0.14)]'
        : isValid
          ? 'border-emerald-500/40 focus:border-emerald-500/60 focus:shadow-[0_0_12px_rgba(16,185,129,0.12)]'
          : 'border-white/[0.09] focus:border-rose-500/50 focus:shadow-[0_0_14px_rgba(225,29,72,0.10)]'
    } text-white text-sm rounded-xl py-2.5 pl-10 pr-10 placeholder-slate-700 focus:outline-none transition-all duration-200`

  return (
    <div className="min-h-screen bg-[#06020c] flex flex-col items-center justify-center px-6 relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[580px] h-[580px] bg-rose-600/[0.10] rounded-full blur-[110px]" />
        <div className="absolute bottom-[-8%] right-[15%] w-[400px] h-[400px] bg-red-700/[0.07] rounded-full blur-[90px]" />
        <div className="absolute top-[35%] left-[-4%] w-[260px] h-[260px] bg-rose-500/[0.05] rounded-full blur-[70px]" />
        <div className="absolute inset-0 home-grid opacity-35" />
      </div>

      <div className="w-full max-w-sm mb-6 relative z-10">
        <Link to="/login" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-rose-400 transition-colors font-bold group">
          <ArrowLeft size={13} className="transition-transform duration-200 group-hover:-translate-x-0.5" /> Back to sign in
        </Link>
      </div>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={stagger}
        className="relative z-10 w-full max-w-sm bg-[#0a0d16]/88 border border-white/[0.08] rounded-2xl p-8 backdrop-blur-2xl shadow-[0_8px_60px_rgba(0,0,0,0.55),0_0_50px_rgba(225,29,72,0.08),0_0_0_1px_rgba(225,29,72,0.07)]"
      >
        {!result ? (
          <>
            <motion.div variants={fadeUp} className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute -inset-3 rounded-full bg-rose-500/8 blur-xl" />
                <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-600/15 to-red-600/8 border border-rose-500/25 flex items-center justify-center shadow-[0_0_28px_rgba(225,29,72,0.20)]">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-600/30 to-red-700/20 border border-rose-500/30 flex items-center justify-center">
                    <LogoMark size={22} />
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div variants={fadeUp} className="text-center mb-7">
              <div className="inline-flex items-center gap-1.5 bg-rose-500/8 border border-rose-500/20 rounded-full px-3 py-1 mb-4">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
                <span className="text-[10px] font-bold text-rose-300 tracking-wider uppercase">Account Recovery</span>
              </div>
              <h1 className="text-[1.4rem] font-black text-white mb-1.5 tracking-tight">Reset Password</h1>
              <p className="text-xs text-slate-500 font-medium">Request a backend password reset email.</p>
            </motion.div>

            <motion.form variants={fadeUp} onSubmit={handleSubmit} noValidate className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 tracking-wide uppercase">Email Address</label>
                <div className="relative">
                  <Mail size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={handleChange}
                    placeholder="your@email.com"
                    className={inputClass}
                  />
                  {error && <AlertCircle size={13} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-rose-400 pointer-events-none" />}
                  {isValid && <CheckCircle size={13} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-400 pointer-events-none" />}
                </div>
                {error && (
                  <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-[11px] text-rose-400 mt-1.5 flex items-center gap-1">
                    <AlertCircle size={10} />{error}
                  </motion.p>
                )}
              </div>

              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.01, boxShadow: '0 0 28px rgba(225,29,72,0.40)' }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                className="ripple-btn w-full py-3 bg-gradient-to-r from-rose-600 to-red-600 disabled:opacity-55 text-white text-sm font-black rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-[0_0_22px_rgba(225,29,72,0.28)]"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Requesting...
                  </>
                ) : (
                  <>Send Reset Link <ArrowRight size={15} /></>
                )}
              </motion.button>
            </motion.form>
          </>
        ) : (
          <motion.div initial="hidden" animate="visible" variants={stagger} className="text-center py-4">
            <motion.div variants={fadeUp} className="flex justify-center mb-5">
              <div className={`w-16 h-16 rounded-2xl border flex items-center justify-center ${
                'bg-emerald-500/10 border-emerald-500/25 shadow-[0_0_28px_rgba(16,185,129,0.15)]'
              }`}>
                <CheckCircle size={28} className="text-emerald-400" />
              </div>
            </motion.div>
            <motion.h2 variants={fadeUp} className="text-xl font-black text-white mb-2">
              Check your inbox
            </motion.h2>
            <motion.p variants={fadeUp} className="text-xs text-slate-500 leading-relaxed mb-4">
              {result.message}
            </motion.p>
            {result.devReset?.resetUrl && (
              <motion.div variants={fadeUp} className="mb-4 rounded-xl border border-amber-500/20 bg-amber-500/8 p-3 text-left">
                <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-amber-300">Development reset link</p>
                <a
                  href={result.devReset.resetUrl}
                  className="break-all text-[11px] font-bold text-rose-300 transition-colors hover:text-rose-200"
                >
                  {result.devReset.resetUrl}
                </a>
              </motion.div>
            )}
            <motion.button
              variants={fadeUp}
              type="button"
              onClick={() => setResult(null)}
              className="text-rose-400 hover:text-rose-300 text-[11px] font-black transition-colors"
            >
              Request another reset
            </motion.button>
          </motion.div>
        )}

        <motion.p variants={fadeUp} className="text-[11px] text-slate-600 text-center mt-6 font-medium">
          Remember your password?{' '}
          <Link to="/login" className="text-rose-400 hover:text-rose-300 font-black transition-colors">
            Sign in
          </Link>
        </motion.p>
      </motion.div>
    </div>
  )
}
