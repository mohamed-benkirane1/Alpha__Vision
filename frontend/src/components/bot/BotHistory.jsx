import { motion, AnimatePresence } from 'framer-motion'
import { History } from 'lucide-react'

const signalStyle = {
  BUY:  'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25',
  SELL: 'bg-red-500/15 text-red-400 border border-red-500/25',
  HOLD: 'bg-amber-500/15 text-amber-400 border border-amber-500/25',
}

function BotHistory({ signals }) {
  return (
    <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-5 backdrop-blur-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <History size={13} className="text-indigo-400" />
          <h2 className="text-sm font-semibold text-white">Signal History</h2>
        </div>
        <span className="text-[11px] text-slate-500">{signals.length} signals</span>
      </div>

      {signals.length === 0 ? (
        <div className="py-10 text-center">
          <p className="text-xs text-slate-600">No signals yet.</p>
          <p className="text-[11px] text-slate-700 mt-1">Start the bot to begin generating signals.</p>
        </div>
      ) : (
        <>
          <div className="hidden sm:grid grid-cols-5 px-3 mb-2 text-[11px] text-slate-500 uppercase tracking-widest font-semibold">
            <span>Time</span><span>Symbol</span><span>Strategy</span><span>Signal</span><span className="text-right">Confidence</span>
          </div>
          <div className="space-y-1.5">
            <AnimatePresence initial={false}>
              {signals.map((s, i) => (
                <motion.div
                  key={`${s.time}-${i}`}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className="grid grid-cols-3 sm:grid-cols-5 items-center px-3 py-2.5 bg-slate-900/40 border border-slate-700/30 rounded-xl hover:border-indigo-500/20 transition-all duration-200 text-xs gap-1 sm:gap-0"
                >
                  <span className="text-slate-500 font-mono text-[11px]">{s.time}</span>
                  <span className="hidden sm:block text-slate-200 font-semibold">{s.symbol}</span>
                  <span className="hidden sm:block text-slate-500 capitalize">{s.strategy}</span>
                  <span className={`w-fit px-2.5 py-0.5 rounded-lg text-[10px] font-bold ${signalStyle[s.signal] || signalStyle.HOLD}`}>
                    {s.signal}
                  </span>
                  <span className="text-right">
                    <span className="text-slate-200 font-bold">{s.confidence}%</span>
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </>
      )}
    </div>
  )
}

export default BotHistory
