import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Activity, AlertTriangle } from 'lucide-react'
import { getValidNumber, formatPrice, formatPercent, formatDateTime } from '../../utils/formatters'
import Card from '../ui/Card'
import Badge from '../ui/Badge'

const assetColors = ['#f97316', '#6366f1', '#8b5cf6', '#eab308', '#64748b', '#06b6d4']

const formatChange = (change) => formatPercent(change, 1)

const normalizeMarkets = (markets) => {
  if (!Array.isArray(markets) || markets.length === 0) return []

  return markets.slice(0, 6).map((market, index) => {
    const price = getValidNumber(market.price)
    const change = getValidNumber(market.change24h ?? market.changePercent)
    const priceAvailable = market.priceAvailable === true && price !== null
    const fallback = market.fallback === true
    const isStale = market.stale === true || market.isStale === true || fallback || !priceAvailable
    const isLive = market.isLive === true && priceAvailable && !fallback && !isStale

    return {
      symbol: market.symbol || 'N/A',
      name: market.name || market.type || 'Market asset',
      type: market.type || 'unknown',
      price,
      change,
      up: (change ?? 0) >= 0,
      color: assetColors[index % assetColors.length],
      source: market.source || null,
      provider: market.provider || null,
      timestamp: market.fetchedAt || market.timestamp || null,
      cached: market.cached === true,
      fallback,
      stale: market.stale === true,
      isStale,
      isLive,
      priceAvailable,
      error: market.error || null,
    }
  })
}

export default function MarketOverview({ markets = [], loading = false, dataQuality = null }) {
  const assets = normalizeMarkets(markets)
  const hasQualityIssue = dataQuality?.hasErrors || dataQuality?.hasFallbacks || dataQuality?.hasStale || dataQuality?.hasUnavailable
  const statusLabel = loading
    ? 'Loading'
    : assets.length === 0
      ? 'Unavailable'
      : hasQualityIssue
        ? 'Partial'
        : 'Backend live'
  const statusVariant = assets.length > 0 && !hasQualityIssue
    ? 'success'
    : hasQualityIssue
      ? 'warning'
      : 'neutral'

  return (
    <motion.div
      whileHover={{ borderColor: 'rgba(225,29,72,0.12)' }}
      className="bg-app-surface border border-white/[0.07] rounded-card p-5 backdrop-blur-card shadow-card transition-all duration-300"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity size={13} className="text-rose-400" />
          <h2 className="text-body font-bold text-white">Market Overview</h2>
        </div>
        <Badge variant={statusVariant} size="sm">{statusLabel}</Badge>
      </div>

      <div className="space-y-1.5">
        {assets.length > 0 ? assets.map((a, i) => (
          <motion.div
            key={`${a.symbol}-${i}`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05, duration: 0.3 }}
            whileHover={{ x: 2, backgroundColor: 'rgba(225,29,72,0.03)' }}
            className="px-3 py-2.5 bg-white/[0.02] border border-white/[0.045] rounded-xl transition-all duration-200 cursor-default"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-caption font-black shrink-0"
                  style={{ background: `${a.color}16`, border: `1px solid ${a.color}28`, color: a.color }}
                >
                  {a.symbol.slice(0, 2)}
                </div>
                <div>
                  <p className="text-body font-bold text-white">{a.symbol}</p>
                  <p className="text-caption text-slate-700">{a.name}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-body font-bold tabular-nums ${a.priceAvailable ? 'text-white' : 'text-amber-400/80'}`}>{formatPrice(a.price)}</p>
                <p className={`text-body-sm font-bold flex items-center justify-end gap-0.5 ${a.up ? 'text-emerald-400' : 'text-red-400'}`}>
                  {a.up ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                  {formatChange(a.change)}
                </p>
              </div>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-1">
              {a.isLive && <Badge variant="success" size="sm">Live</Badge>}
              {a.cached && !a.isLive && <Badge variant="neutral" size="sm">Cached</Badge>}
              {a.fallback && <Badge variant="warning" size="sm">Fallback</Badge>}
              {a.isStale && !a.fallback && a.priceAvailable && <Badge variant="warning" size="sm">Stale</Badge>}
              {!a.priceAvailable && <Badge variant="danger" size="sm">Unavailable</Badge>}
              <span className="text-caption text-slate-700 ml-auto">{a.provider || a.source || '--'} - {formatDateTime(a.timestamp)}</span>
            </div>
            {a.error && <p className="mt-1 text-caption text-amber-400/80 font-semibold flex items-center gap-1"><AlertTriangle size={10} />{a.error}</p>}
          </motion.div>
        )) : (
          <div className="py-10 text-center">
            <Activity size={16} className="text-slate-700 mx-auto mb-3" />
            <p className="text-body-sm text-slate-600 font-medium">{loading ? 'Loading market quotes...' : 'No backend market quotes available.'}</p>
          </div>
        )}
      </div>
    </motion.div>
  )
}
