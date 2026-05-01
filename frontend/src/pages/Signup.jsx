import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Zap, User, Mail, Lock, Eye, EyeOff, ArrowLeft, CheckCircle2,
} from 'lucide-react'

const fadeUp = {
  hidden:  { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}
const stagger = { visible: { transition: { staggerChildren: 0.07 } } }

const perks = [
  'Real-time crypto, stocks & indices',
  'AI-powered trade signals',
  'Portfolio tracker & analytics',
  'Paper trading bot & backtesting',
]

function Signup() {
  const [form, setForm]           = useState({ name: '', email: '', password: '', confirm: '' })
  const [errors, setErrors]       = useState({})
  const [showPw, setShowPw]       = useState(false)
  const [showConfirm, setShowCf]  = useState(false)
  const [loading, setLoading]     = useState(false)

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
      e.password = 'Password must be at least 8 characters'
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
    setTimeout(() => setLoading(false), 700)
  }

  const handleChange = (field) => (ev) => {
    setForm((f) => ({ ...f, [field]: ev.target.value }))
    if (errors[field]) setErrors((e) => { const n = { ...e }; delete n[field]; return n })
  }

  const inputClass = (field) =>
    `w-full bg-gray-900 border ${errors[field] ? 'border-red-500/60' : 'border-gray-800'} text-white text-sm rounded-lg py-2.5 placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors`

  return (
    <div className="min-h-screen bg-gray-950 flex">

      {/* ── Decorative panel (desktop only) ──────────────────────────────── */}
      <div className="hidden lg:flex w-[420px] relative flex-col justify-center px-12 bg-gray-900/30 border-r border-gray-800/50 overflow-hidden">
        <div className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 w-72 h-72 bg-violet-600/12 rounded-full blur-3xl" />
        <div className="pointer-events-none absolute bottom-1/4 left-1/3 w-56 h-56 bg-indigo-600/10 rounded-full blur-3xl" />

        <div className="relative">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-7 h-7 rounded-md bg-indigo-600 flex items-center justify-center">
              <Zap size={13} className="text-white" />
            </div>
            <span className="font-bold text-white">Alpha Vision</span>
          </div>

          <h2 className="text-xl font-bold text-white mb-2">
            Start trading smarter today
          </h2>
          <p className="text-sm text-gray-500 mb-8">
            Everything you need to analyze markets and manage your portfolio.
          </p>

          <ul className="space-y-3">
            {perks.map((p) => (
              <li key={p} className="flex items-center gap-3">
                <CheckCircle2 size={14} className="text-indigo-400 shrink-0" />
                <span className="text-sm text-gray-300">{p}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ── Form side ────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12">
        <div className="w-full max-w-sm mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-white transition-colors"
          >
            <ArrowLeft size={13} /> Back to home
          </Link>
        </div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="w-full max-w-sm"
        >
          {/* Mobile logo */}
          <motion.div variants={fadeUp} className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-7 h-7 rounded-md bg-indigo-600 flex items-center justify-center">
              <Zap size={13} className="text-white" />
            </div>
            <span className="font-bold text-white">Alpha Vision</span>
          </motion.div>

          {/* Heading */}
          <motion.div variants={fadeUp} className="mb-7">
            <h1 className="text-2xl font-bold text-white mb-1.5">Create your account</h1>
            <p className="text-sm text-gray-400">
              Join Alpha Vision and trade with AI-powered intelligence.
            </p>
          </motion.div>

          {/* Form */}
          <motion.form variants={fadeUp} onSubmit={handleSubmit} noValidate className="space-y-4">

            {/* Name */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Full name</label>
              <div className="relative">
                <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                <input
                  type="text"
                  value={form.name}
                  onChange={handleChange('name')}
                  placeholder="John Doe"
                  className={`${inputClass('name')} pl-10 pr-4`}
                />
              </div>
              {errors.name && <p className="text-xs text-red-400 mt-1.5">{errors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Email</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                <input
                  type="email"
                  value={form.email}
                  onChange={handleChange('email')}
                  placeholder="you@example.com"
                  className={`${inputClass('email')} pl-10 pr-4`}
                />
              </div>
              {errors.email && <p className="text-xs text-red-400 mt-1.5">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Password</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                <input
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={handleChange('password')}
                  placeholder="Min. 8 characters"
                  className={`${inputClass('password')} pl-10 pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-400 mt-1.5">{errors.password}</p>}
            </div>

            {/* Confirm password */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Confirm password</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={form.confirm}
                  onChange={handleChange('confirm')}
                  placeholder="••••••••"
                  className={`${inputClass('confirm')} pl-10 pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowCf((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {errors.confirm && <p className="text-xs text-red-400 mt-1.5">{errors.confirm}</p>}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account…
                </>
              ) : 'Create account'}
            </button>
          </motion.form>

          <motion.p variants={fadeUp} className="text-xs text-gray-500 text-center mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
              Login
            </Link>
          </motion.p>
        </motion.div>
      </div>
    </div>
  )
}

export default Signup
