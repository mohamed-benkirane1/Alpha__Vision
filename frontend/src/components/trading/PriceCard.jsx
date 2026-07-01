import { TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react'
import { motion } from 'framer-motion'
import { getValidNumber, formatDateTime } from '../../utils/formatters'

const assetColors = {
  BTC: '#f97316', ETH: '#6366f1', SOL: '#8b5cf6',
  XAU: '#eab308', AAPL: '#64748b',
}

function Badge({ label, tone = 'slate' }) {
  const tones = {
    emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    amber: 'bg-amber-500/10 border-amber-500/22 text-amber-400',
    rose: 'bg-rose-500/10 border-rose-500/22 text-rose-400',
    slate: 'bg-white/[0.03] border-white/[0.07] text-slate-500',
  }
  return <span className={`rounded-full border px-1.5 py-0.5 text-caption font-black uppercase ${tones[tone]}`}>{label}</span>
}

export default function PriceCard({ symbol, name, type, price, change, source, provider, providerSymbol, timestamp, fetchedAt, cached, fallback, stale, isLive, isStale, priceAvailable = true, error, selected, onSelect }) {
  const validPrice = getValidNumber(price)
  const available = priceAvailable === true && validPrice !== null
  const staleQuote = stale === true || isStale === true || fallback === true || !available
  const liveQuote = available && (isLive === true || (!fallback && !staleQuote))
  const validChange = getValidNumber(change) ?? 0
  const up    = validChange >= 0
  const color = assetColors[symbol] || '#6366f1'
  const displayTimestamp = fetchedAt || timestamp
  return (
    <motion.button
      onClick={() => onSelect(symbol)}
      whileHover={{ x: 2 }}
      whileTap={{ scale: 0.98 }}
      className={`w-full text-left rounded-xl p-3.5 border transition-all duration-200 ${
        selected
          ? 'border-rose-500/45 bg-rose-500/10 shadow-[0_0_22px_rgba(225,29,72,0.20)]'
          : 'bg-white/[0.02] border-white/[0.045] hover:border-rose-500/20 hover:bg-white/[0.04]'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-caption font-black shrink-0"
            style={
              selected
                ? { background: 'rgba(225,29,72,0.18)', border: '1px solid rgba(225,29,72,0.3)', color: '#fb7185' }
                : { background: `${color}16`, border: `1px solid ${color}28`, color }
            }
          >
            {symbol.slice(0, 2)}
          </div>
          <div>
            <p className="text-body font-bold text-white">{symbol}</p>
            <p className="text-caption text-slate-700 font-medium">{name}</p>
          </div>
        </div>
        <div className="text-right">
          <p className={`text-body font-black tabular-nums font-mono ${available ? 'text-white' : 'text-amber-400/80'}`}>
            {available ? `$${validPrice.toLocaleString()}` : 'Unavailable'}
          </p>
          <p className={`text-label font-bold flex items-center justify-end gap-0.5 ${up ? 'text-emerald-400' : 'text-rose-400'}`}>
            {up ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {up ? '+' : ''}{validChange}%
          </p>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        {liveQuote && <Badge label="Live" tone="emerald" />}
        {cached && <Badge label="Cached" />}
        {fallback && <Badge label="Fallback" tone="amber" />}
        {staleQuote && !fallback && available && <Badge label="Stale" tone="amber" />}
        {!available && <Badge label="Unavailable" tone="rose" />}
      </div>
      <div className="mt-2 text-caption text-slate-700 font-medium leading-relaxed">
        <p>{type || 'asset'} - {source || '--'} - {formatDateTime(displayTimestamp)}</p>
        <p className="truncate" title={provider || providerSymbol || displayTimestamp || error || undefined}>{provider || providerSymbol || error || '--'}</p>
        {error && <p className="text-amber-400/75 flex items-center gap-1"><AlertTriangle size={9} />{error}</p>}
      </div>
    </motion.button>
  )
}
