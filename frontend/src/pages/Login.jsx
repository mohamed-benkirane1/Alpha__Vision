import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react'
import { useAuth } from '../context/useAuth'
import { login as loginRequest, startGoogleOAuth } from '../services/authService'
import { LogoMark, Card, Button } from '../components/ui'

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
      e.email = 'Email requis'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = 'Email invalide'
    if (!form.password)
      e.password = 'Mot de passe requis'
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
      setSuccess('Connexion réussie. Redirection...')
      setTimeout(() => navigate(redirectTo, { replace: true }), 500)
    } catch (err) {
      setErrors({ submit: err.message || 'Impossible de se connecter.' })
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
    `w-full h-11 px-4 rounded-xl text-body text-white placeholder:text-white/30
     focus:outline-none transition-all duration-200
     ${errors[field]
        ? 'bg-rose-500/5 border border-rose-500/40 focus:border-rose-500/60 focus:bg-rose-500/8'
        : isValid(field)
        ? 'bg-emerald-500/5 border border-emerald-500/30 focus:border-emerald-500/50 focus:bg-emerald-500/8'
        : 'bg-white/[0.04] border border-white/[0.08] focus:border-app-accent/50 focus:bg-white/[0.06]'
     } ${extra}`

  return (
    <div className="min-h-screen bg-[#06020c] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-rose-600/[0.08] rounded-full blur-[120px]" />
        <div className="absolute bottom-[-5%] right-[10%] w-[400px] h-[400px] bg-red-700/[0.05] rounded-full blur-[100px]" />
        <div className="absolute inset-0 home-grid opacity-25" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-5">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shadow-[0_0_28px_rgba(225,29,72,0.18)]">
              <LogoMark size={32} />
            </div>
          </div>
          <h1 className="text-heading font-bold text-white mb-1">Bon retour</h1>
          <p className="text-body text-white/40">Connectez-vous à Alpha Vision</p>
        </div>

        {/* Form card */}
        <Card padding="lg">
          <form onSubmit={handleSubmit} noValidate className="space-y-4">

            {/* Email */}
            <div>
              <label className="text-label uppercase tracking-wide text-white/50 mb-1.5 block">
                Email
              </label>
              <div className="relative">
                <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                <input
                  type="email"
                  value={form.email}
                  onChange={handleChange('email')}
                  placeholder="vous@exemple.com"
                  className={inputClass('email', 'pl-10 pr-10')}
                  autoComplete="email"
                />
                {errors.email     && <AlertCircle  size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-rose-400 pointer-events-none" />}
                {isValid('email') && <CheckCircle  size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-400 pointer-events-none" />}
              </div>
              {errors.email && (
                <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                  className="text-label text-rose-400 mt-1.5 flex items-center gap-1">
                  <AlertCircle size={10} />{errors.email}
                </motion.p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-label uppercase tracking-wide text-white/50">
                  Mot de passe
                </label>
                <Link to="/forgot-password" className="text-label text-rose-400 hover:text-rose-300 transition-colors font-medium">
                  Oublié ?
                </Link>
              </div>
              <div className="relative">
                <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={handleChange('password')}
                  placeholder="••••••••"
                  className={inputClass('password', 'pl-10 pr-10')}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {errors.password && (
                <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                  className="text-label text-rose-400 mt-1.5 flex items-center gap-1">
                  <AlertCircle size={10} />{errors.password}
                </motion.p>
              )}
            </div>

            {/* Feedback */}
            {(errors.submit || success) && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className={`text-label flex items-center gap-1.5 font-medium ${
                  success ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {success ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
                {success || errors.submit}
              </motion.p>
            )}

            {/* Submit */}
            <Button
              type="submit"
              size="lg"
              loading={loading}
              rightIcon={<ArrowRight size={15} />}
              className="w-full font-bold"
            >
              {loading ? 'Connexion…' : 'Se connecter'}
            </Button>

            {/* Divider */}
            <div className="flex items-center gap-3 my-1">
              <div className="flex-1 h-px bg-white/[0.06]" />
              <span className="text-caption text-white/25 uppercase tracking-widest">ou</span>
              <div className="flex-1 h-px bg-white/[0.06]" />
            </div>

            {/* Google OAuth */}
            <motion.button
              type="button"
              onClick={startGoogleOAuth}
              whileHover={{ backgroundColor: 'rgba(255,255,255,0.06)' }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center justify-center gap-2.5 w-full h-11 bg-white/[0.03] border border-white/[0.08] rounded-xl text-body font-medium text-white/60 hover:text-white transition-all duration-200"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continuer avec Google
            </motion.button>
          </form>
        </Card>

        {/* Footer */}
        <p className="text-center text-body-sm text-white/35 mt-6">
          Pas encore de compte ?{' '}
          <Link to="/signup" className="text-rose-400 hover:text-rose-300 font-medium transition-colors">
            Créer un compte
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
