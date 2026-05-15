import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ChevronRight, Play, ArrowRight, TrendingUp, Shield,
  Zap, Brain, BarChart3, Activity, Check, Users,
  Target, Clock, LineChart, Bot, Star, FlaskConical,
} from 'lucide-react'
import { motion, useInView } from 'framer-motion'
import PriceTicker from '../components/ambient/PriceTicker'
// heroImage supprimé — composition 3D abstraite remplace le taureau
import heroBg3D  from '../assets/reference/home-hero-3d-bg.jpg'

// ── Data ──────────────────────────────────────────────────────────────────────
const NAV_LINKS = [
  { label: 'Features',     href: '#features' },
  { label: 'How it Works', href: '#how'      },
  { label: 'Pricing',      href: '#pricing'  },
  { label: 'About',        href: '#about'    },
]

const STATS = [
  { icon: Users,      end: 10000, suffix: '+', div: 1,   label: 'Active Traders'  },
  { icon: Target,     end: 987,   suffix: '%', div: 10,  label: 'Signal Accuracy' },
  { icon: TrendingUp, end: 248,   suffix: 'B', div: 100, prefix: '$', label: 'Volume Traded' },
  { icon: Clock,      end: null,               label: 'AI Monitoring'  },
]

const FEATURES = [
  { icon: Brain,       color: '#e11d48', glow: 'rgba(225,29,72,0.5)',  title: 'AI Signal Engine',    badge: '87% acc.',     desc: 'Neural networks cross-validate 200+ indicators to generate high-confidence trade signals in real-time.' },
  { icon: BarChart3,   color: '#f59e0b', glow: 'rgba(245,158,11,0.5)', title: 'Instant Backtesting', badge: '5Y history',   desc: 'Replay any strategy against 5 years of historical data in under 2 seconds.' },
  { icon: Activity,    color: '#06b6d4', glow: 'rgba(6,182,212,0.5)',  title: 'Live Portfolio',       badge: 'Real-time',    desc: 'Real-time P&L tracking, risk metrics, and rebalancing alerts across all positions.' },
  { icon: Shield,      color: '#10b981', glow: 'rgba(16,185,129,0.5)', title: 'Risk Management',      badge: 'Protected',    desc: 'Automated stop-loss, position sizing, and drawdown protection powered by ML models.' },
  { icon: Bot,         color: '#8b5cf6', glow: 'rgba(139,92,246,0.5)', title: 'Trading Bot 24/7',     badge: 'Automated',    desc: 'Deploy bots that execute signals around the clock with zero emotional bias.' },
  { icon: LineChart,   color: '#e11d48', glow: 'rgba(225,29,72,0.5)',  title: 'Market Intelligence',  badge: 'Sentiment AI', desc: 'Sentiment analysis, news monitoring, and macro trend detection in one unified view.' },
]

const HOW = [
  { step: '01', title: 'Connect & Configure',  desc: 'Link your portfolio, set risk tolerance, and select your preferred assets and strategies.' },
  { step: '02', title: 'AI Analyzes Markets',   desc: 'The engine processes thousands of technical, on-chain, and sentiment signals per second.'   },
  { step: '03', title: 'Execute & Compound',    desc: 'Act on AI signals manually or let the bot run 24/7 with full risk controls active.'         },
]

const BENEFITS = [
  'No financial expertise required',
  'Institutional-grade algorithms',
  'Crypto, stocks & forex support',
  'Full strategy backtesting suite',
  'Automated 24/7 trading bot',
  'Real-time portfolio analytics',
  'Advanced risk management',
  'Cancel anytime — no lock-in',
]

const PRICING = [
  {
    name: 'Starter', price: 'Free',   sub: 'forever',   color: '#64748b', featured: false,
    features: ['5 assets tracked', 'Basic AI signals', 'Portfolio overview', '7-day backtest'],
  },
  {
    name: 'Pro',     price: '$29',    sub: 'per month', color: '#e11d48', featured: true,
    features: ['50+ assets tracked', 'Full AI signal suite', 'Advanced backtesting', 'Live trading bot', 'Priority support'],
  },
  {
    name: 'Enterprise', price: 'Custom', sub: 'contact us', color: '#f59e0b', featured: false,
    features: ['Unlimited assets', 'Dedicated AI model', 'API access', 'White-label option', 'SLA guarantee'],
  },
]

// ── Helpers ───────────────────────────────────────────────────────────────────
function LogoMark() {
  return (
    <svg viewBox="0 0 34 34" fill="none" className="w-8 h-8 shrink-0" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="lgR" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#e11d48" />
          <stop offset="100%" stopColor="#dc2626" />
        </linearGradient>
      </defs>
      <polygon points="17,2 32,31 2,31" fill="url(#lgR)" />
      <polygon points="17,10 26,29 8,29" fill="#06020c" />
      <rect x="10" y="21" width="14" height="2.5" fill="url(#lgR)" />
    </svg>
  )
}

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

function Counter({ end, suffix = '', prefix = '', div = 1 }) {
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
      {end === null
        ? '24/7'
        : `${prefix}${(count / div).toFixed(div > 1 ? (div >= 100 ? 2 : 1) : 0)}${suffix}`}
    </span>
  )
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
  return (
    <>
      <style>{`
        html { scroll-behavior: smooth; }

        @keyframes signalGlow {
          0%, 100% { box-shadow: 0 0 16px rgba(225,29,72,0.20); }
          50%       { box-shadow: 0 0 30px rgba(225,29,72,0.48); }
        }
        .signal-card { animation: signalGlow 3s ease-in-out infinite; }

        @keyframes coreBreath {
          0%, 100% { opacity: 0.72; transform: scale(1);    }
          50%       { opacity: 1;    transform: scale(1.08); }
        }
        .ai-core-breath { animation: coreBreath 5s ease-in-out infinite; }

        @keyframes coreFloat {
          0%, 100% { transform: translateY(0px);   }
          50%       { transform: translateY(-10px); }
        }
        .ai-core-float { animation: coreFloat 7s ease-in-out infinite; }

        @keyframes dataBlink {
          0%, 100% { opacity: 0.18; }
          50%       { opacity: 0.88; }
        }
        .ai-data-blink { animation: dataBlink 3s ease-in-out infinite; }

        @keyframes ringPulse {
          0%, 100% { opacity: 0.30; }
          50%       { opacity: 0.60; }
        }
        .ai-ring-pulse { animation: ringPulse 4s ease-in-out infinite; }
      `}</style>

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
              <LogoMark />
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
              <Link to="/signup"
                className="ripple-btn px-4 py-1.5 text-[12px] font-black text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-all shadow-[0_0_16px_rgba(225,29,72,0.35)] hover:shadow-[0_0_24px_rgba(225,29,72,0.55)]"
              >
                Get Started
              </Link>
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
                  <Link to="/signup"
                    className="ripple-btn px-7 py-3 bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white text-sm font-black rounded-xl transition-all shadow-[0_0_24px_rgba(225,29,72,0.40)] hover:shadow-[0_0_36px_rgba(225,29,72,0.60)] hover:-translate-y-0.5"
                  >
                    Start for Free
                  </Link>
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
                {STATS.map(({ icon: Icon, label, end, suffix, prefix, div }) => (
                  <div key={label} className="flex items-center gap-3 px-5 xl:px-8 py-5">
                    <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
                      <Icon size={13} className="text-rose-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[19px] font-black text-white leading-none tabular-nums">
                        <Counter end={end} suffix={suffix} prefix={prefix} div={div} />
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
                Built for every level — from your first signal to fully automated portfolio management.
              </p>
            </FadeUp>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {FEATURES.map((f, i) => (
                <FadeUp key={f.title} delay={i * 0.08}>
                  <motion.div
                    whileHover={{ y: -4, borderColor: `${f.color}40` }}
                    className="group bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6 backdrop-blur-xl shadow-[0_4px_28px_rgba(0,0,0,0.32)] transition-all duration-300 h-full"
                  >
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                      style={{ background: `${f.color}18`, border: `1px solid ${f.color}28`, boxShadow: `0 0 14px ${f.glow}22` }}>
                      <f.icon size={18} style={{ color: f.color }} />
                    </div>
                    <span className="inline-block text-[10px] font-black px-2 py-0.5 rounded-full mb-3"
                      style={{ background: `${f.color}14`, border: `1px solid ${f.color}25`, color: f.color }}>
                      {f.badge}
                    </span>
                    <h3 className="text-sm font-black text-white mb-2">{f.title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">{f.desc}</p>
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
                From setup to first signal in under 5 minutes.
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
                  Real-time signals, portfolio performance, market news, and bot controls — all in one
                  clean, distraction-free interface.
                </p>
                <div className="space-y-3 mb-8">
                  {['Real-time AI signal feed', 'Portfolio P&L with risk metrics', 'One-click bot deployment', 'News sentiment overlay'].map((item) => (
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

              {/* Dashboard mock */}
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
                    <span className="text-[10px] text-rose-400 font-black bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full">● LIVE</span>
                  </div>

                  <div className="p-4">
                    {/* Mini stat cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                      {[
                        { label: 'Portfolio',   val: '$24,810', sub: '+12.4%',   color: '#10b981' },
                        { label: "Today P&L",   val: '+$842',   sub: '+3.5%',    color: '#10b981' },
                        { label: 'Win Rate',     val: '72.4%',   sub: '48 trades',color: '#e11d48' },
                        { label: 'AI Signals',   val: '3 BUY',   sub: 'active',   color: '#e11d48' },
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
                        <span className="text-[10px] text-emerald-400 font-black">+12.4% / 30D</span>
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
                        <span className="text-xs font-black text-white">BTC / USDT</span>
                        <span className="text-[10px] font-black text-rose-400 bg-rose-500/15 px-1.5 py-0.5 rounded">STRONG BUY</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-medium">
                        Conf: <span className="text-rose-400 font-black">89%</span>
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
                <Link to="/signup"
                  className="ripple-btn inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white text-sm font-black rounded-xl transition-all shadow-[0_0_20px_rgba(225,29,72,0.35)]">
                  Get Started Free <ArrowRight size={14} />
                </Link>
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
                      className="flex items-center gap-3 px-4 py-3 bg-white/[0.025] border border-white/[0.06] rounded-xl"
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
              {PRICING.map((plan, i) => (
                <FadeUp key={plan.name} delay={i * 0.1}>
                  <motion.div
                    whileHover={{ y: -4 }}
                    className={`relative flex flex-col rounded-2xl p-6 backdrop-blur-xl h-full transition-all duration-300 ${
                      plan.featured
                        ? 'border-2 shadow-[0_0_40px_rgba(225,29,72,0.18)]'
                        : 'bg-white/[0.03] border border-white/[0.07] shadow-[0_4px_28px_rgba(0,0,0,0.32)]'
                    }`}
                    style={plan.featured ? { background: 'rgba(225,29,72,0.06)', borderColor: 'rgba(225,29,72,0.45)' } : {}}
                  >
                    {plan.featured && (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-[10px] font-black tracking-widest uppercase text-white bg-gradient-to-r from-rose-600 to-red-700 px-4 py-1 rounded-full shadow-[0_0_16px_rgba(225,29,72,0.4)]">
                        Most Popular
                      </div>
                    )}

                    <div className="mb-5">
                      <p className="text-[11px] font-black tracking-widest uppercase mb-2" style={{ color: plan.color }}>
                        {plan.name}
                      </p>
                      <div className="flex items-end gap-1.5">
                        <span className="text-4xl font-black text-white">{plan.price}</span>
                        <span className="text-xs text-slate-600 font-medium mb-1.5">{plan.sub}</span>
                      </div>
                    </div>

                    <ul className="space-y-2.5 flex-1 mb-6">
                      {plan.features.map((feat) => (
                        <li key={feat} className="flex items-center gap-2.5 text-xs text-slate-400 font-medium">
                          <Check size={12} style={{ color: plan.color }} className="shrink-0" />
                          {feat}
                        </li>
                      ))}
                    </ul>

                    <Link to="/signup"
                      className={`ripple-btn w-full py-2.5 rounded-xl text-sm font-black text-center transition-all flex items-center justify-center gap-1.5 ${
                        plan.featured
                          ? 'bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white shadow-[0_0_18px_rgba(225,29,72,0.3)]'
                          : 'bg-white/[0.05] border border-white/[0.10] text-slate-300 hover:bg-white/[0.09] hover:text-white'
                      }`}
                    >
                      Get started <ArrowRight size={13} />
                    </Link>
                  </motion.div>
                </FadeUp>
              ))}
            </div>
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
                Join 10,000+ traders who use Alpha Vision every day. Get your first AI signal in minutes — no credit card required.
              </p>
              <div className="flex items-center justify-center gap-4 flex-wrap">
                <Link to="/signup"
                  className="ripple-btn px-8 py-3.5 bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white text-sm font-black rounded-xl transition-all shadow-[0_0_28px_rgba(225,29,72,0.42)] hover:shadow-[0_0_42px_rgba(225,29,72,0.62)] hover:-translate-y-0.5">
                  Create Free Account
                </Link>
                <Link to="/login"
                  className="px-8 py-3.5 text-sm font-black text-slate-300 hover:text-white border border-white/[0.12] hover:border-white/[0.22] rounded-xl transition-all">
                  Sign In
                </Link>
              </div>
            </FadeUp>
          </div>
        </section>

        {/* ── FOOTER ─────────────────────────────────────────────────────── */}
        <footer className="border-t border-white/[0.06] bg-[#03010a]/85 backdrop-blur-xl py-8 px-6 sm:px-8">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <Link to="/" className="flex items-center gap-2.5 select-none">
              <LogoMark />
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
    </>
  )
}
