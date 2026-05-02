import { motion } from 'framer-motion'

const allocation = [
  { label: 'Crypto', value: '$18,234', pct: 73, color: 'bg-indigo-500',  dot: 'bg-indigo-400'  },
  { label: 'Stocks', value: '$4,890',  pct: 20, color: 'bg-violet-500',  dot: 'bg-violet-400'  },
  { label: 'Cash',   value: '$1,732',  pct: 7,  color: 'bg-gray-600',    dot: 'bg-gray-400'    },
]

function PortfolioSummary() {
  return (
    <div className="bg-gray-900/50 border border-gray-800/60 rounded-xl p-5 backdrop-blur-sm">
      <h2 className="text-sm font-semibold text-white mb-5">Portfolio Allocation</h2>

      {/* Stacked bar */}
      <div className="h-2.5 rounded-full overflow-hidden flex mb-5 gap-0.5">
        {allocation.map((a) => (
          <motion.div
            key={a.label}
            initial={{ width: 0 }}
            animate={{ width: `${a.pct}%` }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className={`${a.color} rounded-full`}
          />
        ))}
      </div>

      {/* Allocation rows */}
      <div className="space-y-3">
        {allocation.map((a) => (
          <div key={a.label} className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className={`w-2 h-2 rounded-full ${a.dot}`} />
              <span className="text-sm text-gray-400">{a.label}</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-24 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className={`h-full ${a.color} rounded-full`}
                  style={{ width: `${a.pct}%` }}
                />
              </div>
              <span className="text-xs text-gray-500 w-7 text-right">{a.pct}%</span>
              <span className="text-sm text-white font-medium w-16 text-right">{a.value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="mt-5 pt-4 border-t border-gray-800/70 flex justify-between">
        <span className="text-xs text-gray-500">Total value</span>
        <span className="text-sm font-bold text-white">$24,856.40</span>
      </div>
    </div>
  )
}

export default PortfolioSummary
