import { useState } from 'react'
import { Play, FlaskConical, ChevronDown } from 'lucide-react'
import { motion } from 'framer-motion'

const SYMBOLS    = ['BTC', 'ETH', 'SOL', 'XAU', 'AAPL']
const STRATEGIES = [
  { value: 'rsi',       label: 'RSI Strategy',    desc: 'Buys on RSI < 30, sells on RSI > 70. Simple momentum oscillator.' },
  { value: 'macd',      label: 'MACD Crossover',  desc: 'Signal line crossover using 12/26/9 EMA configuration.'          },
  { value: 'bollinger', label: 'Bollinger Bands', desc: 'Mean-reversion strategy trading band breakouts and squeezes.'    },
  { value: 'multi',     label: 'Multi-Indicator', desc: 'Combines RSI + MACD + BB for higher-confidence signals.'         },
]

const fieldCls = 'w-full bg-[#060D1C]/80 border border-white/[0.09] text-white text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-indigo-500/60 focus:shadow-[0_0_14px_rgba(99,102,241,0.14)] transition-all duration-200 appearance-none'

export default function BacktestForm({ onRun, loading }) {
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
    <motion.div
      whileHover={{ borderColor: 'rgba(99,102,241,0.14)' }}
      className="bg-[#0a1628]/88 border border-white/[0.07] rounded-2xl p-5 backdrop-blur-2xl shadow-[0_4px_28px_rgba(0,0,0,0.32)] transition-all duration-300"
    >
      <div className="flex items-center gap-2 mb-5">
        <FlaskConical size={13} className="text-indigo-400" />
        <h2 className="text-sm font-bold text-white">Strategy Configuration</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Asset */}
        <div>
          <label className="block text-[10px] font-black text-slate-600 mb-1.5 tracking-[0.1em] uppercase">Asset</label>
          <div className="relative">
            <select value={symbol} onChange={(e) => setSymbol(e.target.value)} className={fieldCls + ' pr-9 cursor-pointer'} style={{ backgroundImage: 'none' }}>
              {SYMBOLS.map((s) => <option key={s} value={s} className="bg-[#0a1628]">{s}</option>)}
            </select>
            <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" />
          </div>
        </div>

        {/* Strategy */}
        <div>
          <label className="block text-[10px] font-black text-slate-600 mb-1.5 tracking-[0.1em] uppercase">Strategy</label>
          <div className="relative">
            <select value={strategy} onChange={(e) => setStrategy(e.target.value)} className={fieldCls + ' pr-9 cursor-pointer'} style={{ backgroundImage: 'none' }}>
              {STRATEGIES.map((s) => <option key={s.value} value={s.value} className="bg-[#0a1628]">{s.label}</option>)}
            </select>
            <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" />
          </div>
          <p className="text-[11px] text-slate-600 mt-1.5 leading-relaxed font-medium">
            {STRATEGIES.find((s) => s.value === strategy)?.desc}
          </p>
        </div>

        {/* Capital */}
        <div>
          <label className="block text-[10px] font-black text-slate-600 mb-1.5 tracking-[0.1em] uppercase">Initial Capital ($)</label>
          <input
            type="number"
            min="100"
            value={capital}
            onChange={(e) => setCapital(e.target.value)}
            placeholder="10000"
            className={fieldCls}
          />
        </div>

        <motion.button
          type="submit"
          disabled={loading}
          whileHover={{ scale: loading ? 1 : 1.01 }}
          whileTap={{ scale: loading ? 1 : 0.98 }}
          className="ripple-btn w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-55 text-white text-sm font-black rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-[0_0_18px_rgba(99,102,241,0.26)]"
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Running…
            </>
          ) : (
            <><Play size={13} /> Run Backtest</>
          )}
        </motion.button>
      </form>
    </motion.div>
  )
}
