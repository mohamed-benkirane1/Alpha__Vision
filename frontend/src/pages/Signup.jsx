import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { User, Mail, Lock, Eye, EyeOff, ArrowRight, CheckCircle, AlertCircle, Sparkles, TrendingUp, ShieldCheck, Zap, BarChart2 } from 'lucide-react'
import ParticleBackground from '../components/ambient/ParticleBackground'

const fadeUp  = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } } }
const stagger = { visible: { transition: { staggerChildren: 0.08 } } }

const BENEFITS = [
  { icon: TrendingUp,  title: 'AI-Powered Signals',   desc: 'Real-time market intelligence at your fingertips' },
  { icon: BarChart2,   title: 'Portfolio Analytics',   desc: 'Deep-dive performance insights and reports' },
  { icon: ShieldCheck, title: 'Risk Guard',             desc: 'Automated risk scoring and position limits' },
  { icon: Sparkles,    title: 'No-Code Bot Builder',   desc: 'Deploy trading bots without writing a single line' },
]

const PW_CHECKS = [
  { label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { label: 'Uppercase letter',       test: (p) => /[A-Z]/.test(p) },
  { label: 'Number',                 test: (p) => /[0-9]/.test(p) },
  { label: 'Special character',      test: (p) => /[^A-Za-z0-9]/.test(p) },
]

const STRENGTH_LABEL = ['', 'Weak', 'Fair', 'Good', 'Strong']
const STRENGTH_COLOR = [
  '',
  'bg-rose-500',
  'bg-orange-500',
  'bg-amber-400',
  'bg-emerald-500',
]
const STRENGTH_TEXT = [
  '',
  'text-rose-400',
  'text-orange-400',
  'text-amber-400',
  'text-emerald-400',
]

function PasswordStrength({ password }) {
  if (!password) return null
  const score = PW_CHECKS.filter((c) => c.test(password)).length
  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= score ? STRENGTH_COLOR[score] : 'bg-white/[0.08]'}`}
          />
        ))}
      </div>
      {score > 0 && (
        <p className={`text-[10px] font-bold ${STRENGTH_TEXT[score]}`}>
          {STRENGTH_LABEL[score]}
          {score < 4 && <span className="text-slate-600 font-medium"> — add {PW_CHECKS.find((c) => !c.test(password))?.label.toLowerCase()} to strengthen</span>}
        </p>
      )}
    </div>
  )
}

function LogoMark({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <defs>
        <linearGradient id="lgSg" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#e11d48" />
          <stop offset="100%" stopColor="#dc2626" />
        </linearGradient>
      </defs>
      <polygon points="20,4 36,34 4,34" fill="url(#lgSg)" />
      <polygon points="20,12 30,30 10,30" fill="#06020c" />
      <rect x="14" y="30" width="12" height="3" rx="1.5" fill="url(#lgSg)" />
    </svg>
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
    `w-full bg-[#0a0114]/70 border ${
      errors[field]
        ? 'border-rose-500/50 focus:border-rose-500/70 focus:shadow-[0_0_14px_rgba(225,29,72,0.16)]'
        : isValid(field)
        ? 'border-emerald-500/40 focus:border-emerald-500/60 focus:shadow-[0_0_14px_rgba(16,185,129,0.14)]'
        : 'border-white/[0.09] focus:border-rose-500/50 focus:shadow-[0_0_14px_rgba(225,29,72,0.14)]'
    } text-white text-sm rounded-xl py-2.5 placeholder-slate-700 focus:outline-none transition-all duration-200 ${extra}`

  function Field({ name, type = 'text', label, placeholder, icon: Icon, show, onToggle }) {
    return (
      <div>
        <label className="block text-[11px] font-bold text-slate-500 mb-1.5 tracking-wide uppercase">{label}</label>
        <div className="relative">
          <Icon size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" />
          <input
            type={show !== undefined ? (show ? 'text' : type) : type}
            value={form[name]}
            onChange={handleChange(name)}
            placeholder={placeholder}
            className={inputCls(name, 'pl-10 pr-10')}
          />
          {onToggle ? (
            <button type="button" onClick={onToggle}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-300 transition-colors">
              {show ? <EyeOff size={13} /> : <Eye size={13} />}
            </button>
          ) : (
            <>
              {errors[name]    && <AlertCircle  size={13} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-rose-400 pointer-events-none" />}
              {isValid(name) && <CheckCircle size={13} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-400 pointer-events-none" />}
            </>
          )}
        </div>
        {errors[name] && (
          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
            className="text-[11px] text-rose-400 mt-1.5 flex items-center gap-1">
            <AlertCircle size={10} />{errors[name]}
          </motion.p>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#06020c] grid lg:grid-cols-2 relative overflow-hidden">

      {/* ── LEFT BRANDING PANEL ─────────────────────────────────────────────── */}
      <div className="hidden lg:flex flex-col justify-between bg-[#04010a] relative overflow-hidden px-12 py-10">

        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-[-10%] left-[-5%] w-[520px] h-[520px] bg-rose-600/[0.09] rounded-full blur-[120px]" />
          <div className="absolute bottom-[-8%] right-[-8%] w-[400px] h-[400px] bg-red-800/[0.07] rounded-full blur-[100px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-rose-900/[0.05] rounded-full blur-[80px]" />
        </div>

        <div className="pointer-events-none absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: 'linear-gradient(rgba(225,29,72,0.9) 1px, transparent 1px), linear-gradient(90deg, rgba(225,29,72,0.9) 1px, transparent 1px)',
            backgroundSize: '56px 56px',
          }}
        />

        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/3 w-px h-full bg-gradient-to-b from-transparent via-rose-500/[0.08] to-transparent" />
          <div className="absolute top-0 right-1/4 w-px h-full bg-gradient-to-b from-transparent via-rose-500/[0.05] to-transparent" />
          <div className="absolute top-2/3 left-0 w-full h-px bg-gradient-to-r from-transparent via-rose-500/[0.06] to-transparent" />
        </div>

        <div className="absolute inset-[1px] rounded-r-3xl border-r border-white/[0.04] pointer-events-none" />

        {/* Logo */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
          className="relative z-10 flex items-center gap-3">
          <LogoMark size={36} />
          <span className="text-white text-lg font-black tracking-tight">Alpha<span className="text-rose-400">Vision</span></span>
        </motion.div>

        {/* Headline + benefits */}
        <motion.div
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
          className="relative z-10 space-y-8"
        >
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-black px-3 py-1.5 rounded-full tracking-widest uppercase">
              <Sparkles size={9} /> Join 18,000+ traders
            </div>
            <h2 className="text-4xl font-black text-white leading-[1.15] tracking-tight">
              Your edge starts<br />
              <span className="bg-gradient-to-r from-rose-400 to-red-500 bg-clip-text text-transparent">
                here.
              </span>
            </h2>
            <p className="text-slate-500 text-sm leading-relaxed max-w-xs font-medium">
              Create your free account and access the same tools used by professional algorithmic traders worldwide.
            </p>
          </div>

          <div className="space-y-4">
            {BENEFITS.map(({ icon: Icon, title, desc }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.35 + i * 0.08 }}
                className="flex items-start gap-3.5"
              >
                <div className="mt-0.5 w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
                  <Icon size={14} className="text-rose-400" />
                </div>
                <div>
                  <p className="text-white text-xs font-bold mb-0.5">{title}</p>
                  <p className="text-slate-600 text-[11px] font-medium leading-relaxed">{desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Stat strip */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
          className="relative z-10 grid grid-cols-3 gap-3"
        >
          {[['Free', 'To get started'], ['2 min', 'Setup time'], ['No CC', 'Required']].map(([val, label]) => (
            <div key={label} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 text-center">
              <p className="text-rose-400 text-base font-black">{val}</p>
              <p className="text-slate-600 text-[10px] font-medium mt-0.5">{label}</p>
            </div>
          ))}
        </motion.div>
      </div>

      {/* ── RIGHT FORM PANEL ────────────────────────────────────────────────── */}
      <div className="relative flex flex-col items-center justify-center px-5 py-10 overflow-hidden">

        <ParticleBackground count={35} opacity={0.45} className="absolute inset-0" />

        <div className="pointer-events-none absolute top-[-6%] right-[-4%] w-[400px] h-[400px] bg-rose-700/[0.07] rounded-full blur-[100px]" />
        <div className="pointer-events-none absolute bottom-[-4%] left-[-4%] w-[300px] h-[300px] bg-red-900/[0.06] rounded-full blur-[80px]" />

        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2.5 mb-8 relative z-10">
          <LogoMark size={28} />
          <span className="text-white text-base font-black tracking-tight">Alpha<span className="text-rose-400">Vision</span></span>
        </div>

        {/* Card */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="relative z-10 w-full max-w-sm bg-[#0a0114]/80 border border-white/[0.08] rounded-2xl p-8 backdrop-blur-2xl shadow-[0_8px_60px_rgba(0,0,0,0.6),0_0_0_1px_rgba(225,29,72,0.06)]"
        >
          {/* Heading */}
          <motion.div variants={fadeUp} className="mb-6">
            <h1 className="text-[1.4rem] font-black text-white mb-1.5 tracking-tight">Create Account</h1>
            <p className="text-xs text-slate-500 font-medium">Start your journey with AlphaVision</p>
          </motion.div>

          {/* Form */}
          <motion.form variants={fadeUp} onSubmit={handleSubmit} noValidate className="space-y-3.5">

            <Field name="name"     label="Full Name"        placeholder="Your full name"    icon={User} />
            <Field name="email"    label="Email Address"    placeholder="your@email.com"    icon={Mail} type="email" />

            {/* Password with strength */}
            <div>
              <Field name="password" label="Password" placeholder="Min. 8 characters" icon={Lock} type="password" show={showPw} onToggle={() => setShowPw(v => !v)} />
              <PasswordStrength password={form.password} />
            </div>

            <Field name="confirm"  label="Confirm Password" placeholder="Repeat password"   icon={Lock} type="password" show={showCf} onToggle={() => setShowCf(v => !v)} />

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
              whileHover={{ scale: loading ? 1 : 1.01, boxShadow: '0 0 28px rgba(225,29,72,0.45)' }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              className="ripple-btn w-full mt-1 py-3 bg-gradient-to-r from-rose-600 to-red-700 disabled:opacity-55 text-white text-sm font-black rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-[0_0_22px_rgba(225,29,72,0.30)]"
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
              { label: 'Google', icon: (
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              )},
              { label: 'Apple', icon: (
                <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor" className="text-white">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                </svg>
              )},
              { label: 'Discord', icon: (
                <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor" className="text-indigo-400">
                  <path d="M20.317 4.492c-1.53-.69-3.17-1.2-4.885-1.49a.075.075 0 0 0-.079.036c-.21.369-.444.85-.608 1.23a18.566 18.566 0 0 0-5.487 0 12.36 12.36 0 0 0-.617-1.23A.077.077 0 0 0 8.562 3c-1.714.29-3.354.8-4.885 1.491a.07.07 0 0 0-.032.027C.533 9.093-.32 13.555.099 17.961a.08.08 0 0 0 .031.055 20.03 20.03 0 0 0 5.993 2.98.078.078 0 0 0 .084-.026c.462-.62.874-1.275 1.226-1.963a.074.074 0 0 0-.041-.104 13.201 13.201 0 0 1-1.872-.878.075.075 0 0 1-.008-.125c.126-.093.252-.19.372-.287a.075.075 0 0 1 .078-.01c3.927 1.764 8.18 1.764 12.061 0a.075.075 0 0 1 .079.009c.12.098.245.195.372.288a.075.075 0 0 1-.006.125c-.598.344-1.22.635-1.873.877a.075.075 0 0 0-.041.105c.36.687.772 1.341 1.225 1.962a.077.077 0 0 0 .084.028 19.963 19.963 0 0 0 6.002-2.981.076.076 0 0 0 .032-.054c.5-5.094-.838-9.52-3.549-13.442a.06.06 0 0 0-.031-.028z"/>
                </svg>
              )},
            ].map(({ label, icon }) => (
              <motion.button
                key={label}
                type="button"
                whileHover={{ y: -1, backgroundColor: 'rgba(255,255,255,0.05)' }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center justify-center gap-1.5 py-2.5 bg-white/[0.03] border border-white/[0.07] rounded-xl text-xs font-bold text-slate-400 transition-all duration-200"
              >
                {icon}
                {label}
              </motion.button>
            ))}
          </motion.div>

          {/* Footer link */}
          <motion.p variants={fadeUp} className="text-[11px] text-slate-600 text-center mt-6 font-medium">
            Already have an account?{' '}
            <Link to="/login" className="text-rose-400 hover:text-rose-300 font-black transition-colors">
              Log in
            </Link>
          </motion.p>
        </motion.div>
      </div>
    </div>
  )
}
