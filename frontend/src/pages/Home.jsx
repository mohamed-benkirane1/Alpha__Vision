import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Zap,
  ArrowRight,
  Activity,
  Bot,
  BarChart2,
  Cpu,
  TrendingUp,
  TrendingDown,
} from 'lucide-react'

// ── Animation helpers ────────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45 } },
}
const stagger = {
  visible: { transition: { staggerChildren: 0.09 } },
}

// ── Static data (decorative, no API) ────────────────────────────────────────
const features = [
  {
    icon: Activity,
    title: 'Real-time Markets',
    desc: 'Live prices for crypto, stocks, indices and commodities from multiple data sources.',
    accent: { text: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  },
  {
    icon: Bot,
    title: 'AI Assistant',
    desc: 'Ask anything about markets. Get analysis, signals and trade recommendations instantly.',
    accent: { text: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20' },
  },
  {
    icon: BarChart2,
    title: 'Portfolio Tracking',
    desc: 'Track assets, monitor performance and visualize allocation in real time.',
    accent: { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  },
  {
    icon: Cpu,
    title: 'Paper Trading Bot',
    desc: 'Run automated strategies with paper money. Backtest, optimize and deploy with confidence.',
    accent: { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  },
]

const mockStats = [
  { label: 'Portfolio Value', value: '$24,856', sub: '+5.2% this week',  color: 'text-emerald-400' },
  { label: 'AI Signal',       value: 'STRONG BUY', sub: 'Confidence 87%', color: 'text-indigo-400' },
  { label: 'Open Trades',     value: '3 active',  sub: 'P&L +$342',      color: 'text-blue-400' },
  { label: 'Win Rate',        value: '72.4%',     sub: 'Last 30 days',   color: 'text-violet-400' },
]

const mockTickers = [
  { symbol: 'BTC', name: 'Bitcoin',  price: '$67,432', change: '+2.4%', up: true  },
  { symbol: 'ETH', name: 'Ethereum', price: '$3,847',  change: '+1.8%', up: true  },
  { symbol: 'AAPL', name: 'Apple',   price: '$189.45', change: '-0.3%', up: false },
  { symbol: 'NVDA', name: 'NVIDIA',  price: '$875.20', change: '+3.1%', up: true  },
]

// ── Navbar ───────────────────────────────────────────────────────────────────
function Navbar() {
  return (
    <nav className="fixed top-0 inset-x-0 z-50 bg-gray-950/80 backdrop-blur-md border-b border-gray-800/50">
      <div className="max-w-6xl mx-auto px-5 h-15 flex items-center justify-between gap-6">
        {/* Logo */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 rounded-md bg-indigo-600 flex items-center justify-center">
            <Zap size={13} className="text-white" />
          </div>
          <span className="font-bold text-white text-sm">Alpha Vision</span>
        </div>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-6 text-sm text-gray-400">
          {['Features', 'Markets', 'AI', 'Trading'].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              className="hover:text-white transition-colors"
            >
              {item}
            </a>
          ))}
        </div>

        {/* Auth buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <Link
            to="/login"
            className="px-4 py-1.5 text-sm text-gray-300 hover:text-white transition-colors"
          >
            Login
          </Link>
          <Link
            to="/signup"
            className="px-4 py-1.5 text-sm bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors font-medium"
          >
            Sign up
          </Link>
        </div>
      </div>
    </nav>
  )
}

// ── Home ─────────────────────────────────────────────────────────────────────
function Home() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative pt-36 pb-24 px-5 overflow-hidden">
        {/* Background glow */}
        <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[450px] bg-indigo-600/10 rounded-full blur-3xl" />
        <div className="pointer-events-none absolute top-24 right-1/4 w-[320px] h-[320px] bg-violet-600/8 rounded-full blur-3xl" />

        <div className="relative max-w-4xl mx-auto text-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="flex flex-col items-center gap-7"
          >
            {/* Badge */}
            <motion.div variants={fadeUp}>
              <span className="inline-flex items-center gap-1.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium px-4 py-1.5 rounded-full">
                <Zap size={11} />
                AI-Powered Trading Platform
              </span>
            </motion.div>

            {/* Title */}
            <motion.h1
              variants={fadeUp}
              className="text-4xl sm:text-5xl lg:text-[3.5rem] font-bold leading-tight tracking-tight"
            >
              Trade smarter with{' '}
              <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-indigo-400 bg-clip-text text-transparent">
                real-time market intelligence
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p variants={fadeUp} className="text-base sm:text-lg text-gray-400 max-w-2xl leading-relaxed">
              Analyze markets, manage your portfolio, simulate trading strategies
              and leverage AI insights — all in one unified platform.
            </motion.p>

            {/* CTA buttons */}
            <motion.div variants={fadeUp} className="flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 px-7 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg transition-colors"
              >
                Get Started <ArrowRight size={15} />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-7 py-3 bg-white/5 hover:bg-white/10 border border-gray-700/80 text-white rounded-lg transition-colors"
              >
                Login
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Dashboard mock ───────────────────────────────────────────────── */}
      <section id="markets" className="py-14 px-5">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={stagger}
            className="rounded-2xl bg-gray-900/50 border border-gray-800/60 backdrop-blur-sm p-6"
          >
            {/* Mock topbar */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-sm text-gray-400 font-medium">Platform preview</span>
              </div>
              <span className="text-[11px] text-gray-600 bg-gray-800/60 px-2.5 py-1 rounded-md">
                Simulated data
              </span>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
              {mockStats.map((s) => (
                <motion.div
                  key={s.label}
                  variants={fadeUp}
                  className="bg-gray-900/80 border border-gray-800/60 rounded-xl p-4"
                >
                  <p className="text-[11px] text-gray-500 mb-1.5">{s.label}</p>
                  <p className={`text-base font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-[11px] text-gray-600 mt-1">{s.sub}</p>
                </motion.div>
              ))}
            </div>

            {/* Ticker rows */}
            <div className="space-y-1.5">
              {mockTickers.map((t) => (
                <motion.div
                  key={t.symbol}
                  variants={fadeUp}
                  className="flex items-center justify-between px-4 py-2.5 bg-gray-900/60 border border-gray-800/40 rounded-xl hover:border-gray-700/60 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-[11px] font-bold text-gray-300 shrink-0">
                      {t.symbol.slice(0, 2)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{t.symbol}</p>
                      <p className="text-[11px] text-gray-500">{t.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-white">{t.price}</p>
                    <p className={`text-xs font-medium flex items-center justify-end gap-0.5 ${t.up ? 'text-emerald-400' : 'text-red-400'}`}>
                      {t.up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                      {t.change}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────── */}
      <section id="features" className="py-20 px-5">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={stagger}
            className="text-center mb-12"
          >
            <motion.h2 variants={fadeUp} className="text-3xl font-bold text-white mb-3">
              Everything you need to trade with confidence
            </motion.h2>
            <motion.p variants={fadeUp} className="text-gray-400 max-w-lg mx-auto text-sm">
              A complete suite of tools built for modern traders and investors.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={stagger}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {features.map((f) => (
              <motion.div
                key={f.title}
                variants={fadeUp}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className={`bg-gray-900/50 border ${f.accent.border} rounded-xl p-5 backdrop-blur-sm`}
              >
                <div className={`w-10 h-10 rounded-lg ${f.accent.bg} border ${f.accent.border} flex items-center justify-center mb-4`}>
                  <f.icon size={18} className={f.accent.text} />
                </div>
                <h3 className="text-sm font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section id="ai" className="py-24 px-5">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={stagger}
            className="relative rounded-2xl border border-indigo-500/20 p-12 overflow-hidden"
          >
            {/* Glow inside card */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-600/10 via-violet-600/8 to-transparent" />

            <motion.h2 variants={fadeUp} className="relative text-3xl font-bold text-white mb-4">
              Ready to build your trading edge?
            </motion.h2>
            <motion.p variants={fadeUp} className="relative text-gray-400 text-sm mb-8">
              Join Alpha Vision and start trading with the power of real-time data and AI.
            </motion.p>
            <motion.div variants={fadeUp} className="relative">
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg transition-colors"
              >
                Create free account <ArrowRight size={15} />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer id="trading" className="border-t border-gray-800/60 py-6 px-5 text-center">
        <p className="text-xs text-gray-600">
          © 2025 Alpha Vision — AI-powered trading platform. For educational purposes only.
        </p>
      </footer>
    </div>
  )
}

export default Home
