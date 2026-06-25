import { motion } from 'framer-motion'
import { AlertTriangle, TrendingUp, TrendingDown, BarChart2 } from 'lucide-react'
import { formatCurrency, formatPercent, formatDateTime, formatNumber } from '../../utils/formatters'

const fmt  = formatCurrency
const fmtP = (value) => formatPercent(value, 1)

const assetColors = {
  BTC: '#f97316', ETH: '#6366f1', SOL: '#8b5cf6',
  XAU: '#eab308', AAPL: '#64748b',
}

function StatusBadge({ label, tone = 'slate' }) {
  const tones = {
    emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    amber: 'bg-amber-500/10 border-amber-500/22 text-amber-400',
    rose: 'bg-rose-500/10 border-rose-500/22 text-rose-400',
    slate: 'bg-white/[0.03] border-white/[0.07] text-slate-500',
  }

  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.08em] ${tones[tone] || tones.slate}`}>
      {label}
    </span>
  )
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
            const priceMeta = h.priceMeta || {}
            const profit = getValidNumber(h.profit)
            const hasProfit = priceAvailable && profit !== null
            const up = hasProfit ? profit >= 0 : true
            const color = assetColors[h.symbol] || '#6366f1'
            const quantity = getValidNumber(h.quantity)
            const warningText = Array.isArray(h.warnings) && h.warnings.length > 0
              ? h.warnings.join(' ')
              : h.warning || h.priceError || ''
            const rowKey = h._id || `${h.symbol || 'holding'}-${i}`

            return (
              <motion.div
                key={rowKey}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.055 }}
                whileHover={{ x: 2, backgroundColor: 'rgba(225,29,72,0.03)' }}
                className="grid grid-cols-3 md:grid-cols-6 items-center px-3 py-3 bg-white/[0.02] border border-white/[0.045] rounded-xl transition-all duration-200 gap-2 md:gap-0"
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
                      {formatNumber(quantity)} {h.symbol || ''} · {h.name || h.type || 'Asset'}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {priceAvailable && priceMeta.isLive && !priceMeta.fallback && !priceMeta.isStale && <StatusBadge label="Live" tone="emerald" />}
                      {priceAvailable && !priceMeta.isLive && !priceMeta.cached && !priceMeta.fallback && !priceMeta.isStale && <StatusBadge label="Delayed" />}
                      {priceMeta.cached && <StatusBadge label="Cached" />}
                      {priceMeta.fallback && <StatusBadge label="Fallback" tone="amber" />}
                      {priceMeta.isStale && <StatusBadge label="Stale" tone="amber" />}
                      {!priceAvailable && <StatusBadge label="Unavailable" tone="rose" />}
                    </div>
                  </div>
                </div>

                <span className="hidden md:block text-xs text-slate-600 text-right tabular-nums font-medium">{fmt(h.averagePrice ?? h.avgPrice)}</span>
                <span
                  className={`text-xs text-right font-bold col-span-1 tabular-nums ${priceAvailable ? 'text-slate-300' : 'text-amber-400/75'}`}
                  title={warningText || undefined}
                >
                  {priceAvailable ? fmt(h.currentPrice) : 'Unavailable'}
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
                <div className="col-span-3 md:col-span-6 mt-1 pt-2 border-t border-white/[0.035] grid grid-cols-1 md:grid-cols-4 gap-1.5 text-[10px] font-medium">
                  <span className="text-slate-700">
                    Provider <span className="text-slate-500">{priceMeta.provider || h.priceProvider || h.priceSource || '--'}</span>
                  </span>
                  <span className="text-slate-700">
                    Source <span className="text-slate-500">{priceMeta.source || h.priceSource || '--'}</span>
                  </span>
                  <span className="text-slate-700">
                    Price time <span className="text-slate-500">{formatDateTime(priceMeta.fetchedAt || h.priceFetchedAt || h.priceTimestamp)}</span>
                  </span>
                  <span className="text-slate-700">
                    Invested <span className="text-slate-500 tabular-nums">{fmt(h.investedValue ?? h.costBasis)}</span>
                  </span>
                  {warningText && (
                    <p className="md:col-span-4 text-amber-400/75 font-semibold">{warningText}</p>
                  )}
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
