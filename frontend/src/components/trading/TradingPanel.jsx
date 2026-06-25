import { Shield, Target, AlertTriangle, TrendingUp } from 'lucide-react'
import { motion } from 'framer-motion'
import { getValidNumber, formatCurrency, formatDateTime } from '../../utils/formatters'

const fmt = formatCurrency

export default function TradingPanel({ symbol, price, type, quote }) {
  const normalizedType = type === 'SELL' ? 'SELL' : 'BUY'
  const isLong     = normalizedType !== 'SELL'
  const validPrice = getValidNumber(price)
  const quoteFallback = quote?.fallback === true
  const quoteStale = quote?.stale === true || quote?.isStale === true
  const quoteUnavailable = quote?.priceAvailable === false || validPrice === null
  const quoteStatus = quoteUnavailable
    ? 'Unavailable'
    : quoteFallback
      ? 'Fallback'
      : quoteStale
        ? 'Stale'
        : quote?.isLive
          ? 'Live'
          : 'Backend quote'
  const stopLoss   = validPrice === null ? null : (isLong ? validPrice * 0.97 : validPrice * 1.03)
  const takeProfit = validPrice === null ? null : (isLong ? validPrice * 1.06 : validPrice * 0.94)

  const rows = [
    { label: 'Estimated Entry', value: fmt(price),      icon: TrendingUp,    color: 'text-white'      },
    { label: 'Indicative Stop', value: fmt(stopLoss),   icon: AlertTriangle, color: 'text-rose-400'   },
    { label: 'Indicative Target', value: fmt(takeProfit), icon: Target,      color: 'text-emerald-400' },
  ]

  return (
    <motion.div
      whileHover={{ borderColor: 'rgba(99,102,241,0.14)' }}
      className="bg-[#0a1628]/88 border border-white/[0.07] rounded-2xl p-5 backdrop-blur-2xl shadow-[0_4px_28px_rgba(0,0,0,0.32)] transition-all duration-300"
    >
      <div className="flex items-center gap-2 mb-4">
        <Shield size={13} className="text-indigo-400" />
        <h3 className="text-body font-bold text-white">Paper Risk Preview</h3>
        <span className={`ml-auto text-caption px-2.5 py-0.5 rounded-lg font-black ${
          isLong
            ? 'bg-emerald-500/12 text-emerald-400 border border-emerald-500/22'
            : 'bg-rose-500/12 text-rose-400 border border-rose-500/22'
        }`}>
          {normalizedType} - {symbol}
        </span>
      </div>

      <div className="space-y-3">
        {rows.map((r, i) => (
          <motion.div
            key={r.label}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
            className="flex items-center justify-between text-body-sm"
          >
            <div className="flex items-center gap-1.5 text-slate-600 font-medium">
              {r.icon && <r.icon size={10} />}
              {r.label}
            </div>
            <span className={`font-black tabular-nums ${r.color}`}>{r.value}</span>
          </motion.div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-white/[0.05]">
        <p className="text-label text-slate-600 leading-relaxed font-medium">
          Paper Trading only. The backend calculates and saves the simulated execution price.
        </p>
        <p className="text-caption text-slate-700 mt-2 font-medium">
          Price status: <span className="text-slate-500">{quoteStatus}</span>
        </p>
        <p className="text-caption text-slate-700 mt-2 font-medium">
          Quote {quote?.source || '--'} - {quote?.provider || '--'} - {formatDateTime(quote?.fetchedAt || quote?.timestamp)}
        </p>
      </div>
    </motion.div>
  )
}
