import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Users, Target, TrendingUp, Clock, Play, ChevronRight,
  Activity, Cpu, FlaskConical, Check, Zap, Star,
  Mail, MapPin, Shield, ArrowRight,
} from 'lucide-react'
import { motion, useInView } from 'framer-motion'
import PriceTicker from '../components/ambient/PriceTicker'
import heroImage from '../assets/reference/home-hero-reference.png'

// ── Static data ────────────────────────────────────────────────────────────────
const NAV_LINKS = ['Home', 'Features', 'Pricing', 'About', 'Contact']

const STATS = [
  { icon: Users,      value: '10K+',   end: 10000, suffix: '+',  label: 'Active Traders'  },
  { icon: Target,     value: '98.7%',  end: 987,   suffix: '%',  div: 10, label: 'Accuracy' },
  { icon: TrendingUp, value: '$2.48B', end: 248,   suffix: 'B',  prefix: '$', div: 100, label: 'Trading Volume' },
  { icon: Clock,      value: '24/7',   end: null,  label: 'AI Support' },
]

// ── Animated counter ───────────────────────────────────────────────────────────
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

// ── SVG chart curves background ────────────────────────────────────────────────
function ChartBackground() {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 1200 600"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="cg1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#6366f1" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0"    />
        </linearGradient>
        <linearGradient id="cg2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#8b5cf6" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0"    />
        </linearGradient>
      </defs>

      <motion.path
        d="M0,420 C80,380 160,300 280,320 C400,340 440,240 560,200 C680,160 740,260 860,220 C980,180 1060,140 1200,100"
        fill="none" stroke="#6366f1" strokeWidth="2" strokeOpacity="0.35"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
        transition={{ duration: 2.4, ease: 'easeInOut', delay: 0.3 }}
        style={{ filter: 'drop-shadow(0 0 6px rgba(99,102,241,0.6))' }}
      />
      <motion.path
        d="M0,420 C80,380 160,300 280,320 C400,340 440,240 560,200 C680,160 740,260 860,220 C980,180 1060,140 1200,100 L1200,600 L0,600 Z"
        fill="url(#cg1)"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        transition={{ duration: 1.6, delay: 1.2 }}
      />
      <motion.path
        d="M0,480 C100,460 200,400 320,380 C440,360 500,300 620,280 C740,260 800,320 920,300 C1040,280 1120,240 1200,200"
        fill="none" stroke="#8b5cf6" strokeWidth="1.5" strokeOpacity="0.22"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
        transition={{ duration: 2.2, ease: 'easeInOut', delay: 0.6 }}
      />
      <motion.path
        d="M0,480 C100,460 200,400 320,380 C440,360 500,300 620,280 C740,260 800,320 920,300 C1040,280 1120,240 1200,200 L1200,600 L0,600 Z"
        fill="url(#cg2)"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        transition={{ duration: 1.4, delay: 1.4 }}
      />

      {[{ cx: 280, cy: 320 }, { cx: 560, cy: 200 }, { cx: 860, cy: 220 }].map((pt, i) => (
        <motion.circle
          key={i} cx={pt.cx} cy={pt.cy} r="4"
          fill="#6366f1" fillOpacity="0.7"
          style={{ filter: 'drop-shadow(0 0 6px rgba(99,102,241,0.9))' }}
          initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 1.8 + i * 0.15, type: 'spring', stiffness: 200 }}
        />
      ))}
    </svg>
  )
}

// ── Logo SVG ──────────────────────────────────────────────────────────────────
function LogoMark() {
  return (
    <svg viewBox="0 0 34 34" fill="none" className="w-8 h-8 shrink-0" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="lm" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
      </defs>
      <polygon points="17,2 32,31 2,31" fill="url(#lm)" />
      <polygon points="17,10 26,29 8,29" fill="#070E20" />
      <rect x="10" y="21" width="14" height="2.5" fill="url(#lm)" />
    </svg>
  )
}

// ── Scroll‑reveal wrapper ──────────────────────────────────────────────────────
function FadeUp({ children, delay = 0, className = '' }) {
  const ref    = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ── Section divider ────────────────────────────────────────────────────────────
function SectionDivider() {
  return (
    <div className="flex items-center justify-center gap-4 py-2">
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />
    </div>
  )
}

// ── HOME PAGE ─────────────────────────────────────────────────────────────────
export default function Home() {
  return (
    <>
      {/* ── Keyframes injected locally ────────────────────────────────────────
          flashDark : quick dark veil that covers the bull every ~4 s
          ──────────────────────────────────────────────────────────────────── */}
      <style>{`
        html { scroll-behavior: smooth; }

        @keyframes flashDark {
          0%   { opacity: 0; }
          2%   { opacity: 0.88; }
          7%   { opacity: 0; }
          100% { opacity: 0; }
        }
        .bull-flash-overlay {
          animation: flashDark 4s ease-in-out infinite;
          background: rgba(0, 0, 0, 0.88);
          box-shadow:
            inset 0 0 60px rgba(99,102,241,0.18),
            inset 0 0 20px rgba(0,0,0,0.6);
        }
      `}</style>

      <div className="bg-[#070E20] text-white overflow-x-hidden">

        {/* Fixed ambient orbs */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute -top-20 right-[15%] w-[500px] h-[500px] bg-indigo-900/20 rounded-full blur-[130px]" />
          <div className="absolute bottom-0  left-[5%]  w-[320px] h-[320px] bg-violet-900/14 rounded-full blur-[100px]" />
          <div className="absolute top-1/2  left-1/2   -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-blue-900/8 rounded-full blur-[140px]" />
        </div>

        {/* ── NAVBAR ─────────────────────────────────────────────────────── */}
        <nav className="sticky top-0 z-50 h-14 flex items-center border-b border-white/[0.07] bg-[#070E20]/90 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 w-full flex items-center justify-between">

            <Link to="/" className="flex items-center gap-2 select-none">
              <LogoMark />
              <div className="leading-none">
                <span className="block text-[12px] font-black tracking-[0.18em] text-white">ALPHA</span>
                <span className="block text-[8px]  font-bold  tracking-[0.25em] text-indigo-400 mt-[1px]">VISION</span>
              </div>
            </Link>

            <div className="hidden md:flex items-center gap-7">
              {NAV_LINKS.map((link) => (
                <a
                  key={link}
                  href={link === 'Home' ? '#' : `#${link.toLowerCase()}`}
                  className="text-[13px] font-medium text-slate-500 hover:text-white transition-colors"
                >
                  {link}
                </a>
              ))}
            </div>

            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-[12px] font-bold text-white border border-indigo-500/35 rounded-lg hover:bg-indigo-500/10 hover:border-indigo-400/55 transition-all"
            >
              Sign In <ChevronRight size={11} />
            </Link>
          </div>
        </nav>

        {/* ── HERO ───────────────────────────────────────────────────────── */}
        <section className="min-h-[calc(100vh-56px)] flex flex-col">
          <div className="flex-1 max-w-7xl mx-auto px-6 sm:px-8 w-full flex items-center">
            <div className="grid lg:grid-cols-2 gap-8 xl:gap-14 items-center w-full py-10 lg:py-6">

              {/* Left: text */}
              <motion.div
                className="flex flex-col gap-5"
                initial="hidden"
                animate="visible"
                variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
              >
                <motion.div variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } }}>
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-black tracking-widest uppercase text-indigo-400 bg-indigo-500/10 border border-indigo-500/25 px-3 py-1.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                    AI-Powered Trading Intelligence
                  </span>
                </motion.div>

                <motion.h1
                  className="font-black leading-[1.04] tracking-tight text-[2.6rem] sm:text-[3.1rem] lg:text-[3.5rem] xl:text-[4rem]"
                  variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } }}
                >
                  <span className="block text-white">AI-POWERED</span>
                  <span className="block bg-gradient-to-r from-indigo-400 via-violet-400 to-indigo-300 bg-clip-text text-transparent">
                    TRADING PLATFORM
                  </span>
                </motion.h1>

                <motion.p
                  className="text-base font-semibold text-slate-300 tracking-wide"
                  variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } }}
                >
                  Analyze. Predict. Trade. Win.
                </motion.p>

                <motion.p
                  className="text-sm text-slate-500 leading-relaxed max-w-[400px] font-medium"
                  variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } }}
                >
                  Alpha Vision uses advanced AI algorithms to analyze the market and help you
                  make smarter, faster trading decisions in real time.
                </motion.p>

                <motion.div
                  className="flex items-center gap-4 pt-1"
                  variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } }}
                >
                  <Link
                    to="/signup"
                    className="ripple-btn px-7 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-black rounded-xl transition-all shadow-[0_0_24px_rgba(99,102,241,0.38)] hover:shadow-[0_0_36px_rgba(99,102,241,0.55)] hover:-translate-y-0.5"
                  >
                    Get Started
                  </Link>
                  <button
                    type="button"
                    className="flex items-center gap-2.5 text-sm font-semibold text-slate-400 hover:text-white transition-colors group"
                  >
                    <span className="w-9 h-9 rounded-full border border-slate-700/80 group-hover:border-indigo-500/50 bg-white/[0.03] flex items-center justify-center transition-all group-hover:bg-indigo-500/8">
                      <Play size={9} fill="currentColor" className="ml-0.5 text-slate-400 group-hover:text-indigo-400 transition-colors" />
                    </span>
                    Watch Demo
                  </button>
                </motion.div>
              </motion.div>

              {/* Right: bull + dark flash overlay + chart curves */}
              <div className="relative flex items-center justify-center lg:justify-end">
                {/* Chart SVG background */}
                <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
                  <ChartBackground />
                </div>

                {/* Glow orbs */}
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden="true">
                  <div className="w-[400px] h-[400px] bg-blue-700/12 rounded-full blur-[90px]" />
                </div>
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden="true">
                  <div className="w-[240px] h-[240px] bg-indigo-600/10 rounded-full blur-[60px]" />
                </div>

                {/* Bull + flash overlay container */}
                <div className="relative z-10 w-full max-w-[480px] lg:max-w-[540px] xl:max-w-[600px]">

                  {/* ── DARK FLASH OVERLAY ────────────────────────────────────
                      A black veil that flashes opaque (~0.88) for ~0.28 s
                      every 4 s, then returns to invisible.
                      The subtle indigo inset glow keeps a « cyber » feel.
                      ─────────────────────────────────────────────────────── */}
                  <div
                    className="bull-flash-overlay absolute inset-0 z-[3] pointer-events-none rounded-xl"
                    aria-hidden="true"
                  />

                  <img
                    src={heroImage}
                    alt="AI Trading Bull"
                    className="w-full select-none relative z-[2]"
                    style={{ mixBlendMode: 'screen' }}
                    draggable={false}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Price ticker */}
          <div className="shrink-0 border-t border-white/[0.06] bg-[#060C1C]/70 backdrop-blur-xl">
            <PriceTicker />
          </div>

          {/* Stats strip */}
          <div className="shrink-0 border-t border-white/[0.06] bg-[#060C1C]/85 backdrop-blur-xl">
            <div className="max-w-7xl mx-auto px-6 sm:px-8">
              <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-white/[0.06]">
                {STATS.map(({ icon: Icon, label, end, suffix, prefix, div }) => (
                  <div key={label} className="flex items-center gap-3 px-5 xl:px-8 py-5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                      <Icon size={13} className="text-indigo-400" />
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

        {/* ══════════════════════════════════════════════════════════════════
            SECTION 1 — FEATURES
        ══════════════════════════════════════════════════════════════════ */}
        <section id="features" className="relative py-24 px-6 sm:px-8">
          {/* Section ambient */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-indigo-900/12 rounded-full blur-[100px]" />
          </div>

          <div className="max-w-7xl mx-auto relative z-10">
            <FadeUp className="text-center mb-14">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-black tracking-widest uppercase text-indigo-400 bg-indigo-500/10 border border-indigo-500/25 px-3 py-1.5 rounded-full mb-4">
                <Zap size={10} /> What we offer
              </span>
              <h2 className="text-4xl font-black text-white tracking-tight mb-4">Powerful Features</h2>
              <p className="text-slate-500 text-sm font-medium max-w-md mx-auto leading-relaxed">
                Everything you need to trade smarter — built with institutional-grade AI, designed for every level of trader.
              </p>
            </FadeUp>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                {
                  icon: Activity,
                  color: '#6366f1',
                  glow: 'rgba(99,102,241,0.55)',
                  title: 'Real-Time Analysis',
                  desc: 'Monitor 50+ assets with live price feeds, multi-timeframe charts and 12 technical indicators refreshed every second.',
                  badge: 'Live',
                },
                {
                  icon: Cpu,
                  color: '#8b5cf6',
                  glow: 'rgba(139,92,246,0.55)',
                  title: 'AI Predictions',
                  desc: 'Our neural network cross-validates RSI, MACD, Bollinger Bands and volume signals to deliver high-confidence trade calls.',
                  badge: '87% accuracy',
                },
                {
                  icon: FlaskConical,
                  color: '#06b6d4',
                  glow: 'rgba(6,182,212,0.55)',
                  title: 'Automated Backtesting',
                  desc: 'Replay your strategies on years of historical data, fine-tune parameters and download a full performance report in seconds.',
                  badge: '30-day history',
                },
              ].map((f, i) => (
                <FadeUp key={f.title} delay={i * 0.1}>
                  <motion.div
                    whileHover={{ y: -4, borderColor: `${f.color}40` }}
                    className="group bg-[#0a1628]/88 border border-white/[0.07] rounded-2xl p-6 backdrop-blur-2xl shadow-[0_4px_28px_rgba(0,0,0,0.32)] transition-all duration-300 h-full"
                  >
                    {/* Icon */}
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
                      style={{
                        background: `${f.color}18`,
                        border: `1px solid ${f.color}30`,
                        boxShadow: `0 0 16px ${f.glow}30`,
                      }}
                    >
                      <f.icon size={20} style={{ color: f.color }} />
                    </div>

                    {/* Badge */}
                    <span
                      className="inline-block text-[10px] font-black px-2 py-0.5 rounded-full mb-3"
                      style={{
                        background: `${f.color}18`,
                        border: `1px solid ${f.color}28`,
                        color: f.color,
                      }}
                    >
                      {f.badge}
                    </span>

                    <h3 className="text-base font-black text-white mb-2">{f.title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">{f.desc}</p>
                  </motion.div>
                </FadeUp>
              ))}
            </div>
          </div>
        </section>

        <SectionDivider />

        {/* ══════════════════════════════════════════════════════════════════
            SECTION 2 — PRICING
        ══════════════════════════════════════════════════════════════════ */}
        <section id="pricing" className="relative py-24 px-6 sm:px-8">
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
            <div className="absolute bottom-0 right-1/4 w-[500px] h-[350px] bg-violet-900/12 rounded-full blur-[100px]" />
          </div>

          <div className="max-w-7xl mx-auto relative z-10">
            <FadeUp className="text-center mb-14">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-black tracking-widest uppercase text-violet-400 bg-violet-500/10 border border-violet-500/25 px-3 py-1.5 rounded-full mb-4">
                <Star size={10} /> Simple pricing
              </span>
              <h2 className="text-4xl font-black text-white tracking-tight mb-4">Choose Your Plan</h2>
              <p className="text-slate-500 text-sm font-medium max-w-md mx-auto leading-relaxed">
                Start free, upgrade when you're ready. No hidden fees, no lock-in.
              </p>
            </FadeUp>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
              {[
                {
                  name: 'Starter',
                  price: 'Free',
                  sub: 'forever',
                  color: '#64748b',
                  featured: false,
                  features: ['5 assets tracked', 'Basic AI signals', 'Portfolio overview', '7-day backtest'],
                },
                {
                  name: 'Pro',
                  price: '$29',
                  sub: 'per month',
                  color: '#6366f1',
                  featured: true,
                  features: ['50+ assets tracked', 'Full AI signal suite', 'Advanced backtesting', 'Live trading bot', 'Priority support'],
                },
                {
                  name: 'Enterprise',
                  price: 'Custom',
                  sub: 'contact us',
                  color: '#f59e0b',
                  featured: false,
                  features: ['Unlimited assets', 'Dedicated AI model', 'API access', 'White-label option', 'SLA guarantee'],
                },
              ].map((plan, i) => (
                <FadeUp key={plan.name} delay={i * 0.1}>
                  <motion.div
                    whileHover={{ y: -4 }}
                    className={`relative flex flex-col rounded-2xl p-6 backdrop-blur-2xl h-full transition-all duration-300 ${
                      plan.featured
                        ? 'bg-indigo-600/10 border-2 border-indigo-500/50 shadow-[0_0_40px_rgba(99,102,241,0.18)]'
                        : 'bg-[#0a1628]/88 border border-white/[0.07] shadow-[0_4px_28px_rgba(0,0,0,0.32)]'
                    }`}
                  >
                    {plan.featured && (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-[10px] font-black tracking-widest uppercase text-white bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-1 rounded-full shadow-[0_0_16px_rgba(99,102,241,0.4)]">
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

                    <Link
                      to="/signup"
                      className={`ripple-btn w-full py-2.5 rounded-xl text-sm font-black text-center transition-all duration-200 flex items-center justify-center gap-1.5 ${
                        plan.featured
                          ? 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-[0_0_18px_rgba(99,102,241,0.3)]'
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

        <SectionDivider />

        {/* ══════════════════════════════════════════════════════════════════
            SECTION 3 — ABOUT
        ══════════════════════════════════════════════════════════════════ */}
        <section id="about" className="relative py-24 px-6 sm:px-8">
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
            <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-indigo-900/10 rounded-full blur-[100px]" />
          </div>

          <div className="max-w-7xl mx-auto relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 xl:gap-20 items-center">

              {/* Text */}
              <FadeUp>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-black tracking-widest uppercase text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-3 py-1.5 rounded-full mb-6">
                  <Shield size={10} /> Our mission
                </span>
                <h2 className="text-4xl font-black text-white tracking-tight mb-5 leading-tight">
                  Built for Traders,<br />
                  <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                    Powered by AI
                  </span>
                </h2>
                <p className="text-sm text-slate-400 leading-relaxed font-medium mb-4">
                  Alpha Vision was founded in 2023 with a single goal: democratize institutional-grade trading intelligence.
                  We believe every trader — from beginner to seasoned professional — deserves access to the same analytical tools
                  that hedge funds use, wrapped in an interface that's beautiful and intuitive.
                </p>
                <p className="text-sm text-slate-500 leading-relaxed font-medium mb-8">
                  Our team combines deep expertise in quantitative finance, machine learning and product design.
                  We iterate relentlessly, listen to our community and build in public.
                </p>

                <div className="grid grid-cols-3 gap-4">
                  {[
                    { value: '2023', label: 'Founded' },
                    { value: '12',   label: 'Team members' },
                    { value: '10K+', label: 'Active users' },
                  ].map((s) => (
                    <div key={s.label} className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-3.5 text-center">
                      <p className="text-xl font-black text-white">{s.value}</p>
                      <p className="text-[10px] text-slate-600 font-medium mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>
              </FadeUp>

              {/* Visual card */}
              <FadeUp delay={0.15}>
                <div className="relative">
                  <div className="absolute -inset-4 bg-indigo-500/6 rounded-3xl blur-2xl" />
                  <div className="relative bg-[#0a1628]/88 border border-white/[0.07] rounded-2xl p-6 backdrop-blur-2xl shadow-[0_4px_28px_rgba(0,0,0,0.32)] space-y-4">
                    {[
                      { icon: Activity, color: '#6366f1', title: 'Real-time signals',     val: '87% avg confidence' },
                      { icon: Cpu,      color: '#8b5cf6', title: 'AI models trained',      val: '4 strategies live'  },
                      { icon: Shield,   color: '#10b981', title: 'Security audited',       val: 'SOC-2 compliant'    },
                      { icon: Star,     color: '#f59e0b', title: 'User satisfaction',      val: '4.9 / 5 rating'     },
                    ].map((row, i) => (
                      <motion.div
                        key={row.title}
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 + i * 0.08 }}
                        className="flex items-center gap-3 p-3 bg-white/[0.025] border border-white/[0.05] rounded-xl"
                      >
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: `${row.color}18`, border: `1px solid ${row.color}28` }}
                        >
                          <row.icon size={14} style={{ color: row.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-white">{row.title}</p>
                          <p className="text-[10px] text-slate-600 font-medium">{row.val}</p>
                        </div>
                        <Check size={12} className="text-emerald-400 shrink-0" />
                      </motion.div>
                    ))}
                  </div>
                </div>
              </FadeUp>
            </div>
          </div>
        </section>

        <SectionDivider />

        {/* ══════════════════════════════════════════════════════════════════
            SECTION 4 — CONTACT
        ══════════════════════════════════════════════════════════════════ */}
        <section id="contact" className="relative py-24 px-6 sm:px-8">
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
            <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-indigo-900/10 rounded-full blur-[100px]" />
          </div>

          <div className="max-w-3xl mx-auto relative z-10">
            <FadeUp className="text-center mb-12">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-black tracking-widest uppercase text-indigo-400 bg-indigo-500/10 border border-indigo-500/25 px-3 py-1.5 rounded-full mb-4">
                <Mail size={10} /> Get in touch
              </span>
              <h2 className="text-4xl font-black text-white tracking-tight mb-4">Contact Us</h2>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">
                Questions, partnership inquiries or just want to say hi?<br />
                We read every message and reply within 24 hours.
              </p>
            </FadeUp>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
              {[
                { icon: Mail,    color: '#6366f1', label: 'Email',    value: 'hello@alphavision.app' },
                { icon: MapPin,  color: '#8b5cf6', label: 'Location', value: 'Casablanca, Morocco'    },
                { icon: Shield,  color: '#10b981', label: 'Support',  value: '24/7 via chat'          },
              ].map((c) => (
                <FadeUp key={c.label}>
                  <div className="bg-[#0a1628]/88 border border-white/[0.07] rounded-2xl p-5 backdrop-blur-2xl shadow-[0_4px_28px_rgba(0,0,0,0.28)] text-center">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3"
                      style={{ background: `${c.color}18`, border: `1px solid ${c.color}28` }}
                    >
                      <c.icon size={16} style={{ color: c.color }} />
                    </div>
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">{c.label}</p>
                    <p className="text-xs font-bold text-slate-300">{c.value}</p>
                  </div>
                </FadeUp>
              ))}
            </div>

            {/* Mini contact form */}
            <FadeUp delay={0.1}>
              <div className="bg-[#0a1628]/88 border border-white/[0.07] rounded-2xl p-6 backdrop-blur-2xl shadow-[0_4px_28px_rgba(0,0,0,0.28)]">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-[10px] font-black text-slate-600 mb-1.5 uppercase tracking-[0.1em]">Name</label>
                    <input
                      type="text"
                      placeholder="Your name"
                      className="w-full bg-[#060D1C]/80 border border-white/[0.09] text-white text-sm rounded-xl px-3.5 py-2.5 placeholder-slate-700 focus:outline-none focus:border-indigo-500/60 focus:shadow-[0_0_14px_rgba(99,102,241,0.14)] transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-600 mb-1.5 uppercase tracking-[0.1em]">Email</label>
                    <input
                      type="email"
                      placeholder="your@email.com"
                      className="w-full bg-[#060D1C]/80 border border-white/[0.09] text-white text-sm rounded-xl px-3.5 py-2.5 placeholder-slate-700 focus:outline-none focus:border-indigo-500/60 focus:shadow-[0_0_14px_rgba(99,102,241,0.14)] transition-all duration-200"
                    />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-[10px] font-black text-slate-600 mb-1.5 uppercase tracking-[0.1em]">Message</label>
                  <textarea
                    rows={4}
                    placeholder="How can we help you?"
                    className="w-full bg-[#060D1C]/80 border border-white/[0.09] text-white text-sm rounded-xl px-3.5 py-2.5 placeholder-slate-700 focus:outline-none focus:border-indigo-500/60 focus:shadow-[0_0_14px_rgba(99,102,241,0.14)] transition-all duration-200 resize-none"
                  />
                </div>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  className="ripple-btn w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-black rounded-xl transition-all shadow-[0_0_18px_rgba(99,102,241,0.26)] flex items-center justify-center gap-2"
                >
                  Send Message <ArrowRight size={14} />
                </motion.button>
              </div>
            </FadeUp>
          </div>
        </section>

        {/* ── FOOTER ─────────────────────────────────────────────────────── */}
        <footer className="border-t border-white/[0.06] bg-[#060C1C]/85 backdrop-blur-xl py-8 px-6 sm:px-8">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 select-none">
              <LogoMark />
              <div className="leading-none">
                <span className="block text-[12px] font-black tracking-[0.18em] text-white">ALPHA</span>
                <span className="block text-[8px] font-bold tracking-[0.25em] text-indigo-400 mt-[1px]">VISION</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-700 font-medium">
              © 2025 Alpha Vision · All rights reserved
            </p>
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
