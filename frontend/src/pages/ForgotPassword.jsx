import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, ArrowLeft, ArrowRight, AlertCircle, CheckCircle, ShieldCheck } from 'lucide-react'
import ParticleBackground from '../components/ambient/ParticleBackground'

const fadeUp  = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } } }
const stagger = { visible: { transition: { staggerChildren: 0.08 } } }

function LogoMark({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <defs>
        <linearGradient id="lgFp" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#e11d48" />
          <stop offset="100%" stopColor="#dc2626" />
        </linearGradient>
      </defs>
      <polygon points="20,4 36,34 4,34" fill="url(#lgFp)" />
      <polygon points="20,12 30,30 10,30" fill="#06020c" />
      <rect x="14" y="30" width="12" height="3" rx="1.5" fill="url(#lgFp)" />
    </svg>
  )
}

export default function ForgotPassword() {
  const [email, setEmail]     = useState('')
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent]       = useState(false)

  const isValidEmail = email && !error && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  const handleChange = (ev) => {
    setEmail(ev.target.value)
    if (error) setError('')
  }

  const handleSubmit = (ev) => {
    ev.preventDefault()
    if (!email.trim()) { setError('Email is required'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Enter a valid email address'); return }
    setError('')
    setLoading(true)
    setTimeout(() => { setLoading(false); setSent(true) }, 1400)
  }

  const inputClass =
    `w-full bg-[#0a0114]/70 border ${
      error
        ? 'border-rose-500/50 focus:border-rose-500/70 focus:shadow-[0_0_14px_rgba(225,29,72,0.16)]'
        : isValidEmail
        ? 'border-emerald-500/40 focus:border-emerald-500/60 focus:shadow-[0_0_14px_rgba(16,185,129,0.14)]'
        : 'border-white/[0.09] focus:border-rose-500/50 focus:shadow-[0_0_14px_rgba(225,29,72,0.14)]'
    } text-white text-sm rounded-xl py-2.5 pl-10 pr-10 placeholder-slate-700 focus:outline-none transition-all duration-200`

  return (
    <div className="min-h-screen bg-[#06020c] flex flex-col items-center justify-center px-5 py-10 relative overflow-hidden">

      <ParticleBackground count={30} opacity={0.4} className="absolute inset-0" />

      {/* Ambient orbs */}
      <div className="pointer-events-none absolute top-[-8%] left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-rose-700/[0.08] rounded-full blur-[110px]" />
      <div className="pointer-events-none absolute bottom-[-6%] left-1/4 w-[320px] h-[320px] bg-red-900/[0.06] rounded-full blur-[90px]" />
      <div className="pointer-events-none absolute top-1/3 right-0 w-[240px] h-[240px] bg-rose-800/[0.05] rounded-full blur-[70px]" />

      {/* Subtle grid */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: 'linear-gradient(rgba(225,29,72,0.9) 1px, transparent 1px), linear-gradient(90deg, rgba(225,29,72,0.9) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
        }}
      />

      {/* Back link */}
      <div className="w-full max-w-sm mb-5 relative z-10">
        <Link to="/login" className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-white transition-colors font-medium">
          <ArrowLeft size={13} /> Back to login
        </Link>
      </div>

      {/* Card */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={stagger}
        className="relative z-10 w-full max-w-sm bg-[#0a0114]/80 border border-white/[0.08] rounded-2xl p-8 backdrop-blur-2xl shadow-[0_8px_60px_rgba(0,0,0,0.6),0_0_0_1px_rgba(225,29,72,0.06)]"
      >
        {/* Icon */}
        <motion.div variants={fadeUp} className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute -inset-3 rounded-full bg-rose-500/[0.07] blur-xl" />
            <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-600/20 to-red-700/10 border border-rose-500/30 flex items-center justify-center shadow-[0_0_32px_rgba(225,29,72,0.20)]">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-red-700 flex items-center justify-center shadow-[0_0_18px_rgba(225,29,72,0.5)]">
                <ShieldCheck size={17} className="text-white" />
              </div>
            </div>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {!sent ? (
            <motion.div key="form" initial="hidden" animate="visible" exit={{ opacity: 0, y: -10 }} variants={stagger}>

              {/* Heading */}
              <motion.div variants={fadeUp} className="text-center mb-7">
                <h1 className="text-[1.4rem] font-black text-white mb-1.5 tracking-tight">Forgot password?</h1>
                <p className="text-xs text-slate-500 font-medium">No worries — we'll email you a reset link</p>
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
                    {error         && <AlertCircle  size={13} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-rose-400 pointer-events-none" />}
                    {isValidEmail  && <CheckCircle  size={13} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-400 pointer-events-none" />}
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
                  whileHover={{ scale: loading ? 1 : 1.01, boxShadow: '0 0 28px rgba(225,29,72,0.45)' }}
                  whileTap={{ scale: loading ? 1 : 0.98 }}
                  className="ripple-btn w-full py-3 bg-gradient-to-r from-rose-600 to-red-700 disabled:opacity-55 text-white text-sm font-black rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-[0_0_22px_rgba(225,29,72,0.30)]"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending reset link…
                    </>
                  ) : (
                    <>Send Reset Link <ArrowRight size={15} /></>
                  )}
                </motion.button>
              </motion.form>

              <motion.p variants={fadeUp} className="text-[11px] text-slate-600 text-center mt-6 font-medium">
                Remembered it?{' '}
                <Link to="/login" className="text-rose-400 hover:text-rose-300 font-black transition-colors">
                  Back to login
                </Link>
              </motion.p>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="text-center space-y-4"
            >
              {/* Success icon */}
              <div className="flex justify-center mb-2">
                <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center shadow-[0_0_24px_rgba(16,185,129,0.18)]">
                  <CheckCircle size={26} className="text-emerald-400" />
                </div>
              </div>

              <div>
                <h2 className="text-lg font-black text-white mb-1.5 tracking-tight">Check your inbox</h2>
                <p className="text-xs text-slate-500 leading-relaxed font-medium max-w-xs mx-auto">
                  We sent a password reset link to{' '}
                  <span className="text-rose-400 font-bold">{email}</span>.
                  {' '}It expires in 15 minutes.
                </p>
              </div>

              <div className="pt-2 space-y-2">
                <p className="text-[11px] text-slate-700 font-medium">Didn't receive it? Check your spam folder.</p>
                <button
                  onClick={() => { setSent(false); setEmail('') }}
                  className="text-[11px] text-rose-400 hover:text-rose-300 font-black transition-colors"
                >
                  Try a different email address
                </button>
              </div>

              <div className="pt-2">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-white transition-colors font-medium"
                >
                  <ArrowLeft size={12} /> Back to login
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Footer badge */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
        className="relative z-10 mt-8 flex items-center gap-3"
      >
        <div className="h-px w-10 bg-white/[0.05]" />
        <div className="flex items-center gap-2 text-[10px] text-slate-700 font-bold tracking-widest uppercase">
          <LogoMark size={12} />
          Alpha Vision
        </div>
        <div className="h-px w-10 bg-white/[0.05]" />
      </motion.div>
    </div>
  )
}
