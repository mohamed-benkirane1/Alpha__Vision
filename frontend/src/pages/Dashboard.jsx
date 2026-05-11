import { motion } from 'framer-motion'
import { Wallet, TrendingUp, Target, Cpu, Zap, Bell, Search } from 'lucide-react'

import StatCard         from '../components/dashboard/StatCard'
import PerformanceChart from '../components/dashboard/PerformanceChart'
import AISignalCard     from '../components/dashboard/AISignalCard'
import MarketOverview   from '../components/dashboard/MarketOverview'
import PortfolioSummary from '../components/dashboard/PortfolioSummary'
import RecentTrades     from '../components/dashboard/RecentTrades'

const stats = [
  { icon: Wallet,     label: 'Portfolio Value', value: '$24,856.40', sub: '+$1,234 today (+5.2%)', subUp: true,  accentColor: 'rose'    },
  { icon: TrendingUp, label: 'Total Profit',    value: '+$3,241.20', sub: '+15.8% all time',       subUp: true,  accentColor: 'emerald' },
  { icon: Target,     label: 'Win Rate',         value: '72.4%',      sub: '48 trades completed',   subUp: true,  accentColor: 'cyan'    },
  { icon: Cpu,        label: 'Active Bot',        value: 'RUNNING',    sub: 'SOL/USDT · SMA strategy', subUp: true, accentColor: 'amber'  },
]

const fadeUp  = { hidden: { opacity: 0, y: 18 }, visible: { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0.16, 1, 0.3, 1] } } }
const stagger = { visible: { transition: { staggerChildren: 0.08 } } }

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function Dashboard() {
  return (
    <div className="space-y-5">

      {/* Header */}
      <motion.div
        initial="hidden" animate="visible" variants={fadeUp}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
      >
        <div>
          <p className="text-[11px] text-slate-600 font-bold tracking-widest uppercase mb-1">{getGreeting()}, Trader</p>
          <h1 className="text-2xl font-black text-white leading-tight">Dashboard</h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">Real-time overview of your trading intelligence</p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Search */}
          <div className="hidden sm:flex items-center gap-2 bg-white/[0.04] border border-white/[0.07] rounded-xl px-3 py-2 w-44">
            <Search size={12} className="text-slate-600 shrink-0" />
            <input
              placeholder="Search…"
              className="bg-transparent text-xs text-slate-400 placeholder-slate-700 outline-none w-full font-medium"
            />
          </div>

          {/* Bell */}
          <button className="relative w-8 h-8 rounded-xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center hover:bg-white/[0.07] transition-colors">
            <Bell size={13} className="text-slate-400" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-rose-400 ring-[1.5px] ring-[#06020c]" />
          </button>

          {/* Live badge */}
          <div className="flex items-center gap-1.5 bg-rose-500/10 border border-rose-500/25 text-rose-400 text-[10px] font-black px-3 py-1.5 rounded-full shadow-[0_0_12px_rgba(225,29,72,0.10)] tracking-wider">
            <Zap size={10} />
            LIVE SIMULATION
          </div>
        </div>
      </motion.div>

      {/* Stat cards */}
      <motion.div
        initial="hidden" animate="visible" variants={stagger}
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5"
      >
        {stats.map((s) => (
          <motion.div key={s.label} variants={fadeUp}>
            <StatCard {...s} />
          </motion.div>
        ))}
      </motion.div>

      {/* Chart + AI Signal */}
      <motion.div
        initial="hidden" animate="visible" variants={stagger}
        className="grid grid-cols-1 lg:grid-cols-3 gap-3.5"
      >
        <motion.div variants={fadeUp} className="lg:col-span-2">
          <PerformanceChart />
        </motion.div>
        <motion.div variants={fadeUp} className="h-full">
          <AISignalCard />
        </motion.div>
      </motion.div>

      {/* Market + Portfolio */}
      <motion.div
        initial="hidden" animate="visible" variants={stagger}
        className="grid grid-cols-1 lg:grid-cols-2 gap-3.5"
      >
        <motion.div variants={fadeUp}><MarketOverview /></motion.div>
        <motion.div variants={fadeUp}><PortfolioSummary /></motion.div>
      </motion.div>

      {/* Recent trades */}
      <motion.div initial="hidden" animate="visible" variants={fadeUp}>
        <RecentTrades />
      </motion.div>

    </div>
  )
}
