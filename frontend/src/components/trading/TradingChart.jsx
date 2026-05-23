import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createChart, CandlestickSeries, HistogramSeries, LineSeries } from 'lightweight-charts'
import { Activity, AlertTriangle, BarChart3, Loader2, RefreshCw, TrendingDown, TrendingUp } from 'lucide-react'
import { getMarketHistory } from '../../services/marketService'

const TIMEFRAMES = [
  { label: '1m', interval: '1m', range: '1d' },
  { label: '5m', interval: '5m', range: '7d' },
  { label: '15m', interval: '15m', range: '30d' },
  { label: '1h', interval: '1h', range: '30d' },
  { label: '1d', interval: '1d', range: '90d' },
]

const getNumber = (value) => {
  if (value === null || value === undefined || value === '') return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

const formatPrice = (value) => {
  const number = getNumber(value)
  if (number === null) return '--'

  const maximumFractionDigits = Math.min(Math.max(number >= 100 ? 2 : number >= 1 ? 4 : 6, 0), 8)
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits,
  }).format(number)
}

const formatVolume = (value) => {
  const number = getNumber(value)
  if (number === null) return '--'

  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 2,
  }).format(number)
}

const movingAverage = (candles, period) => {
  if (!Array.isArray(candles) || candles.length < period) return []

  return candles
    .map((candle, index) => {
      if (index < period - 1) return null
      const slice = candles.slice(index - period + 1, index + 1)
      const total = slice.reduce((sum, item) => sum + item.close, 0)
      return {
        time: candle.time,
        value: Number((total / period).toFixed(8)),
      }
    })
    .filter(Boolean)
}

const getTrend = (ma20, ma50) => {
  const lastMa20 = ma20.at(-1)?.value
  const lastMa50 = ma50.at(-1)?.value

  if (!Number.isFinite(lastMa20) || !Number.isFinite(lastMa50)) {
    return { label: 'Neutral', tone: 'slate', icon: Activity, detail: 'Not enough candle history for MA20/MA50.' }
  }

  if (lastMa20 > lastMa50) {
    return { label: 'Bullish', tone: 'emerald', icon: TrendingUp, detail: 'MA20 is above MA50.' }
  }

  if (lastMa20 < lastMa50) {
    return { label: 'Bearish', tone: 'rose', icon: TrendingDown, detail: 'MA20 is below MA50.' }
  }

  return { label: 'Neutral', tone: 'slate', icon: Activity, detail: 'MA20 and MA50 are aligned.' }
}

function StatusBadge({ meta, hasData }) {
  const unavailable = !hasData
  const label = unavailable
    ? 'Unavailable'
    : meta?.isStale
      ? 'Stale'
      : meta?.cached
        ? 'Cached'
        : meta?.isLive
          ? 'Live'
          : 'Delayed'
  const tone = unavailable
    ? 'border-rose-500/24 bg-rose-500/10 text-rose-400'
    : meta?.isStale
      ? 'border-amber-500/24 bg-amber-500/10 text-amber-400'
      : meta?.isLive
        ? 'border-emerald-500/24 bg-emerald-500/10 text-emerald-400'
        : 'border-white/[0.08] bg-white/[0.03] text-slate-500'

  return (
    <span className={`rounded-full border px-2 py-1 text-[10px] font-black uppercase ${tone}`}>
      {label}
    </span>
  )
}

export default function TradingChart({ symbol, quote }) {
  const containerRef = useRef(null)
  const requestIdRef = useRef(0)
  const [timeframe, setTimeframe] = useState('1h')
  const [candles, setCandles] = useState([])
  const [meta, setMeta] = useState(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const activeSymbol = String(symbol || '').trim().toUpperCase()
  const activeTimeframe = TIMEFRAMES.find((item) => item.interval === timeframe) || TIMEFRAMES[3]

  const loadHistory = useCallback(async () => {
    const requestId = requestIdRef.current + 1
    requestIdRef.current = requestId

    if (!activeSymbol) {
      setCandles([])
      setMeta(null)
      setMessage('Select a symbol to load chart data.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const result = await getMarketHistory(activeSymbol, activeTimeframe.interval, activeTimeframe.range)
      if (requestId !== requestIdRef.current) return
      setCandles(Array.isArray(result.candles) ? result.candles : [])
      setMeta(result.meta || null)
      setMessage(result.message || '')

      if (!result.success) {
        setError(result.message || 'No chart data available for this symbol.')
      }
    } catch (err) {
      if (requestId !== requestIdRef.current) return
      setCandles([])
      setMeta(null)
      setMessage('')
      setError(err?.message || 'Unable to load chart data.')
    } finally {
      if (requestId === requestIdRef.current) setLoading(false)
    }
  }, [activeSymbol, activeTimeframe.interval, activeTimeframe.range])

  useEffect(() => {
    const timer = window.setTimeout(loadHistory, 0)
    return () => {
      window.clearTimeout(timer)
      requestIdRef.current += 1
    }
  }, [loadHistory])

  const chartCandles = useMemo(() => (
    candles.map((candle) => ({
      time: candle.time,
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
    }))
  ), [candles])

  const volumeData = useMemo(() => (
    candles
      .filter((candle) => getNumber(candle.volume) !== null)
      .map((candle) => ({
        time: candle.time,
        value: candle.volume,
        color: candle.close >= candle.open ? 'rgba(16,185,129,0.28)' : 'rgba(244,63,94,0.28)',
      }))
  ), [candles])

  const ma20 = useMemo(() => movingAverage(candles, 20), [candles])
  const ma50 = useMemo(() => movingAverage(candles, 50), [candles])
  const trend = useMemo(() => getTrend(ma20, ma50), [ma20, ma50])
  const TrendIcon = trend.icon
  const lastCandle = candles.at(-1)
  const high = candles.length > 0 ? Math.max(...candles.map((item) => item.high)) : null
  const low = candles.length > 0 ? Math.min(...candles.map((item) => item.low)) : null
  const warnings = Array.isArray(meta?.warnings) ? meta.warnings : []
  const providerName = meta?.provider || quote?.provider || ''
  const delayedProvider = /yahoo/i.test(providerName) || (candles.length > 0 && !meta?.isLive && !meta?.isStale && !meta?.cached)

  useEffect(() => {
    if (!containerRef.current || chartCandles.length === 0) return undefined

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: 360,
      layout: {
        background: { color: 'transparent' },
        textColor: '#64748b',
      },
      grid: {
        vertLines: { color: 'rgba(148,163,184,0.06)' },
        horzLines: { color: 'rgba(148,163,184,0.06)' },
      },
      rightPriceScale: {
        borderColor: 'rgba(148,163,184,0.12)',
        scaleMargins: { top: 0.08, bottom: volumeData.length > 0 ? 0.26 : 0.08 },
      },
      timeScale: {
        borderColor: 'rgba(148,163,184,0.12)',
        timeVisible: activeTimeframe.interval !== '1d',
        secondsVisible: false,
      },
      crosshair: {
        vertLine: { color: 'rgba(244,63,94,0.32)' },
        horzLine: { color: 'rgba(244,63,94,0.32)' },
      },
    })

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#10b981',
      downColor: '#f43f5e',
      wickUpColor: '#10b981',
      wickDownColor: '#f43f5e',
      borderVisible: false,
    })
    candleSeries.setData(chartCandles)

    if (volumeData.length > 0) {
      const volumeSeries = chart.addSeries(HistogramSeries, {
        priceFormat: { type: 'volume' },
        priceScaleId: '',
      })
      volumeSeries.priceScale().applyOptions({
        scaleMargins: { top: 0.82, bottom: 0 },
      })
      volumeSeries.setData(volumeData)
    }

    if (ma20.length > 0) {
      const ma20Series = chart.addSeries(LineSeries, {
        color: '#38bdf8',
        lineWidth: 2,
        priceLineVisible: false,
      })
      ma20Series.setData(ma20)
    }

    if (ma50.length > 0) {
      const ma50Series = chart.addSeries(LineSeries, {
        color: '#f59e0b',
        lineWidth: 2,
        priceLineVisible: false,
      })
      ma50Series.setData(ma50)
    }

    chart.timeScale().fitContent()

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) {
        chart.applyOptions({ width: Math.max(Math.floor(entry.contentRect.width), 240) })
      }
    })
    resizeObserver.observe(containerRef.current)

    return () => {
      resizeObserver.disconnect()
      chart.remove()
    }
  }, [activeTimeframe.interval, chartCandles, ma20, ma50, volumeData])

  const trendTone = {
    emerald: 'border-emerald-500/18 bg-emerald-500/[0.06] text-emerald-400',
    rose: 'border-rose-500/18 bg-rose-500/[0.06] text-rose-400',
    slate: 'border-white/[0.07] bg-white/[0.03] text-slate-500',
  }[trend.tone]

  return (
    <section className="bg-[#0a1628]/88 border border-white/[0.07] rounded-2xl p-5 backdrop-blur-2xl shadow-[0_4px_28px_rgba(0,0,0,0.32)]">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 size={14} className="text-rose-400" />
            <h2 className="text-sm font-bold text-white">{activeSymbol || '--'} Candlestick Chart</h2>
            <StatusBadge meta={meta} hasData={candles.length > 0} />
          </div>
          <p className="mt-1 text-[11px] font-medium text-slate-600">
            {meta?.provider || quote?.provider || 'Market provider'} - {meta?.providerSymbol || quote?.providerSymbol || activeSymbol || '--'}
          </p>
          {delayedProvider && (
            <p className="mt-1 text-[10px] font-semibold text-slate-700">
              Some assets such as GOLD, SP500 or stocks may use delayed provider data.
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {TIMEFRAMES.map((item) => (
            <button
              key={item.interval}
              type="button"
              onClick={() => setTimeframe(item.interval)}
              disabled={loading}
              className={`rounded-lg border px-2.5 py-1.5 text-[10px] font-black transition ${
                timeframe === item.interval
                  ? 'border-rose-500/35 bg-rose-500/12 text-rose-300'
                  : 'border-white/[0.07] bg-white/[0.02] text-slate-600 hover:text-slate-300'
              } disabled:cursor-not-allowed disabled:opacity-60`}
            >
              {item.label}
            </button>
          ))}
          <button
            type="button"
            onClick={loadHistory}
            disabled={loading}
            className="rounded-lg border border-white/[0.07] bg-white/[0.02] p-1.5 text-slate-600 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
            title="Refresh chart"
            aria-label="Refresh chart"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin text-rose-400' : ''} />
          </button>
        </div>
      </div>

      <div className="relative min-h-[360px] overflow-hidden rounded-xl border border-white/[0.045] bg-[#060d1c]/60">
        <div ref={containerRef} className="h-[360px] w-full" />
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#060d1c]/55 text-xs font-bold text-slate-400">
            <Loader2 size={16} className="mr-2 animate-spin text-rose-400" />
            Loading chart data...
          </div>
        )}
        {!loading && candles.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
            <AlertTriangle size={18} className="mb-2 text-amber-400" />
            <p className="text-sm font-black text-white">No chart data available</p>
            <p className="mt-1 max-w-md text-[11px] font-medium text-slate-600">
              {error || message || 'The backend did not return OHLC candles for this symbol and timeframe.'}
            </p>
          </div>
        )}
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <div className={`rounded-xl border px-3 py-2.5 ${trendTone}`}>
          <div className="flex items-center gap-1.5 text-[10px] font-black uppercase">
            <TrendIcon size={11} />
            Trend
          </div>
          <p className="mt-1 text-sm font-black">{trend.label}</p>
          <p className="mt-0.5 text-[10px] font-medium text-slate-500">{trend.detail}</p>
        </div>
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 py-2.5">
          <p className="text-[10px] font-black uppercase text-slate-600">Last close</p>
          <p className="mt-1 text-sm font-black text-white">{formatPrice(lastCandle?.close)}</p>
          <p className="mt-0.5 text-[10px] font-medium text-slate-700">Quote: {formatPrice(quote?.price)}</p>
        </div>
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 py-2.5">
          <p className="text-[10px] font-black uppercase text-slate-600">Range high/low</p>
          <p className="mt-1 text-sm font-black text-white">{formatPrice(high)}</p>
          <p className="mt-0.5 text-[10px] font-medium text-slate-700">{formatPrice(low)}</p>
        </div>
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 py-2.5">
          <p className="text-[10px] font-black uppercase text-slate-600">Last volume</p>
          <p className="mt-1 text-sm font-black text-white">{formatVolume(lastCandle?.volume)}</p>
          <p className="mt-0.5 text-[10px] font-medium text-slate-700">
            Candles: {candles.length}
          </p>
        </div>
      </div>

      {(warnings.length > 0 || error) && (
        <div className="mt-3 rounded-xl border border-amber-500/18 bg-amber-500/[0.055] px-3 py-2 text-[11px] font-semibold text-amber-300/90">
          {error || warnings.join(' ')}
        </div>
      )}
    </section>
  )
}
