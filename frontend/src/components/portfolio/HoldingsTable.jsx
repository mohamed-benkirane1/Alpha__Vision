import { motion } from 'framer-motion'
import { AlertTriangle, TrendingUp, TrendingDown, BarChart2 } from 'lucide-react'

const getValidNumber = (value) => {
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

const fmt = (value) => {
  const number = getValidNumber(value)
  if (number === null) return '--'

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(number)
}

const fmtP = (value) => {
  const number = getValidNumber(value)
  if (number === null) return 'N/A'

  return `${number > 0 ? '+' : ''}${number.toFixed(1)}%`
}

const assetColors = {
  BTC: '#f97316', ETH: '#6366f1', SOL: '#8b5cf6',
  XAU: '#eab308', AAPL: '#64748b',
}

export default function HoldingsTable({ holdings = [], loading = false }) {
  const hasHoldings = Array.isArray(holdings) && holdings.length > 0

  return (
    <motion.div
      whileHover={{ borderColor: 'rgba(225,29,72,0.12)' }}
      className="bg-[#0a1628]/88 border border-white/[0.07] rounded-2xl p-5 backdrop-blur-2xl shadow-[0_4px_28px_rgba(0,0,0,0.32)] transition-all duration-300"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart2 size={13} className="text-rose-400" />
          <h2 className="text-sm font-bold text-white">Holdings</h2>
        </div>
        <span className="text-[10px] text-slate-700 font-bold">{loading ? 'Loading' : `${holdings.length} assets`}</span>
      </div>

      <div className="hidden md:grid grid-cols-6 px-3 mb-2 text-[10px] text-slate-700 uppercase tracking-[0.1em] font-black">
        <span className="col-span-2">Asset</span>
        <span className="text-right">Avg Price</span>
        <span className="text-right">Current</span>
        <span className="text-right">Value</span>
        <span className="text-right">P&amp;L</span>
      </div>

      <div className="space-y-1.5">
        {hasHoldings ? (
          holdings.map((h, i) => {
            const priceAvailable = h.priceAvailable !== false
            const profit = getValidNumber(h.profit)
            const hasProfit = priceAvailable && profit !== null
            const up = hasProfit ? profit >= 0 : true
            const color = assetColors[h.symbol] || '#6366f1'
            const quantity = getValidNumber(h.quantity)
            const rowKey = h._id || `${h.symbol || 'holding'}-${i}`

            return (
              <motion.div
                key={rowKey}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.055 }}
                whileHover={{ x: 2, backgroundColor: 'rgba(225,29,72,0.03)' }}
                className="grid grid-cols-3 md:grid-cols-6 items-center px-3 py-2.5 bg-white/[0.02] border border-white/[0.045] rounded-xl transition-all duration-200 gap-2 md:gap-0"
              >
                <div className="flex items-center gap-2.5 col-span-1 md:col-span-2">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black shrink-0"
                    style={{ background: `${color}16`, border: `1px solid ${color}28`, color }}
                  >
                    {(h.symbol || '--').slice(0, 2)}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-bold text-white">{h.symbol || '--'}</p>
                      {!priceAvailable && (
                        <AlertTriangle
                          size={11}
                          className="text-amber-400/80 shrink-0"
                          aria-label="Price unavailable"
                        />
                      )}
                    </div>
                    <p className="text-[10px] text-slate-700 font-medium">
                      {quantity === null ? '--' : quantity} {h.symbol || ''}
                    </p>
                    {!priceAvailable && (
                      <p className="text-[10px] text-amber-400/70 font-semibold md:hidden">
                        Price unavailable
                      </p>
                    )}
                  </div>
                </div>

                <span className="hidden md:block text-xs text-slate-600 text-right tabular-nums font-medium">{fmt(h.avgPrice)}</span>
                <span
                  className={`text-xs text-right font-bold col-span-1 tabular-nums ${priceAvailable ? 'text-slate-300' : 'text-amber-400/75'}`}
                  title={!priceAvailable ? h.warning || 'Price unavailable' : undefined}
                >
                  {priceAvailable ? fmt(h.currentPrice) : '--'}
                </span>
                <span className="hidden md:block text-xs text-white font-black text-right tabular-nums">{priceAvailable ? fmt(h.currentValue) : '--'}</span>

                <div className="flex flex-col items-end col-span-1">
                  <span className={`text-xs font-black flex items-center gap-0.5 tabular-nums ${hasProfit ? (up ? 'text-emerald-400' : 'text-rose-400') : 'text-slate-600'}`}>
                    {hasProfit && (up ? <TrendingUp size={10} /> : <TrendingDown size={10} />)}
                    {hasProfit ? fmt(Math.abs(profit)) : '--'}
                  </span>
                  <span className={`text-[10px] font-bold ${hasProfit ? (up ? 'text-emerald-500/80' : 'text-rose-500/80') : 'text-slate-700'}`}>
                    {hasProfit ? fmtP(h.profitPercent) : '--'}
                  </span>
                </div>
              </motion.div>
            )
          })
        ) : (
          <div className="py-10 text-center">
            <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto mb-3">
              <BarChart2 size={16} className="text-slate-700" />
            </div>
            <p className="text-xs text-slate-600 font-medium">
              {loading ? 'Loading holdings...' : 'No holdings yet.'}
            </p>
            <p className="text-[11px] text-slate-700 mt-1">
              {loading ? 'Portfolio data is being loaded from the backend.' : 'Holdings will appear here after real trades create portfolio positions.'}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  )
}
