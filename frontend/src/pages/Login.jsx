import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Zap, Mail, Lock, Eye, EyeOff, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react'
import { useAuth } from '../context/useAuth'
import { login as loginRequest } from '../services/authService'

const fadeUp  = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } } }
const stagger = { visible: { transition: { staggerChildren: 0.07 } } }

// ── Inline LogoMark — same as Home.jsx and MainLayout.jsx ─────────────────────
function LogoMark({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 34 34" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="lgLogin" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#e11d48" />
          <stop offset="100%" stopColor="#dc2626" />
        </linearGradient>
      </defs>
      <polygon points="17,2 32,31 2,31" fill="url(#lgLogin)" />
      <polygon points="17,10 26,29 8,29" fill="#06020c" />
      <rect x="10" y="21" width="14" height="2.5" fill="url(#lgLogin)" />
    </svg>
  )
}

// ── Feature bullet for the left panel ─────────────────────────────────────────
function Feature({ icon: Icon, title, desc }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/18 flex items-center justify-center shrink-0">
        <Icon size={14} className="text-rose-400" />
      </div>
      <div>
        <p className="text-sm font-bold text-white/90">{title}</p>
        <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{desc}</p>
      </div>
    </div>
  )
}

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login: authLogin } = useAuth()
  const [form, setForm]           = useState({ email: '', password: '' })
  const [errors, setErrors]       = useState({})
  const [success, setSuccess]     = useState('')
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

  const handleSubmit = async (ev) => {
    ev.preventDefault()
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    setErrors({})
    setSuccess('')
    setLoading(true)

    try {
      const { data } = await loginRequest({
        email: form.email.trim(),
        password: form.password,
      })

      authLogin(data?.user, data?.token)

      const redirectTo = location.state?.from?.pathname || '/dashboard'
      setSuccess('Signed in successfully. Redirecting...')
      setTimeout(() => navigate(redirectTo, { replace: true }), 500)
    } catch (err) {
      setErrors({
        submit: err.message || 'Unable to sign in. Please try again.',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field) => (ev) => {
    setForm((f) => ({ ...f, [field]: ev.target.value }))
    if (success) setSuccess('')
    if (errors[field] || errors.submit) setErrors((e) => {
      const n = { ...e }
      delete n[field]
      delete n.submit
      return n
    })
  }

  const isValid = (field) => form[field] && !errors[field]

  const inputClass = (field, extra = '') =>
    `w-full bg-[#06020c]/70 border ${
      errors[field]
        ? 'border-rose-500/50 focus:border-rose-500/70 focus:shadow-[0_0_12px_rgba(225,29,72,0.14)]'
        : isValid(field)
        ? 'border-emerald-500/40 focus:border-emerald-500/60 focus:shadow-[0_0_12px_rgba(16,185,129,0.12)]'
        : 'border-white/[0.09] focus:border-rose-500/50 focus:shadow-[0_0_18px_rgba(225,29,72,0.16)]'
    } text-white text-sm rounded-xl py-2.5 placeholder-slate-700 focus:outline-none transition-all duration-200 ${extra}`

  return (
    <div className="min-h-screen bg-[#06020c] flex overflow-hidden">

      {/* ── Left panel — branding ─────────────────────────────────────────── */}
      <div className="hidden lg:flex flex-col justify-between w-[46%] xl:w-[42%] relative overflow-hidden px-12 py-10">

        {/* Ambient orbs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute -top-32 -left-24 w-[540px] h-[540px] bg-rose-600/[0.12] rounded-full blur-[110px]" />
          <div className="absolute bottom-0 right-[-10%] w-[420px] h-[420px] bg-red-700/[0.09] rounded-full blur-[90px]" />
          <div className="absolute top-1/2 -translate-y-1/2 left-[30%] w-[300px] h-[300px] bg-rose-500/[0.05] rounded-full blur-[80px]" />
          {/* Grid */}
          <div className="absolute inset-0 home-grid opacity-45" />
          {/* Subtle right edge fade */}
          <div className="absolute inset-y-0 right-0 w-28 bg-gradient-to-l from-[#06020c] to-transparent" />
        </div>

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="relative shrink-0">
            <div className="absolute -inset-1.5 rounded-xl bg-rose-500/15 blur-md -z-10" />
            <div className="w-10 h-10 rounded-xl bg-[#06020c] border border-rose-500/25 flex items-center justify-center shadow-[0_0_20px_rgba(225,29,72,0.30)]">
              <LogoMark size={24} />
            </div>
          </div>
          <div className="leading-none">
            <span className="block text-[13px] font-black tracking-[0.18em] text-white">ALPHA</span>
            <span className="block text-[10px] font-bold tracking-[0.24em] text-rose-400 mt-[2px]">VISION</span>
          </div>
        </div>

        {/* Hero text */}
        <div className="relative z-10 space-y-6">
          <div>
            <h2 className="text-3xl xl:text-4xl font-black text-white leading-[1.15] tracking-tight">
              Trade smarter<br />
              <span className="bg-gradient-to-r from-rose-400 to-red-500 bg-clip-text text-transparent">
                with AI at your side
              </span>
            </h2>
            <p className="mt-3 text-sm text-slate-500 leading-relaxed max-w-xs">
              Real-time signals, portfolio analytics, and an AI assistant — all in one premium platform.
            </p>
          </div>

          <div className="space-y-4">
            <Feature icon={Zap}  title="AI-Powered Signals" desc="Sub-second market intelligence powered by large language models." />
            <Feature icon={Mail} title="Portfolio Analytics" desc="Real-time P&L tracking, risk metrics, and allocation insights." />
            <Feature icon={Lock} title="Institutional Grade" desc="Bank-level encryption and compliance-ready infrastructure." />
          </div>
        </div>

        {/* Testimonial */}
        <div className="relative z-10">
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm">
            <p className="text-xs text-slate-400 italic leading-relaxed">
              "Alpha Vision changed how I approach every trade. The AI signals are uncanny."
            </p>
            <div className="flex items-center gap-2 mt-3">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center text-[10px] font-black text-white">S</div>
              <div>
                <p className="text-[11px] font-bold text-white/80">Sarah M.</p>
                <p className="text-[10px] text-slate-600">Quantitative Trader</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right panel — form ────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 relative">

        {/* Ambient orbs — all viewports */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[560px] h-[560px] bg-rose-600/[0.08] rounded-full blur-[110px]" />
          <div className="absolute bottom-0 right-[-8%] w-[380px] h-[380px] bg-red-700/[0.06] rounded-full blur-[90px]" />
          <div className="absolute top-1/2 -translate-y-1/2 left-[-6%] w-[240px] h-[240px] bg-rose-500/[0.04] rounded-full blur-[70px]" />
        </div>

        {/* Vertical separator — desktop only */}
        <div className="hidden lg:block absolute left-0 inset-y-0 w-px bg-gradient-to-b from-transparent via-white/[0.06] to-transparent" />

        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="relative z-10 w-full max-w-sm bg-[#0a0d16]/80 border border-white/[0.08] rounded-2xl p-8 backdrop-blur-2xl shadow-[0_8px_60px_rgba(0,0,0,0.50),0_0_40px_rgba(225,29,72,0.06),0_0_0_1px_rgba(225,29,72,0.05)]"
        >
          {/* Mobile logo */}
          <motion.div variants={fadeUp} className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-[#06020c] border border-rose-500/25 flex items-center justify-center shadow-[0_0_18px_rgba(225,29,72,0.25)]">
              <LogoMark size={20} />
            </div>
            <div className="leading-none">
              <span className="block text-[12px] font-black tracking-[0.18em] text-white">ALPHA</span>
              <span className="block text-[9px] font-bold tracking-[0.24em] text-rose-400 mt-[2px]">VISION</span>
            </div>
          </motion.div>

          {/* Heading */}
          <motion.div variants={fadeUp} className="mb-7">
            <div className="inline-flex items-center gap-1.5 bg-rose-500/8 border border-rose-500/20 rounded-full px-3 py-1 mb-4">
              <div className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
              <span className="text-[10px] font-bold text-rose-300 tracking-wider uppercase">Secure Login</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">Welcome back</h1>
            <p className="text-xs text-slate-500 font-medium mt-1">Sign in to your Alpha Vision account</p>
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
                {errors.email    && <AlertCircle  size={13} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-rose-400 pointer-events-none" />}
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
                <input type="checkbox" className="w-3.5 h-3.5 rounded accent-rose-600" />
                Remember me
              </label>
              <Link to="/forgot-password" className="text-rose-400 hover:text-rose-300 transition-colors font-bold text-[11px]">
                Forgot password?
              </Link>
            </div>

            {(errors.submit || success) && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className={`text-[11px] mt-1.5 flex items-center gap-1 font-medium ${
                  success ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {success ? <CheckCircle size={10} /> : <AlertCircle size={10} />}
                {success || errors.submit}
              </motion.p>
            )}

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.01, boxShadow: '0 0 28px rgba(225,29,72,0.40)' }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              className="ripple-btn w-full mt-1 py-3 bg-gradient-to-r from-rose-600 to-red-600 disabled:opacity-55 text-white text-sm font-black rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-[0_0_22px_rgba(225,29,72,0.28)]"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in…
                </>
              ) : (
                <>Sign In <ArrowRight size={15} /></>
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
            Don&apos;t have an account?{' '}
            <Link to="/signup" className="text-rose-400 hover:text-rose-300 font-black transition-colors">
              Sign up free
            </Link>
          </motion.p>
        </motion.div>
      </div>
    </div>
  )
}
