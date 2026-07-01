import { useState } from 'react'
import { Play, FlaskConical, ChevronDown } from 'lucide-react'
import { motion } from 'framer-motion'
import { TRADING_ASSETS, ASSET_GROUPS, getAssetProvider } from '../../constants/tradingAssets'

const SUPPORTED_BACKTEST_SYMBOLS = ['BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'ADA', 'DOGE']

const STRATEGIES = [
  { value: 'rsi',        label: 'RSI — Mean Reversion',              desc: 'Buys on RSI < oversold, sells on RSI > overbought. Classic momentum oscillator.' },
  { value: 'macd',       label: 'MACD Crossover — Momentum',         desc: 'Signal line crossover using 12/26/9 EMA. Trend-following momentum strategy.' },
  { value: 'bollinger',  label: 'Bollinger Bands — Volatility',       desc: 'Mean-reversion strategy trading band breakouts. Adapts to volatility.' },
  { value: 'ema_cross',  label: 'EMA Cross — Fast Trend',            desc: 'Fast EMA9/slow EMA21 crossover. Catches early trend reversals.' },
  { value: 'stochastic', label: 'Stochastic — Overbought/Oversold',  desc: 'Stochastic oscillator with K/D lines. Effective in ranging markets.' },
  { value: 'multi',      label: 'Multi-Indicator — High Confidence',  desc: 'Combines RSI + Bollinger Bands for higher-confidence entry signals.' },
]

const PROVIDER_LABELS = { binance: 'via Binance', yahoo: 'via Yahoo Finance', default: '' }

const fieldCls = 'w-full bg-[#060D1C]/80 border border-white/[0.09] text-white text-body rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-rose-500/50 focus:shadow-[0_0_14px_rgba(225,29,72,0.12)] transition-all duration-200 appearance-none'
const paramCls = 'bg-[#060D1C]/80 border border-white/[0.09] text-white text-body rounded-xl px-3 py-2 focus:outline-none focus:border-rose-500/50 transition-all duration-200 w-full'

// ParamRow responsive
function ParamRow({ label, children }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3">
      <span className="text-caption font-bold text-slate-600 sm:w-28 sm:shrink-0 uppercase tracking-wide">{label}</span>
      {children}
    </div>
  )
}

export default function BacktestForm({ onRun, loading, error, supportedSymbols = SUPPORTED_BACKTEST_SYMBOLS }) {
  const [symbol,       setSymbol]       = useState('BTC')
  const [strategy,     setStrategy]     = useState('rsi')
  const [capital,      setCapital]      = useState('10000')
  const [positionSize, setPositionSize] = useState('0.2')
  const [startDate,    setStartDate]    = useState('')
  const [endDate,      setEndDate]      = useState('')
  const [localError,   setLocalError]   = useState(null)

  // Strategy-specific params
  const [rsiPeriod,     setRsiPeriod]     = useState('14')
  const [rsiOversold,   setRsiOversold]   = useState('30')
  const [rsiOverbought, setRsiOverbought] = useState('70')
  const [bbPeriod,      setBbPeriod]      = useState('20')
  const [bbStdDev,      setBbStdDev]      = useState('2')
  const [emaFast,       setEmaFast]       = useState('9')
  const [emaSlow,       setEmaSlow]       = useState('21')
  const [stochK,        setStochK]        = useState('14')
  const [stochD,        setStochD]        = useState('3')
  const [stochOversold, setStochOversold] = useState('20')
  const [stochOverbought, setStochOverbought] = useState('80')

  const effectiveSupportedSymbols = Array.isArray(supportedSymbols) && supportedSymbols.length > 0
    ? supportedSymbols.map((item) => String(item).trim().toUpperCase()).filter(Boolean)
    : SUPPORTED_BACKTEST_SYMBOLS
  const supportedSet = new Set(effectiveSupportedSymbols)
  const backtestAssets = TRADING_ASSETS.filter((asset) => supportedSet.has(asset.value))
  const provider         = getAssetProvider(symbol)
  const providerLabel    = PROVIDER_LABELS[provider] || ''
  const selectedStrategy = STRATEGIES.find((s) => s.value === strategy) || STRATEGIES[0]

  const handleSubmit = (e) => {
    e.preventDefault()
    const cap = Number(capital)
    const ps  = Number(positionSize)
    if (!symbol) { setLocalError('Choose an asset.'); return }
    if (!supportedSet.has(symbol)) { setLocalError('This asset is not supported by the Binance historical backtest provider.'); return }
    if (!Number.isFinite(cap) || cap <= 0) { setLocalError('Initial capital must be positive.'); return }
    if (!Number.isFinite(ps) || ps <= 0 || ps > 1) { setLocalError('Position size must be between 0 and 1.'); return }
    setLocalError(null)

    const payload = { symbol, strategy, initialCapital: cap, positionSize: ps, startDate: startDate || undefined, endDate: endDate || undefined }

    if (strategy === 'rsi') {
      Object.assign(payload, { rsiPeriod: Number(rsiPeriod)||14, rsiOversold: Number(rsiOversold)||30, rsiOverbought: Number(rsiOverbought)||70 })
    } else if (strategy === 'bollinger') {
      Object.assign(payload, { bbPeriod: Number(bbPeriod)||20, bbStdDev: Number(bbStdDev)||2 })
    } else if (strategy === 'ema_cross') {
      Object.assign(payload, { emaFast: Number(emaFast)||9, emaSlow: Number(emaSlow)||21 })
    } else if (strategy === 'stochastic') {
      Object.assign(payload, { stochK: Number(stochK)||14, stochD: Number(stochD)||3, stochOversold: Number(stochOversold)||20, stochOverbought: Number(stochOverbought)||80 })
    }
    onRun(payload)
  }

  return (
    <motion.div
      whileHover={{ borderColor: 'rgba(225,29,72,0.12)' }}
      className="bg-[#0a1628]/88 border border-white/[0.07] rounded-2xl p-5 backdrop-blur-2xl shadow-[0_4px_28px_rgba(0,0,0,0.32)] transition-all duration-300"
    >
      <div className="flex items-center gap-2 mb-5">
        <FlaskConical size={13} className="text-rose-400" />
        <h2 className="text-body font-bold text-white">Strategy Configuration</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* ── Asset ──────────────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-caption font-black text-slate-600 tracking-wide uppercase">Asset</label>
            {providerLabel && (
              <span className="text-caption font-bold text-slate-600 bg-white/[0.04] border border-white/[0.07] rounded-full px-2 py-0.5">
                {providerLabel}
              </span>
            )}
          </div>
          <div className="relative">
            <select
              value={symbol} onChange={(e) => setSymbol(e.target.value)}
              className={`${fieldCls} pr-9 cursor-pointer`} style={{ backgroundImage: 'none' }}
            >
              {ASSET_GROUPS.map((group) => {
                const assets = backtestAssets.filter((a) => a.type === group.type)
                if (assets.length === 0) return null
                return (
                  <optgroup key={group.type} label={group.label}>
                    {assets.map((asset) => (
                      <option key={asset.value} value={asset.value} className="bg-[#0a1628]">{asset.label}</option>
                    ))}
                  </optgroup>
                )
              })}
            </select>
            <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" />
          </div>
          <p className="text-caption text-slate-600 font-medium mt-1">
            Backtests use Binance daily historical candles. Supported symbols: {effectiveSupportedSymbols.join(', ')}.
          </p>
        </div>

        {/* ── Strategy ───────────────────────────────────────── */}
        <div>
          <label className="block text-caption font-black text-slate-600 mb-1.5 tracking-wide uppercase">Strategy</label>
          <div className="relative">
            <select
              value={strategy} onChange={(e) => setStrategy(e.target.value)}
              className={`${fieldCls} pr-9 cursor-pointer`} style={{ backgroundImage: 'none' }}
            >
              {STRATEGIES.map((s) => (
                <option key={s.value} value={s.value} className="bg-[#0a1628]">{s.label}</option>
              ))}
            </select>
            <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" />
          </div>
          <p className="text-label text-slate-600 mt-1.5 leading-relaxed font-medium">{selectedStrategy.desc}</p>
        </div>

        {/* ── Strategy params ────────────────────────────────── */}
        {strategy === 'rsi' && (
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-3 space-y-3">
            <p className="text-caption font-black text-rose-400 uppercase tracking-wider">RSI Parameters</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <ParamRow label="Period"><input type="number" min="2" max="50" value={rsiPeriod} onChange={(e) => setRsiPeriod(e.target.value)} className={paramCls} /></ParamRow>
              <ParamRow label="Oversold"><input type="number" min="10" max="45" value={rsiOversold} onChange={(e) => setRsiOversold(e.target.value)} className={paramCls} /></ParamRow>
              <ParamRow label="Overbought"><input type="number" min="55" max="90" value={rsiOverbought} onChange={(e) => setRsiOverbought(e.target.value)} className={paramCls} /></ParamRow>
            </div>
          </div>
        )}
        {strategy === 'bollinger' && (
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-3 space-y-3">
            <p className="text-caption font-black text-rose-400 uppercase tracking-wider">Bollinger Bands Parameters</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <ParamRow label="Period"><input type="number" min="5" max="50" value={bbPeriod} onChange={(e) => setBbPeriod(e.target.value)} className={paramCls} /></ParamRow>
              <ParamRow label="Std Dev"><input type="number" min="1" max="3" step="0.1" value={bbStdDev} onChange={(e) => setBbStdDev(e.target.value)} className={paramCls} /></ParamRow>
            </div>
          </div>
        )}
        {strategy === 'ema_cross' && (
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-3 space-y-3">
            <p className="text-caption font-black text-rose-400 uppercase tracking-wider">EMA Cross Parameters</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <ParamRow label="Fast EMA"><input type="number" min="3" max="50" value={emaFast} onChange={(e) => setEmaFast(e.target.value)} className={paramCls} /></ParamRow>
              <ParamRow label="Slow EMA"><input type="number" min="5" max="200" value={emaSlow} onChange={(e) => setEmaSlow(e.target.value)} className={paramCls} /></ParamRow>
            </div>
          </div>
        )}
        {strategy === 'stochastic' && (
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-3 space-y-3">
            <p className="text-caption font-black text-rose-400 uppercase tracking-wider">Stochastic Parameters</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <ParamRow label="K Period"><input type="number" min="5" max="30" value={stochK} onChange={(e) => setStochK(e.target.value)} className={paramCls} /></ParamRow>
              <ParamRow label="D Period"><input type="number" min="2" max="10" value={stochD} onChange={(e) => setStochD(e.target.value)} className={paramCls} /></ParamRow>
              <ParamRow label="Oversold"><input type="number" min="5" max="40" value={stochOversold} onChange={(e) => setStochOversold(e.target.value)} className={paramCls} /></ParamRow>
              <ParamRow label="Overbought"><input type="number" min="60" max="95" value={stochOverbought} onChange={(e) => setStochOverbought(e.target.value)} className={paramCls} /></ParamRow>
            </div>
          </div>
        )}

        {/* ── Capital + Position size — grid-cols-1 sm:grid-cols-2 ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-caption font-black text-slate-600 mb-1.5 tracking-wide uppercase">Initial Capital ($)</label>
            <input type="number" min="1" value={capital} onChange={(e) => setCapital(e.target.value)} placeholder="10000" className={fieldCls} />
          </div>
          <div>
            <label className="block text-caption font-black text-slate-600 mb-1.5 tracking-wide uppercase">Position Size (0–1)</label>
            <input type="number" min="0.01" max="1" step="0.05" value={positionSize} onChange={(e) => setPositionSize(e.target.value)} placeholder="0.2" className={fieldCls} />
          </div>
        </div>

        {/* ── Date range — grid-cols-1 sm:grid-cols-2 ──────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-caption font-black text-slate-600 mb-1.5 tracking-wide uppercase">Start Date</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={fieldCls} />
          </div>
          <div>
            <label className="block text-caption font-black text-slate-600 mb-1.5 tracking-wide uppercase">End Date</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={fieldCls} />
          </div>
        </div>

        {(localError || error) && (
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/8 px-3 py-2 text-body-sm font-semibold text-amber-300">
            {localError || error}
          </div>
        )}

        {/* ── Submit — w-full ─────────────────────────────────── */}
        <motion.button
          type="submit" disabled={loading}
          whileHover={{ scale: loading ? 1 : 1.01 }}
          whileTap={{ scale: loading ? 1 : 0.98 }}
          className="ripple-btn w-full py-3 bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 disabled:opacity-55 text-white text-body font-black rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-[0_0_18px_rgba(225,29,72,0.28)]"
        >
          {loading
            ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Running...</>
            : <><Play size={13} />Run Backtest</>
          }
        </motion.button>
      </form>
    </motion.div>
  )
}
