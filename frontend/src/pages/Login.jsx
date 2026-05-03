import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Zap, Mail, Lock, Eye, EyeOff, ArrowRight, ArrowLeft } from 'lucide-react'

const fadeUp = {
  hidden:  { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}
const stagger = { visible: { transition: { staggerChildren: 0.07 } } }

function Login() {
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
    setTimeout(() => setLoading(false), 700)
  }

  const handleChange = (field) => (ev) => {
    setForm((f) => ({ ...f, [field]: ev.target.value }))
    if (errors[field]) setErrors((e) => { const n = { ...e }; delete n[field]; return n })
  }

  return (
    <div className="min-h-screen bg-[#060D1C] flex flex-col items-center justify-center px-4 relative overflow-hidden">

      {/* Background glow orbs */}
      <div className="pointer-events-none absolute top-[-10%] left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-indigo-600/10 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-5%] right-1/4 w-[400px] h-[400px] bg-violet-600/8 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 left-[10%] w-[300px] h-[300px] bg-blue-600/6 rounded-full blur-3xl" />

      {/* Back link */}
      <div className="w-full max-w-sm mb-6 relative z-10">
        <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-white transition-colors">
          <ArrowLeft size={13} /> Back to home
        </Link>
      </div>

      {/* Card */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={stagger}
        className="relative z-10 w-full max-w-sm bg-slate-900/70 border border-slate-700/60 rounded-2xl p-8 backdrop-blur-xl shadow-[0_0_60px_rgba(99,102,241,0.08)]"
      >
        {/* Glowing logo circle */}
        <motion.div variants={fadeUp} className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-600/30 to-violet-600/20 border border-indigo-500/40 flex items-center justify-center shadow-[0_0_40px_rgba(99,102,241,0.3)]">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.5)]">
                <Zap size={20} className="text-white" />
              </div>
            </div>
            <div className="absolute -inset-1 rounded-full border border-indigo-500/20 blur-sm" />
          </div>
        </motion.div>

        {/* Heading */}
        <motion.div variants={fadeUp} className="text-center mb-7">
          <h1 className="text-2xl font-bold text-white mb-1.5">Welcome Back</h1>
          <p className="text-sm text-slate-400">Login to your account and continue trading</p>
        </motion.div>

        {/* Form */}
        <motion.form variants={fadeUp} onSubmit={handleSubmit} noValidate className="space-y-4">

          {/* Email */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              <input
                type="email"
                value={form.email}
                onChange={handleChange('email')}
                placeholder="Enter your email"
                className={`w-full bg-slate-800/60 border ${errors.email ? 'border-red-500/60' : 'border-slate-700/60'} text-white text-sm rounded-xl pl-10 pr-4 py-2.5 placeholder-slate-600 focus:outline-none focus:border-indigo-500/60 focus:shadow-[0_0_12px_rgba(99,102,241,0.12)] transition-all duration-200`}
              />
            </div>
            {errors.email && <p className="text-xs text-red-400 mt-1.5">{errors.email}</p>}
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Password</label>
            <div className="relative">
              <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={handleChange('password')}
                placeholder="Enter your password"
                className={`w-full bg-slate-800/60 border ${errors.password ? 'border-red-500/60' : 'border-slate-700/60'} text-white text-sm rounded-xl pl-10 pr-10 py-2.5 placeholder-slate-600 focus:outline-none focus:border-indigo-500/60 focus:shadow-[0_0_12px_rgba(99,102,241,0.12)] transition-all duration-200`}
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-red-400 mt-1.5">{errors.password}</p>}
          </div>

          {/* Remember + Forgot */}
          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center gap-2 text-slate-400 cursor-pointer select-none">
              <input type="checkbox" className="w-3.5 h-3.5 rounded accent-indigo-600" />
              Remember me
            </label>
            <button type="button" className="text-indigo-400 hover:text-indigo-300 transition-colors font-medium">
              Forgot password?
            </button>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-1 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-60 text-white text-sm font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(99,102,241,0.3)]"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Logging in…
              </>
            ) : (
              <>Log In <ArrowRight size={15} /></>
            )}
          </button>
        </motion.form>

        {/* Divider */}
        <motion.div variants={fadeUp} className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-slate-700/60" />
          <span className="text-[11px] text-slate-500">or continue with</span>
          <div className="flex-1 h-px bg-slate-700/60" />
        </motion.div>

        {/* Social buttons */}
        <motion.div variants={fadeUp} className="grid grid-cols-3 gap-2.5">
          {[
            { label: 'Google',  letter: 'G', color: 'text-blue-400' },
            { label: 'Apple',   letter: '',  apple: true             },
            { label: 'Discord', letter: 'D', color: 'text-indigo-400' },
          ].map(({ label, letter, color, apple }) => (
            <button
              key={label}
              type="button"
              className="flex items-center justify-center gap-1.5 py-2.5 bg-slate-800/60 border border-slate-700/50 rounded-xl text-xs font-semibold text-slate-300 hover:border-slate-600/70 hover:bg-slate-800 transition-all duration-200"
            >
              {apple ? (
                <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor" className="text-white">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                </svg>
              ) : (
                <span className={`text-xs font-bold ${color}`}>{letter}</span>
              )}
              {label}
            </button>
          ))}
        </motion.div>

        {/* Footer link */}
        <motion.p variants={fadeUp} className="text-xs text-slate-500 text-center mt-6">
          Don't have an account?{' '}
          <Link to="/signup" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
            Sign up
          </Link>
        </motion.p>
      </motion.div>
    </div>
  )
}

export default Login
