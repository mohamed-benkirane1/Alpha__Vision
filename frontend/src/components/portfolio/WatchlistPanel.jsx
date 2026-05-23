import { useState } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, Eye, Loader2, Plus, Trash2, TrendingDown, TrendingUp } from 'lucide-react'

const suggestedSymbols = ['BTC', 'ETH', 'AAPL', 'GOLD', 'SP500']

const getNumber = (value) => {
  if (value === null || value === undefined || value === '') return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

const formatPrice = (value) => {
  const number = getNumber(value)
  if (number === null) return 'Unavailable'

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: number >= 1 ? 2 : 6,
  }).format(number)
}

const formatPercent = (value) => {
  const number = getNumber(value)
  if (number === null) return '--'
  return `${number >= 0 ? '+' : ''}${number.toFixed(2)}%`
}

const formatDateTime = (value) => {
  if (!value) return '--'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '--'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function getStatus(item) {
  if (!item.priceAvailable) return { label: 'Unavailable', tone: 'rose' }
  if (item.priceMeta?.isStale) return { label: 'Stale', tone: 'amber' }
  if (item.priceMeta?.cached) return { label: 'Cached', tone: 'slate' }
  if (item.priceMeta?.isLive) return { label: 'Live', tone: 'emerald' }
  return { label: 'Delayed', tone: 'slate' }
}

function StatusBadge({ item }) {
  const status = getStatus(item)
  const tones = {
    emerald: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400',
    amber: 'border-amber-500/22 bg-amber-500/10 text-amber-400',
    rose: 'border-rose-500/22 bg-rose-500/10 text-rose-400',
    slate: 'border-white/[0.07] bg-white/[0.03] text-slate-500',
  }

  return (
    <span className={`rounded-full border px-2 py-0.5 text-[9px] font-black uppercase ${tones[status.tone]}`}>
      {status.label}
    </span>
  )
}

export default function WatchlistPanel({
  items = [],
  loading = false,
  error = '',
  message = '',
  mutating = false,
  onAdd,
  onRemove,
  onRefresh,
}) {
  const [symbol, setSymbol] = useState('')
  const hasItems = Array.isArray(items) && items.length > 0

  const submit = async (event) => {
    event.preventDefault()
    const nextSymbol = symbol.trim().toUpperCase()
    if (!nextSymbol || mutating) return
    const ok = await onAdd?.(nextSymbol)
    if (ok) setSymbol('')
  }

  return (
    <motion.section
      whileHover={{ borderColor: 'rgba(225,29,72,0.12)' }}
      className="bg-[#0a1628]/88 border border-white/[0.07] rounded-2xl p-5 backdrop-blur-2xl shadow-[0_4px_28px_rgba(0,0,0,0.32)] transition-all duration-300"
    >
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Eye size={13} className="text-rose-400" />
            <h2 className="text-sm font-bold text-white">Watchlist</h2>
            <span className="text-[10px] text-slate-700 font-bold">{loading ? 'Loading' : `${items.length} symbols`}</span>
          </div>
          <p className="mt-1 text-[11px] font-medium text-slate-600">
            Prices are loaded from the backend market service. Yahoo assets may be delayed.
          </p>
        </div>

        <form onSubmit={submit} className="flex min-w-0 gap-2">
          <input
            value={symbol}
            onChange={(event) => setSymbol(event.target.value.toUpperCase())}
            placeholder="BTC, AAPL, GOLD"
            disabled={loading || mutating}
            className="h-9 min-w-0 rounded-xl border border-white/[0.08] bg-[#060D1C]/80 px-3 text-xs font-bold text-white placeholder-slate-700 outline-none transition focus:border-rose-500/45 disabled:cursor-not-allowed disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={loading || mutating || !symbol.trim()}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-rose-500/22 bg-rose-500/10 px-3 text-[11px] font-black text-rose-300 transition hover:bg-rose-500/15 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {mutating ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
            Add
          </button>
        </form>
      </div>

      <div className="mb-3 flex flex-wrap gap-1.5">
        {suggestedSymbols.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => onAdd?.(suggestion)}
            disabled={loading || mutating || items.some((item) => item.symbol === suggestion)}
            className="rounded-full border border-white/[0.06] bg-white/[0.025] px-2.5 py-1 text-[10px] font-black text-slate-600 transition hover:text-slate-300 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {suggestion}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-3 flex items-start gap-2 rounded-xl border border-amber-500/18 bg-amber-500/[0.055] px-3 py-2 text-[11px] font-semibold text-amber-300/90">
          <AlertTriangle size={12} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {message && !error && (
        <p className="mb-3 text-[11px] font-semibold text-emerald-400/85">{message}</p>
      )}

      <div className="space-y-1.5">
        {hasItems ? (
          items.map((item, index) => {
            const change = getNumber(item.change24h)
            const up = change === null ? true : change >= 0
            const provider = item.priceMeta?.provider || item.priceMeta?.source || '--'
            const providerSymbol = item.priceMeta?.providerSymbol || item.symbol

            return (
              <motion.div
                key={item._id || item.symbol}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.045 }}
                className="grid grid-cols-2 gap-2 rounded-xl border border-white/[0.045] bg-white/[0.02] px-3 py-3 md:grid-cols-5 md:items-center"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-black text-white">{item.symbol}</p>
                    <StatusBadge item={item} />
                  </div>
                  <p className="mt-0.5 text-[10px] font-medium text-slate-700">{item.name || item.type || 'Asset'}</p>
                </div>

                <div className="text-right md:text-left">
                  <p className={`text-xs font-black tabular-nums ${item.priceAvailable ? 'text-white' : 'text-amber-400/85'}`}>
                    {formatPrice(item.currentPrice)}
                  </p>
                  <p className={`mt-0.5 inline-flex items-center gap-0.5 text-[10px] font-bold ${up ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {up ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                    {formatPercent(change)}
                  </p>
                </div>

                <div className="md:col-span-2">
                  <p className="text-[10px] font-medium text-slate-700">
                    Provider <span className="text-slate-500">{provider}</span>
                  </p>
                  <p className="mt-0.5 text-[10px] font-medium text-slate-700">
                    Symbol <span className="text-slate-500">{providerSymbol}</span> - {formatDateTime(item.priceMeta?.fetchedAt)}
                  </p>
                  {item.warning && (
                    <p className="mt-1 text-[10px] font-semibold text-amber-400/75">{item.warning}</p>
                  )}
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => onRemove?.(item.symbol)}
                    disabled={mutating}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.025] text-slate-600 transition hover:border-rose-500/22 hover:text-rose-300 disabled:cursor-not-allowed disabled:opacity-50"
                    title={`Remove ${item.symbol}`}
                    aria-label={`Remove ${item.symbol}`}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </motion.div>
            )
          })
        ) : (
          <div className="py-10 text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.03]">
              <Eye size={16} className="text-slate-700" />
            </div>
            <p className="text-xs font-medium text-slate-600">
              {loading ? 'Loading watchlist...' : 'No watchlist symbols yet.'}
            </p>
            <p className="mt-1 text-[11px] text-slate-700">
              {loading ? 'Watchlist data is being loaded from the backend.' : 'Add a symbol to track real market prices.'}
            </p>
          </div>
        )}
      </div>

      {hasItems && (
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading || mutating}
            className="text-[10px] font-black text-slate-600 transition hover:text-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Refresh watchlist
          </button>
        </div>
      )}
    </motion.section>
  )
}
