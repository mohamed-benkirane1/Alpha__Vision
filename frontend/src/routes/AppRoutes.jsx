import { lazy, Suspense } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import MainLayout    from '../components/layout/MainLayout'
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

// ── Page transition variants ──────────────────────────────────────────────────
const pageVariants = {
  initial: {
    opacity: 0,
    y: 12,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: [0.25, 0.1, 0.25, 1] },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.15, ease: [0.25, 0.1, 0.25, 1] },
  },
}

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

// ── Animated wrapper for public pages ─────────────────────────────────────────
function PageWrapper({ children }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {children}
    </motion.div>
  )
}

// ── Routes ────────────────────────────────────────────────────────────────────
function AppRoutes() {
  const location = useLocation()

  return (
    <Suspense fallback={<AppFallback />}>
      {/* AnimatePresence gère les transitions entre pages publiques.
          Les pages protégées ont leur propre transition dans MainLayout. */}
      <AnimatePresence mode="wait" initial={false}>
        <Routes location={location} key={location.pathname}>

          {/* ── Public pages — avec transition de page ─── */}
          <Route path="/"                element={<PageWrapper><Home /></PageWrapper>}           />
          <Route path="/login"           element={<PageWrapper><Login /></PageWrapper>}          />
          <Route path="/signup"          element={<PageWrapper><Signup /></PageWrapper>}         />
          <Route path="/forgot-password" element={<PageWrapper><ForgotPassword /></PageWrapper>} />
          <Route path="/reset-password"  element={<PageWrapper><ResetPassword /></PageWrapper>}  />
          <Route path="/auth/callback"   element={<PageWrapper><AuthCallback /></PageWrapper>}   />

          {/* ── Protected pages — transition gérée dans MainLayout ── */}
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route path="/dashboard"   element={<Dashboard />}   />
              <Route path="/portfolio"   element={<Portfolio />}   />
              <Route path="/news"        element={<News />}        />
              <Route path="/chatbot"     element={<Chatbot />}    />
              <Route path="/trading"     element={<Trading />}    />
              <Route path="/backtesting" element={<Backtesting />}/>
              <Route path="/bot"         element={<TradingBot />} />
              <Route path="/payments"    element={<Payments />}   />
              <Route path="/settings"    element={<Settings />}   />
            </Route>
          </Route>

          <Route path="*" element={<PageWrapper><NotFound /></PageWrapper>} />
        </Routes>
      </AnimatePresence>
    </Suspense>
  )
}

export default AppRoutes
