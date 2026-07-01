import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { motion } from 'framer-motion'
import MainLayout     from '../components/layout/MainLayout'
import ProtectedRoute from '../components/ProtectedRoute'

// ── Lazy-loaded pages ─────────────────────────────────────────────────────────
const Home           = lazy(() => import('../pages/Home'))
const Login          = lazy(() => import('../pages/Login'))
const Signup         = lazy(() => import('../pages/Signup'))
const ForgotPassword = lazy(() => import('../pages/ForgotPassword'))
const ResetPassword  = lazy(() => import('../pages/ResetPassword'))
const AuthCallback   = lazy(() => import('../pages/AuthCallback'))
const Dashboard      = lazy(() => import('../pages/Dashboard'))
const Portfolio      = lazy(() => import('../pages/Portfolio'))
const News           = lazy(() => import('../pages/News'))
const Chatbot        = lazy(() => import('../pages/Chatbot'))
const Trading        = lazy(() => import('../pages/Trading'))
const Backtesting    = lazy(() => import('../pages/Backtesting'))
const TradingBot     = lazy(() => import('../pages/TradingBot'))
const Settings       = lazy(() => import('../pages/Settings'))
const Payments       = lazy(() => import('../pages/Payments'))
const NotFound       = lazy(() => import('../pages/NotFound'))

// ── Loading fallback ──────────────────────────────────────────────────────────
function AppFallback() {
  return (
    <div className="min-h-screen bg-[#06020c] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <defs>
            <linearGradient id="lgFb" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#e11d48" />
              <stop offset="100%" stopColor="#dc2626" />
            </linearGradient>
          </defs>
          <polygon points="16,3 29,29 3,29" fill="url(#lgFb)" />
          <polygon points="16,10 23,27 9,27" fill="#06020c" />
          <rect x="9" y="20" width="14" height="2.5" fill="url(#lgFb)" />
        </svg>
        <div className="w-5 h-5 border-2 border-rose-500/20 border-t-rose-500/80 rounded-full animate-spin" />
      </div>
    </div>
  )
}

// ── Page entry animation — appliquée sur chaque page publique au montage ──────
// Pas d'exit animation (nécessiterait AnimatePresence + key sur Routes,
// ce qui remonte toute la hiérarchie de routes et casse l'état Dashboard).
function PageWrapper({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {children}
    </motion.div>
  )
}

// ── Routes ────────────────────────────────────────────────────────────────────
// IMPORTANT : PAS de key={location.pathname} sur <Routes>.
// Mettre une key sur Routes force React à démonter/remonter la hiérarchie entière
// (ProtectedRoute → MainLayout → Dashboard) à chaque navigation, ce qui cause
// une page blanche et perte de l'état du dashboard.
function AppRoutes() {
  return (
    <Suspense fallback={<AppFallback />}>
      <Routes>
        {/* ── Pages publiques — animation d'entrée au montage ──────── */}
        <Route path="/"                element={<PageWrapper><Home /></PageWrapper>}           />
        <Route path="/login"           element={<PageWrapper><Login /></PageWrapper>}          />
        <Route path="/signup"          element={<PageWrapper><Signup /></PageWrapper>}         />
        <Route path="/forgot-password" element={<PageWrapper><ForgotPassword /></PageWrapper>} />
        <Route path="/reset-password"  element={<PageWrapper><ResetPassword /></PageWrapper>}  />
        <Route path="/auth/callback"   element={<PageWrapper><AuthCallback /></PageWrapper>}   />

        {/* ── Pages protégées — transition gérée par MainLayout ────── */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/dashboard"   element={<Dashboard />}   />
            <Route path="/portfolio"   element={<Portfolio />}   />
            <Route path="/news"        element={<News />}        />
            <Route path="/chatbot"     element={<Chatbot />}     />
            <Route path="/trading"     element={<Trading />}     />
            <Route path="/backtesting" element={<Backtesting />} />
            <Route path="/bot"         element={<TradingBot />}  />
            <Route path="/payments"    element={<Payments />}    />
            <Route path="/settings"    element={<Settings />}    />
          </Route>
        </Route>

        <Route path="*" element={<PageWrapper><NotFound /></PageWrapper>} />
      </Routes>
    </Suspense>
  )
}

export default AppRoutes
