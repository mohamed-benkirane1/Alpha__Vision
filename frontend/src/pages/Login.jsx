import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Zap, Mail, Lock, Eye, EyeOff, ArrowRight, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react'
import ParticleBackground from '../components/ambient/ParticleBackground'

const fadeUp  = { hidden: { opacity: 0, y: 18 }, visible: { opacity: 1, y: 0, transition: { duration: 0.42, ease: [0.16, 1, 0.3, 1] } } }
const stagger = { visible: { transition: { staggerChildren: 0.07 } } }

export default function Login() {
  const [form, setForm]           = useState({ email: '', password: '' })
  const [errors, setErrors]       = useState({})
  const [showPassword, setShowPw] = useState(false)
  const [loading, setLoading]     = useState(false)

  const validate = () => {
    const e = {}
    if (!form.email.trim())
      e.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = 'Enter a valid email address'
    if (!form.password)
      e.password = 'Password is required'
    return e
  }

  const handleSubmit = (ev) => {
    ev.preventDefault()
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    setErrors({})
    setLoading(true)
    setTimeout(() => setLoading(false), 1200)
  }

  const handleChange = (field) => (ev) => {
    setForm((f) => ({ ...f, [field]: ev.target.value }))
    if (errors[field]) setErrors((e) => { const n = { ...e }; delete n[field]; return n })
  }

  const isValid = (field) => form[field] && !errors[field]

  const inputClass = (field, extra = '') =>
    `w-full bg-[#060D1C]/80 border ${
      errors[field]
        ? 'border-rose-500/50 focus:border-rose-500/70 focus:shadow-[0_0_12px_rgba(244,63,94,0.12)]'
        : isValid(field)
        ? 'border-emerald-500/40 focus:border-emerald-500/60 focus:shadow-[0_0_12px_rgba(16,185,129,0.12)]'
        : 'border-white/[0.09] focus:border-indigo-500/60 focus:shadow-[0_0_14px_rgba(99,102,241,0.14)]'
    } text-white text-sm rounded-xl py-2.5 placeholder-slate-700 focus:outline-none transition-all duration-200 ${extra}`

  return (
    <div className="min-h-screen bg-[#060D1C] flex flex-col items-center justify-center px-4 relative overflow-hidden">

      <ParticleBackground count={45} opacity={0.55} className="absolute inset-0" />

      {/* Ambient orbs */}
      <div className="pointer-events-none absolute top-[-8%] left-1/2 -translate-x-1/2 w-[600px] h-[500px] bg-indigo-600/[0.08] rounded-full blur-[100px]" />
      <div className="pointer-events-none absolute bottom-[-4%] right-1/4 w-[360px] h-[360px] bg-violet-600/[0.06] rounded-full blur-[80px]" />

      {/* Back link */}
      <div className="w-full max-w-sm mb-5 relative z-10">
        <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-white transition-colors font-medium">
          <ArrowLeft size={13} /> Back to home
        </Link>
      </div>

      {/* Card */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={stagger}
        className="relative z-10 w-full max-w-sm bg-[#0a1628]/88 border border-white/[0.08] rounded-2xl p-8 backdrop-blur-2xl shadow-[0_8px_60px_rgba(0,0,0,0.55),0_0_0_1px_rgba(99,102,241,0.06)]"
      >
        {/* Logo circle */}
        <motion.div variants={fadeUp} className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute -inset-3 rounded-full bg-indigo-500/8 blur-xl" />
            <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600/20 to-violet-600/10 border border-indigo-500/30 flex items-center justify-center shadow-[0_0_32px_rgba(99,102,241,0.25)]">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-[0_0_18px_rgba(99,102,241,0.5)]">
                <Zap size={17} className="text-white" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Heading */}
        <motion.div variants={fadeUp} className="text-center mb-7">
          <h1 className="text-[1.4rem] font-black text-white mb-1.5 tracking-tight">Welcome Back</h1>
          <p className="text-xs text-slate-500 font-medium">Login to your Alpha Vision account</p>
        </motion.div>

        {/* Form */}
        <motion.form variants={fadeUp} onSubmit={handleSubmit} noValidate className="space-y-4">

          {/* Email */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1.5 tracking-wide uppercase">Email Address</label>
            <div className="relative">
              <Mail size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" />
              <input
                type="email"
                value={form.email}
                onChange={handleChange('email')}
                placeholder="your@email.com"
                className={inputClass('email', 'pl-10 pr-10')}
              />
              {errors.email  && <AlertCircle  size={13} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-rose-400 pointer-events-none" />}
              {isValid('email') && <CheckCircle size={13} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-400 pointer-events-none" />}
            </div>
            {errors.email && (
              <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-[11px] text-rose-400 mt-1.5 flex items-center gap-1">
                <AlertCircle size={10} />{errors.email}
              </motion.p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1.5 tracking-wide uppercase">Password</label>
            <div className="relative">
              <Lock size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={handleChange('password')}
                placeholder="••••••••••"
                className={inputClass('password', 'pl-10 pr-10')}
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-300 transition-colors"
              >
                {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
            </div>
            {errors.password && (
              <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-[11px] text-rose-400 mt-1.5 flex items-center gap-1">
                <AlertCircle size={10} />{errors.password}
              </motion.p>
            )}
          </div>

          {/* Remember + Forgot */}
          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center gap-2 text-slate-500 cursor-pointer select-none font-medium">
              <input type="checkbox" className="w-3.5 h-3.5 rounded accent-indigo-600" />
              Remember me
            </label>
            <button type="button" className="text-indigo-400 hover:text-indigo-300 transition-colors font-bold text-[11px]">
              Forgot password?
            </button>
          </div>

          {/* Submit */}
          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: loading ? 1 : 1.01, boxShadow: '0 0 28px rgba(99,102,241,0.45)' }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
            className="ripple-btn w-full mt-1 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 disabled:opacity-55 text-white text-sm font-black rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-[0_0_22px_rgba(99,102,241,0.30)]"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Logging in…
              </>
            ) : (
              <>Log In <ArrowRight size={15} /></>
            )}
          </motion.button>
        </motion.form>

        {/* Divider */}
        <motion.div variants={fadeUp} className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-white/[0.06]" />
          <span className="text-[10px] text-slate-600 font-bold tracking-wider uppercase">or continue with</span>
          <div className="flex-1 h-px bg-white/[0.06]" />
        </motion.div>

        {/* Social buttons */}
        <motion.div variants={fadeUp} className="grid grid-cols-3 gap-2">
          {[
            { label: 'Google',  letter: 'G', color: 'text-blue-400' },
            { label: 'Apple',   apple: true                          },
            { label: 'Discord', letter: 'D', color: 'text-indigo-400' },
          ].map(({ label, letter, color, apple }) => (
            <motion.button
              key={label}
              type="button"
              whileHover={{ y: -1, backgroundColor: 'rgba(255,255,255,0.05)' }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center justify-center gap-1.5 py-2.5 bg-white/[0.03] border border-white/[0.07] rounded-xl text-xs font-bold text-slate-400 transition-all duration-200"
            >
              {apple ? (
                <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor" className="text-white">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                </svg>
              ) : (
                <span className={`text-xs font-black ${color}`}>{letter}</span>
              )}
              {label}
            </motion.button>
          ))}
        </motion.div>

        {/* Footer link */}
        <motion.p variants={fadeUp} className="text-[11px] text-slate-600 text-center mt-6 font-medium">
          Don't have an account?{' '}
          <Link to="/signup" className="text-indigo-400 hover:text-indigo-300 font-black transition-colors">
            Sign up
          </Link>
        </motion.p>
      </motion.div>
    </div>
  )
}
