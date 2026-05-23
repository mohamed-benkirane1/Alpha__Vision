import { useEffect, useMemo, useState } from 'react'
import { getMarketPrices } from '../../services/marketService'

const TICKER_SYMBOLS = ['BTC', 'ETH', 'SOL', 'XAU', 'AAPL', 'NDX', 'BNB', 'XRP', 'ADA', 'DOGE', 'AVAX']

const getValidNumber = (value) => {
  if (value === null || value === undefined || value === '') return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

const formatPrice = (quote) => {
  const price = getValidNumber(quote.price)
  if (price === null || quote.priceAvailable !== true) return 'Unavailable'

  if (quote.type === 'index') {
    return price.toLocaleString('en-US', { maximumFractionDigits: 2 })
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: price < 1 ? 4 : 2,
    maximumFractionDigits: price < 1 ? 4 : price >= 1000 ? 0 : 2,
  }).format(price)
}

const formatChange = (change) => {
  const value = getValidNumber(change)
  if (value === null) return '--'
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
}

function getStatus(quote) {
  if (quote.priceAvailable !== true) return { label: 'Unavailable', className: 'text-rose-400 bg-rose-500/10' }
  if (quote.fallback) return { label: 'Fallback', className: 'text-amber-400 bg-amber-500/10' }
  if (quote.stale || quote.isStale) return { label: 'Stale', className: 'text-amber-400 bg-amber-500/10' }
  if (quote.cached) return { label: 'Cached', className: 'text-slate-400 bg-white/[0.05]' }
  return { label: 'Live', className: 'text-emerald-400 bg-emerald-500/10' }
}

function TickerItem({ quote }) {
  const change = getValidNumber(quote.change24h)
  const up = (change ?? 0) >= 0
  const status = getStatus(quote)

  return (
    <span className="inline-flex items-center gap-2.5 px-5 select-none">
      <span className="text-[11px] font-bold text-slate-400 tracking-wider">{quote.symbol}</span>
      <span className="text-[11px] font-semibold text-white tabular-nums">{formatPrice(quote)}</span>
      <span className={`text-[10px] font-bold px-1.5 py-px rounded ${
        up ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'
      }`}>
        {formatChange(change)}
      </span>
      <span className={`text-[9px] font-black px-1.5 py-px rounded uppercase ${status.className}`}>
        {status.label}
      </span>
      <span className="text-slate-800 text-[10px] select-none">|</span>
    </span>
  )
}

export default function PriceTicker() {
  const [quotes, setQuotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    const loadTicker = async () => {
      setLoading(true)
      setError('')

      try {
        const response = await getMarketPrices(TICKER_SYMBOLS)
        if (cancelled) return
        setQuotes(Array.isArray(response.quotes) ? response.quotes : [])
      } catch (err) {
        if (cancelled) return
        setQuotes([])
        setError(err?.normalized?.error || err?.message || 'Market data unavailable')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadTicker()

    return () => {
      cancelled = true
    }
  }, [])

  const doubled = useMemo(() => (quotes.length > 0 ? [...quotes, ...quotes] : []), [quotes])
  const message = loading ? 'Loading market quotes...' : error || 'Market data unavailable'

  return (
    <div className="overflow-hidden border-t border-white/[0.05] bg-[#060b18]/95 backdrop-blur-sm h-8 flex items-center shrink-0">
      {doubled.length > 0 ? (
        <div className="flex animate-ticker whitespace-nowrap">
          {doubled.map((quote, i) => (
            <TickerItem key={`${quote.symbol}-${i}`} quote={quote} />
          ))}
        </div>
      ) : (
        <div className="px-5 text-[11px] font-semibold text-slate-500">
          {message}
        </div>
      )}
    </div>
  )
}
