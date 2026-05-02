import { motion, AnimatePresence } from 'framer-motion'
import { History } from 'lucide-react'

const signalStyle = {
  BUY:  'bg-emerald-500/15 text-emerald-400',
  SELL: 'bg-red-500/15 text-red-400',
  HOLD: 'bg-amber-500/15 text-amber-400',
}

function BotHistory({ signals }) {
  return (
    <div className="bg-gray-900/50 border border-gray-800/60 rounded-xl p-5 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <History size={13} className="text-indigo-400" />
          <h2 className="text-sm font-semibold text-white">Signal History</h2>
        </div>
        <span className="text-[11px] text-gray-500">{signals.length} signals</span>
      </div>

      {signals.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-xs text-gray-600">No signals yet.</p>
          <p className="text-[11px] text-gray-700 mt-1">Start the bot to begin generating signals.</p>
        </div>
      ) : (
        <>
          <div className="hidden sm:grid grid-cols-5 px-3 mb-2 text-[11px] text-gray-500 uppercase tracking-wide">
            <span>Time</span>
            <span>Symbol</span>
            <span>Strategy</span>
            <span>Signal</span>
            <span className="text-right">Confidence</span>
          </div>
          <div className="space-y-1.5">
            <AnimatePresence initial={false}>
              {signals.map((s, i) => (
                <motion.div
                  key={`${s.time}-${i}`}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className="grid grid-cols-3 sm:grid-cols-5 items-center px-3 py-2.5 bg-gray-900/60 border border-gray-800/40 rounded-lg hover:border-gray-700/60 transition-colors text-xs gap-1 sm:gap-0"
                >
                  <span className="text-gray-500 font-mono text-[11px]">{s.time}</span>
                  <span className="hidden sm:block text-gray-300 font-medium">{s.symbol}</span>
                  <span className="hidden sm:block text-gray-500 capitalize">{s.strategy}</span>
                  <span className={`w-fit px-2 py-0.5 rounded text-[10px] font-semibold ${signalStyle[s.signal] || signalStyle.HOLD}`}>
                    {s.signal}
                  </span>
                  <span className="text-right">
                    <span className="text-gray-300 font-semibold">{s.confidence}%</span>
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
