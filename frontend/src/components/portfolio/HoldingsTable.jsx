import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AlertTriangle, BarChart2, PieChart, TrendingDown, TrendingUp } from 'lucide-react'
import { formatCurrency, formatPercent, formatDateTime, formatNumber, getValidNumber } from '../../utils/formatters'
import { Badge, Button, EmptyState } from '../ui'

const fmt  = formatCurrency
const fmtP = (value) => formatPercent(value, 1)

const assetColors = {
  BTC: '#f97316', ETH: '#6366f1', SOL: '#8b5cf6',
  XAU: '#eab308', AAPL: '#64748b',
}

export default function HoldingsTable({ holdings = [], loading = false }) {
  const hasHoldings = Array.isArray(holdings) && holdings.length > 0

  return (
    <motion.div
      whileHover={{ borderColor: 'rgba(225,29,72,0.12)' }}
      className="bg-app-surface border border-white/[0.07] rounded-card p-5 backdrop-blur-card shadow-card transition-all duration-300"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart2 size={13} className="text-rose-400" />
          <h2 className="text-body font-bold text-white">Holdings</h2>
        </div>
        <span className="text-caption text-white/30 font-bold">
          {loading ? 'Chargement…' : `${holdings.length} actifs`}
        </span>
      </div>

      {/* Loading skeleton */}
      {loading && !hasHoldings && (
        <div className="space-y-1.5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-white/[0.02] border border-white/[0.04] animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !hasHoldings && (
        <EmptyState
          icon={PieChart}
          title="Aucune position ouverte"
          description="Ajoutez des actifs à votre portfolio pour les suivre ici"
          action={
            <Button as={Link} to="/trading" variant="secondary" size="sm">
              Commencer à trader
            </Button>
          }
        />
      )}

      {/* Table — overflow-x-auto pour mobile */}
      {hasHoldings && (
        <div className="overflow-x-auto">
          <div className="min-w-[640px]">
            {/* Column headers */}
            <div className="hidden md:grid grid-cols-6 px-3 mb-2 text-caption text-white/25 uppercase tracking-[0.1em] font-black">
              <span className="col-span-2">Actif</span>
              <span className="text-right">Prix moyen</span>
              <span className="text-right">Prix actuel</span>
              <span className="text-right">Valeur</span>
              <span className="text-right">P&amp;L</span>
            </div>

            <div className="space-y-1.5">
              {holdings.map((h, i) => {
                const priceAvailable = h.priceAvailable !== false
                const priceMeta      = h.priceMeta || {}
                const profit         = getValidNumber(h.profit)
                const hasProfit      = priceAvailable && profit !== null
                const up             = hasProfit ? profit >= 0 : true
                const color          = assetColors[h.symbol] || '#6366f1'
                const quantity       = getValidNumber(h.quantity)
                const warningText    = Array.isArray(h.warnings) && h.warnings.length > 0
                  ? h.warnings.join(' ')
                  : h.warning || h.priceError || ''
                const rowKey         = h._id || `${h.symbol || 'holding'}-${i}`

                return (
                  <motion.div
                    key={rowKey}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.055 }}
                    whileHover={{ x: 2, backgroundColor: 'rgba(225,29,72,0.03)' }}
                    className="grid grid-cols-3 md:grid-cols-6 items-center px-3 py-3
                               bg-white/[0.02] border border-white/[0.045] rounded-xl
                               transition-all duration-200 gap-2 md:gap-0"
                  >
                    {/* Actif */}
                    <div className="flex items-center gap-2.5 col-span-1 md:col-span-2">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black shrink-0"
                        style={{ background: `${color}16`, border: `1px solid ${color}28`, color }}
                      >
                        {(h.symbol || '--').slice(0, 2)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="text-body font-bold text-white">{h.symbol || '--'}</p>
                          {!priceAvailable && (
                            <AlertTriangle size={11} className="text-amber-400/80 shrink-0" />
                          )}
                        </div>
                        <p className="text-caption text-white/30 font-medium">
                          {formatNumber(quantity)} {h.symbol || ''} · {h.name || h.type || 'Asset'}
                        </p>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {priceAvailable && priceMeta.isLive && !priceMeta.fallback && !priceMeta.isStale && (
                            <Badge variant="success" size="sm">Live</Badge>
                          )}
                          {priceAvailable && !priceMeta.isLive && !priceMeta.cached && !priceMeta.fallback && !priceMeta.isStale && (
                            <Badge variant="neutral" size="sm">Delayed</Badge>
                          )}
                          {priceMeta.cached  && <Badge variant="neutral" size="sm">Cached</Badge>}
                          {priceMeta.fallback && <Badge variant="warning" size="sm">Fallback</Badge>}
                          {priceMeta.isStale  && <Badge variant="warning" size="sm">Stale</Badge>}
                          {!priceAvailable    && <Badge variant="danger"  size="sm">Unavailable</Badge>}
                        </div>
                      </div>
                    </div>

                    {/* Prix moyen */}
                    <span className="hidden md:block text-body-sm text-white/40 text-right tabular-nums font-medium">
                      {fmt(h.averagePrice ?? h.avgPrice)}
                    </span>

                    {/* Prix actuel */}
                    <span
                      className={`text-body-sm text-right font-bold col-span-1 tabular-nums ${
                        priceAvailable ? 'text-white/70' : 'text-amber-400/75'
                      }`}
                      title={warningText || undefined}
                    >
                      {priceAvailable ? fmt(h.currentPrice) : 'N/A'}
                    </span>

                    {/* Valeur */}
                    <span className="hidden md:block text-body-sm text-white font-black text-right tabular-nums">
                      {priceAvailable ? fmt(h.currentValue) : '--'}
                    </span>

                    {/* P&L */}
                    <div className="flex flex-col items-end col-span-1">
                      <span className={`text-body-sm font-black flex items-center gap-0.5 tabular-nums ${
                        hasProfit ? (up ? 'text-emerald-400' : 'text-rose-400') : 'text-white/25'
                      }`}>
                        {hasProfit && (up ? <TrendingUp size={10} /> : <TrendingDown size={10} />)}
                        {hasProfit ? fmt(Math.abs(profit)) : '--'}
                      </span>
                      <span className={`text-caption font-bold ${
                        hasProfit ? (up ? 'text-emerald-500/70' : 'text-rose-500/70') : 'text-white/20'
                      }`}>
                        {hasProfit ? fmtP(h.profitPercent) : '--'}
                      </span>
                    </div>

                    {/* Meta row */}
                    <div className="col-span-3 md:col-span-6 mt-1 pt-2 border-t border-white/[0.035]
                                    grid grid-cols-1 md:grid-cols-4 gap-1.5 text-caption font-medium">
                      <span className="text-white/20">
                        Provider <span className="text-white/35">{priceMeta.provider || h.priceProvider || '--'}</span>
                      </span>
                      <span className="text-white/20">
                        Source <span className="text-white/35">{priceMeta.source || h.priceSource || '--'}</span>
                      </span>
                      <span className="text-white/20">
                        Horodatage <span className="text-white/35">{formatDateTime(priceMeta.fetchedAt || h.priceFetchedAt)}</span>
                      </span>
                      <span className="text-white/20">
                        Investi <span className="text-white/35 tabular-nums">{fmt(h.investedValue ?? h.costBasis)}</span>
                      </span>
                      {warningText && (
                        <p className="md:col-span-4 text-amber-400/70 font-semibold">{warningText}</p>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}
