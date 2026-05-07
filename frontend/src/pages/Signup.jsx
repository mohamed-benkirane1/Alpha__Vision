import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { User, Mail, Lock, Eye, EyeOff, ArrowRight, ArrowLeft, CheckCircle, AlertCircle, Sparkles } from 'lucide-react'
import ParticleBackground from '../components/ambient/ParticleBackground'

const fadeUp  = { hidden: { opacity: 0, y: 18 }, visible: { opacity: 1, y: 0, transition: { duration: 0.42, ease: [0.16, 1, 0.3, 1] } } }
const stagger = { visible: { transition: { staggerChildren: 0.07 } } }

export default function Signup() {
  const [form, setForm]          = useState({ name: '', email: '', password: '', confirm: '' })
  const [errors, setErrors]      = useState({})
  const [showPw, setShowPw]      = useState(false)
  const [showCf, setShowCf]      = useState(false)
  const [loading, setLoading]    = useState(false)

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
    `w-full bg-[#060D1C]/80 border ${
      errors[field]
        ? 'border-rose-500/50 focus:border-rose-500/70 focus:shadow-[0_0_12px_rgba(244,63,94,0.12)]'
        : isValid(field)
        ? 'border-emerald-500/40 focus:border-emerald-500/60 focus:shadow-[0_0_12px_rgba(16,185,129,0.12)]'
        : 'border-white/[0.09] focus:border-violet-500/60 focus:shadow-[0_0_14px_rgba(139,92,246,0.14)]'
    } text-white text-sm rounded-xl py-2.5 placeholder-slate-700 focus:outline-none transition-all duration-200 ${extra}`

  function Field({ name, type = 'text', label, placeholder, icon: Icon, show, onToggle, children }) {
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
            className={inputCls(name, show !== undefined ? 'pl-10 pr-10' : 'pl-10 pr-10')}
          />
          {onToggle && (
            <button type="button" onClick={onToggle}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-300 transition-colors">
              {show ? <EyeOff size={13} /> : <Eye size={13} />}
            </button>
          )}
          {!onToggle && errors[name]   && <AlertCircle  size={13} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-rose-400 pointer-events-none" />}
          {!onToggle && isValid(name) && <CheckCircle size={13} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-400 pointer-events-none" />}
        </div>
        {errors[name] && (
          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
            className="text-[11px] text-rose-400 mt-1.5 flex items-center gap-1">
            <AlertCircle size={10} />{errors[name]}
          </motion.p>
        )}
        {children}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#060D1C] flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden">

      <ParticleBackground count={45} opacity={0.5} className="absolute inset-0" />

      {/* Ambient orbs */}
      <div className="pointer-events-none absolute top-[-8%] left-1/2 -translate-x-1/2 w-[600px] h-[500px] bg-violet-600/[0.08] rounded-full blur-[100px]" />
      <div className="pointer-events-none absolute bottom-[-4%] left-1/4 w-[360px] h-[360px] bg-indigo-600/[0.06] rounded-full blur-[80px]" />

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
        className="relative z-10 w-full max-w-sm bg-[#0a1628]/88 border border-white/[0.08] rounded-2xl p-8 backdrop-blur-2xl shadow-[0_8px_60px_rgba(0,0,0,0.55),0_0_0_1px_rgba(139,92,246,0.06)]"
      >
        {/* Logo circle */}
        <motion.div variants={fadeUp} className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute -inset-3 rounded-full bg-violet-500/8 blur-xl" />
            <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600/20 to-indigo-600/10 border border-violet-500/30 flex items-center justify-center shadow-[0_0_32px_rgba(139,92,246,0.25)]">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-[0_0_18px_rgba(139,92,246,0.5)]">
                <Sparkles size={17} className="text-white" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Heading */}
        <motion.div variants={fadeUp} className="text-center mb-7">
          <h1 className="text-[1.4rem] font-black text-white mb-1.5 tracking-tight">Create Account</h1>
          <p className="text-xs text-slate-500 font-medium">Join Alpha Vision and start your journey</p>
        </motion.div>

        {/* Form */}
        <motion.form variants={fadeUp} onSubmit={handleSubmit} noValidate className="space-y-3.5">

          <Field name="name"     label="Full Name"        placeholder="Your full name"    icon={User} />
          <Field name="email"    label="Email Address"    placeholder="your@email.com"    icon={Mail} type="email" />
          <Field name="password" label="Password"         placeholder="Min. 8 characters" icon={Lock} type="password" show={showPw}  onToggle={() => setShowPw(v => !v)} />
          <Field name="confirm"  label="Confirm Password" placeholder="Repeat password"   icon={Lock} type="password" show={showCf}  onToggle={() => setShowCf(v => !v)} />

          {/* Terms */}
          <label className="flex items-start gap-2.5 cursor-pointer select-none pt-0.5">
            <input type="checkbox" className="mt-0.5 w-3.5 h-3.5 rounded accent-violet-600 shrink-0" />
            <span className="text-[11px] text-slate-500 leading-relaxed font-medium">
              I agree to the{' '}
              <button type="button" className="text-violet-400 hover:text-violet-300 transition-colors font-black">Terms of Service</button>
              {' '}and{' '}
              <button type="button" className="text-violet-400 hover:text-violet-300 transition-colors font-black">Privacy Policy</button>
            </span>
          </label>

          {/* Submit */}
          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: loading ? 1 : 1.01, boxShadow: '0 0 28px rgba(139,92,246,0.45)' }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
            className="ripple-btn w-full mt-1 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 disabled:opacity-55 text-white text-sm font-black rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-[0_0_22px_rgba(139,92,246,0.30)]"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating account…
              </>
            ) : (
              <>Sign Up <ArrowRight size={15} /></>
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
          <Link to="/login" className="text-violet-400 hover:text-violet-300 font-black transition-colors">
            Log in
          </Link>
        </motion.p>
      </motion.div>
    </div>
  )
}
