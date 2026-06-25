import { motion } from 'framer-motion'
import { ClipboardList, History } from 'lucide-react'
import { formatCurrency, formatNumber, formatDateTime } from '../../utils/formatters'
import Card      from '../ui/Card'
import EmptyState from '../ui/EmptyState'

const formatQuantity = (value) => formatNumber(value, 8)

const normalizeTrades = (trades) => {
  if (!Array.isArray(trades) || trades.length === 0) return []
  return trades.slice(0, 5).map((trade) => ({
    id:            trade._id || `${trade.symbol}-${trade.createdAt}`,
    symbol:        trade.symbol || 'N/A',
    type:          trade.type || '--',
    quantity:      trade.quantity,
    price:         trade.executedPrice ?? trade.price,
    total:         trade.total,
    createdAt:     trade.createdAt,
    priceSource:   trade.priceSource || null,
    priceProvider: trade.priceProvider || null,
  }))
}

export default function RecentTrades({ trades = [], loading = false }) {
  const entries = normalizeTrades(trades)

  return (
    <motion.div
      whileHover={{ borderColor: 'rgba(225,29,72,0.12)' }}
      className="bg-app-surface border border-white/[0.07] rounded-card p-5 backdrop-blur-card shadow-card transition-all duration-300"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ClipboardList size={13} className="text-rose-400" />
          <h2 className="text-body font-bold text-white">Trades récents</h2>
        </div>
        <span className="text-caption text-white/30 font-bold">
          {loading ? 'Chargement…' : `${entries.length} trades`}
        </span>
      </div>

      {/* En-têtes colonnes */}
      {entries.length > 0 && (
        <div className="hidden sm:grid grid-cols-5 px-3 mb-2 text-caption text-white/25 uppercase tracking-[0.1em] font-black">
          <span>Actif</span>
          <span>Type</span>
          <span>Quantité</span>
          <span>Prix exec.</span>
          <span className="text-right">Total / Heure</span>
        </div>
      )}

      <div className="space-y-1.5">
        {/* ── Empty state ───────────────────────────────────────────────── */}
        {!loading && entries.length === 0 && (
          <EmptyState
            icon={History}
            title="Aucun trade récent"
            description="Vos dernières transactions apparaîtront ici"
          />
        )}

        {/* ── Loading skeleton ──────────────────────────────────────────── */}
        {loading && entries.length === 0 && (
          <div className="space-y-1.5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 rounded-xl bg-white/[0.02] border border-white/[0.04] animate-pulse" />
            ))}
          </div>
        )}

        {/* ── Rows ──────────────────────────────────────────────────────── */}
        {entries.map((t, i) => (
          <motion.div
            key={t.id || `${t.symbol}-${i}`}
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-20px' }}
            transition={{ delay: i * 0.07, duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{
              x: 1.5,
              backgroundColor: t.type === 'BUY' ? 'rgba(16,185,129,0.035)' : 'rgba(225,29,72,0.035)',
            }}
            className="grid grid-cols-3 sm:grid-cols-5 items-center px-3 py-2.5
                       bg-white/[0.02] border border-white/[0.045] rounded-xl
                       transition-all duration-200 text-body-sm gap-2 sm:gap-0"
          >
            {/* Actif */}
            <div className="flex items-center gap-2.5">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 ${
                t.type === 'BUY'
                  ? 'bg-emerald-500/8 border border-emerald-500/16 text-emerald-400'
                  : 'bg-rose-500/8 border border-rose-500/16 text-rose-400'
              }`}>
                {t.symbol.slice(0, 2)}
              </div>
              <span className="text-white font-bold">{t.symbol}</span>
            </div>

            {/* Type */}
            <span className={`hidden sm:inline-flex w-fit px-2.5 py-0.5 rounded-lg text-caption font-black ${
              t.type === 'BUY'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/18'
                : 'bg-red-500/10 text-red-400 border border-red-500/18'
            }`}>
              {t.type}
            </span>

            {/* Quantité */}
            <span className="hidden sm:block text-white/40 font-medium tabular-nums">
              {formatQuantity(t.quantity)} {t.symbol}
            </span>

            {/* Prix */}
            <span className="text-white/60 text-right sm:text-left font-medium tabular-nums">
              {formatCurrency(t.price)}
            </span>

            {/* Total + heure */}
            <div className="flex flex-col items-end">
              <span className="text-white font-black tabular-nums">{formatCurrency(t.total)}</span>
              <span className="text-caption text-white/30 font-medium">{formatDateTime(t.createdAt)}</span>
              {(t.priceProvider || t.priceSource) && (
                <span className="text-[9px] text-white/20 font-medium">
                  {t.priceProvider || t.priceSource}
                </span>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
