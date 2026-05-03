import { motion } from 'framer-motion'
import { Wallet, TrendingUp, Target, Cpu, Zap } from 'lucide-react'

import StatCard         from '../components/dashboard/StatCard'
import PerformanceChart from '../components/dashboard/PerformanceChart'
import AISignalCard     from '../components/dashboard/AISignalCard'
import MarketOverview   from '../components/dashboard/MarketOverview'
import PortfolioSummary from '../components/dashboard/PortfolioSummary'
import RecentTrades     from '../components/dashboard/RecentTrades'

const stats = [
  { icon: Wallet,    label: 'Portfolio Value', value: '$24,856.40', sub: '+$1,234 today (+5.2%)', subUp: true, accentColor: 'indigo'  },
  { icon: TrendingUp, label: 'Total Profit',   value: '+$3,241.20', sub: '+15.8% all time',       subUp: true, accentColor: 'emerald' },
  { icon: Target,    label: 'Win Rate',         value: '72.4%',      sub: '48 trades completed',   subUp: true, accentColor: 'violet'  },
  { icon: Cpu,       label: 'Active Bot',       value: 'RUNNING',    sub: 'SOL/USDT · SMA strategy', subUp: true, accentColor: 'amber' },
]

const fadeUp = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35 } } }
const stagger = { visible: { transition: { staggerChildren: 0.08 } } }

function Dashboard() {
  return (
    <div className="space-y-6">

      <motion.div initial="hidden" animate="visible" variants={fadeUp}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-slate-400 mt-0.5">Real-time overview of your trading intelligence</p>
        </div>
        <span className="inline-flex items-center gap-1.5 self-start sm:self-auto bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 text-xs font-semibold px-3 py-1.5 rounded-full shadow-[0_0_12px_rgba(99,102,241,0.10)]">
          <Zap size={11} />
          Live market simulation
        </span>
      </motion.div>

      <motion.div initial="hidden" animate="visible" variants={stagger}
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((s) => (
          <motion.div key={s.label} variants={fadeUp}>
            <StatCard {...s} />
          </motion.div>
        ))}
      </motion.div>

      <motion.div initial="hidden" animate="visible" variants={stagger}
        className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div variants={fadeUp} className="lg:col-span-2">
          <PerformanceChart />
        </motion.div>
        <motion.div variants={fadeUp}>
          <AISignalCard />
        </motion.div>
      </motion.div>

      <motion.div initial="hidden" animate="visible" variants={stagger}
        className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div variants={fadeUp}><MarketOverview /></motion.div>
        <motion.div variants={fadeUp}><PortfolioSummary /></motion.div>
      </motion.div>

      <motion.div initial="hidden" animate="visible" variants={fadeUp}>
        <RecentTrades />
      </motion.div>

    </div>
  )
}

export default Dashboard
