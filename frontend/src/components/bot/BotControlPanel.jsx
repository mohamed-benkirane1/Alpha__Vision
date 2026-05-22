import { useState } from 'react'
import { Play, Square, Settings2, ChevronDown, AlertTriangle, RefreshCw } from 'lucide-react'
import { motion } from 'framer-motion'

const SYMBOLS = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA', 'DOGE']
const STRATEGIES = [
  { value: 'momentum-24h', label: '24h Momentum' },
]

const fieldCls = 'w-full bg-[#060D1C]/80 border border-white/[0.09] text-white text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-rose-500/50 focus:shadow-[0_0_14px_rgba(225,29,72,0.12)] transition-all duration-200 disabled:opacity-40 appearance-none'

export default function BotControlPanel({ onStart, onStop, onTick, running, loading, tickLoading, error }) {
  const [symbol, setSymbol] = useState('BTC')
  const [strategy, setStrategy] = useState('momentum-24h')
  const [positionSize, setPositionSize] = useState('100')
  const [localError, setLocalError] = useState(null)

  const start = () => {
    if (!symbol) {
      setLocalError('Symbol is required.')
      return
    }
    if (!strategy) {
      setLocalError('Strategy is required.')
      return
    }
    const normalizedPositionSize = Number(positionSize)
    if (!Number.isFinite(normalizedPositionSize) || normalizedPositionSize <= 0) {
      setLocalError('Paper position size must be positive.')
      return
    }
    setLocalError(null)
    onStart({
      symbol,
      strategy,
      positionSize: normalizedPositionSize,
      mode: 'paper',
    })
  }

  return (
    <motion.div
      whileHover={{ borderColor: 'rgba(225,29,72,0.12)' }}
      className="bg-[#0a1628]/88 border border-white/[0.07] rounded-2xl p-5 backdrop-blur-2xl shadow-[0_4px_28px_rgba(0,0,0,0.32)] transition-all duration-300"
    >
      <div className="flex items-center gap-2 mb-5">
        <Settings2 size={13} className="text-rose-400" />
        <h2 className="text-sm font-bold text-white">Bot Configuration</h2>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-[10px] font-black text-slate-600 mb-1.5 tracking-[0.1em] uppercase">Trading Pair</label>
          <div className="relative">
            <select
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              disabled={running || loading}
              className={`${fieldCls} pr-9 cursor-pointer`}
              style={{ backgroundImage: 'none' }}
            >
              {SYMBOLS.map((s) => <option key={s} value={s} className="bg-[#0a1628]">{s}/USDT</option>)}
            </select>
            <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" />
          </div>
        </div>

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
              {STRATEGIES.map((s) => <option key={s.value} value={s.value} className="bg-[#0a1628]">{s.label}</option>)}
            </select>
            <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-black text-slate-600 mb-1.5 tracking-[0.1em] uppercase">Paper Position Size</label>
          <input
            value={positionSize}
            onChange={(e) => setPositionSize(e.target.value)}
            disabled={running || loading}
            type="number"
            min="1"
            step="1"
            className={fieldCls}
          />
        </div>

        {(localError || error) && (
          <div className="flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/8 px-3 py-2 text-xs font-semibold text-amber-300">
            <AlertTriangle size={12} className="mt-0.5 shrink-0" />
            <span>{localError || error}</span>
          </div>
        )}

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
              {loading ? 'Starting...' : 'Start Bot'}
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
                {tickLoading ? 'Running Tick...' : 'Run Bot Tick'}
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
