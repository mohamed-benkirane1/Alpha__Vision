import { motion } from 'framer-motion'
import { PieChart } from 'lucide-react'

const allocation = [
  { label: 'Crypto', value: '$18,234', pct: 73, color: '#e11d48', glow: 'rgba(225,29,72,0.55)'   },
  { label: 'Stocks', value: '$4,890',  pct: 20, color: '#f59e0b', glow: 'rgba(245,158,11,0.55)' },
  { label: 'Cash',   value: '$1,732',  pct:  7, color: '#334155', glow: 'rgba(51,65,85,0.3)'    },
]

export default function PortfolioSummary() {
  return (
    <motion.div
      whileHover={{ borderColor: 'rgba(225,29,72,0.14)' }}
      className="bg-[#0d0212]/90 border border-white/[0.07] rounded-2xl p-5 backdrop-blur-2xl shadow-[0_4px_28px_rgba(0,0,0,0.32)] transition-all duration-300"
    >
      <div className="flex items-center gap-2 mb-5">
        <PieChart size={13} className="text-rose-400" />
        <h2 className="text-sm font-bold text-white">Portfolio Allocation</h2>
      </div>

      {/* Stacked animated bar */}
      <div className="h-3 rounded-full overflow-hidden flex gap-0.5 mb-6 bg-slate-800/60">
        {allocation.map((a) => (
          <motion.div
            key={a.label}
            initial={{ width: 0 }}
            animate={{ width: `${a.pct}%` }}
            transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
            className="h-full rounded-full"
            style={{
              background: a.color,
              boxShadow: `0 0 8px ${a.glow}`,
            }}
          />
        ))}
      </div>

      <div className="space-y-4">
        {allocation.map((a, i) => (
          <motion.div
            key={a.label}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 + i * 0.1 }}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-2.5">
              <div
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ background: a.color, boxShadow: `0 0 6px ${a.glow}` }}
              />
              <span className="text-sm text-slate-300 font-medium">{a.label}</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-20 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${a.pct}%`, background: a.color }}
                />
              </div>
              <span className="text-xs text-slate-600 w-7 text-right font-black">{a.pct}%</span>
              <span className="text-sm text-white font-bold w-16 text-right tabular-nums">{a.value}</span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-5 pt-4 border-t border-white/[0.05] flex justify-between items-center">
        <span className="text-xs text-slate-700 font-medium">Total portfolio value</span>
        <span className="text-base font-black text-white tabular-nums">$24,856.40</span>
      </div>
    </motion.div>
  )
}
