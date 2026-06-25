import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createChart, CandlestickSeries, HistogramSeries, LineSeries } from 'lightweight-charts'
import {
  Activity, AlertTriangle, BarChart3, Loader2,
  Maximize2, Minimize2, RefreshCw, TrendingDown, TrendingUp,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { getMarketHistory } from '../../services/marketService'
import { useAuth } from '../../context/useAuth'

// ── Plan-gated indicators ──────────────────────────────────────────────────────
const PLAN_INDICATORS = {
  free:  ['MA20', 'MA50'],
  pro:   ['MA20', 'MA50', 'EMA9', 'EMA21', 'Volume'],
  elite: ['MA20', 'MA50', 'EMA9', 'EMA21', 'Volume', 'BollingerBands', 'RSI', 'MACD'],
}

const ALL_INDICATORS = [
  { id: 'MA20',         label: 'MA20',   color: '#38bdf8', minPlan: 'free'  },
  { id: 'MA50',         label: 'MA50',   color: '#f59e0b', minPlan: 'free'  },
  { id: 'EMA9',         label: 'EMA9',   color: '#e91e63', minPlan: 'pro'   },
  { id: 'EMA21',        label: 'EMA21',  color: '#9c27b0', minPlan: 'pro'   },
  { id: 'Volume',       label: 'Volume', color: '#26a69a', minPlan: 'pro'   },
  { id: 'BollingerBands', label: 'BB',   color: '#607d8b', minPlan: 'elite' },
  { id: 'RSI',          label: 'RSI',    color: '#ff6b6b', minPlan: 'elite' },
  { id: 'MACD',         label: 'MACD',   color: '#4fc3f7', minPlan: 'elite' },
]

const TIMEFRAMES = [
  { label: '1m',  interval: '1m',  range: '1d'  },
  { label: '5m',  interval: '5m',  range: '7d'  },
  { label: '15m', interval: '15m', range: '7d'  },
  { label: '1h',  interval: '1h',  range: '30d' },
  { label: '4h',  interval: '1h',  range: '90d' }, // uses 1h data over 90d as proxy for 4h view
  { label: '1d',  interval: '1d',  range: '1y'  },
]

// ── Indicator calculations ─────────────────────────────────────────────────────
const calcSMA = (candles, period) =>
  candles.map((c, i) => {
    if (i < period - 1) return null
    const avg = candles.slice(i - period + 1, i + 1).reduce((s, x) => s + x.close, 0) / period
    return { time: c.time, value: Number(avg.toFixed(8)) }
  }).filter(Boolean)

const calcEMA = (candles, period) => {
  if (candles.length < period) return []
  const k = 2 / (period + 1)
  const result = []
  let ema = candles.slice(0, period).reduce((s, c) => s + c.close, 0) / period
  candles.forEach((c, i) => {
    if (i < period - 1) return
    if (i === period - 1) { result.push({ time: c.time, value: Number(ema.toFixed(8)) }); return }
    ema = c.close * k + ema * (1 - k)
    result.push({ time: c.time, value: Number(ema.toFixed(8)) })
  })
  return result
}

const calcRSI = (candles, period = 14) => {
  if (candles.length < period + 1) return []
  const result = []
  for (let i = period; i < candles.length; i++) {
    let gains = 0, losses = 0
    for (let j = i - period + 1; j <= i; j++) {
      const diff = candles[j].close - candles[j - 1].close
      if (diff > 0) gains += diff; else losses -= diff
    }
    const rs = gains / (losses || 0.0001)
    result.push({ time: candles[i].time, value: Number((100 - 100 / (1 + rs)).toFixed(2)) })
  }
  return result
}

const calcMACD = (candles, fast = 12, slow = 26, signal = 9) => {
  if (candles.length < slow + signal) return { macd: [], signal: [], hist: [] }
  const emaFast = calcEMA(candles, fast)
  const emaSlow = calcEMA(candles, slow)
  const offset = slow - fast
  const macdLine = emaFast.slice(offset).map((v, i) => ({
    time: v.time, value: Number((v.value - (emaSlow[i]?.value ?? 0)).toFixed(8)),
  }))
  // Signal line = EMA of macdLine
  const k = 2 / (signal + 1)
  let sigEma = macdLine.slice(0, signal).reduce((s, v) => s + v.value, 0) / signal
  const sigLine = []
  macdLine.forEach((v, i) => {
    if (i < signal - 1) return
    if (i === signal - 1) { sigLine.push({ time: v.time, value: Number(sigEma.toFixed(8)) }); return }
    sigEma = v.value * k + sigEma * (1 - k)
    sigLine.push({ time: v.time, value: Number(sigEma.toFixed(8)) })
  })
  const hist = sigLine.map((s, i) => ({
    time: s.time,
    value: Number((macdLine[i + signal - 1]?.value - s.value).toFixed(8)),
    color: (macdLine[i + signal - 1]?.value ?? 0) >= s.value ? '#26a69a88' : '#ef535088',
  }))
  return { macd: macdLine, signal: sigLine, hist }
}

const calcBB = (candles, period = 20, mult = 2) => {
  const upper = [], middle = [], lower = []
  candles.forEach((_, i) => {
    if (i < period - 1) return
    const slice = candles.slice(i - period + 1, i + 1).map((c) => c.close)
    const sma = slice.reduce((a, b) => a + b, 0) / period
    const std = Math.sqrt(slice.reduce((s, p) => s + (p - sma) ** 2, 0) / period)
    upper.push({ time: candles[i].time, value: Number((sma + mult * std).toFixed(8)) })
    middle.push({ time: candles[i].time, value: Number(sma.toFixed(8)) })
    lower.push({ time: candles[i].time, value: Number((sma - mult * std).toFixed(8)) })
  })
  return { upper, middle, lower }
}

const calcTrend = (ma20, ma50) => {
  const v20 = ma20.at(-1)?.value, v50 = ma50.at(-1)?.value
  if (!Number.isFinite(v20) || !Number.isFinite(v50))
    return { label: 'Neutral', tone: 'slate', icon: Activity, detail: 'Not enough history.' }
  if (v20 > v50) return { label: 'Bullish', tone: 'emerald', icon: TrendingUp, detail: 'MA20 above MA50.' }
  if (v20 < v50) return { label: 'Bearish', tone: 'rose', icon: TrendingDown, detail: 'MA20 below MA50.' }
  return { label: 'Neutral', tone: 'slate', icon: Activity, detail: 'MA20 aligned with MA50.' }
}

const getNum = (v) => { const n = Number(v); return Number.isFinite(n) ? n : null }
const fmtPrice = (v) => { const n = getNum(v); if (!n) return '--'; const d = n >= 100 ? 2 : n >= 1 ? 4 : 6; return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: d }).format(n) }
const fmtVol = (v) => { const n = getNum(v); return n ? new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 2 }).format(n) : '--' }

function StatusBadge({ meta, hasData }) {
  const label = !hasData ? 'Unavailable' : meta?.isStale ? 'Stale' : meta?.cached ? 'Cached' : meta?.isLive ? 'Live' : 'Delayed'
  const tone = !hasData ? 'border-rose-500/24 bg-rose-500/10 text-rose-400'
    : meta?.isStale ? 'border-amber-500/24 bg-amber-500/10 text-amber-400'
    : meta?.isLive ? 'border-emerald-500/24 bg-emerald-500/10 text-emerald-400'
    : 'border-white/[0.08] bg-white/[0.03] text-slate-500'
  return <span className={`rounded-full border px-2 py-1 text-caption font-black uppercase ${tone}`}>{label}</span>
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function TradingChart({ symbol, quote }) {
  const { user } = useAuth()
  const plan = user?.plan || 'free'
  const allowed = PLAN_INDICATORS[plan] || PLAN_INDICATORS.free

  const containerRef = useRef(null)
  const rsiContainerRef = useRef(null)
  const macdContainerRef = useRef(null)
  const requestIdRef = useRef(0)

  const [timeframe, setTimeframe] = useState('1h')
  const [candles, setCandles] = useState([])
  const [meta, setMeta] = useState(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [active, setActive] = useState(['MA20', 'MA50'])

  const activeSymbol = String(symbol || '').trim().toUpperCase()
  const tf = TIMEFRAMES.find((t) => t.label === timeframe) || TIMEFRAMES[3]

  const loadHistory = useCallback(async () => {
    const id = requestIdRef.current + 1
    requestIdRef.current = id
    if (!activeSymbol) { setCandles([]); setMeta(null); setMessage('Select a symbol.'); return }
    setLoading(true); setError('')
    try {
      const result = await getMarketHistory(activeSymbol, tf.interval, tf.range)
      if (id !== requestIdRef.current) return
      setCandles(Array.isArray(result.candles) ? result.candles : [])
      setMeta(result.meta || null)
      setMessage(result.message || '')
      if (!result.success) setError(result.message || 'No chart data available.')
    } catch (err) {
      if (id !== requestIdRef.current) return
      setCandles([]); setMeta(null); setError(err?.message || 'Unable to load chart data.')
    } finally {
      if (id === requestIdRef.current) setLoading(false)
    }
  }, [activeSymbol, tf.interval, tf.range])

  useEffect(() => {
    const t = window.setTimeout(loadHistory, 0)
    return () => { window.clearTimeout(t); requestIdRef.current += 1 }
  }, [loadHistory])

  const ma20 = useMemo(() => calcSMA(candles, 20), [candles])
  const ma50 = useMemo(() => calcSMA(candles, 50), [candles])
  const ema9 = useMemo(() => calcEMA(candles, 9), [candles])
  const ema21 = useMemo(() => calcEMA(candles, 21), [candles])
  const rsi = useMemo(() => calcRSI(candles), [candles])
  const macdData = useMemo(() => calcMACD(candles), [candles])
  const bbData = useMemo(() => calcBB(candles), [candles])
  const trend = useMemo(() => calcTrend(ma20, ma50), [ma20, ma50])
  const TrendIcon = trend.icon
  const lastCandle = candles.at(-1)
  const periodHigh = candles.length > 0 ? Math.max(...candles.map((c) => c.high)) : null
  const periodLow  = candles.length > 0 ? Math.min(...candles.map((c) => c.low))  : null
  const warnings = Array.isArray(meta?.warnings) ? meta.warnings : []

  const showRSI  = active.includes('RSI')  && allowed.includes('RSI')  && rsi.length > 0
  const showMACD = active.includes('MACD') && allowed.includes('MACD') && macdData.hist.length > 0
  const showVol  = active.includes('Volume') && allowed.includes('Volume')

  // ── Main chart ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || candles.length === 0) return

    const mainBottom = showRSI && showMACD ? 0.52 : showRSI || showMACD ? 0.34 : showVol ? 0.22 : 0.05

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: isFullscreen ? Math.floor(window.innerHeight * 0.55) : 400,
      layout: { background: { color: 'transparent' }, textColor: '#64748b' },
      grid: { vertLines: { color: 'rgba(148,163,184,0.06)' }, horzLines: { color: 'rgba(148,163,184,0.06)' } },
      rightPriceScale: { borderColor: 'rgba(148,163,184,0.12)', scaleMargins: { top: 0.05, bottom: mainBottom } },
      timeScale: { borderColor: 'rgba(148,163,184,0.12)', timeVisible: tf.interval !== '1d', secondsVisible: false },
      crosshair: { vertLine: { color: 'rgba(244,63,94,0.32)' }, horzLine: { color: 'rgba(244,63,94,0.32)' } },
    })

    // Candlestick
    const cs = chart.addSeries(CandlestickSeries, {
      upColor: '#10b981', downColor: '#f43f5e',
      wickUpColor: '#10b981', wickDownColor: '#f43f5e', borderVisible: false,
    })
    cs.setData(candles.map((c) => ({ time: c.time, open: c.open, high: c.high, low: c.low, close: c.close })))

    // Volume
    if (showVol && candles.some((c) => getNum(c.volume) !== null)) {
      const vs = chart.addSeries(HistogramSeries, { priceFormat: { type: 'volume' }, priceScaleId: 'vol' })
      chart.priceScale('vol').applyOptions({ scaleMargins: { top: 1 - mainBottom + 0.02, bottom: 0 } })
      vs.setData(candles.map((c) => ({
        time: c.time, value: c.volume ?? 0,
        color: c.close >= c.open ? 'rgba(16,185,129,0.28)' : 'rgba(244,63,94,0.28)',
      })))
    }

    // MA20
    if (active.includes('MA20') && allowed.includes('MA20') && ma20.length > 0) {
      const s = chart.addSeries(LineSeries, { color: '#38bdf8', lineWidth: 2, priceLineVisible: false, title: 'MA20' })
      s.setData(ma20)
    }
    // MA50
    if (active.includes('MA50') && allowed.includes('MA50') && ma50.length > 0) {
      const s = chart.addSeries(LineSeries, { color: '#f59e0b', lineWidth: 2, priceLineVisible: false, title: 'MA50' })
      s.setData(ma50)
    }
    // EMA9
    if (active.includes('EMA9') && allowed.includes('EMA9') && ema9.length > 0) {
      const s = chart.addSeries(LineSeries, { color: '#e91e63', lineWidth: 1, priceLineVisible: false, title: 'EMA9' })
      s.setData(ema9)
    }
    // EMA21
    if (active.includes('EMA21') && allowed.includes('EMA21') && ema21.length > 0) {
      const s = chart.addSeries(LineSeries, { color: '#9c27b0', lineWidth: 1, priceLineVisible: false, title: 'EMA21' })
      s.setData(ema21)
    }
    // Bollinger Bands
    if (active.includes('BollingerBands') && allowed.includes('BollingerBands')) {
      const opts = { lineWidth: 1, priceLineVisible: false }
      const su = chart.addSeries(LineSeries, { ...opts, color: '#607d8b66', title: 'BB↑' })
      const sm = chart.addSeries(LineSeries, { ...opts, color: '#607d8b', lineStyle: 2, title: 'BB mid' })
      const sl = chart.addSeries(LineSeries, { ...opts, color: '#607d8b66', title: 'BB↓' })
      su.setData(bbData.upper); sm.setData(bbData.middle); sl.setData(bbData.lower)
    }

    // RSI pane (separate price scale at bottom)
    if (showRSI) {
      const rsiScaleTop = showMACD ? 0.53 : 0.66
      const rsiSeries = chart.addSeries(LineSeries, {
        color: '#ff6b6b', lineWidth: 1, priceScaleId: 'rsi', priceLineVisible: false, title: 'RSI',
      })
      chart.priceScale('rsi').applyOptions({ scaleMargins: { top: rsiScaleTop, bottom: showMACD ? 0.26 : 0.02 }, visible: true })
      rsiSeries.setData(rsi)
      // RSI level lines at 70 and 30
      ;[{ value: 70, color: '#ef535055' }, { value: 30, color: '#26a69a55' }].forEach(({ value, color }) => {
        const ls = chart.addSeries(LineSeries, { color, lineWidth: 1, priceScaleId: 'rsi', priceLineVisible: false, lineStyle: 1 })
        if (rsi.length > 1) ls.setData([{ time: rsi[0].time, value }, { time: rsi.at(-1).time, value }])
      })
    }

    // MACD pane
    if (showMACD) {
      const macdTop = 0.79
      const histS = chart.addSeries(HistogramSeries, { priceScaleId: 'macd', priceLineVisible: false })
      chart.priceScale('macd').applyOptions({ scaleMargins: { top: macdTop, bottom: 0.01 }, visible: true })
      histS.setData(macdData.hist)
      const macdS = chart.addSeries(LineSeries, { color: '#4fc3f7', lineWidth: 1, priceScaleId: 'macd', priceLineVisible: false, title: 'MACD' })
      macdS.setData(macdData.macd)
      const sigS = chart.addSeries(LineSeries, { color: '#ff9800', lineWidth: 1, priceScaleId: 'macd', priceLineVisible: false, title: 'Signal' })
      sigS.setData(macdData.signal)
    }

    chart.timeScale().fitContent()

    const ro = new ResizeObserver((entries) => {
      const e = entries[0]
      if (e) chart.applyOptions({ width: Math.max(Math.floor(e.contentRect.width), 240) })
    })
    ro.observe(containerRef.current)

    return () => { ro.disconnect(); chart.remove() }
  }, [candles, active, allowed, isFullscreen, ma20, ma50, ema9, ema21, bbData, rsi, macdData, showRSI, showMACD, showVol, tf.interval])

  const toggleIndicator = (id) => {
    if (!allowed.includes(id)) return
    setActive((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])
  }

  const trendTone = { emerald: 'border-emerald-500/18 bg-emerald-500/[0.06] text-emerald-400', rose: 'border-rose-500/18 bg-rose-500/[0.06] text-rose-400', slate: 'border-white/[0.07] bg-white/[0.03] text-slate-500' }[trend.tone]

  return (
    <section className={isFullscreen
      ? 'fixed inset-0 z-50 flex flex-col bg-[#060d1c] overflow-auto'
      : 'bg-[#0a1628]/88 border border-white/[0.07] rounded-2xl backdrop-blur-2xl shadow-[0_4px_28px_rgba(0,0,0,0.32)]'
    }>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2 px-5 pt-5 pb-3 border-b border-white/[0.06]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <BarChart3 size={14} className="text-rose-400" />
            <h2 className="text-body font-bold text-white">{activeSymbol || '--'} Chart</h2>
            <StatusBadge meta={meta} hasData={candles.length > 0} />
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Timeframe buttons */}
            {TIMEFRAMES.map((t) => (
              <button
                key={t.label} type="button"
                onClick={() => setTimeframe(t.label)}
                disabled={loading}
                className={`rounded-lg border px-2.5 py-1.5 text-caption font-black transition ${
                  timeframe === t.label
                    ? 'border-rose-500/35 bg-rose-500/12 text-rose-300'
                    : 'border-white/[0.07] bg-white/[0.02] text-slate-600 hover:text-slate-300'
                } disabled:opacity-60`}
              >{t.label}</button>
            ))}
            <button type="button" onClick={loadHistory} disabled={loading}
              className="rounded-lg border border-white/[0.07] bg-white/[0.02] p-1.5 text-slate-600 transition hover:text-white disabled:opacity-60"
              title="Refresh"
            ><RefreshCw size={13} className={loading ? 'animate-spin text-rose-400' : ''} /></button>
            <button type="button" onClick={() => setIsFullscreen((v) => !v)}
              className="rounded-lg border border-white/[0.07] bg-white/[0.02] p-1.5 text-slate-600 transition hover:text-white"
              title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            >{isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}</button>
          </div>
        </div>

        {/* ── Indicator toolbar ─────────────────────────────────────────────── */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-caption text-slate-600 font-bold mr-1">Indicators:</span>
          {ALL_INDICATORS.map(({ id, label, color, minPlan }) => {
            const isAllowed = allowed.includes(id)
            const isActive  = active.includes(id)
            const requiresPlan = minPlan === 'pro' ? 'Pro' : minPlan === 'elite' ? 'Elite' : null
            return (
              <button
                key={id} type="button"
                onClick={() => toggleIndicator(id)}
                title={!isAllowed ? `Available on ${requiresPlan} plan` : isActive ? `Hide ${label}` : `Show ${label}`}
                className={`px-2 py-0.5 text-caption rounded border font-bold transition-all ${
                  !isAllowed
                    ? 'border-white/[0.06] text-slate-700 cursor-not-allowed'
                    : isActive
                      ? 'border-current text-white bg-white/10'
                      : 'border-white/[0.08] text-slate-500 hover:border-white/20 hover:text-slate-300'
                }`}
                style={isAllowed && isActive ? { borderColor: color, color } : {}}
              >
                {label}{!isAllowed && ' 🔒'}
              </button>
            )
          })}
          {plan !== 'elite' && (
            <Link to="/payments" className="text-caption text-rose-400 hover:underline ml-1">
              {plan === 'free' ? 'Upgrade → Pro/Elite' : 'Upgrade → Elite'}
            </Link>
          )}
        </div>
      </div>

      {/* ── Chart container ─────────────────────────────────────────────────── */}
      <div className="relative">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#060d1c]/60">
            <Loader2 size={16} className="mr-2 animate-spin text-rose-400" />
            <span className="text-body-sm text-slate-400 font-bold">Loading chart...</span>
          </div>
        )}
        {!loading && candles.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
            <AlertTriangle size={18} className="mb-2 text-amber-400" />
            <p className="text-body font-black text-white">No chart data</p>
            <p className="mt-1 max-w-md text-label text-slate-600">{error || message || 'No OHLC candles available.'}</p>
          </div>
        )}
        <div ref={containerRef} className="w-full" />
      </div>

      {/* ── Stats row ──────────────────────────────────────────────────────── */}
      {candles.length > 0 && (
        <div className="px-5 pb-5 pt-3">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <div className={`rounded-xl border px-3 py-2.5 ${trendTone}`}>
              <div className="flex items-center gap-1.5 text-caption font-black uppercase"><TrendIcon size={11} />Trend</div>
              <p className="mt-1 text-body font-black">{trend.label}</p>
              <p className="mt-0.5 text-caption text-slate-500">{trend.detail}</p>
            </div>
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 py-2.5">
              <p className="text-caption font-black uppercase text-slate-600">Last close</p>
              <p className="mt-1 text-body font-black text-white">{fmtPrice(lastCandle?.close)}</p>
              <p className="mt-0.5 text-caption text-slate-700">Quote: {fmtPrice(quote?.price)}</p>
            </div>
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 py-2.5">
              <p className="text-caption font-black uppercase text-slate-600">Period High / Low</p>
              <p className="mt-1 text-body font-black text-white">{fmtPrice(periodHigh)}</p>
              <p className="mt-0.5 text-caption text-slate-700">{fmtPrice(periodLow)}</p>
            </div>
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 py-2.5">
              <p className="text-caption font-black uppercase text-slate-600">Volume / Candles</p>
              <p className="mt-1 text-body font-black text-white">{fmtVol(lastCandle?.volume)}</p>
              <p className="mt-0.5 text-caption text-slate-700">{candles.length} candles</p>
            </div>
          </div>
          {(warnings.length > 0 || error) && (
            <div className="mt-2 rounded-xl border border-amber-500/18 bg-amber-500/[0.055] px-3 py-2 text-label font-semibold text-amber-300/90">
              {error || warnings.join(' ')}
            </div>
          )}
        </div>
      )}
    </section>
  )
}
