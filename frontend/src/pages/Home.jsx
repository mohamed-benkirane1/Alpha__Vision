import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, BarChart3, Bot, Brain, Check,
  FlaskConical, LineChart, Shield, TrendingUp, Zap,
} from 'lucide-react'
import { motion, useInView } from 'framer-motion'
import { Badge, Button, Card, LogoMark } from '../components/ui'
import PriceTicker from '../components/ambient/PriceTicker'
import { getPlans } from '../services/paymentService'
import { useAuth } from '../context/useAuth'

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const PUBLIC_NAV = [
  { label: 'Fonctionnalités', href: '#features' },
  { label: 'Comment ça marche', href: '#how' },
  { label: 'Tarifs', href: '#pricing' },
]

const APP_NAV = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Marchés',   to: '/trading'   },
  { label: 'Bot IA',    to: '/bot'       },
  { label: 'Backtest',  to: '/backtesting' },
]

const STATS = [
  { value: '25+',    label: 'Actifs suivis'    },
  { value: '6',      label: 'Stratégies IA'    },
  { value: '<100ms', label: 'Latence signaux'  },
  { value: 'Gratuit', label: 'Pour commencer' },
]

const FEATURES = [
  {
    icon: Brain,
    color: '#e11d48',
    badge: 'Groq · Llama 3.3',
    title: 'Signaux IA temps réel',
    desc: 'BUY/SELL/HOLD générés par Llama 3.3 70B. Données de marché live + actualités financières en contexte. Source et fraîcheur exposées.',
  },
  {
    icon: BarChart3,
    color: '#f59e0b',
    badge: 'Binance · Historique',
    title: 'Backtesting réel',
    desc: 'RSI, MACD, Bollinger Bands, EMA Cross, Stochastique. Données klines Binance réelles — pas de simulation fictive sur données inventées.',
  },
  {
    icon: LineChart,
    color: '#06b6d4',
    badge: '25+ actifs',
    title: 'Portfolio live',
    desc: 'Crypto, actions US, indices, matières premières. Chaque prix expose son provider, sa fraîcheur et sa fiabilité avant valorisation.',
  },
  {
    icon: Shield,
    color: '#10b981',
    badge: 'Paper trading',
    title: 'Exécution validée',
    desc: 'Chaque ordre vérifie la qualité du prix avant d\'exécuter. Fallback, stale et indisponible sont automatiquement rejetés.',
  },
  {
    icon: Bot,
    color: '#8b5cf6',
    badge: '6 stratégies',
    title: 'Bot algorithmique',
    desc: 'Scheduling configurable, décisions en temps réel, historique complet. Paper trading uniquement — vos fonds réels ne sont jamais exposés.',
  },
  {
    icon: FlaskConical,
    color: '#e11d48',
    badge: 'Stop-loss · TP',
    title: 'Lab de stratégies',
    desc: 'Testez n\'importe quelle configuration sur le passé avec stop-loss et take-profit. Courbe d\'équité et statistiques détaillées.',
  },
]

const HOW = [
  {
    step: '01',
    title: 'Créez votre compte',
    desc: 'Inscription en 30 secondes. Ajoutez des fonds de démonstration pour commencer à trader sans risque réel.',
  },
  {
    step: '02',
    title: 'Configurez votre stratégie',
    desc: 'Choisissez un actif, une stratégie parmi 6, et laissez le signal IA analyser le marché pour vous.',
  },
  {
    step: '03',
    title: 'Vérifiez et optimisez',
    desc: 'Chaque signal affiche sa source et sa fiabilité. Backtestez sur le passé avant de valider en live.',
  },
]

const PLAN_COLORS = { free: '#64748b', pro: '#e11d48', elite: '#f59e0b' }

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function FadeUp({ children, delay = 0, className = '' }) {
  const ref    = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

function SectionLabel({ children }) {
  return (
    <div className="flex justify-center mb-5">
      <Badge variant="neutral">{children}</Badge>
    </div>
  )
}

function formatPlanPrice(plan) {
  const price = Number(plan?.price)
  if (!Number.isFinite(price)) return '--'
  if (price <= 0) return 'Gratuit'
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: (plan.currency || 'EUR').toUpperCase(),
  }).format(price / 100)
}

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD MOCKUP — hero right panel
// ─────────────────────────────────────────────────────────────────────────────

function DashboardMockup() {
  return (
    <div className="relative">
      {/* Glow halo */}
      <div className="pointer-events-none absolute -inset-10 bg-rose-600/[0.07] rounded-full blur-3xl" aria-hidden="true" />

      {/* Window */}
      <div className="relative bg-[#070E20] border border-white/[0.10] rounded-2xl overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.55)]">

        {/* Browser chrome */}
        <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/[0.06] bg-white/[0.02]">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-500/50" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500/50" />
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50" />
          <div className="flex-1 max-w-[190px] mx-auto bg-white/[0.04] rounded-md h-5 flex items-center justify-center">
            <span className="text-caption text-white/20 font-mono">alphavision.app/dashboard</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Stat row */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            {[
              { l: 'Portfolio',  v: '$24 891', hi: false },
              { l: 'Profit',     v: '+$1 240', hi: true  },
              { l: 'Win Rate',   v: '68,4 %',  hi: false },
            ].map((s) => (
              <div key={s.l} className="bg-white/[0.04] border border-white/[0.05] rounded-xl p-2.5">
                <p className="text-caption text-white/35 mb-1 font-medium">{s.l}</p>
                <p className={`text-body font-black tabular-nums ${s.hi ? 'text-emerald-400' : 'text-white'}`}>{s.v}</p>
              </div>
            ))}
          </div>

          {/* Chart */}
          <div className="bg-white/[0.025] border border-white/[0.04] rounded-xl p-3 mb-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-caption text-white/30 font-medium">Performance — 30 jours</p>
              <span className="text-caption text-emerald-400 font-bold">+12,4 %</span>
            </div>
            <svg className="w-full h-14" viewBox="0 0 280 52" preserveAspectRatio="none">
              <defs>
                <linearGradient id="mockupChartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#e11d48" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="#e11d48" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d="M0,48 C12,44 22,42 38,36 C54,30 66,33 80,26 C94,19 106,22 120,15 C134,8 148,11 168,7 C188,3 205,6 225,4 C248,2 262,2 280,1"
                fill="none" stroke="#e11d48" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
              />
              <path
                d="M0,48 C12,44 22,42 38,36 C54,30 66,33 80,26 C94,19 106,22 120,15 C134,8 148,11 168,7 C188,3 205,6 225,4 C248,2 262,2 280,1 L280,52 L0,52 Z"
                fill="url(#mockupChartGrad)"
              />
            </svg>
          </div>

          {/* Bottom cards */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-rose-500/[0.08] border border-rose-500/[0.18] rounded-xl p-2.5">
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse shrink-0" />
                <p className="text-caption text-rose-400 font-black tracking-wider uppercase">AI Signal</p>
              </div>
              <p className="text-body font-black text-white mb-0.5">BUY</p>
              <p className="text-caption text-white/35 font-medium">BTC/USDT · 78 % conf.</p>
            </div>
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-2.5">
              <p className="text-caption text-white/30 font-medium mb-1.5">Bot actif</p>
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
                <p className="text-body-sm font-black text-amber-300">RUNNING</p>
              </div>
              <p className="text-caption text-white/30 font-medium">MA Cross · Paper</p>
            </div>
          </div>
        </div>
      </div>

      {/* Floating notification */}
      <motion.div
        animate={{ y: [-5, 5, -5] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -right-5 top-1/3 bg-emerald-500/10 border border-emerald-500/22 rounded-xl px-3 py-2.5 backdrop-blur-lg shadow-lg"
      >
        <div className="flex items-center gap-2">
          <TrendingUp size={14} className="text-emerald-400 shrink-0" />
          <div>
            <p className="text-caption text-white/35 font-medium">Trade exécuté</p>
            <p className="text-body font-black text-emerald-400">+$342</p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// HOME PAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function Home() {
  const { isAuthenticated, loading: authLoading } = useAuth()
  const [scrolled,   setScrolled]   = useState(false)
  const [plans,      setPlans]      = useState([])
  const [planError,  setPlanError]  = useState(null)

  // Navbar glassmorphism on scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Load pricing plans from backend
  useEffect(() => {
    const timer = window.setTimeout(async () => {
      const response = await getPlans()
      if (response.success) {
        setPlans(response.plans)
        setPlanError(null)
      } else {
        setPlanError(response.error || 'Plans non disponibles.')
      }
    }, 0)
    return () => window.clearTimeout(timer)
  }, [])

  return (
    <div className="bg-[#06020c] text-white overflow-x-hidden">

      {/* Ambient orbs — subtils, non distrayants */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-24 right-[8%]  w-[560px] h-[560px] bg-rose-950/[0.22] rounded-full blur-[160px]" />
        <div className="absolute bottom-0   left-[5%]  w-[400px] h-[400px] bg-red-950/[0.16]  rounded-full blur-[130px]" />
      </div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* NAVBAR                                                            */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <header className={`fixed top-0 left-0 right-0 z-50 h-16 transition-all duration-300 ${
        scrolled ? 'backdrop-blur-xl bg-[#06020c]/85 border-b border-white/[0.07]' : ''
      }`}>
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between gap-6">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0 select-none">
            <LogoMark size={28} />
            <div className="leading-none">
              <span className="block text-body-sm font-black tracking-widest text-white">ALPHA</span>
              <span className="block text-caption font-bold tracking-widest text-rose-400 mt-[2px]">VISION</span>
            </div>
          </Link>

          {/* Centre — navigation contextuelle */}
          {!authLoading && (
            <nav className="hidden md:flex items-center gap-6">
              {isAuthenticated
                ? APP_NAV.map((l) => (
                    <Link key={l.to} to={l.to}
                      className="text-body text-white/50 hover:text-white transition-colors font-medium">
                      {l.label}
                    </Link>
                  ))
                : PUBLIC_NAV.map((l) => (
                    <a key={l.href} href={l.href}
                      className="text-body text-white/50 hover:text-white transition-colors font-medium">
                      {l.label}
                    </a>
                  ))
              }
            </nav>
          )}

          {/* CTA droite */}
          <div className="flex items-center gap-2 shrink-0">
            {!authLoading && (
              isAuthenticated ? (
                <Button as={Link} to="/dashboard" size="sm" rightIcon={<ArrowRight size={13} />}>
                  Dashboard
                </Button>
              ) : (
                <>
                  <Button as={Link} to="/login" variant="ghost" size="sm" className="hidden sm:inline-flex">
                    Connexion
                  </Button>
                  <Button as={Link} to="/signup" size="sm">
                    Commencer
                  </Button>
                </>
              )
            )}
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* HERO                                                              */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <section className="min-h-screen flex items-center pt-16 px-6 relative">
        {/* Subtle grid overlay */}
        <div className="pointer-events-none absolute inset-0 home-grid opacity-[0.35]" aria-hidden="true" />

        <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-12 xl:gap-20 items-center py-24">

          {/* ── Left: copy ─────────────────────────────────────────────── */}
          <div className="flex flex-col gap-7 relative z-10">

            {/* Pill badge */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Badge variant="accent" dot>
                Llama 3.3 70B via Groq — Maintenant intégré
              </Badge>
            </motion.div>

            {/* H1 */}
            <motion.h1
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.06 }}
              className="text-display-sm sm:text-display lg:text-display-lg font-black leading-[1.05] tracking-tight"
            >
              Vos stratégies.<br />
              <span className="bg-gradient-to-r from-rose-400 via-red-400 to-rose-300 bg-clip-text text-transparent">
                Vérifiées par l'IA.
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.12 }}
              className="text-ui text-white/55 leading-relaxed max-w-md"
            >
              Alpha Vision combine données de marché live, backtesting sur données réelles
              et signaux IA pour valider chaque décision avant exécution.
              La plateforme qui montre ses sources.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.18 }}
              className="flex items-center gap-3 flex-wrap"
            >
              {isAuthenticated ? (
                <Button as={Link} to="/dashboard" size="lg"
                  rightIcon={<ArrowRight size={16} />} className="font-black">
                  Aller au Dashboard
                </Button>
              ) : (
                <>
                  <Button as={Link} to="/signup" size="lg"
                    rightIcon={<ArrowRight size={16} />}
                    className="font-black hover:-translate-y-0.5 transition-transform">
                    Commencer gratuitement
                  </Button>
                  <Button as={Link} to="/login" variant="secondary" size="lg" className="font-black">
                    Connexion
                  </Button>
                </>
              )}
            </motion.div>

            {/* Social proof */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.28 }}
              className="flex flex-wrap items-center gap-x-5 gap-y-2"
            >
              {[
                'Pas de carte bancaire',
                'Gratuit jusqu\'à 5 trades/jour',
                'Annulation à tout moment',
              ].map((item) => (
                <span key={item} className="flex items-center gap-1.5 text-label text-white/30 font-medium">
                  <Check size={11} className="text-emerald-400 shrink-0" />
                  {item}
                </span>
              ))}
            </motion.div>
          </div>

          {/* ── Right: dashboard mockup ──────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 36, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="hidden lg:block relative z-10"
          >
            <DashboardMockup />
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* PRICE TICKER                                                      */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <PriceTicker />

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* STATS                                                             */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <section className="py-20 px-6 border-y border-white/[0.05]">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map((s, i) => (
              <FadeUp key={s.label} delay={i * 0.07} className="text-center">
                <p className="text-display-sm font-black text-white mb-1.5 tabular-nums">{s.value}</p>
                <p className="text-body text-white/40 font-medium">{s.label}</p>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* FEATURES                                                          */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <section id="features" className="py-28 px-6">
        <div className="max-w-7xl mx-auto">

          <FadeUp className="text-center max-w-2xl mx-auto mb-16">
            <SectionLabel>Fonctionnalités</SectionLabel>
            <h2 className="text-display-sm font-black text-white mb-4 leading-tight">
              Tout ce qu'un trader algorithmique peut demander
            </h2>
            <p className="text-body text-white/45 leading-relaxed">
              Des signaux IA au backtesting historique — Alpha Vision expose la qualité
              de chaque donnée. Pas de boîte noire, pas de simulacre.
            </p>
          </FadeUp>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <FadeUp key={f.title} delay={i * 0.06}>
                <Card hover className="h-full flex flex-col gap-4">
                  {/* Icon + badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: `${f.color}14`, border: `1px solid ${f.color}24` }}
                    >
                      <f.icon size={18} style={{ color: f.color }} />
                    </div>
                    <Badge variant="neutral" size="sm">{f.badge}</Badge>
                  </div>
                  {/* Text */}
                  <div>
                    <h3 className="text-body font-bold text-white mb-2">{f.title}</h3>
                    <p className="text-body-sm text-white/45 leading-relaxed">{f.desc}</p>
                  </div>
                </Card>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* HOW IT WORKS                                                      */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <section id="how" className="py-28 px-6 bg-white/[0.015]">
        <div className="max-w-5xl mx-auto">

          <FadeUp className="text-center max-w-xl mx-auto mb-16">
            <SectionLabel>Comment ça marche</SectionLabel>
            <h2 className="text-display-sm font-black text-white mb-4 leading-tight">
              Opérationnel en 3 étapes
            </h2>
            <p className="text-body text-white/45">
              De l'inscription à votre première stratégie backtestée — moins de 5 minutes.
            </p>
          </FadeUp>

          <div className="grid md:grid-cols-3 gap-10 relative">
            {/* Connector */}
            <div
              className="hidden md:block absolute top-8 h-px bg-gradient-to-r from-transparent via-rose-500/25 to-transparent pointer-events-none"
              style={{ left: 'calc(16.7% + 1rem)', right: 'calc(16.7% + 1rem)' }}
            />

            {HOW.map((step, i) => (
              <FadeUp key={step.step} delay={i * 0.1} className="text-center">
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                    <span className="text-heading font-black text-rose-400 tabular-nums">{step.step}</span>
                  </div>
                </div>
                <h3 className="text-heading-sm font-bold text-white mb-3">{step.title}</h3>
                <p className="text-body text-white/40 leading-relaxed">{step.desc}</p>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* PRICING                                                           */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <section id="pricing" className="py-28 px-6">
        <div className="max-w-5xl mx-auto">

          <FadeUp className="text-center max-w-xl mx-auto mb-16">
            <SectionLabel>Tarifs</SectionLabel>
            <h2 className="text-display-sm font-black text-white mb-4 leading-tight">
              Commencez gratuitement
            </h2>
            <p className="text-body text-white/45">
              Pas de carte bancaire requise. Passez Pro ou Elite quand vous êtes prêt.
            </p>
          </FadeUp>

          {planError && (
            <p className="text-center text-body text-white/35 mb-8">{planError}</p>
          )}

          {plans.length > 0 && (
            <div className="grid md:grid-cols-3 gap-5">
              {plans.map((plan, i) => {
                const isPopular = plan.id === 'pro'
                const color     = PLAN_COLORS[plan.id] || '#64748b'
                const isFree    = Number(plan.price) <= 0

                return (
                  <FadeUp key={plan.id} delay={i * 0.08}>
                    <div className={`relative h-full ${isPopular ? 'md:scale-[1.04] md:z-10' : ''}`}>

                      {isPopular && (
                        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20">
                          <Badge variant="accent">Plus populaire</Badge>
                        </div>
                      )}

                      <Card
                        padding="lg"
                        className={`h-full flex flex-col ${
                          isPopular ? 'border-rose-500/28 bg-rose-500/[0.04]' : ''
                        }`}
                      >
                        {/* Plan header */}
                        <div className="mb-6">
                          <p className="text-heading-sm font-bold text-white mb-2 capitalize">
                            {plan.label || plan.id}
                          </p>
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-display-sm font-black tabular-nums" style={{ color: isFree ? '#64748b' : color }}>
                              {formatPlanPrice(plan)}
                            </span>
                            {!isFree && (
                              <span className="text-body text-white/30 font-medium">/ mois</span>
                            )}
                          </div>
                        </div>

                        {/* Features list */}
                        <ul className="flex-1 space-y-3 mb-7">
                          {(plan.features || []).map((feat) => (
                            <li key={feat} className="flex items-start gap-2.5 text-body text-white/55">
                              <Check size={14} className="mt-0.5 shrink-0" style={{ color }} />
                              {feat}
                            </li>
                          ))}
                        </ul>

                        <Button
                          as={Link}
                          to={isFree ? '/signup' : '/payments'}
                          variant={isPopular ? 'primary' : 'secondary'}
                          className="w-full font-bold"
                        >
                          {isFree ? 'Commencer gratuitement' : `Choisir ${plan.label || plan.id}`}
                        </Button>
                      </Card>
                    </div>
                  </FadeUp>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* FINAL CTA                                                         */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <section className="py-28 px-6 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden="true">
          <div className="w-[600px] h-[300px] bg-rose-600/[0.06] rounded-full blur-[100px]" />
        </div>

        <div className="max-w-3xl mx-auto text-center relative z-10">
          <FadeUp>
            <h2 className="text-display-sm sm:text-display font-black text-white mb-5 leading-[1.06]">
              Prêt à trader avec{' '}
              <span className="bg-gradient-to-r from-rose-400 to-red-400 bg-clip-text text-transparent">
                plus de clarté ?
              </span>
            </h2>
            <p className="text-ui text-white/45 mb-9 max-w-lg mx-auto leading-relaxed">
              Rejoignez Alpha Vision. Backtestez vos stratégies, vérifiez chaque signal
              IA, et tradez avec la confiance que les données vous donnent.
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Button as={Link} to="/signup" size="lg"
                rightIcon={<ArrowRight size={16} />}
                className="font-black hover:-translate-y-0.5 transition-transform">
                Créer un compte gratuit
              </Button>
              <Button as={Link} to="/login" variant="secondary" size="lg" className="font-black">
                Se connecter
              </Button>
            </div>
            <p className="text-label text-white/22 mt-5 font-medium">
              Pas de carte bancaire · Accès immédiat · Gratuit à vie jusqu'à 5 trades/jour
            </p>
          </FadeUp>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* FOOTER                                                            */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <footer className="border-t border-white/[0.05] py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-8">

            {/* Brand */}
            <Link to="/" className="flex items-center gap-2.5 select-none shrink-0">
              <LogoMark size={24} />
              <span className="text-body font-bold text-white/50">Alpha Vision</span>
            </Link>

            {/* Links */}
            <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
              {[
                { label: 'Dashboard',   href: '/dashboard'  },
                { label: 'Trading',     href: '/trading'    },
                { label: 'Bot IA',      href: '/bot'        },
                { label: 'Backtesting', href: '/backtesting'},
                { label: 'Tarifs',      href: '#pricing'    },
                { label: 'Paiements',   href: '/payments'   },
              ].map((l) => (
                <a key={l.href} href={l.href}
                  className="text-body-sm text-white/28 hover:text-white/60 transition-colors font-medium">
                  {l.label}
                </a>
              ))}
            </nav>

            {/* Legal */}
            <p className="text-label text-white/22 font-medium shrink-0">
              © {new Date().getFullYear()} Alpha Vision
            </p>
          </div>
        </div>
      </footer>

    </div>
  )
}
