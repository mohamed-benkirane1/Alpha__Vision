import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Activity, AlertTriangle } from 'lucide-react'

const assetColors = ['#f97316', '#6366f1', '#8b5cf6', '#eab308', '#64748b', '#06b6d4']

const getValidNumber = (value) => {
  if (value === null || value === undefined || value === '') return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

const formatPrice = (price) => {
  const number = getValidNumber(price)
  if (number === null) return 'Unavailable'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: number >= 1000 ? 0 : 2,
  }).format(number)
}

const formatChange = (change) => {
  const number = getValidNumber(change)
  if (number === null) return '--'
  return `${number >= 0 ? '+' : ''}${number.toFixed(1)}%`
}

const formatDateTime = (value) => {
  if (!value) return '--'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '--'
  return new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit' }).format(date)
}

function StatusBadge({ label, tone = 'slate' }) {
  const tones = {
    emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    amber: 'bg-amber-500/10 border-amber-500/22 text-amber-400',
    rose: 'bg-rose-500/10 border-rose-500/22 text-rose-400',
    slate: 'bg-white/[0.03] border-white/[0.07] text-slate-500',
  }
  return <span className={`rounded-full border px-1.5 py-0.5 text-[8px] font-black uppercase ${tones[tone]}`}>{label}</span>
}

const normalizeMarkets = (markets) => {
  if (!Array.isArray(markets) || markets.length === 0) return []

  return markets.slice(0, 6).map((market, index) => {
    const price = getValidNumber(market.price)
    const change = getValidNumber(market.change24h ?? market.changePercent)
    const priceAvailable = market.priceAvailable === true && price !== null

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
      timestamp: market.timestamp || null,
      cached: market.cached === true,
      fallback: market.fallback === true,
      stale: market.stale === true,
      priceAvailable,
      error: market.error || null,
    }
  })
}

export default function MarketOverview({ markets = [], loading = false, dataQuality = null }) {
  const assets = normalizeMarkets(markets)
  const hasQualityIssue = dataQuality?.hasErrors || dataQuality?.hasFallbacks || dataQuality?.hasStale
  const statusLabel = loading
    ? 'Loading'
    : assets.length === 0
      ? 'Unavailable'
      : hasQualityIssue
        ? 'Partial'
        : 'Backend live'
  const statusClass = assets.length > 0 && !hasQualityIssue
    ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
    : hasQualityIssue
      ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
      : 'text-slate-500 bg-white/[0.03] border-white/[0.07]'

  return (
    <motion.div
      whileHover={{ borderColor: 'rgba(225,29,72,0.12)' }}
      className="bg-[#0a1628]/88 border border-white/[0.07] rounded-2xl p-5 backdrop-blur-2xl shadow-[0_4px_28px_rgba(0,0,0,0.32)] transition-all duration-300"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity size={13} className="text-rose-400" />
          <h2 className="text-sm font-bold text-white">Market Overview</h2>
        </div>
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${statusClass}`}>
          {statusLabel}
        </span>
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
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black shrink-0"
                  style={{ background: `${a.color}16`, border: `1px solid ${a.color}28`, color: a.color }}
                >
                  {a.symbol.slice(0, 2)}
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{a.symbol}</p>
                  <p className="text-[10px] text-slate-700">{a.name}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-sm font-bold tabular-nums ${a.priceAvailable ? 'text-white' : 'text-amber-400/80'}`}>{formatPrice(a.price)}</p>
                <p className={`text-xs font-bold flex items-center justify-end gap-0.5 ${a.up ? 'text-emerald-400' : 'text-red-400'}`}>
                  {a.up ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                  {formatChange(a.change)}
                </p>
              </div>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-1">
              {a.priceAvailable && !a.fallback && !a.stale && <StatusBadge label="Live" tone="emerald" />}
              {a.cached && <StatusBadge label="Cached" />}
              {a.fallback && <StatusBadge label="Fallback" tone="amber" />}
              {a.stale && <StatusBadge label="Stale" tone="amber" />}
              {!a.priceAvailable && <StatusBadge label="Unavailable" tone="rose" />}
              <span className="text-[10px] text-slate-700 ml-auto">{a.source || '--'} · {formatDateTime(a.timestamp)}</span>
            </div>
            {a.error && <p className="mt-1 text-[10px] text-amber-400/80 font-semibold flex items-center gap-1"><AlertTriangle size={10} />{a.error}</p>}
          </motion.div>
        )) : (
          <div className="py-10 text-center">
            <Activity size={16} className="text-slate-700 mx-auto mb-3" />
            <p className="text-xs text-slate-600 font-medium">{loading ? 'Loading market quotes...' : 'No backend market quotes available.'}</p>
          </div>
        )}
      </div>
    </motion.div>
  )
}
