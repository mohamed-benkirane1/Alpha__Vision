import { motion } from 'framer-motion'
import { PieChart } from 'lucide-react'

const allocation = [
  { label: 'Crypto', value: '$18,234', pct: 73, bar: 'bg-indigo-500',  dot: 'bg-indigo-400'  },
  { label: 'Stocks', value: '$4,890',  pct: 20, bar: 'bg-violet-500',  dot: 'bg-violet-400'  },
  { label: 'Cash',   value: '$1,732',  pct: 7,  bar: 'bg-slate-500',   dot: 'bg-slate-400'   },
]

function PortfolioSummary() {
  return (
    <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-5 backdrop-blur-xl">
      <div className="flex items-center gap-2 mb-5">
        <PieChart size={13} className="text-indigo-400" />
        <h2 className="text-sm font-semibold text-white">Portfolio Allocation</h2>
      </div>

      {/* Stacked progress bar */}
      <div className="h-3 rounded-full overflow-hidden flex gap-0.5 mb-6">
        {allocation.map((a) => (
          <motion.div
            key={a.label}
            initial={{ width: 0 }}
            animate={{ width: `${a.pct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className={`${a.bar} rounded-full`}
          />
        ))}
      </div>

      <div className="space-y-3.5">
        {allocation.map((a) => (
          <div key={a.label} className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className={`w-2.5 h-2.5 rounded-full ${a.dot} shadow-[0_0_6px_currentColor]`} />
              <span className="text-sm text-slate-300 font-medium">{a.label}</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div className={`h-full ${a.bar} rounded-full`} style={{ width: `${a.pct}%` }} />
              </div>
              <span className="text-xs text-slate-500 w-7 text-right font-medium">{a.pct}%</span>
              <span className="text-sm text-white font-semibold w-16 text-right">{a.value}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 pt-4 border-t border-slate-700/40 flex justify-between items-center">
        <span className="text-xs text-slate-500">Total portfolio value</span>
        <span className="text-base font-bold text-white">$24,856.40</span>
      </div>
    </div>
  )
}

export default PortfolioSummary
