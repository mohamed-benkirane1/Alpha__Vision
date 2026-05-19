import { motion } from 'framer-motion'
import { PieChart } from 'lucide-react'

const defaultAllocation = [
  { label: 'Crypto', value: '$18,234', pct: 73, color: '#e11d48', glow: 'rgba(225,29,72,0.50)'  },
  { label: 'Stocks', value: '$4,890',  pct: 20, color: '#64748b', glow: 'rgba(100,116,139,0.45)' },
  { label: 'Cash',   value: '$1,732',  pct:  7, color: '#334155', glow: 'rgba(51,65,85,0.3)'    },
]

const colors = [
  { color: '#e11d48', glow: 'rgba(225,29,72,0.50)' },
  { color: '#64748b', glow: 'rgba(100,116,139,0.45)' },
  { color: '#334155', glow: 'rgba(51,65,85,0.3)' },
  { color: '#06b6d4', glow: 'rgba(6,182,212,0.35)' },
  { color: '#8b5cf6', glow: 'rgba(139,92,246,0.35)' },
]

const toNumber = (value) => {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(toNumber(value))

const buildAllocation = (portfolio, loading) => {
  if (loading || !portfolio) return defaultAllocation

  const holdings = Array.isArray(portfolio.holdings) ? portfolio.holdings : []
  const total = toNumber(portfolio.totalValue)
  if (holdings.length === 0 || total <= 0) return []

  return holdings.slice(0, 5).map((holding, index) => {
    const value = toNumber(holding.currentValue)
    const pct = Math.max(1, Math.round((value / total) * 100))
    const palette = colors[index % colors.length]

    return {
      label: holding.symbol,
      value: formatCurrency(value),
      pct,
      ...palette,
    }
  })
}

export default function PortfolioSummary({ portfolio = null, loading = false }) {
  const allocation = buildAllocation(portfolio, loading)
  const totalValue = portfolio ? portfolio.totalValue : 24856.40

  return (
    <motion.div
      whileHover={{ borderColor: 'rgba(225,29,72,0.12)' }}
      className="bg-[#0a1628]/88 border border-white/[0.07] rounded-2xl p-5 backdrop-blur-2xl shadow-[0_4px_28px_rgba(0,0,0,0.32)] transition-all duration-300"
    >
      <div className="flex items-center gap-2 mb-5">
        <PieChart size={13} className="text-rose-400" />
        <h2 className="text-sm font-bold text-white">Portfolio Allocation</h2>
      </div>

      {/* Stacked animated bar */}
      <div className="h-3 rounded-full overflow-hidden flex gap-0.5 mb-6 bg-slate-800/60">
        {allocation.length > 0 ? (
          allocation.map((a) => (
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
          ))
        ) : (
          <div className="h-full w-full bg-white/[0.04]" />
        )}
      </div>

      <div className="space-y-4">
        {allocation.length > 0 ? (
          allocation.map((a, i) => (
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
          ))
        ) : (
          <p className="text-sm text-slate-600 font-medium">No holdings yet</p>
        )}
      </div>

      <div className="mt-5 pt-4 border-t border-white/[0.05] flex justify-between items-center">
        <span className="text-xs text-slate-700 font-medium">Total portfolio value</span>
        <span className="text-base font-black text-white tabular-nums">{formatCurrency(totalValue)}</span>
      </div>
    </motion.div>
  )
}
