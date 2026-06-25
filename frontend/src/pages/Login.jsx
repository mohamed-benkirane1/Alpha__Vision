import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Zap, Mail, Lock, Eye, EyeOff, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react'
import { useAuth } from '../context/useAuth'
import { login as loginRequest, startGoogleOAuth } from '../services/authService'

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

      if (data?.success !== true || !data?.user) {
        throw new Error(data?.message || 'Invalid authentication response.')
      }

      authLogin(data?.user)

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
              Verify your trades<br />
              <span className="bg-gradient-to-r from-rose-400 to-red-500 bg-clip-text text-transparent">
                with backend data
              </span>
            </h2>
            <p className="mt-3 text-sm text-slate-500 leading-relaxed max-w-xs">
              Backend quotes, execution metadata, portfolio warnings, and provider status in one workspace.
            </p>
          </div>

          <div className="space-y-4">
            <Feature icon={Zap}  title="Price Metadata" desc="Source, freshness, fallback, and availability stay visible before execution." />
            <Feature icon={Mail} title="Portfolio Analytics" desc="Backend holdings, cash balance, valuation quality, and allocation insights." />
            <Feature icon={Lock} title="Protected Flows" desc="Authentication and guarded backend writes stay the source of truth." />
          </div>
        </div>

        {/* Integration status */}
        <div className="relative z-10">
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm">
            <p className="text-xs text-slate-400 leading-relaxed">
              AI signals still need a real backend signal provider. Live market, trading, portfolio, news, and payment flows stay explicit about provider status.
            </p>
            <div className="flex items-center gap-2 mt-3">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center text-[10px] font-black text-white">API</div>
              <div>
                <p className="text-[11px] font-bold text-white/80">Integration status</p>
                <p className="text-[10px] text-slate-600">Provider-backed data only</p>
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

          {/* Google OAuth — seul bouton social */}
          <motion.div variants={fadeUp} className="flex justify-center">
            <motion.button
              type="button"
              onClick={startGoogleOAuth}
              whileHover={{ y: -1, backgroundColor: 'rgba(255,255,255,0.06)' }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center justify-center gap-2 px-6 py-2.5 w-full bg-white/[0.03] border border-white/[0.07] rounded-xl text-xs font-bold text-slate-300 hover:text-white transition-all duration-200"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continuer avec Google
            </motion.button>
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
