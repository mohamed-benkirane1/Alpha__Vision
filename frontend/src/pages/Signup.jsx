import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { User, Mail, Lock, Eye, EyeOff, ArrowRight, CheckCircle, AlertCircle, ShieldCheck } from 'lucide-react'
import { useAuth } from '../context/useAuth'
import { signup, startGoogleOAuth } from '../services/authService'
import LogoMark from '../components/ui/LogoMark'

const fadeUp  = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } } }
const stagger = { visible: { transition: { staggerChildren: 0.07 } } }

// ── Password strength helper ───────────────────────────────────────────────────
function getStrength(pw) {
  if (!pw) return 0
  let score = 0
  if (pw.length >= 8)  score++
  if (pw.length >= 12) score++
  if (/[A-Z]/.test(pw))          score++
  if (/[0-9]/.test(pw))          score++
  if (/[^A-Za-z0-9]/.test(pw))   score++
  return Math.min(score, 4)
}

const STRENGTH_LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong']
const STRENGTH_COLORS = ['', 'bg-rose-500', 'bg-amber-500', 'bg-yellow-400', 'bg-emerald-500']
const STRENGTH_TEXT   = ['', 'text-rose-400', 'text-amber-400', 'text-yellow-400', 'text-emerald-400']

function PasswordStrength({ value }) {
  const strength = getStrength(value)
  if (!value) return null
  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((n) => (
          <div
            key={n}
            className={`h-0.5 flex-1 rounded-full transition-all duration-300 ${
              n <= strength ? STRENGTH_COLORS[strength] : 'bg-white/[0.07]'
            }`}
          />
        ))}
      </div>
      <p className={`text-[10px] font-bold ${STRENGTH_TEXT[strength]}`}>
        {STRENGTH_LABELS[strength]}
      </p>
    </div>
  )
}

// ── Plan tier card ─────────────────────────────────────────────────────────────
function PlanBadge({ label, highlight }) {
  return (
    <div className={`relative flex-1 py-3 px-3 rounded-xl border text-center cursor-pointer transition-all duration-200 overflow-hidden ${
      highlight
        ? 'bg-rose-500/12 border-rose-500/35 shadow-[0_0_22px_rgba(225,29,72,0.16)]'
        : 'bg-white/[0.02] border-white/[0.07] hover:border-rose-500/20 hover:bg-white/[0.04]'
    }`}>
      {highlight && (
        <div className="absolute inset-0 bg-gradient-to-b from-rose-500/6 to-transparent pointer-events-none" />
      )}
      <p className={`text-[11px] font-black relative z-10 ${highlight ? 'text-rose-300' : 'text-slate-500'}`}>{label}</p>
      {highlight && <p className="text-[9px] text-rose-400/60 font-bold mt-0.5 relative z-10 tracking-widest">POPULAR</p>}
    </div>
  )
}

export default function Signup() {
  const navigate = useNavigate()
  const { login: authLogin } = useAuth()
  const [form, setForm]       = useState({ name: '', email: '', password: '', confirm: '' })
  const [errors, setErrors]   = useState({})
  const [success, setSuccess] = useState('')
  const [showPw, setShowPw]   = useState(false)
  const [showCf, setShowCf]   = useState(false)
  const [loading, setLoading] = useState(false)

  const validate = () => {
    const e = {}
    if (!form.name.trim())
      e.name = 'Name is required'
    if (!form.email.trim())
      e.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = 'Enter a valid email address'
    if (!form.password)
      e.password = 'Password is required'
    else if (form.password.length < 8)
      e.password = 'Must be at least 8 characters'
    else if (!/[A-Za-z]/.test(form.password) || !/\d/.test(form.password))
      e.password = 'Must include at least one letter and one number'
    if (!form.confirm)
      e.confirm = 'Please confirm your password'
    else if (form.confirm !== form.password)
      e.confirm = 'Passwords do not match'
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
      const { data } = await signup({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      })

      if (data?.success !== true || !data?.user) {
        throw new Error(data?.message || 'Invalid authentication response.')
      }

      authLogin(data?.user)

      setSuccess('Account created successfully. Redirecting...')
      setTimeout(() => navigate('/dashboard'), 500)
    } catch (err) {
      setErrors({
        submit: err.message || 'Unable to create your account. Please try again.',
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

  const inputCls = (field, extra = '') =>
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

        {/* Ambient */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute -top-32 -left-24 w-[540px] h-[540px] bg-rose-600/[0.12] rounded-full blur-[110px]" />
          <div className="absolute bottom-0 right-[-10%] w-[420px] h-[420px] bg-red-700/[0.09] rounded-full blur-[90px]" />
          <div className="absolute top-1/2 -translate-y-1/2 left-[30%] w-[300px] h-[300px] bg-rose-500/[0.05] rounded-full blur-[80px]" />
          <div className="absolute inset-0 home-grid opacity-45" />
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
              Your edge starts<br />
              <span className="bg-gradient-to-r from-rose-400 to-red-500 bg-clip-text text-transparent">
                here
              </span>
            </h2>
            <p className="mt-3 text-sm text-slate-500 leading-relaxed max-w-xs">
              Create an account to use backend-backed market data, trading, and portfolio flows.
            </p>
          </div>

          {/* Plan comparison */}
          <div className="space-y-2">
            <p className="text-[10px] text-slate-600 uppercase tracking-[0.14em] font-black">Start free / upgrade through backend plans</p>
            <div className="flex gap-2">
              <PlanBadge label="Free" />
              <PlanBadge label="Pro" highlight />
              <PlanBadge label="Elite" />
            </div>
          </div>

          {/* Trust badges */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: ShieldCheck, text: 'Bank-level encryption' },
              { icon: CheckCircle,  text: 'No credit card required' },
              { icon: CheckCircle,  text: 'Password policy enforced' },
              { icon: ShieldCheck, text: 'Cancel anytime' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2">
                <Icon size={11} className="text-rose-400 shrink-0" />
                <span className="text-[11px] text-slate-500">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stats row */}
        <div className="relative z-10 flex items-center gap-5">
          {[['Live', 'Market quotes'], ['Real', 'Trade writes'], ['Safe', 'Portfolio reads']].map(([val, lbl]) => (
            <div key={lbl}>
              <p className="text-lg font-black text-white">{val}</p>
              <p className="text-[10px] text-slate-600 font-medium">{lbl}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right panel — form ────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 relative overflow-y-auto">

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
              <span className="text-[10px] font-bold text-rose-300 tracking-wider uppercase">Free account</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">Create your account</h1>
            <p className="text-xs text-slate-500 font-medium mt-1">Create your account / no card required</p>
          </motion.div>

          {/* Form */}
          <motion.form variants={fadeUp} onSubmit={handleSubmit} noValidate className="space-y-3.5">

            {/* Name */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5 tracking-wide uppercase">Full Name</label>
              <div className="relative">
                <User size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" />
                <input
                  type="text"
                  value={form.name}
                  onChange={handleChange('name')}
                  placeholder="Your full name"
                  className={inputCls('name', 'pl-10 pr-10')}
                />
                {errors.name    && <AlertCircle  size={13} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-rose-400 pointer-events-none" />}
                {isValid('name') && <CheckCircle size={13} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-400 pointer-events-none" />}
              </div>
              {errors.name && (
                <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-[11px] text-rose-400 mt-1.5 flex items-center gap-1">
                  <AlertCircle size={10} />{errors.name}
                </motion.p>
              )}
            </div>

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
                  className={inputCls('email', 'pl-10 pr-10')}
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
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={handleChange('password')}
                  placeholder="8+ characters, letter and number"
                  className={inputCls('password', 'pl-10 pr-10')}
                />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-300 transition-colors">
                  {showPw ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
              <PasswordStrength value={form.password} />
              {errors.password && (
                <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-[11px] text-rose-400 mt-1.5 flex items-center gap-1">
                  <AlertCircle size={10} />{errors.password}
                </motion.p>
              )}
            </div>

            {/* Confirm */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5 tracking-wide uppercase">Confirm Password</label>
              <div className="relative">
                <Lock size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" />
                <input
                  type={showCf ? 'text' : 'password'}
                  value={form.confirm}
                  onChange={handleChange('confirm')}
                  placeholder="Repeat password"
                  className={inputCls('confirm', 'pl-10 pr-10')}
                />
                <button type="button" onClick={() => setShowCf(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-300 transition-colors">
                  {showCf ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
              {errors.confirm && (
                <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-[11px] text-rose-400 mt-1.5 flex items-center gap-1">
                  <AlertCircle size={10} />{errors.confirm}
                </motion.p>
              )}
            </div>

            {/* Terms */}
            <label className="flex items-start gap-2.5 cursor-pointer select-none pt-0.5">
              <input type="checkbox" className="mt-0.5 w-3.5 h-3.5 rounded accent-rose-600 shrink-0" />
              <span className="text-[11px] text-slate-500 leading-relaxed font-medium">
                I agree to the{' '}
                <button type="button" className="text-rose-400 hover:text-rose-300 transition-colors font-black">Terms of Service</button>
                {' '}and{' '}
                <button type="button" className="text-rose-400 hover:text-rose-300 transition-colors font-black">Privacy Policy</button>
              </span>
            </label>

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
                  Creating account...
                </>
              ) : (
                <>Create Account <ArrowRight size={15} /></>
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
            Already have an account?{' '}
            <Link to="/login" className="text-rose-400 hover:text-rose-300 font-black transition-colors">
              Sign in
            </Link>
          </motion.p>
        </motion.div>
      </div>
    </div>
  )
}
