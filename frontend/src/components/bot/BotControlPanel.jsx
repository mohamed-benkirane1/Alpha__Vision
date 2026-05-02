import { useState } from 'react'
import { Play, Square } from 'lucide-react'

const SYMBOLS     = ['BTC', 'ETH', 'SOL', 'XAU', 'AAPL']
const STRATEGIES  = [
  { value: 'rsi',       label: 'RSI Strategy'    },
  { value: 'macd',      label: 'MACD Crossover'  },
  { value: 'bollinger', label: 'Bollinger Bands' },
  { value: 'multi',     label: 'Multi-Indicator' },
]

const selectClass =
  'w-full bg-gray-900 border border-gray-800 text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-indigo-500 transition-colors'

function BotControlPanel({ onStart, onStop, running }) {
  const [symbol,   setSymbol]   = useState('SOL')
  const [strategy, setStrategy] = useState('rsi')

  return (
    <div className="bg-gray-900/50 border border-gray-800/60 rounded-xl p-5 backdrop-blur-sm">
      <h2 className="text-sm font-semibold text-white mb-5">Bot Configuration</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-xs text-gray-400 mb-1.5 font-medium">Trading Pair</label>
          <select value={symbol} onChange={(e) => setSymbol(e.target.value)} disabled={running} className={`${selectClass} disabled:opacity-50`}>
            {SYMBOLS.map((s) => <option key={s} value={s}>{s}/USDT</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1.5 font-medium">Strategy</label>
          <select value={strategy} onChange={(e) => setStrategy(e.target.value)} disabled={running} className={`${selectClass} disabled:opacity-50`}>
            {STRATEGIES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            onClick={() => onStart(symbol, strategy)}
            disabled={running}
            className="py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Play size={13} />
            Start Bot
          </button>
          <button
            onClick={onStop}
            disabled={!running}
            className="py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
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
