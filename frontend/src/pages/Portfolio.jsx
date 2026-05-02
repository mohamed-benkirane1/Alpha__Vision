import { motion } from 'framer-motion'
import { Wallet, TrendingUp, Star, Layers, Lightbulb, AlertTriangle, CheckCircle } from 'lucide-react'

import PortfolioCard  from '../components/portfolio/PortfolioCard'
import HoldingsTable  from '../components/portfolio/HoldingsTable'
import PortfolioChart from '../components/portfolio/PortfolioChart'

const summaryCards = [
  {
    icon: Wallet,
    label: 'Total Value',
    value: '$25,135.51',
    sub: '+$1,456 today (+6.1%)',
    subUp: true,
    accentColor: 'indigo',
  },
  {
    icon: TrendingUp,
    label: 'Total Profit',
    value: '+$2,455.38',
    sub: '+10.8% overall return',
    subUp: true,
    accentColor: 'emerald',
  },
  {
    icon: Star,
    label: 'Best Asset',
    value: 'SOL',
    sub: '+15.0% unrealized gain',
    subUp: true,
    accentColor: 'violet',
  },
  {
    icon: Layers,
    label: 'Assets Held',
    value: '5',
    sub: 'Crypto, stocks & commodities',
    subUp: true,
    accentColor: 'amber',
  },
]

const insights = [
  {
    icon: AlertTriangle,
    type: 'warning',
    title: 'High BTC concentration',
    body: 'BTC represents 61.7% of your portfolio. Consider rebalancing into ETH or SOL to reduce single-asset risk.',
    accent: { icon: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  },
  {
    icon: TrendingUp,
    type: 'positive',
    title: 'SOL momentum strong',
    body: 'Solana is your best-performing asset this week with +15% unrealized gains and strong on-chain activity.',
    accent: { icon: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  },
  {
    icon: CheckCircle,
    type: 'info',
    title: 'AAPL underperforming',
    body: 'Apple stock is slightly in the red (-2.8%). Monitor earnings announcements before adding more exposure.',
    accent: { icon: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
  },
]

const fadeUp = {
  hidden:  { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
}
const stagger = { visible: { transition: { staggerChildren: 0.08 } } }

function Portfolio() {
  return (
    <div className="space-y-6">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <motion.div initial="hidden" animate="visible" variants={fadeUp}>
        <h1 className="text-2xl font-bold text-white">Portfolio</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Track your assets, performance and allocation
        </p>
      </motion.div>

      {/* ── Summary cards ──────────────────────────────────────────────── */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={stagger}
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
      >
        {summaryCards.map((c) => (
          <motion.div key={c.label} variants={fadeUp}>
            <PortfolioCard {...c} />
          </motion.div>
        ))}
      </motion.div>

      {/* ── Holdings + Allocation chart ─────────────────────────────────── */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={stagger}
        className="grid grid-cols-1 lg:grid-cols-3 gap-4"
      >
        <motion.div variants={fadeUp} className="lg:col-span-2">
          <HoldingsTable />
        </motion.div>
        <motion.div variants={fadeUp}>
          <PortfolioChart />
        </motion.div>
      </motion.div>

      {/* ── Portfolio Insights ──────────────────────────────────────────── */}
      <motion.div initial="hidden" animate="visible" variants={stagger}>
        <motion.div variants={fadeUp} className="mb-4 flex items-center gap-2">
          <Lightbulb size={15} className="text-indigo-400" />
          <h2 className="text-sm font-semibold text-white">Portfolio Insights</h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {insights.map((ins) => (
            <motion.div
              key={ins.title}
              variants={fadeUp}
              className="bg-gray-900/50 border border-gray-800/60 rounded-xl p-4 backdrop-blur-sm hover:border-gray-700/60 transition-colors"
            >
              <div className={`w-8 h-8 rounded-lg ${ins.accent.bg} border ${ins.accent.border} flex items-center justify-center mb-3`}>
                <ins.icon size={14} className={ins.accent.icon} />
              </div>
              <p className="text-sm font-semibold text-white mb-1.5">{ins.title}</p>
              <p className="text-xs text-gray-500 leading-relaxed">{ins.body}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

    </div>
  )
}

export default Portfolio
