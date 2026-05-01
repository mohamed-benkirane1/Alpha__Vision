import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Zap, Mail, Lock, Eye, EyeOff, ArrowLeft, TrendingUp, Bot,
} from 'lucide-react'

const fadeUp = {
  hidden:  { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}
const stagger = { visible: { transition: { staggerChildren: 0.07 } } }

const signals = [
  { label: 'BTC/USDT', price: '$67,432', change: '+2.4%' },
  { label: 'ETH/USDT', price: '$3,847',  change: '+1.8%' },
  { label: 'NVDA',     price: '$875.20', change: '+3.1%' },
]

function Login() {
  const [form, setForm]               = useState({ email: '', password: '' })
  const [errors, setErrors]           = useState({})
  const [showPassword, setShowPw]     = useState(false)
  const [loading, setLoading]         = useState(false)

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
    setTimeout(() => setLoading(false), 700)
  }

  const handleChange = (field) => (ev) => {
    setForm((f) => ({ ...f, [field]: ev.target.value }))
    if (errors[field]) setErrors((e) => { const n = { ...e }; delete n[field]; return n })
  }

  return (
    <div className="min-h-screen bg-gray-950 flex">

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
          {/* Logo */}
          <motion.div variants={fadeUp} className="flex items-center gap-2 mb-8">
            <div className="w-7 h-7 rounded-md bg-indigo-600 flex items-center justify-center">
              <Zap size={13} className="text-white" />
            </div>
            <span className="font-bold text-white">Alpha Vision</span>
          </motion.div>

          {/* Heading */}
          <motion.div variants={fadeUp} className="mb-7">
            <h1 className="text-2xl font-bold text-white mb-1.5">Welcome back</h1>
            <p className="text-sm text-gray-400">
              Log in to access your trading dashboard and AI insights.
            </p>
          </motion.div>

          {/* Form */}
          <motion.form variants={fadeUp} onSubmit={handleSubmit} noValidate className="space-y-4">
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
                  className={`w-full bg-gray-900 border ${errors.email ? 'border-red-500/60' : 'border-gray-800'} text-white text-sm rounded-lg pl-10 pr-4 py-2.5 placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors`}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-400 mt-1.5">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Password</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={handleChange('password')}
                  placeholder="••••••••"
                  className={`w-full bg-gray-900 border ${errors.password ? 'border-red-500/60' : 'border-gray-800'} text-white text-sm rounded-lg pl-10 pr-10 py-2.5 placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors`}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-400 mt-1.5">{errors.password}</p>
              )}
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
                  Logging in…
                </>
              ) : 'Login'}
            </button>
          </motion.form>

          <motion.p variants={fadeUp} className="text-xs text-gray-500 text-center mt-6">
            Don't have an account?{' '}
            <Link to="/signup" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
              Sign up
            </Link>
          </motion.p>
        </motion.div>
      </div>

      {/* ── Decorative panel (desktop only) ──────────────────────────────── */}
      <div className="hidden lg:flex w-[460px] relative flex-col justify-center px-12 bg-gray-900/30 border-l border-gray-800/50 overflow-hidden">
        <div className="pointer-events-none absolute top-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-indigo-600/12 rounded-full blur-3xl" />
        <div className="pointer-events-none absolute bottom-1/3 left-1/4 w-56 h-56 bg-violet-600/10 rounded-full blur-3xl" />

        <div className="relative space-y-4">
          <div className="mb-7">
            <span className="text-[11px] text-indigo-400 font-medium bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full">
              Live intelligence
            </span>
            <h2 className="text-xl font-bold text-white mt-3 mb-1">
              Market signals at a glance
            </h2>
            <p className="text-sm text-gray-500">
              Your AI-powered dashboard keeps you ahead of every move.
            </p>
          </div>

          {signals.map((s) => (
            <div
              key={s.label}
              className="flex items-center justify-between bg-gray-900/70 border border-gray-800/60 rounded-xl px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <TrendingUp size={14} className="text-indigo-400" />
                <span className="text-sm font-medium text-white">{s.label}</span>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-white">{s.price}</p>
                <p className="text-xs text-emerald-400">{s.change}</p>
              </div>
            </div>
          ))}

          <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl px-4 py-3.5 flex items-center gap-3 mt-2">
            <Bot size={18} className="text-indigo-400 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-white">AI Signal</p>
              <p className="text-xs text-indigo-400">STRONG BUY — Confidence 87%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
