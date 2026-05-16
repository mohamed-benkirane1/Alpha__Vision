import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { User, Mail, Lock, Eye, EyeOff, ArrowRight, CheckCircle, AlertCircle, ShieldCheck } from 'lucide-react'

const fadeUp  = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } } }
const stagger = { visible: { transition: { staggerChildren: 0.07 } } }

// ── Inline LogoMark ────────────────────────────────────────────────────────────
function LogoMark({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 34 34" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="lgSignup" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#e11d48" />
          <stop offset="100%" stopColor="#dc2626" />
        </linearGradient>
      </defs>
      <polygon points="17,2 32,31 2,31" fill="url(#lgSignup)" />
      <polygon points="17,10 26,29 8,29" fill="#06020c" />
      <rect x="10" y="21" width="14" height="2.5" fill="url(#lgSignup)" />
    </svg>
  )
}

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
  const [form, setForm]       = useState({ name: '', email: '', password: '', confirm: '' })
  const [errors, setErrors]   = useState({})
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
    if (!form.confirm)
      e.confirm = 'Please confirm your password'
    else if (form.confirm !== form.password)
      e.confirm = 'Passwords do not match'
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
              Join thousands of traders using AI-powered signals and professional-grade analytics to stay ahead.
            </p>
          </div>

          {/* Plan comparison */}
          <div className="space-y-2">
            <p className="text-[10px] text-slate-600 uppercase tracking-[0.14em] font-black">Start free · Upgrade anytime</p>
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
              { icon: CheckCircle,  text: '14-day free trial' },
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
          {[['12k+', 'Traders'], ['94%', 'Accuracy'], ['$2.4B', 'Volume']].map(([val, lbl]) => (
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
              <span className="text-[10px] font-bold text-rose-300 tracking-wider uppercase">Free 14-day trial</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">Create your account</h1>
            <p className="text-xs text-slate-500 font-medium mt-1">Start your 14-day free trial — no card required</p>
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
                  placeholder="Min. 8 characters"
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
                  Creating account…
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
