import { useState } from 'react'
import { Play, Square, Settings2 } from 'lucide-react'

const SYMBOLS    = ['BTC', 'ETH', 'SOL', 'XAU', 'AAPL']
const STRATEGIES = [
  { value: 'rsi',       label: 'RSI Strategy'    },
  { value: 'macd',      label: 'MACD Crossover'  },
  { value: 'bollinger', label: 'Bollinger Bands' },
  { value: 'multi',     label: 'Multi-Indicator' },
]

const selectClass = 'w-full bg-slate-900/80 border border-slate-700/50 text-white text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500/60 transition-all duration-200 disabled:opacity-50'

function BotControlPanel({ onStart, onStop, running }) {
  const [symbol,   setSymbol]   = useState('SOL')
  const [strategy, setStrategy] = useState('rsi')

  return (
    <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-5 backdrop-blur-xl">
      <div className="flex items-center gap-2 mb-5">
        <Settings2 size={13} className="text-indigo-400" />
        <h2 className="text-sm font-semibold text-white">Bot Configuration</h2>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs text-slate-400 mb-1.5 font-semibold uppercase tracking-wide">Trading Pair</label>
          <select value={symbol} onChange={(e) => setSymbol(e.target.value)} disabled={running} className={selectClass}>
            {SYMBOLS.map((s) => <option key={s} value={s}>{s}/USDT</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1.5 font-semibold uppercase tracking-wide">Strategy</label>
          <select value={strategy} onChange={(e) => setStrategy(e.target.value)} disabled={running} className={selectClass}>
            {STRATEGIES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            onClick={() => onStart(symbol, strategy)}
            disabled={running}
            className="py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-[0_0_14px_rgba(16,185,129,0.2)]"
          >
            <Play size={13} />
            Start Bot
          </button>
          <button
            onClick={onStop}
            disabled={!running}
            className="py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
          >
            <Square size={13} />
            Stop Bot
          </button>
        </div>
      </div>
    </div>
  )
}

export default BotControlPanel
