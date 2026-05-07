import { useState } from 'react'
import { Play, Square, Settings2, ChevronDown } from 'lucide-react'
import { motion } from 'framer-motion'

const SYMBOLS    = ['BTC', 'ETH', 'SOL', 'XAU', 'AAPL']
const STRATEGIES = [
  { value: 'rsi',       label: 'RSI Strategy'    },
  { value: 'macd',      label: 'MACD Crossover'  },
  { value: 'bollinger', label: 'Bollinger Bands' },
  { value: 'multi',     label: 'Multi-Indicator' },
]

const fieldCls = 'w-full bg-[#060D1C]/80 border border-white/[0.09] text-white text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-indigo-500/60 transition-all duration-200 disabled:opacity-40 appearance-none'

export default function BotControlPanel({ onStart, onStop, running }) {
  const [symbol,   setSymbol]   = useState('SOL')
  const [strategy, setStrategy] = useState('rsi')

  return (
    <motion.div
      whileHover={{ borderColor: 'rgba(99,102,241,0.14)' }}
      className="bg-[#0a1628]/88 border border-white/[0.07] rounded-2xl p-5 backdrop-blur-2xl shadow-[0_4px_28px_rgba(0,0,0,0.32)] transition-all duration-300"
    >
      <div className="flex items-center gap-2 mb-5">
        <Settings2 size={13} className="text-indigo-400" />
        <h2 className="text-sm font-bold text-white">Bot Configuration</h2>
      </div>

      <div className="space-y-4">

        {/* Trading Pair */}
        <div>
          <label className="block text-[10px] font-black text-slate-600 mb-1.5 tracking-[0.1em] uppercase">Trading Pair</label>
          <div className="relative">
            <select
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              disabled={running}
              className={fieldCls + ' pr-9 cursor-pointer'}
              style={{ backgroundImage: 'none' }}
            >
              {SYMBOLS.map((s) => <option key={s} value={s} className="bg-[#0a1628]">{s}/USDT</option>)}
            </select>
            <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" />
          </div>
        </div>

        {/* Strategy */}
        <div>
          <label className="block text-[10px] font-black text-slate-600 mb-1.5 tracking-[0.1em] uppercase">Strategy</label>
          <div className="relative">
            <select
              value={strategy}
              onChange={(e) => setStrategy(e.target.value)}
              disabled={running}
              className={fieldCls + ' pr-9 cursor-pointer'}
              style={{ backgroundImage: 'none' }}
            >
              {STRATEGIES.map((s) => <option key={s.value} value={s.value} className="bg-[#0a1628]">{s.label}</option>)}
            </select>
            <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" />
          </div>
        </div>

        {/* Toggle */}
        <div className="pt-1">
          {!running ? (
            <motion.button
              onClick={() => onStart(symbol, strategy)}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.97 }}
              className="ripple-btn w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-black rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-[0_0_18px_rgba(16,185,129,0.22)]"
            >
              <Play size={13} />
              Start Bot
            </motion.button>
          ) : (
            <motion.button
              onClick={onStop}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.97 }}
              className="ripple-btn w-full py-3 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-sm font-black rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-[0_0_18px_rgba(244,63,94,0.22)]"
            >
              <Square size={13} />
              Stop Bot
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  )
}
