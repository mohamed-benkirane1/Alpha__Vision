import { motion } from 'framer-motion'
import { TrendingUp, Target, BarChart2, CheckCircle, DollarSign } from 'lucide-react'

const fmt = (n) => `$${Math.round(n).toLocaleString()}`

function BacktestResults({ results, symbol, strategy }) {
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
    <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-5 backdrop-blur-xl">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm font-semibold text-white">Backtest Results</h2>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-500 bg-slate-800/60 border border-slate-700/40 px-2 py-0.5 rounded-lg">{symbol}</span>
          <span className="text-[11px] text-indigo-400 bg-indigo-500/10 border border-indigo-500/25 px-2 py-0.5 rounded-lg capitalize font-semibold">{strategy}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.06 }}
            className="bg-slate-900/80 border border-slate-700/40 rounded-xl p-3.5 hover:border-indigo-500/20 transition-colors"
          >
            <div className="flex items-center gap-1.5 mb-2">
              <s.icon size={11} className="text-slate-500" />
              <p className="text-[11px] text-slate-500 font-medium">{s.label}</p>
            </div>
            <p className={`text-base font-bold ${s.color}`}>{s.value}</p>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export default BacktestResults
