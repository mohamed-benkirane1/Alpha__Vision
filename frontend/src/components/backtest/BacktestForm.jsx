import { useState } from 'react'
import { Play, FlaskConical } from 'lucide-react'

const SYMBOLS    = ['BTC', 'ETH', 'SOL', 'XAU', 'AAPL']
const STRATEGIES = [
  { value: 'rsi',       label: 'RSI Strategy',    desc: 'Buys on RSI < 30, sells on RSI > 70. Simple momentum oscillator.' },
  { value: 'macd',      label: 'MACD Crossover',  desc: 'Signal line crossover using 12/26/9 EMA configuration.'          },
  { value: 'bollinger', label: 'Bollinger Bands', desc: 'Mean-reversion strategy trading band breakouts and squeezes.'    },
  { value: 'multi',     label: 'Multi-Indicator', desc: 'Combines RSI + MACD + BB for higher-confidence signals.'         },
]

const selectClass = 'w-full bg-slate-900/80 border border-slate-700/50 text-white text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500/60 focus:shadow-[0_0_10px_rgba(99,102,241,0.12)] transition-all duration-200'

function BacktestForm({ onRun, loading }) {
  const [symbol,   setSymbol]   = useState('BTC')
  const [strategy, setStrategy] = useState('rsi')
  const [capital,  setCapital]  = useState('10000')

  const handleSubmit = (e) => {
    e.preventDefault()
    const cap = parseFloat(capital)
    if (!cap || cap < 100) return
    onRun({ symbol, strategy, capital: cap })
  }

  return (
    <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-5 backdrop-blur-xl">
      <div className="flex items-center gap-2 mb-5">
        <FlaskConical size={13} className="text-indigo-400" />
        <h2 className="text-sm font-semibold text-white">Strategy Configuration</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs text-slate-400 mb-1.5 font-semibold uppercase tracking-wide">Asset</label>
          <select value={symbol} onChange={(e) => setSymbol(e.target.value)} className={selectClass}>
            {SYMBOLS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1.5 font-semibold uppercase tracking-wide">Strategy</label>
          <select value={strategy} onChange={(e) => setStrategy(e.target.value)} className={selectClass}>
            {STRATEGIES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <p className="text-[11px] text-slate-600 mt-1.5 leading-relaxed">
            {STRATEGIES.find((s) => s.value === strategy)?.desc}
          </p>
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1.5 font-semibold uppercase tracking-wide">Initial Capital ($)</label>
          <input
            type="number"
            min="100"
            value={capital}
            onChange={(e) => setCapital(e.target.value)}
            placeholder="10000"
            className={selectClass}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-60 text-white text-sm font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-[0_0_14px_rgba(99,102,241,0.25)]"
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Running…
            </>
          ) : (
            <><Play size={13} /> Run Backtest</>
          )}
        </button>
      </form>
    </div>
  )
}

export default BacktestForm
