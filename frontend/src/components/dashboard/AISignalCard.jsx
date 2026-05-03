import { motion } from 'framer-motion'
import { Bot, TrendingUp, Activity, Zap } from 'lucide-react'

const CONFIDENCE = 87

function AISignalCard() {
  return (
    <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-5 backdrop-blur-xl flex flex-col h-full hover:border-indigo-500/20 transition-all duration-300">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Zap size={14} className="text-indigo-400" />
          <h2 className="text-sm font-semibold text-white">AI Signal</h2>
        </div>
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600/20 to-violet-600/5 border border-indigo-500/25 flex items-center justify-center">
          <Bot size={14} className="text-indigo-400" />
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-5 py-2">
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-2.5 bg-emerald-500/10 border border-emerald-500/25 rounded-xl px-5 py-3 mb-2 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
            <TrendingUp size={18} className="text-emerald-400" />
            <span className="text-xl font-bold text-emerald-400 tracking-wide">STRONG BUY</span>
          </div>
          <p className="text-[11px] text-slate-500">Based on 12 technical indicators</p>
        </motion.div>

        <div className="w-full">
          <div className="flex justify-between text-xs mb-2">
            <span className="text-slate-500">Confidence score</span>
            <span className="text-white font-bold">{CONFIDENCE}%</span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${CONFIDENCE}%` }}
              transition={{ duration: 1, delay: 0.25, ease: 'easeOut' }}
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-emerald-400"
            />
          </div>
        </div>
      </div>

      <div className="bg-slate-900/80 border border-slate-700/40 rounded-xl p-3.5 mt-4">
        <div className="flex items-center gap-1.5 mb-1.5">
          <Activity size={11} className="text-indigo-400" />
          <span className="text-[11px] font-semibold text-indigo-400">AI Analysis</span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          BTC showing strong momentum. RSI at 62, MACD bullish crossover, volume surge confirmed. Key support held at $65,800.
        </p>
      </div>

      <p className="text-[10px] text-slate-600 text-center mt-3">Updated 2 min ago</p>
    </div>
  )
}

export default AISignalCard
