import { useState } from 'react'
import { Play, Square, Settings2, ChevronDown, AlertTriangle, RefreshCw } from 'lucide-react'
import { motion } from 'framer-motion'
import { TRADING_ASSETS, ASSET_GROUPS, getAssetProvider } from '../../constants/tradingAssets'

const STRATEGIES = [
  { value: 'ma_cross',   label: 'MA Cross (MA20/MA50) — Trend Following' },
  { value: 'ema_cross',  label: 'EMA Cross (EMA9/EMA21) — Fast Trend' },
  { value: 'rsi',        label: 'RSI — Mean Reversion' },
  { value: 'macd',       label: 'MACD Crossover — Momentum' },
  { value: 'bollinger',  label: 'Bollinger Bands — Volatility' },
  { value: 'stochastic', label: 'Stochastic — Overbought/Oversold' },
]

const PROVIDER_LABELS = { binance: 'via Binance', yahoo: 'via Yahoo Finance', default: '' }

const fieldCls = 'w-full bg-[#060D1C]/80 border border-white/[0.09] text-white text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-rose-500/50 focus:shadow-[0_0_14px_rgba(225,29,72,0.12)] transition-all duration-200 disabled:opacity-40 appearance-none'
const paramCls = 'bg-[#060D1C]/80 border border-white/[0.09] text-white text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-rose-500/50 transition-all duration-200 w-full disabled:opacity-40'

function ParamRow({ label, children }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[10px] font-bold text-slate-600 w-28 shrink-0 uppercase tracking-wide">{label}</span>
      {children}
    </div>
  )
}

export default function BotControlPanel({ onStart, onStop, onTick, running, loading, tickLoading, error }) {
  const [symbol, setSymbol] = useState('BTC')
  const [strategy, setStrategy] = useState('ma_cross')
  const [positionSize, setPositionSize] = useState('100')
  const [executeTrades, setExecuteTrades] = useState(false)
  const [localError, setLocalError] = useState(null)

  // Strategy params
  const [rsiPeriod, setRsiPeriod] = useState('14')
  const [rsiOversold, setRsiOversold] = useState('30')
  const [rsiOverbought, setRsiOverbought] = useState('70')
  const [bbPeriod, setBbPeriod] = useState('20')
  const [bbStdDev, setBbStdDev] = useState('2')
  const [emaFast, setEmaFast] = useState('9')
  const [emaSlow, setEmaSlow] = useState('21')
  const [stochK, setStochK] = useState('14')
  const [stochD, setStochD] = useState('3')
  const [stochOversold, setStochOversold] = useState('20')
  const [stochOverbought, setStochOverbought] = useState('80')

  const provider = getAssetProvider(symbol)
  const providerLabel = PROVIDER_LABELS[provider] || ''

  const start = () => {
    if (!symbol) { setLocalError('Symbol is required.'); return }
    if (!strategy) { setLocalError('Strategy is required.'); return }
    const normalizedPositionSize = Number(positionSize)
    if (!Number.isFinite(normalizedPositionSize) || normalizedPositionSize <= 0) {
      setLocalError('Paper position size must be positive.')
      return
    }
    setLocalError(null)

    const config = {
      symbol,
      strategy,
      positionSize: normalizedPositionSize,
      executeTrades,
      mode: 'paper',
    }

    if (strategy === 'rsi') {
      Object.assign(config, {
        rsiPeriod: Number(rsiPeriod) || 14,
        rsiOversold: Number(rsiOversold) || 30,
        rsiOverbought: Number(rsiOverbought) || 70,
      })
    } else if (strategy === 'bollinger') {
      Object.assign(config, {
        bbPeriod: Number(bbPeriod) || 20,
        bbStdDev: Number(bbStdDev) || 2,
      })
    } else if (strategy === 'ema_cross') {
      Object.assign(config, {
        emaFast: Number(emaFast) || 9,
        emaSlow: Number(emaSlow) || 21,
      })
    } else if (strategy === 'stochastic') {
      Object.assign(config, {
        stochK: Number(stochK) || 14,
        stochD: Number(stochD) || 3,
        stochOversold: Number(stochOversold) || 20,
        stochOverbought: Number(stochOverbought) || 80,
      })
    }

    onStart(config)
  }

  return (
    <motion.div
      whileHover={{ borderColor: 'rgba(225,29,72,0.12)' }}
      className="bg-[#0a1628]/88 border border-white/[0.07] rounded-2xl p-5 backdrop-blur-2xl shadow-[0_4px_28px_rgba(0,0,0,0.32)] transition-all duration-300"
    >
      <div className="flex items-center gap-2 mb-5">
        <Settings2 size={13} className="text-rose-400" />
        <h2 className="text-sm font-bold text-white">Paper Bot Configuration</h2>
      </div>
      <p className="mb-4 text-[11px] font-medium leading-relaxed text-slate-600">
        Simulated execution only. No broker order is sent. Manual ticks use backend candles and paper trading validation.
      </p>

      <div className="space-y-4">

        {/* ── Trading Pair ───────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[10px] font-black text-slate-600 tracking-[0.1em] uppercase">Trading Pair</label>
            {providerLabel && (
              <span className="text-[9px] font-bold text-slate-600 bg-white/[0.04] border border-white/[0.07] rounded-full px-2 py-0.5">
                {providerLabel}
              </span>
            )}
          </div>
          <div className="relative">
            <select
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              disabled={running || loading}
              className={`${fieldCls} pr-9 cursor-pointer`}
              style={{ backgroundImage: 'none' }}
            >
              {ASSET_GROUPS.map((group) => {
                const assets = TRADING_ASSETS.filter((a) => a.type === group.type)
                if (assets.length === 0) return null
                return (
                  <optgroup key={group.type} label={group.label}>
                    {assets.map((asset) => (
                      <option key={asset.value} value={asset.value} className="bg-[#0a1628]">
                        {asset.label}
                      </option>
                    ))}
                  </optgroup>
                )
              })}
            </select>
            <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" />
          </div>
        </div>

        {/* ── Strategy ──────────────────────────────────── */}
        <div>
          <label className="block text-[10px] font-black text-slate-600 mb-1.5 tracking-[0.1em] uppercase">Strategy</label>
          <div className="relative">
            <select
              value={strategy}
              onChange={(e) => setStrategy(e.target.value)}
              disabled={running || loading}
              className={`${fieldCls} pr-9 cursor-pointer`}
              style={{ backgroundImage: 'none' }}
            >
              {STRATEGIES.map((s) => (
                <option key={s.value} value={s.value} className="bg-[#0a1628]">{s.label}</option>
              ))}
            </select>
            <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" />
          </div>
        </div>

        {/* ── Strategy params ────────────────────────────── */}
        {strategy === 'rsi' && !running && (
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-3 space-y-2.5">
            <p className="text-[10px] font-black text-rose-400 uppercase tracking-wider mb-2">RSI Parameters</p>
            <ParamRow label="Period">
              <input type="number" min="2" max="50" value={rsiPeriod} onChange={(e) => setRsiPeriod(e.target.value)} disabled={running || loading} className={paramCls} />
            </ParamRow>
            <ParamRow label="Oversold">
              <input type="number" min="10" max="45" value={rsiOversold} onChange={(e) => setRsiOversold(e.target.value)} disabled={running || loading} className={paramCls} />
            </ParamRow>
            <ParamRow label="Overbought">
              <input type="number" min="55" max="90" value={rsiOverbought} onChange={(e) => setRsiOverbought(e.target.value)} disabled={running || loading} className={paramCls} />
            </ParamRow>
          </div>
        )}

        {strategy === 'bollinger' && !running && (
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-3 space-y-2.5">
            <p className="text-[10px] font-black text-rose-400 uppercase tracking-wider mb-2">Bollinger Bands Parameters</p>
            <ParamRow label="Period">
              <input type="number" min="5" max="50" value={bbPeriod} onChange={(e) => setBbPeriod(e.target.value)} disabled={running || loading} className={paramCls} />
            </ParamRow>
            <ParamRow label="Std Dev">
              <input type="number" min="1" max="3" step="0.1" value={bbStdDev} onChange={(e) => setBbStdDev(e.target.value)} disabled={running || loading} className={paramCls} />
            </ParamRow>
          </div>
        )}

        {strategy === 'ema_cross' && !running && (
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-3 space-y-2.5">
            <p className="text-[10px] font-black text-rose-400 uppercase tracking-wider mb-2">EMA Cross Parameters</p>
            <ParamRow label="Fast EMA">
              <input type="number" min="3" max="50" value={emaFast} onChange={(e) => setEmaFast(e.target.value)} disabled={running || loading} className={paramCls} />
            </ParamRow>
            <ParamRow label="Slow EMA">
              <input type="number" min="5" max="200" value={emaSlow} onChange={(e) => setEmaSlow(e.target.value)} disabled={running || loading} className={paramCls} />
            </ParamRow>
          </div>
        )}

        {strategy === 'stochastic' && !running && (
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-3 space-y-2.5">
            <p className="text-[10px] font-black text-rose-400 uppercase tracking-wider mb-2">Stochastic Parameters</p>
            <ParamRow label="K Period">
              <input type="number" min="5" max="30" value={stochK} onChange={(e) => setStochK(e.target.value)} disabled={running || loading} className={paramCls} />
            </ParamRow>
            <ParamRow label="D Period">
              <input type="number" min="2" max="10" value={stochD} onChange={(e) => setStochD(e.target.value)} disabled={running || loading} className={paramCls} />
            </ParamRow>
            <ParamRow label="Oversold">
              <input type="number" min="5" max="40" value={stochOversold} onChange={(e) => setStochOversold(e.target.value)} disabled={running || loading} className={paramCls} />
            </ParamRow>
            <ParamRow label="Overbought">
              <input type="number" min="60" max="95" value={stochOverbought} onChange={(e) => setStochOverbought(e.target.value)} disabled={running || loading} className={paramCls} />
            </ParamRow>
          </div>
        )}

        {/* ── Position size ──────────────────────────────── */}
        <div>
          <label className="block text-[10px] font-black text-slate-600 mb-1.5 tracking-[0.1em] uppercase">Max Paper Position USD</label>
          <input
            value={positionSize}
            onChange={(e) => setPositionSize(e.target.value)}
            disabled={running || loading}
            type="number" min="1" step="1"
            className={fieldCls}
          />
        </div>

        {/* ── Execute trades checkbox ────────────────────── */}
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/[0.07] bg-white/[0.025] px-3.5 py-3">
          <input
            type="checkbox"
            checked={executeTrades}
            onChange={(e) => setExecuteTrades(e.target.checked)}
            disabled={running || loading}
            className="mt-0.5 h-4 w-4 accent-rose-500 disabled:opacity-40"
          />
          <span>
            <span className="block text-xs font-black text-white">Allow paper trade execution</span>
            <span className="mt-0.5 block text-[10px] font-medium text-slate-600">
              If disabled, ticks only record BUY/SELL/HOLD decisions. If enabled, BUY/SELL uses the backend paper trading engine.
            </span>
          </span>
        </label>

        {(localError || error) && (
          <div className="flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/8 px-3 py-2 text-xs font-semibold text-amber-300">
            <AlertTriangle size={12} className="mt-0.5 shrink-0" />
            <span>{localError || error}</span>
          </div>
        )}

        {/* ── Start / Stop / Tick buttons ────────────────── */}
        <div className="pt-1">
          {!running ? (
            <motion.button
              onClick={start}
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.01 }}
              whileTap={{ scale: loading ? 1 : 0.97 }}
              className="ripple-btn w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-55 disabled:cursor-not-allowed text-white text-sm font-black rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-[0_0_18px_rgba(16,185,129,0.22)]"
            >
              {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Play size={13} />}
              {loading ? 'Starting...' : 'Start Paper Bot'}
            </motion.button>
          ) : (
            <div className="grid grid-cols-1 gap-2">
              <motion.button
                onClick={onTick}
                disabled={loading || tickLoading}
                whileHover={{ scale: loading || tickLoading ? 1 : 1.01 }}
                whileTap={{ scale: loading || tickLoading ? 1 : 0.97 }}
                className="ripple-btn w-full py-3 bg-white/[0.055] hover:bg-white/[0.09] border border-white/[0.08] disabled:opacity-55 disabled:cursor-not-allowed text-white text-sm font-black rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
              >
                <RefreshCw size={13} className={tickLoading ? 'animate-spin' : ''} />
                {tickLoading ? 'Running Tick...' : 'Run Paper Tick'}
              </motion.button>
              <motion.button
                onClick={onStop}
                disabled={loading || tickLoading}
                whileHover={{ scale: loading || tickLoading ? 1 : 1.01 }}
                whileTap={{ scale: loading || tickLoading ? 1 : 0.97 }}
                className="ripple-btn w-full py-3 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 disabled:opacity-55 disabled:cursor-not-allowed text-white text-sm font-black rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-[0_0_18px_rgba(244,63,94,0.22)]"
              >
                {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Square size={13} />}
                {loading ? 'Stopping...' : 'Stop Bot'}
              </motion.button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
