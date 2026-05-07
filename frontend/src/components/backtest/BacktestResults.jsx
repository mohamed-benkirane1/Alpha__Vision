import { motion } from 'framer-motion'
import { TrendingUp, Target, BarChart2, CheckCircle, DollarSign } from 'lucide-react'

const fmt = (n) => `$${Math.round(n).toLocaleString()}`

export default function BacktestResults({ results, symbol, strategy }) {
  const { finalCapital, profit, returnPct, winRate, totalTrades, wins, losses } = results

  const stats = [
    { label: 'Final Capital', value: fmt(finalCapital),           color: 'text-white',       icon: DollarSign  },
    { label: 'Total Profit',  value: `+${fmt(profit)}`,           color: 'text-emerald-400', icon: TrendingUp  },
    { label: 'Return',        value: `+${returnPct.toFixed(1)}%`, color: 'text-emerald-400', icon: TrendingUp  },
    { label: 'Win Rate',      value: `${winRate.toFixed(0)}%`,    color: 'text-indigo-400',  icon: Target      },
    { label: 'Total Trades',  value: totalTrades,                 color: 'text-white',       icon: BarChart2   },
    { label: 'Wins / Losses', value: `${wins} / ${losses}`,       color: 'text-white',       icon: CheckCircle },
  ]

  return (
    <motion.div
      whileHover={{ borderColor: 'rgba(99,102,241,0.14)' }}
      className="bg-[#0a1628]/88 border border-white/[0.07] rounded-2xl p-5 backdrop-blur-2xl shadow-[0_4px_28px_rgba(0,0,0,0.32)] transition-all duration-300"
    >
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm font-bold text-white">Backtest Results</h2>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-slate-600 bg-white/[0.03] border border-white/[0.06] px-2 py-0.5 rounded-lg font-bold">{symbol}</span>
          <span className="text-[10px] text-indigo-400 bg-indigo-500/10 border border-indigo-500/22 px-2 py-0.5 rounded-lg capitalize font-black">{strategy}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.07, type: 'spring', stiffness: 180 }}
            whileHover={{ backgroundColor: 'rgba(255,255,255,0.04)' }}
            className="bg-white/[0.025] border border-white/[0.06] rounded-xl p-3.5 transition-colors"
          >
            <div className="flex items-center gap-1.5 mb-2">
              <s.icon size={10} className="text-slate-600" />
              <p className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">{s.label}</p>
            </div>
            <p className={`text-base font-black tabular-nums ${s.color}`}>{s.value}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
