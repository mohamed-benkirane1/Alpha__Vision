import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { motion } from 'framer-motion'
import { PieChart as PieIcon } from 'lucide-react'

const colors = [
  { color: '#f97316', glow: 'rgba(249,115,22,0.6)' },
  { color: '#8b5cf6', glow: 'rgba(139,92,246,0.6)' },
  { color: '#10b981', glow: 'rgba(16,185,129,0.6)' },
  { color: '#f59e0b', glow: 'rgba(245,158,11,0.6)' },
  { color: '#64748b', glow: 'rgba(100,116,139,0.6)' },
]

const getValidNumber = (value) => {
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

const formatCurrency = (value) => {
  const number = getValidNumber(value)
  if (number === null) return '--'

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(number)
}

const buildAllocation = (holdings, totalValue) => {
  const total = getValidNumber(totalValue)
  if (!Array.isArray(holdings) || holdings.length === 0 || total <= 0) return []

  const pricedHoldings = holdings.filter((holding) => holding.priceAvailable !== false)

  return pricedHoldings.flatMap((holding, index) => {
    const value = getValidNumber(holding.currentValue)
    if (value === null || value <= 0) return []

    const pct = total > 0 ? (value / total) * 100 : 0
    const palette = colors[index % colors.length]
    const name = holding.symbol || '--'

    return {
      key: holding._id || `${name}-${index}`,
      name,
      value,
      pct: Number(pct.toFixed(1)),
      ...palette,
    }
  })
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-[#0a1628] border border-rose-500/28 rounded-xl px-3.5 py-3 text-xs shadow-[0_8px_32px_rgba(0,0,0,0.55)]">
      <p className="text-white font-black mb-1">{d.name}</p>
      <p className="text-slate-400 tabular-nums">{formatCurrency(d.value)}</p>
      <p className="text-rose-400 font-black mt-0.5">{d.pct}%</p>
    </div>
  )
}

export default function PortfolioChart({ holdings = [], totalValue = 0, loading = false }) {
  const allocation = buildAllocation(holdings, totalValue)
  const hasHoldings = Array.isArray(holdings) && holdings.length > 0
  const hasUnavailablePrices = hasHoldings && holdings.some((holding) => holding.priceAvailable === false)

  return (
    <motion.div
      whileHover={{ borderColor: 'rgba(225,29,72,0.12)' }}
      className="bg-[#0a1628]/88 border border-white/[0.07] rounded-2xl p-5 backdrop-blur-2xl shadow-[0_4px_28px_rgba(0,0,0,0.32)] transition-all duration-300"
    >
      <div className="flex items-center gap-2 mb-5">
        <PieIcon size={13} className="text-rose-400" />
        <h2 className="text-sm font-bold text-white">Allocation</h2>
      </div>

      {allocation.length > 0 ? (
        <>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={allocation}
                cx="50%"
                cy="50%"
                innerRadius={58}
                outerRadius={88}
                paddingAngle={3}
                dataKey="value"
                strokeWidth={0}
              >
                {allocation.map((entry) => (
                  <Cell
                    key={entry.key}
                    fill={entry.color}
                    opacity={0.88}
                    style={{ filter: `drop-shadow(0 0 6px ${entry.glow})` }}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          <div className="mt-4 space-y-2.5">
            {allocation.map((a, i) => (
              <motion.div
                key={a.key}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.08 }}
                className="flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: a.color, boxShadow: `0 0 5px ${a.glow}` }}
                  />
                  <span className="text-slate-400 font-medium">{a.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-20 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${a.pct}%`, backgroundColor: a.color }} />
                  </div>
                  <span className="text-slate-600 w-9 text-right font-black tabular-nums">{a.pct}%</span>
                </div>
              </motion.div>
            ))}
          </div>
        </>
      ) : (
        <div className="h-[286px] flex flex-col items-center justify-center text-center">
          <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-3">
            <PieIcon size={16} className="text-slate-700" />
          </div>
          <p className="text-xs text-slate-600 font-medium">
            {loading ? 'Loading allocation...' : (hasUnavailablePrices ? 'No priced allocation' : 'No allocation yet')}
          </p>
          <p className="text-[11px] text-slate-700 mt-1 max-w-[220px]">
            {loading
              ? 'Portfolio allocation is being loaded.'
              : (hasUnavailablePrices
                  ? 'Some prices are temporarily unavailable.'
                  : 'Allocation will be calculated from real holdings with valid values.')}
          </p>
        </div>
      )}
    </motion.div>
  )
}
