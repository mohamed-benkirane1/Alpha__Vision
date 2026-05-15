import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, ArrowRight, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react'

const fadeUp  = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } } }
const stagger = { visible: { transition: { staggerChildren: 0.07 } } }

function LogoMark({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 34 34" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="lgFP" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#e11d48" />
          <stop offset="100%" stopColor="#dc2626" />
        </linearGradient>
      </defs>
      <polygon points="17,2 32,31 2,31" fill="url(#lgFP)" />
      <polygon points="17,10 26,29 8,29" fill="#06020c" />
      <rect x="10" y="21" width="14" height="2.5" fill="url(#lgFP)" />
    </svg>
  )
}

export default function ForgotPassword() {
  const [email, setEmail]     = useState('')
  const [error, setError]     = useState('')
  const [sent, setSent]       = useState(false)
  const [loading, setLoading] = useState(false)

  const validate = () => {
    if (!email.trim())                              return 'Email is required'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Enter a valid email address'
    return ''
  }

  const handleSubmit = (ev) => {
    ev.preventDefault()
    const err = validate()
    if (err) { setError(err); return }
    setError('')
    setLoading(true)
    setTimeout(() => { setLoading(false); setSent(true) }, 1200)
  }

  const handleChange = (ev) => {
    setEmail(ev.target.value)
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

      {/* Ambient orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-rose-600/[0.07] rounded-full blur-[100px]" />
        <div className="absolute bottom-[-8%] right-[15%] w-[360px] h-[360px] bg-red-700/[0.05] rounded-full blur-[80px]" />
        <div className="absolute inset-0 home-grid opacity-30" />
      </div>

      {/* Back link */}
      <div className="w-full max-w-sm mb-6 relative z-10">
        <Link to="/login" className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-white transition-colors font-medium">
          <ArrowLeft size={13} /> Back to sign in
        </Link>
      </div>

      {/* Card */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={stagger}
        className="relative z-10 w-full max-w-sm bg-[#0a0d16]/88 border border-white/[0.08] rounded-2xl p-8 backdrop-blur-2xl shadow-[0_8px_60px_rgba(0,0,0,0.55),0_0_0_1px_rgba(225,29,72,0.05)]"
      >
        {!sent ? (
          <>
            {/* Logo */}
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

            {/* Heading */}
            <motion.div variants={fadeUp} className="text-center mb-7">
              <h1 className="text-[1.4rem] font-black text-white mb-1.5 tracking-tight">Reset Password</h1>
              <p className="text-xs text-slate-500 font-medium">Enter your email and we&apos;ll send you a reset link</p>
            </motion.div>

            {/* Form */}
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
                  {error    && <AlertCircle  size={13} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-rose-400 pointer-events-none" />}
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
                    Sending…
                  </>
                ) : (
                  <>Send Reset Link <ArrowRight size={15} /></>
                )}
              </motion.button>
            </motion.form>
          </>
        ) : (
          /* Success state */
          <motion.div initial="hidden" animate="visible" variants={stagger} className="text-center py-4">
            <motion.div variants={fadeUp} className="flex justify-center mb-5">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center shadow-[0_0_28px_rgba(16,185,129,0.15)]">
                <CheckCircle size={28} className="text-emerald-400" />
              </div>
            </motion.div>
            <motion.h2 variants={fadeUp} className="text-xl font-black text-white mb-2">Check your inbox</motion.h2>
            <motion.p variants={fadeUp} className="text-xs text-slate-500 leading-relaxed mb-6">
              We sent a password reset link to<br />
              <span className="text-white font-semibold">{email}</span>
            </motion.p>
            <motion.p variants={fadeUp} className="text-[11px] text-slate-600">
              Didn&apos;t receive it?{' '}
              <button
                type="button"
                onClick={() => setSent(false)}
                className="text-rose-400 hover:text-rose-300 font-black transition-colors"
              >
                Try again
              </button>
            </motion.p>
          </motion.div>
        )}

        {/* Footer */}
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
