import { motion } from 'framer-motion'
import { Wallet, TrendingUp, Star, Layers, Lightbulb, AlertTriangle, CheckCircle } from 'lucide-react'

import PortfolioCard  from '../components/portfolio/PortfolioCard'
import HoldingsTable  from '../components/portfolio/HoldingsTable'
import PortfolioChart from '../components/portfolio/PortfolioChart'

const summaryCards = [
  { icon: Wallet,     label: 'Total Value',  value: '$25,135.51', sub: '+$1,456 today (+6.1%)',    subUp: true,  accentColor: 'rose'    },
  { icon: TrendingUp, label: 'Total Profit', value: '+$2,455.38', sub: '+10.8% overall return',   subUp: true,  accentColor: 'emerald' },
  { icon: Star,       label: 'Best Asset',   value: 'SOL',        sub: '+15.0% unrealized gain',  subUp: true,  accentColor: 'violet'  },
  { icon: Layers,     label: 'Assets Held',  value: '5',          sub: 'Crypto, stocks & commodities', subUp: true, accentColor: 'amber' },
]

const insights = [
  {
    icon: AlertTriangle,
    title: 'High BTC concentration',
    body: 'BTC represents 61.7% of your portfolio. Consider rebalancing into ETH or SOL to reduce single-asset risk.',
    accent: { icon: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/22', hover: 'rgba(245,158,11,0.12)' },
  },
  {
    icon: TrendingUp,
    title: 'SOL momentum strong',
    body: 'Solana is your best-performing asset this week with +15% unrealized gains and strong on-chain activity.',
    accent: { icon: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/22', hover: 'rgba(16,185,129,0.12)' },
  },
  {
    icon: CheckCircle,
    title: 'AAPL underperforming',
    body: 'Apple stock is slightly in the red (-2.8%). Monitor earnings announcements before adding more exposure.',
    accent: { icon: 'text-rose-400',   bg: 'bg-rose-500/10',   border: 'border-rose-500/20',  hover: 'rgba(225,29,72,0.12)'  },
  },
]

const fadeUp  = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0.16, 1, 0.3, 1] } } }
const stagger = { visible: { transition: { staggerChildren: 0.08 } } }

export default function Portfolio() {
  return (
    <div className="space-y-5">

      <motion.div initial="hidden" animate="visible" variants={fadeUp}>
        <h1 className="text-2xl font-black text-white">Portfolio</h1>
        <p className="text-xs text-slate-500 mt-0.5 font-medium">Track your assets, performance and allocation</p>
      </motion.div>

      <motion.div initial="hidden" animate="visible" variants={stagger}
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
        {summaryCards.map((c) => (
          <motion.div key={c.label} variants={fadeUp}>
            <PortfolioCard {...c} />
          </motion.div>
        ))}
      </motion.div>

      <motion.div initial="hidden" animate="visible" variants={stagger}
        className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
        <motion.div variants={fadeUp} className="lg:col-span-2">
          <HoldingsTable />
        </motion.div>
        <motion.div variants={fadeUp}>
          <PortfolioChart />
        </motion.div>
      </motion.div>

      {/* Insights */}
      <motion.div initial="hidden" animate="visible" variants={stagger}>
        <motion.div variants={fadeUp} className="flex items-center gap-2 mb-3.5">
          <Lightbulb size={13} className="text-rose-400" />
          <h2 className="text-sm font-bold text-white">Portfolio Insights</h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {insights.map((ins) => (
            <motion.div
              key={ins.title}
              variants={fadeUp}
              whileHover={{ y: -2, borderColor: ins.accent.hover }}
              className={`bg-[#0a1628]/88 border ${ins.accent.border} rounded-2xl p-5 backdrop-blur-2xl shadow-[0_4px_28px_rgba(0,0,0,0.28)] transition-all duration-300`}
            >
              <div className={`w-8 h-8 rounded-xl ${ins.accent.bg} border ${ins.accent.border} flex items-center justify-center mb-3.5`}>
                <ins.icon size={14} className={ins.accent.icon} />
              </div>
              <p className="text-sm font-bold text-white mb-1.5">{ins.title}</p>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">{ins.body}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

    </div>
  )
}
