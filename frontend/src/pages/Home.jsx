import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Play, ArrowRight, TrendingUp, Shield,
  Zap, Brain, BarChart3, Activity, Check, Users,
  Target, Clock, LineChart, Bot, Star, Mail,
} from 'lucide-react'
import { motion, useInView } from 'framer-motion'
import PriceTicker from '../components/ambient/PriceTicker'
import LogoMark from '../components/ui/LogoMark'
import Button from '../components/ui/Button'
import { getPlans } from '../services/paymentService'
import heroBg3D  from '../assets/reference/home-hero-3d-bg.jpg'

// ── Data ──────────────────────────────────────────────────────────────────────
const NAV_LINKS = [
  { label: 'Features',     href: '#features' },
  { label: 'How it Works', href: '#how'      },
  { label: 'Pricing',      href: '#pricing'  },
  { label: 'About',        href: '#about'    },
  { label: 'Contact',      href: '#contact'  },
]

const STATS = [
  { icon: TrendingUp, value: '12+',    label: 'Actifs suivis'     },
  { icon: Target,     value: '99.9%',  label: 'Disponibilité'    },
  { icon: Zap,        value: '<100ms', label: 'Latence signaux'  },
  { icon: Shield,     value: 'SSL',    label: 'Sécurité totale'  },
]

const FEATURES = [
  { icon: Brain,     color: '#e11d48', glow: 'rgba(225,29,72,0.5)',   title: 'AI Signal Engine',       badge: 'Groq / Llama 3.3',  desc: 'Signaux de trading alimentés par Llama 3.3 70B via Groq, combinant données de marché en direct et contexte actualités.' },
  { icon: BarChart3, color: '#f59e0b', glow: 'rgba(245,158,11,0.5)',  title: 'Backtesting',             badge: '6 stratégies',       desc: 'Moteur de backtest avec RSI, MACD, Bollinger Bands, EMA Cross, Stochastique — sur données historiques Binance réelles.' },
  { icon: Activity,  color: '#06b6d4', glow: 'rgba(6,182,212,0.5)',   title: 'Portfolio Live',          badge: 'Temps réel',         desc: 'Valorisation en temps réel avec métadonnées de qualité de prix, alertes de fiabilité et suivi des performances.' },
  { icon: Shield,    color: '#10b981', glow: 'rgba(16,185,129,0.5)',  title: 'Exécution Sécurisée',    badge: 'Paper trading',      desc: 'Simulation d\'ordres avec validation prix — rejette automatiquement les prix fallback, obsolètes ou indisponibles.' },
  { icon: Bot,       color: '#8b5cf6', glow: 'rgba(139,92,246,0.5)', title: 'Trading Bot',             badge: 'Automatisé',         desc: 'Bot de trading algorithmique avec 6 stratégies configurables, exécution paper et historique de décisions.' },
  { icon: LineChart, color: '#e11d48', glow: 'rgba(225,29,72,0.5)',   title: 'Market Intelligence',    badge: '25+ actifs',         desc: 'Suivi de 25+ cryptos, actions, indices et matières premières avec prix live via Binance et Yahoo Finance.' },
]

const HOW = [
  { step: '01', title: 'Create an Account', desc: 'Authenticate through backend auth, add demo cash when needed, and choose supported assets.' },
  { step: '02', title: 'Inspect Backend Data', desc: 'Quotes, portfolio valuation, and provider warnings stay visible before you act.' },
  { step: '03', title: 'Execute and Verify', desc: 'Place BUY/SELL orders through backend trade execution and verify portfolio impact.' },
]

const BENEFITS = [
  'Backend source of truth',
  'Price quality metadata',
  'Crypto trading flow',
  'Supported historical backtests',
  'Bot controller transparency',
  'Portfolio valuation warnings',
  'Stripe and demo funding split',
  'Provider gaps documented',
]

const PLAN_COLORS = { free: '#64748b', pro: '#e11d48', elite: '#f59e0b' }

// ── Helpers ───────────────────────────────────────────────────────────────────
function FadeUp({ children, delay = 0, className = '' }) {
  const ref    = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

function Counter({ end, suffix = '', prefix = '', div = 1, value = null }) {
  const [count, setCount] = useState(0)
  const ref    = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  useEffect(() => {
    if (!inView || end === null) return
    const duration = 1600
    const start    = performance.now()
    const raf = (now) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased    = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(eased * end))
      if (progress < 1) requestAnimationFrame(raf)
    }
    requestAnimationFrame(raf)
  }, [inView, end])

  return (
    <span ref={ref}>
      {value || end === null
        ? value || '24/7'
        : `${prefix}${(count / div).toFixed(div > 1 ? (div >= 100 ? 2 : 1) : 0)}${suffix}`}
    </span>
  )
}

function formatBackendPlanPrice(plan) {
  const price = Number(plan?.price)
  if (!Number.isFinite(price)) return '--'
  if (price <= 0) return 'Free'

  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: (plan.currency || 'eur').toUpperCase(),
  }).format(price / 100)
}

function SectionBadge({ children, color = '#e11d48' }) {
  return (
    <div className="mb-5">
      <span
        className="inline-flex items-center gap-1.5 text-[10px] font-black tracking-widest uppercase px-3 py-1.5 rounded-full"
        style={{ color, background: `${color}18`, border: `1px solid ${color}28` }}
      >
        {children}
      </span>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// HOME PAGE
// ═════════════════════════════════════════════════════════════════════════════
export default function Home() {
  const [pricingPlans, setPricingPlans] = useState([])
  const [pricingError, setPricingError] = useState(null)

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      const response = await getPlans()

      if (response.success) {
        setPricingPlans(response.plans)
        setPricingError(null)
      } else {
        setPricingError(response.error || 'Backend pricing plans unavailable.')
      }
    }, 0)

    return () => window.clearTimeout(timer)
  }, [])

  return (
    <div className="bg-[#06020c] text-white overflow-x-hidden">

        {/* Fixed ambient orbs */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute -top-20 right-[10%] w-[600px] h-[600px] bg-rose-950/20 rounded-full blur-[140px]" />
          <div className="absolute bottom-0  left-[5%]  w-[400px] h-[400px] bg-red-950/15  rounded-full blur-[120px]" />
          <div className="absolute top-1/2 right-[20%] w-[500px] h-[300px] bg-rose-900/8  rounded-full blur-[100px] -translate-y-1/2" />
        </div>

        {/* ── NAVBAR ─────────────────────────────────────────────────────── */}
        <nav className="sticky top-0 z-50 h-14 border-b border-white/[0.07] bg-[#06020c]/85 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 h-full flex items-center justify-between">

            <Link to="/" className="flex items-center gap-2.5 select-none">
              <LogoMark size={32} className="shrink-0" />
              <div className="leading-none">
                <span className="block text-[12px] font-black tracking-[0.18em] text-white">ALPHA</span>
                <span className="block text-[8px]  font-bold  tracking-[0.25em] text-rose-400 mt-[1px]">VISION</span>
              </div>
            </Link>

            <div className="hidden md:flex items-center gap-7">
              {NAV_LINKS.map((l) => (
                <a key={l.label} href={l.href}
                  className="text-[13px] font-medium text-slate-500 hover:text-white transition-colors"
                >
                  {l.label}
                </a>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <Link to="/login" className="text-[12px] font-bold text-slate-400 hover:text-white transition-colors">
                Sign In
              </Link>
              <Button as={Link} to="/signup" size="sm" className="text-[12px] font-black">
                Get Started
              </Button>
            </div>
          </div>
        </nav>

        {/* ── HERO ───────────────────────────────────────────────────────── */}
        <section className="min-h-[calc(100vh-56px)] flex flex-col">
          <div className="flex-1 max-w-7xl mx-auto px-6 sm:px-8 w-full flex items-center">
            <div className="grid lg:grid-cols-2 gap-8 xl:gap-16 items-center w-full py-12 lg:py-6">

              {/* Left: copy */}
              <motion.div
                className="flex flex-col gap-5"
                initial="hidden"
                animate="visible"
                variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
              >
                <motion.div variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } }}>
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-black tracking-widest uppercase text-rose-400 bg-rose-500/10 border border-rose-500/25 px-3 py-1.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
                    AI-Powered Trading Intelligence
                  </span>
                </motion.div>

                <motion.h1
                  className="font-black leading-[1.04] tracking-tight text-[2.8rem] sm:text-[3.3rem] lg:text-[3.8rem] xl:text-[4.2rem]"
                  variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } }}
                >
                  <span className="block text-white">TRADE WITH</span>
                  <span className="block bg-gradient-to-r from-rose-400 via-red-400 to-rose-300 bg-clip-text text-transparent">
                    AI PRECISION
                  </span>
                </motion.h1>

                <motion.p
                  className="text-base font-semibold text-slate-300"
                  variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } }}
                >
                  Analyze. Predict. Execute. Win.
                </motion.p>

                <motion.p
                  className="text-sm text-slate-500 leading-relaxed max-w-[420px] font-medium"
                  variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } }}
                >
                  Alpha Vision combines institutional-grade AI with a beautiful interface — giving
                  every trader an unfair advantage from signal generation to automated execution.
                </motion.p>

                <motion.div
                  className="flex items-center gap-4 pt-1"
                  variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } }}
                >
                  <Button as={Link} to="/signup" size="lg" className="font-black hover:-translate-y-0.5">
                    Start for Free
                  </Button>
                  <button type="button" className="flex items-center gap-2.5 text-sm font-semibold text-slate-400 hover:text-white transition-colors group">
                    <span className="w-9 h-9 rounded-full border border-slate-700/80 group-hover:border-rose-500/50 bg-white/[0.03] flex items-center justify-center transition-all group-hover:bg-rose-500/8">
                      <Play size={9} fill="currentColor" className="ml-0.5 text-slate-400 group-hover:text-rose-400 transition-colors" />
                    </span>
                    Watch Demo
                  </button>
                </motion.div>

                <motion.div
                  className="flex items-center gap-3 pt-1"
                  variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.4, delay: 0.2 } } }}
                >
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={11} className="text-rose-400 fill-rose-400" />
                  ))}
                  <span className="text-xs text-slate-600 font-medium">Trusted by 10,000+ traders</span>
                </motion.div>
              </motion.div>

              {/* Right: AI Neural Core — abstract premium composition */}
              <div className="relative flex items-center justify-center lg:justify-end">

                {/* 3D background */}
                <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
                  <img src={heroBg3D} alt="" loading="lazy" decoding="async"
                    className="absolute inset-0 w-full h-full object-cover object-center opacity-[0.55] lg:opacity-[0.88]" />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#06020c] via-[#06020c]/55 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#06020c]/75 via-transparent to-transparent" />
                  <div className="absolute inset-0 bg-[#06020c]/18" />
                </div>

                {/* Neural Core composition */}
                <div className="relative z-10 w-full max-w-[480px] lg:max-w-[540px] xl:max-w-[580px] flex items-center justify-center">

                  {/* Ambient glow blobs */}
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden="true">
                    <div className="w-[360px] h-[360px] bg-rose-500/[0.08] rounded-full blur-[80px] ai-core-breath" />
                  </div>
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden="true">
                    <div className="w-[200px] h-[200px] bg-red-600/[0.13] rounded-full blur-[45px] ai-core-breath"
                      style={{ animationDelay: '1.4s' }} />
                  </div>

                  {/* SVG Neural Core */}
                  <svg viewBox="0 0 500 500" className="w-full h-auto ai-core-float" aria-hidden="true"
                    style={{ maxHeight: '500px', overflow: 'visible' }}>
                    <defs>
                      <filter id="glow8" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="8" result="b"/>
                        <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
                      </filter>
                      <filter id="glow4" x="-40%" y="-40%" width="180%" height="180%">
                        <feGaussianBlur stdDeviation="4" result="b"/>
                        <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
                      </filter>
                      <filter id="glow18" x="-80%" y="-80%" width="260%" height="260%">
                        <feGaussianBlur stdDeviation="18"/>
                      </filter>
                      <radialGradient id="coreGrad" cx="50%" cy="50%" r="50%">
                        <stop offset="0%"   stopColor="#ff2255" stopOpacity="0.65"/>
                        <stop offset="40%"  stopColor="#e11d48" stopOpacity="0.22"/>
                        <stop offset="100%" stopColor="#e11d48" stopOpacity="0"/>
                      </radialGradient>
                    </defs>

                    {/* Perspective grid */}
                    <g opacity="0.10">
                      {[402, 418, 432, 444, 454].map((y, i) => {
                        const w = 36 + i * 44
                        return <line key={y} x1={250 - w} y1={y} x2={250 + w} y2={y} stroke="#e11d48" strokeWidth="0.5"/>
                      })}
                      {[-4,-3,-2,-1,0,1,2,3,4].map((n) => (
                        <line key={n} x1={250 + n * 9} y1={402} x2={250 + n * 58} y2={455}
                          stroke="#e11d48" strokeWidth="0.5"/>
                      ))}
                    </g>

                    {/* Outer orbital ring */}
                    <g className="ai-ring-pulse">
                      <ellipse cx="250" cy="250" rx="205" ry="66"
                        fill="none" stroke="#e11d48" strokeWidth="0.7" opacity="0.28"
                        strokeDasharray="10 7">
                        <animateTransform attributeName="transform" type="rotate"
                          from="0 250 250" to="360 250 250" dur="24s" repeatCount="indefinite"/>
                      </ellipse>
                    </g>

                    {/* Middle ring */}
                    <ellipse cx="250" cy="250" rx="148" ry="50"
                      fill="none" stroke="#dc2626" strokeWidth="0.5" opacity="0.22">
                      <animateTransform attributeName="transform" type="rotate"
                        from="28 250 250" to="-332 250 250" dur="32s" repeatCount="indefinite"/>
                    </ellipse>

                    {/* Inner ring */}
                    <g filter="url(#glow4)">
                      <ellipse cx="250" cy="250" rx="84" ry="30"
                        fill="none" stroke="#ff3355" strokeWidth="1.0" opacity="0.52">
                        <animateTransform attributeName="transform" type="rotate"
                          from="52 250 250" to="412 250 250" dur="15s" repeatCount="indefinite"/>
                      </ellipse>
                    </g>

                    {/* Outer hexagon */}
                    <polygon points="250,178 312,214 312,286 250,322 188,286 188,214"
                      fill="rgba(225,29,72,0.035)" stroke="rgba(225,29,72,0.16)" strokeWidth="0.8"
                      filter="url(#glow4)" />

                    {/* Inner diamond */}
                    <polygon points="250,210 286,250 250,290 214,250"
                      fill="rgba(225,29,72,0.055)" stroke="rgba(225,29,72,0.30)" strokeWidth="0.9"
                      filter="url(#glow4)" />

                    {/* Rotated square */}
                    <rect x="228" y="228" width="44" height="44"
                      fill="rgba(225,29,72,0.04)" stroke="rgba(225,29,72,0.20)" strokeWidth="0.7"
                      transform="rotate(45, 250, 250)" filter="url(#glow4)" />

                    {/* Radial filaments */}
                    {Array.from({ length: 12 }, (_, i) => {
                      const angle = (i * 30) * Math.PI / 180
                      const r1 = 44, r2 = 158 + (i % 3) * 16
                      return (
                        <line key={i}
                          x1={250 + r1 * Math.cos(angle)} y1={250 + r1 * Math.sin(angle)}
                          x2={250 + r2 * Math.cos(angle)} y2={250 + r2 * Math.sin(angle)}
                          stroke="#e11d48"
                          strokeWidth={i % 4 === 0 ? '0.65' : '0.28'}
                          opacity={i % 4 === 0 ? 0.26 : 0.12} />
                      )
                    })}

                    {/* Central energy sphere */}
                    <circle cx="250" cy="250" r="60" fill="url(#coreGrad)" filter="url(#glow18)"/>
                    <circle cx="250" cy="250" r="30"
                      fill="rgba(225,29,72,0.14)" stroke="rgba(225,29,72,0.68)" strokeWidth="1.2"
                      filter="url(#glow8)"/>
                    <circle cx="250" cy="250" r="15" fill="rgba(255,42,72,0.60)" filter="url(#glow4)"/>
                    <circle cx="250" cy="250" r="5.5" fill="rgba(255,165,180,0.95)" filter="url(#glow4)"/>
                    <circle cx="244" cy="243" r="2.5" fill="rgba(255,255,255,0.55)"/>

                    {/* Glass shards */}
                    <polygon points="342,110 366,96 372,122 352,130"
                      fill="rgba(225,29,72,0.05)" stroke="rgba(225,29,72,0.24)" strokeWidth="0.8"/>
                    <polygon points="98,312 120,300 126,324 106,332"
                      fill="rgba(225,29,72,0.04)" stroke="rgba(225,29,72,0.19)" strokeWidth="0.7"/>
                    <polygon points="138,142 160,132 163,156 144,160"
                      fill="rgba(200,20,50,0.04)" stroke="rgba(200,20,50,0.17)" strokeWidth="0.6"/>
                    <polygon points="390,232 408,221 413,246 396,251"
                      fill="rgba(225,29,72,0.05)" stroke="rgba(225,29,72,0.22)" strokeWidth="0.7"/>
                    <polygon points="258,76 278,65 281,84 263,88"
                      fill="rgba(225,29,72,0.04)" stroke="rgba(225,29,72,0.17)" strokeWidth="0.6"/>

                    {/* Data nodes */}
                    {[
                      { x: 346, y: 113, r: 2.0, d: '0s'   },
                      { x: 146, y: 170, r: 1.6, d: '0.7s' },
                      { x: 393, y: 306, r: 1.8, d: '1.4s' },
                      { x: 102, y: 326, r: 1.5, d: '0.3s' },
                      { x: 264, y:  80, r: 1.8, d: '1.1s' },
                      { x: 160, y: 416, r: 1.4, d: '1.8s' },
                      { x: 418, y: 180, r: 1.6, d: '0.9s' },
                    ].map((n, i) => (
                      <g key={i}>
                        <circle cx={n.x} cy={n.y} r={n.r * 2.8}
                          fill="#e11d48" opacity="0.10" filter="url(#glow18)"/>
                        <circle cx={n.x} cy={n.y} r={n.r}
                          fill="#ff4466" className="ai-data-blink"
                          style={{ animationDelay: n.d }}/>
                      </g>
                    ))}

                    {/* Filaments: nodes → core */}
                    {[
                      { x: 346, y: 113 }, { x: 146, y: 170 },
                      { x: 393, y: 306 }, { x: 102, y: 326 },
                      { x: 264, y:  80 },
                    ].map((n, i) => {
                      const dx = n.x - 250, dy = n.y - 250
                      const dist = Math.sqrt(dx * dx + dy * dy)
                      const edgeR = 120
                      return (
                        <line key={i}
                          x1={n.x} y1={n.y}
                          x2={250 + (dx / dist) * edgeR}
                          y2={250 + (dy / dist) * edgeR}
                          stroke="#e11d48" strokeWidth="0.35" opacity="0.14"/>
                      )
                    })}

                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Price ticker */}
          <div className="shrink-0 border-t border-white/[0.06] bg-[#06020c]/70 backdrop-blur-xl">
            <PriceTicker />
          </div>

          {/* Stats strip */}
          <div className="shrink-0 border-t border-white/[0.06] bg-[#040108]/85 backdrop-blur-xl">
            <div className="max-w-7xl mx-auto px-6 sm:px-8">
              <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-white/[0.06]">
                {STATS.map(({ icon: Icon, label, end, suffix, prefix, div, value }) => (
                  <div key={label} className="flex items-center gap-3 px-5 xl:px-8 py-5">
                    <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
                      <Icon size={13} className="text-rose-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[19px] font-black text-white leading-none tabular-nums">
                        <Counter end={end} suffix={suffix} prefix={prefix} div={div} value={value} />
                      </p>
                      <p className="text-[11px] text-slate-600 mt-[3px] font-medium truncate">{label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── FEATURES ───────────────────────────────────────────────────── */}
        <section id="features" className="relative py-24 px-6 sm:px-8">
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-rose-950/15 rounded-full blur-[120px]" />
          </div>

          <div className="max-w-7xl mx-auto relative z-10">
            <FadeUp className="text-center mb-14">
              <SectionBadge><Zap size={10} /> Everything you need</SectionBadge>
              <h2 className="text-4xl font-black text-white tracking-tight mb-4">
                Powerful Features,<br />
                <span className="bg-gradient-to-r from-rose-400 to-red-400 bg-clip-text text-transparent">
                  Zero Compromise
                </span>
              </h2>
              <p className="text-slate-500 text-sm font-medium max-w-md mx-auto leading-relaxed">
                Built around current backend flows while advanced signal and automation providers are integrated.
              </p>
            </FadeUp>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {FEATURES.map((f, i) => (
                <FadeUp key={f.title} delay={i * 0.08}>
                  <motion.div
                    whileHover={{ y: -4, borderColor: `${f.color}40` }}
                    className="group relative bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6 backdrop-blur-xl shadow-[0_4px_28px_rgba(0,0,0,0.32)] hover:shadow-[0_8px_40px_rgba(0,0,0,0.40)] transition-all duration-300 h-full overflow-hidden"
                  >
                    <div className="absolute top-0 left-6 right-6 h-px opacity-40 group-hover:opacity-80 transition-opacity duration-300 pointer-events-none"
                      style={{ background: `linear-gradient(90deg, transparent, ${f.color}, transparent)` }} />
                    <div className="absolute top-0 inset-x-0 h-20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                      style={{ background: `radial-gradient(ellipse at 50% 0%, ${f.glow.replace('0.5)', '0.10)')}, transparent 70%)` }} />
                    <div className="relative z-10">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                        style={{ background: `${f.color}18`, border: `1px solid ${f.color}30`, boxShadow: `0 0 20px ${f.glow.replace('0.5)', '0.30)')}` }}>
                        <f.icon size={18} style={{ color: f.color }} />
                      </div>
                      <span className="inline-block text-[10px] font-black px-2 py-0.5 rounded-full mb-3"
                        style={{ background: `${f.color}14`, border: `1px solid ${f.color}28`, color: f.color }}>
                        {f.badge}
                      </span>
                      <h3 className="text-sm font-black text-white mb-2">{f.title}</h3>
                      <p className="text-xs text-slate-500 leading-relaxed font-medium">{f.desc}</p>
                    </div>
                  </motion.div>
                </FadeUp>
              ))}
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ───────────────────────────────────────────────── */}
        <section id="how" className="relative py-24 px-6 sm:px-8">
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
            <div className="absolute bottom-0 left-1/4 w-[500px] h-[350px] bg-rose-950/12 rounded-full blur-[100px]" />
          </div>

          <div className="max-w-7xl mx-auto relative z-10">
            <FadeUp className="text-center mb-16">
              <SectionBadge color="#f59e0b"><TrendingUp size={10} /> Simple by design</SectionBadge>
              <h2 className="text-4xl font-black text-white tracking-tight mb-4">How It Works</h2>
              <p className="text-slate-500 text-sm font-medium max-w-sm mx-auto leading-relaxed">
                From authenticated setup to backend-verified trading flow.
              </p>
            </FadeUp>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
              {/* Desktop connector */}
              <div className="hidden md:block absolute top-8 left-[calc(16.67%+32px)] right-[calc(16.67%+32px)] h-px bg-gradient-to-r from-rose-500/30 via-rose-500/60 to-rose-500/30" />

              {HOW.map((item, i) => (
                <FadeUp key={item.step} delay={i * 0.12}>
                  <div className="flex flex-col items-center md:items-start text-center md:text-left gap-4">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-black shrink-0"
                      style={{ background: 'rgba(225,29,72,0.10)', border: '1px solid rgba(225,29,72,0.28)', color: '#e11d48', boxShadow: '0 0 24px rgba(225,29,72,0.14)' }}>
                      {item.step}
                    </div>
                    <div>
                      <h3 className="text-base font-black text-white mb-2">{item.title}</h3>
                      <p className="text-sm text-slate-500 leading-relaxed font-medium">{item.desc}</p>
                    </div>
                  </div>
                </FadeUp>
              ))}
            </div>
          </div>
        </section>

        {/* ── DASHBOARD PREVIEW ──────────────────────────────────────────── */}
        <section className="relative py-24 px-6 sm:px-8">
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
            <div className="absolute top-1/2 right-0 w-[600px] h-[400px] bg-rose-950/10 rounded-full blur-[120px] -translate-y-1/2" />
          </div>

          <div className="max-w-7xl mx-auto relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 xl:gap-20 items-center">

              <FadeUp>
                <SectionBadge color="#06b6d4"><Activity size={10} /> Live preview</SectionBadge>
                <h2 className="text-4xl font-black text-white tracking-tight mb-5 leading-tight">
                  Your Trading<br />
                  <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                    Command Center
                  </span>
                </h2>
                <p className="text-sm text-slate-400 leading-relaxed font-medium mb-6">
                  Backend-backed market quotes, trade writes, portfolio valuation, and provider status in one
                  clean, focused interface.
                </p>
                <div className="space-y-3 mb-8">
                  {['Backend market quote metadata', 'Portfolio valuation quality flags', 'Trading execution metadata', 'Provider-backed news visibility'].map((item) => (
                    <div key={item} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-rose-500/15 border border-rose-500/28 flex items-center justify-center shrink-0">
                        <Check size={10} className="text-rose-400" />
                      </div>
                      <span className="text-sm text-slate-400 font-medium">{item}</span>
                    </div>
                  ))}
                </div>
                <Link to="/dashboard"
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-black text-white bg-rose-600/15 hover:bg-rose-600/25 border border-rose-500/30 rounded-xl transition-all">
                  View Dashboard <ArrowRight size={14} />
                </Link>
              </FadeUp>

              {/* Dashboard product preview */}
              <FadeUp delay={0.15} className="relative">
                <div className="absolute -inset-4 bg-rose-500/5 rounded-3xl blur-2xl" />
                <div className="relative bg-[#0d0212]/90 border border-white/[0.08] rounded-2xl overflow-hidden shadow-[0_0_80px_rgba(225,29,72,0.07)] backdrop-blur-xl">

                  {/* Browser chrome */}
                  <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06] bg-white/[0.02]">
                    <span className="w-3 h-3 rounded-full bg-rose-500/70" />
                    <span className="w-3 h-3 rounded-full bg-yellow-500/60" />
                    <span className="w-3 h-3 rounded-full bg-emerald-500/60" />
                    <div className="flex-1 mx-4">
                      <div className="h-5 bg-white/[0.04] border border-white/[0.06] rounded-md flex items-center px-3">
                        <span className="text-[10px] text-slate-600 font-mono">alphavision.app/dashboard</span>
                      </div>
                    </div>
                    <span className="text-[10px] text-rose-400 font-black bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full">PREVIEW</span>
                  </div>

                  <div className="p-4">
                    {/* Mini stat cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                      {[
                        { label: 'Market quotes', val: 'Backend', sub: 'metadata', color: '#10b981' },
                        { label: 'Trade writes', val: 'Real', sub: 'executed', color: '#10b981' },
                        { label: 'AI signals', val: 'Provider', sub: 'pending', color: '#e11d48' },
                        { label: 'Bot engine', val: 'Backend', sub: 'pending', color: '#e11d48' },
                      ].map((s) => (
                        <div key={s.label} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
                          <p className="text-[9px] text-slate-600 font-medium mb-1 truncate">{s.label}</p>
                          <p className="text-sm font-black text-white">{s.val}</p>
                          <span className="text-[9px] font-bold" style={{ color: s.color }}>{s.sub}</span>
                        </div>
                      ))}
                    </div>

                    {/* Mini chart */}
                    <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-3 mb-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-white">Portfolio Performance</span>
                        <span className="text-[10px] text-amber-400 font-black">Snapshots pending</span>
                      </div>
                      <svg viewBox="0 0 400 72" className="w-full" style={{ height: 72 }}>
                        <defs>
                          <linearGradient id="cFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#e11d48" stopOpacity="0.28" />
                            <stop offset="100%" stopColor="#e11d48" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        <path d="M0,64 C30,62 55,55 85,49 C115,43 140,36 170,30 C200,24 225,18 255,14 C285,10 315,7 345,5 C365,3 385,2 400,1"
                          fill="none" stroke="#e11d48" strokeWidth="2"
                          style={{ filter: 'drop-shadow(0 0 4px rgba(225,29,72,0.6))' }} />
                        <path d="M0,64 C30,62 55,55 85,49 C115,43 140,36 170,30 C200,24 225,18 255,14 C285,10 315,7 345,5 C365,3 385,2 400,1 L400,72 L0,72 Z"
                          fill="url(#cFill)" />
                      </svg>
                    </div>

                    {/* Signal row */}
                    <div className="flex items-center justify-between px-3 py-2.5 bg-rose-500/[0.06] border border-rose-500/20 rounded-xl">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
                        <span className="text-xs font-black text-white">AI signal endpoint</span>
                        <span className="text-[10px] font-black text-rose-400 bg-rose-500/15 px-1.5 py-0.5 rounded">PENDING</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-medium">
                        Provider: <span className="text-rose-400 font-black">required</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Floating signal card */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.6 }}
                  className="signal-card absolute -right-4 bottom-20 bg-[#0d0212]/95 border border-rose-500/25 rounded-xl p-3 backdrop-blur-xl hidden sm:block"
                >
                  <p className="text-[9px] text-slate-600 font-medium mb-1">Latest signal</p>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-black text-white">ETH / USDT</span>
                  </div>
                  <span className="text-[10px] font-black text-emerald-400">BUY — 74% conf.</span>
                </motion.div>
              </FadeUp>
            </div>
          </div>
        </section>

        {/* ── BENEFITS (id=about) ────────────────────────────────────────── */}
        <section id="about" className="relative py-24 px-6 sm:px-8">
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
            <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-rose-950/10 rounded-full blur-[100px] -translate-y-1/2" />
          </div>

          <div className="max-w-7xl mx-auto relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 xl:gap-20 items-center">
              <FadeUp>
                <SectionBadge><Shield size={10} /> Built to perform</SectionBadge>
                <h2 className="text-4xl font-black text-white tracking-tight mb-5 leading-tight">
                  Every Advantage,<br />
                  <span className="bg-gradient-to-r from-rose-400 to-red-400 bg-clip-text text-transparent">
                    All in One Place
                  </span>
                </h2>
                <p className="text-sm text-slate-400 leading-relaxed font-medium mb-8">
                  Alpha Vision was built from the ground up to remove every barrier between you
                  and profitable trading — no complexity, no compromise, no nonsense.
                </p>
                <Button as={Link} to="/signup" size="lg" rightIcon={<ArrowRight size={14} />} className="font-black">
                  Get Started Free
                </Button>
              </FadeUp>

              <FadeUp delay={0.12}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {BENEFITS.map((item, i) => (
                    <motion.div
                      key={item}
                      initial={{ opacity: 0, x: -8 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.08 + i * 0.06 }}
                      whileHover={{ x: 2, backgroundColor: 'rgba(255,255,255,0.04)' }}
                      className="flex items-center gap-3 px-4 py-3 bg-white/[0.025] border border-white/[0.06] hover:border-rose-500/15 rounded-xl transition-colors duration-200 cursor-default"
                    >
                      <div className="w-5 h-5 rounded-full bg-rose-500/15 border border-rose-500/28 flex items-center justify-center shrink-0">
                        <Check size={10} className="text-rose-400" />
                      </div>
                      <span className="text-sm text-slate-300 font-medium">{item}</span>
                    </motion.div>
                  ))}
                </div>
              </FadeUp>
            </div>
          </div>
        </section>

        {/* ── PRICING ────────────────────────────────────────────────────── */}
        <section id="pricing" className="relative py-24 px-6 sm:px-8">
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
            <div className="absolute bottom-0 right-1/4 w-[500px] h-[350px] bg-rose-950/12 rounded-full blur-[100px]" />
          </div>

          <div className="max-w-7xl mx-auto relative z-10">
            <FadeUp className="text-center mb-14">
              <SectionBadge color="#f59e0b"><Star size={10} /> Simple pricing</SectionBadge>
              <h2 className="text-4xl font-black text-white tracking-tight mb-4">Choose Your Plan</h2>
              <p className="text-slate-500 text-sm font-medium max-w-md mx-auto leading-relaxed">
                Start free, upgrade when you're ready. No hidden fees, no lock-in.
              </p>
            </FadeUp>

            {pricingError && (
              <div className="mb-5 rounded-2xl border border-amber-500/20 bg-amber-500/8 px-4 py-3 text-center text-xs font-semibold text-amber-300">
                {pricingError} No local pricing fallback is shown.
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
              {pricingPlans.map((plan, i) => {
                const featured = plan.id === 'pro'
                const color = PLAN_COLORS[plan.id] || '#64748b'

                return (
                <FadeUp key={plan.id} delay={i * 0.1}>
                  <motion.div
                    whileHover={{ y: featured ? -6 : -4 }}
                    className={`relative flex flex-col rounded-2xl p-6 backdrop-blur-xl h-full transition-all duration-300 overflow-hidden ${
                      featured
                        ? 'border-2 shadow-[0_0_60px_rgba(225,29,72,0.24),0_4px_28px_rgba(0,0,0,0.40)]'
                        : 'bg-white/[0.03] border border-white/[0.07] shadow-[0_4px_28px_rgba(0,0,0,0.32)]'
                    }`}
                    style={featured ? { background: 'rgba(225,29,72,0.07)', borderColor: 'rgba(225,29,72,0.45)' } : {}}
                  >
                    {featured && (
                      <div className="absolute top-0 inset-x-0 h-32 pointer-events-none"
                        style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(225,29,72,0.16), transparent 70%)' }} />
                    )}
                    {featured && (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-[10px] font-black tracking-widest uppercase text-white bg-gradient-to-r from-rose-600 to-red-700 px-4 py-1 rounded-full shadow-[0_0_20px_rgba(225,29,72,0.50)] z-10">
                        Most Popular
                      </div>
                    )}

                    <div className="mb-5">
                      <p className="text-[11px] font-black tracking-widest uppercase mb-2" style={{ color }}>
                        {plan.label || plan.id}
                      </p>
                      <div className="flex items-end gap-1.5">
                        <span className="text-4xl font-black text-white">{formatBackendPlanPrice(plan)}</span>
                        <span className="text-xs text-slate-600 font-medium mb-1.5">{Number(plan.price) > 0 ? '30 days' : 'backend plan'}</span>
                      </div>
                    </div>

                    <ul className="space-y-2.5 flex-1 mb-6">
                      {(plan.features || []).map((feat) => (
                        <li key={feat} className="flex items-center gap-2.5 text-xs text-slate-400 font-medium">
                          <Check size={12} style={{ color }} className="shrink-0" />
                          {feat}
                        </li>
                      ))}
                    </ul>

                    <Link to="/signup"
                      className={`ripple-btn w-full py-2.5 rounded-xl text-sm font-black text-center transition-all flex items-center justify-center gap-1.5 ${
                        featured
                          ? 'bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white shadow-[0_0_18px_rgba(225,29,72,0.3)]'
                          : 'bg-white/[0.05] border border-white/[0.10] text-slate-300 hover:bg-white/[0.09] hover:text-white'
                      }`}
                    >
                      Get started <ArrowRight size={13} />
                    </Link>
                  </motion.div>
                </FadeUp>
                )
              })}
              {!pricingError && pricingPlans.length === 0 && (
                <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-6 text-center text-sm font-bold text-slate-500 md:col-span-3">
                  Loading backend plans...
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── CONTACT ────────────────────────────────────────────────────── */}
        <section id="contact" className="relative py-24 px-6 sm:px-8">
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[450px] bg-rose-950/12 rounded-full blur-[130px]" />
          </div>
          <div className="max-w-7xl mx-auto relative z-10">
            <FadeUp className="text-center mb-14">
              <SectionBadge><Mail size={10} /> Get in touch</SectionBadge>
              <h2 className="text-4xl font-black text-white tracking-tight mb-4">
                Have Questions?<br />
                <span className="bg-gradient-to-r from-rose-400 to-red-400 bg-clip-text text-transparent">
                  We&apos;re Here to Help
                </span>
              </h2>
              <p className="text-slate-500 text-sm font-medium max-w-md mx-auto leading-relaxed">
                The support form still needs a real delivery endpoint before contact messages can be sent.
              </p>
            </FadeUp>
            <FadeUp delay={0.1}>
              <div className="max-w-xl mx-auto bg-[#0a0d16]/80 border border-white/[0.08] rounded-2xl p-8 backdrop-blur-2xl shadow-[0_8px_60px_rgba(0,0,0,0.50),0_0_0_1px_rgba(225,29,72,0.04)]">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1.5 tracking-wide uppercase">Name</label>
                      <input type="text" placeholder="Your name"
                        className="w-full bg-[#06020c]/70 border border-white/[0.09] text-white text-sm rounded-xl px-4 py-2.5 placeholder-slate-700 focus:outline-none focus:border-rose-500/50 focus:shadow-[0_0_16px_rgba(225,29,72,0.14)] transition-all duration-200" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1.5 tracking-wide uppercase">Email</label>
                      <input type="email" placeholder="your@email.com"
                        className="w-full bg-[#06020c]/70 border border-white/[0.09] text-white text-sm rounded-xl px-4 py-2.5 placeholder-slate-700 focus:outline-none focus:border-rose-500/50 focus:shadow-[0_0_16px_rgba(225,29,72,0.14)] transition-all duration-200" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1.5 tracking-wide uppercase">Message</label>
                    <textarea rows={4} placeholder="Tell us how we can help…"
                      className="w-full bg-[#06020c]/70 border border-white/[0.09] text-white text-sm rounded-xl px-4 py-2.5 placeholder-slate-700 focus:outline-none focus:border-rose-500/50 focus:shadow-[0_0_16px_rgba(225,29,72,0.14)] transition-all duration-200 resize-none" />
                  </div>
                  <motion.button
                    type="button"
                    disabled
                    className="ripple-btn w-full py-3 bg-gradient-to-r from-rose-600 to-red-700 disabled:cursor-not-allowed disabled:opacity-55 text-white text-sm font-black rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-[0_0_22px_rgba(225,29,72,0.28)]"
                  >
                    Contact delivery pending <ArrowRight size={15} />
                  </motion.button>
                </div>
              </div>
            </FadeUp>
          </div>
        </section>

        {/* ── FINAL CTA ──────────────────────────────────────────────────── */}
        <section className="relative py-28 px-6 sm:px-8">
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-rose-950/8 to-transparent" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-rose-900/14 rounded-full blur-[130px]" />
          </div>

          <div className="max-w-3xl mx-auto text-center relative z-10">
            <FadeUp>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-black tracking-widest uppercase text-rose-400 bg-rose-500/10 border border-rose-500/25 px-3 py-1.5 rounded-full mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
                Start Today — It's Free
              </span>
              <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-5 leading-[1.06]">
                Ready to Trade<br />
                <span className="bg-gradient-to-r from-rose-400 via-red-400 to-rose-300 bg-clip-text text-transparent">
                  Like a Machine?
                </span>
              </h2>
              <p className="text-slate-400 text-sm font-medium leading-relaxed mb-8 max-w-md mx-auto">
                Use the real auth, quote, trade, portfolio, news, and payment flows now while the remaining providers are integrated.
              </p>
              <div className="flex items-center justify-center gap-4 flex-wrap">
                <Button as={Link} to="/signup" size="lg" className="px-8 font-black hover:-translate-y-0.5">
                  Create Free Account
                </Button>
                <Button as={Link} to="/login" variant="secondary" size="lg" className="px-8 font-black">
                  Sign In
                </Button>
              </div>
            </FadeUp>
          </div>
        </section>

        {/* ── FOOTER ─────────────────────────────────────────────────────── */}
        <footer className="border-t border-white/[0.06] bg-[#03010a]/85 backdrop-blur-xl py-8 px-6 sm:px-8">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <Link to="/" className="flex items-center gap-2.5 select-none">
              <LogoMark size={32} className="shrink-0" />
              <div className="leading-none">
                <span className="block text-[12px] font-black tracking-[0.18em] text-white">ALPHA</span>
                <span className="block text-[8px] font-bold tracking-[0.25em] text-rose-400 mt-[1px]">VISION</span>
              </div>
            </Link>
            <p className="text-[11px] text-slate-700 font-medium">© 2025 Alpha Vision · All rights reserved</p>
            <div className="flex items-center gap-5">
              {['Privacy', 'Terms', 'Docs'].map((l) => (
                <a key={l} href="#" className="text-[11px] text-slate-600 hover:text-white transition-colors font-medium">{l}</a>
              ))}
            </div>
          </div>
        </footer>

    </div>
  )
}
