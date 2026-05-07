import { motion } from 'framer-motion'
import { Bot, TrendingUp, Activity, Zap, ChevronUp } from 'lucide-react'

const CONFIDENCE = 87

export default function AISignalCard() {
  return (
    <motion.div
      whileHover={{ borderColor: 'rgba(99,102,241,0.22)' }}
      className="bg-[#0a1628]/88 border border-white/[0.07] rounded-2xl p-5 backdrop-blur-2xl flex flex-col h-full shadow-[0_4px_28px_rgba(0,0,0,0.32)] transition-all duration-300"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
            <Zap size={13} className="text-indigo-400" />
          </div>
          <h2 className="text-sm font-bold text-white">AI Signal</h2>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[9px] text-emerald-400 font-black tracking-widest">LIVE</span>
        </div>
      </div>

      {/* Signal + confidence */}
      <div className="flex-1 flex flex-col items-center justify-center gap-5 py-2">
        <motion.div
          initial={{ scale: 0.82, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.1 }}
          className="text-center"
        >
          {/* Pulsing badge */}
          <div className="relative inline-flex items-center justify-center mb-3">
            <div
              className="absolute inset-0 rounded-2xl bg-emerald-500/10 animate-ping"
              style={{ animationDuration: '2.6s' }}
            />
            <div className="relative inline-flex items-center gap-2.5 bg-emerald-500/10 border border-emerald-500/28 rounded-2xl px-5 py-3 shadow-[0_0_28px_rgba(16,185,129,0.12)]">
              <TrendingUp size={17} className="text-emerald-400" />
              <span className="text-xl font-black text-emerald-400 tracking-wide">STRONG BUY</span>
              <ChevronUp size={16} className="text-emerald-400" />
            </div>
          </div>
          <p className="text-[11px] text-slate-600 font-medium">Based on 12 technical indicators</p>
        </motion.div>

        {/* Confidence bar */}
        <div className="w-full">
          <div className="flex justify-between text-xs mb-2">
            <span className="text-slate-600 font-medium">Confidence score</span>
            <span className="text-white font-black">{CONFIDENCE}%</span>
          </div>
          <div className="h-2.5 bg-slate-800/80 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${CONFIDENCE}%` }}
              transition={{ duration: 1.3, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.4)]"
            />
          </div>
        </div>
      </div>

      {/* AI analysis block */}
      <div className="bg-white/[0.025] border border-white/[0.06] rounded-xl p-3.5 mt-4">
        <div className="flex items-center gap-1.5 mb-2">
          <Activity size={11} className="text-indigo-400" />
          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-wider">AI Analysis</span>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          BTC showing strong momentum. RSI at 62, MACD bullish crossover, volume surge confirmed. Key support held at $65,800.
        </p>
      </div>

      <p className="text-[10px] text-slate-700 text-center mt-3 font-medium">Updated 2 min ago</p>
    </motion.div>
  )
}
