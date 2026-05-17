import { motion, AnimatePresence } from 'framer-motion'
import { History } from 'lucide-react'

const signalStyle = {
  BUY:  'bg-emerald-500/10 text-emerald-400 border border-emerald-500/22',
  SELL: 'bg-rose-500/10 text-rose-400 border border-rose-500/22',
  HOLD: 'bg-amber-500/10 text-amber-400 border border-amber-500/22',
}

export default function BotHistory({ signals }) {
  return (
    <motion.div
      whileHover={{ borderColor: 'rgba(225,29,72,0.12)' }}
      className="bg-[#0a1628]/88 border border-white/[0.07] rounded-2xl p-5 backdrop-blur-2xl shadow-[0_4px_28px_rgba(0,0,0,0.32)] transition-all duration-300"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <History size={13} className="text-rose-400" />
          <h2 className="text-sm font-bold text-white">Signal History</h2>
        </div>
        <span className="text-[10px] text-slate-700 font-bold">{signals.length} signals</span>
      </div>

      {signals.length === 0 ? (
        <div className="py-10 text-center">
          <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto mb-3">
            <History size={16} className="text-slate-700" />
          </div>
          <p className="text-xs text-slate-600 font-medium">No signals yet.</p>
          <p className="text-[11px] text-slate-700 mt-1">Start the bot to begin generating signals.</p>
        </div>
      ) : (
        <>
          <div className="hidden sm:grid grid-cols-5 px-3 mb-2 text-[10px] text-slate-700 uppercase tracking-[0.1em] font-black">
            <span>Time</span><span>Symbol</span><span>Strategy</span><span>Signal</span>
            <span className="text-right">Confidence</span>
          </div>
          <div className="space-y-1.5">
            <AnimatePresence initial={false}>
              {signals.map((s, i) => (
                <motion.div
                  key={`${s.time}-${i}`}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.25 }}
                  whileHover={{ x: 2, backgroundColor: 'rgba(225,29,72,0.03)' }}
                  className="grid grid-cols-3 sm:grid-cols-5 items-center px-3 py-2.5 bg-white/[0.02] border border-white/[0.045] rounded-xl transition-all duration-200 text-xs gap-1 sm:gap-0"
                >
                  <span className="text-slate-600 font-mono text-[10px]">{s.time}</span>
                  <span className="hidden sm:block text-slate-300 font-bold">{s.symbol}</span>
                  <span className="hidden sm:block text-slate-600 capitalize font-medium">{s.strategy}</span>
                  <span className={`w-fit px-2.5 py-0.5 rounded-lg text-[10px] font-black ${signalStyle[s.signal] || signalStyle.HOLD}`}>
                    {s.signal}
                  </span>
                  <span className="text-right">
                    <span className="text-white font-black tabular-nums">{s.confidence}%</span>
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </>
      )}
    </motion.div>
  )
}
