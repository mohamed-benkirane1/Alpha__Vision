import { useEffect, useMemo, useState } from 'react'
import { getMarketPrices } from '../../services/marketService'

const TICKER_SYMBOLS = ['BTC', 'ETH', 'SOL', 'XAU', 'AAPL', 'NDX', 'BNB', 'XRP', 'ADA', 'DOGE', 'AVAX']

const getValidNumber = (value) => {
  if (value === null || value === undefined || value === '') return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

const getCurrencyFractionDigits = (price) => {
  if (!Number.isFinite(price)) return { minimumFractionDigits: 0, maximumFractionDigits: 0 }
  if (price >= 1000) return { minimumFractionDigits: 0, maximumFractionDigits: 0 }
  if (price >= 1) return { minimumFractionDigits: 2, maximumFractionDigits: 2 }
  return { minimumFractionDigits: 4, maximumFractionDigits: 6 }
}

const formatPrice = (quote = {}) => {
  const price = getValidNumber(quote.price)
  if (price === null || price < 0 || quote.priceAvailable !== true) return 'Unavailable'

  if (quote.type === 'index') {
    return price.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    ...getCurrencyFractionDigits(price),
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
  const safeQuote = quote || {}
  const change = getValidNumber(safeQuote.change24h)
  const up = (change ?? 0) >= 0
  const status = getStatus(safeQuote)

  return (
    <span className="inline-flex items-center gap-2.5 px-5 select-none">
      <span className="text-label font-bold text-slate-400 tracking-wider">{safeQuote.symbol || '--'}</span>
      <span className="text-label font-semibold text-white tabular-nums">{formatPrice(safeQuote)}</span>
      <span className={`text-caption font-bold px-1.5 py-px rounded ${
        up ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'
      }`}>
        {formatChange(change)}
      </span>
      <span className={`text-caption font-black px-1.5 py-px rounded uppercase ${status.className}`}>
        {status.label}
      </span>
      <span className="text-slate-800 text-caption select-none">|</span>
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
        <div className="px-5 text-label font-semibold text-slate-500">
          {message}
        </div>
      )}
    </div>
  )
}
