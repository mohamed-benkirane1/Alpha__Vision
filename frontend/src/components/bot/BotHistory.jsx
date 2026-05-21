import { motion, AnimatePresence } from 'framer-motion'
import { History } from 'lucide-react'

const formatDateTime = (value) => {
  if (!value) return '--'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '--'
  return date.toLocaleString([], { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

export default function BotHistory({ actions = [] }) {
  const cleanActions = Array.isArray(actions) ? actions.filter(Boolean) : []

  return (
    <motion.div
      whileHover={{ borderColor: 'rgba(225,29,72,0.12)' }}
      className="bg-[#0a1628]/88 border border-white/[0.07] rounded-2xl p-5 backdrop-blur-2xl shadow-[0_4px_28px_rgba(0,0,0,0.32)] transition-all duration-300"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <History size={13} className="text-rose-400" />
          <h2 className="text-sm font-bold text-white">Recent Bot Actions</h2>
        </div>
        <span className="text-[10px] text-slate-700 font-bold">{cleanActions.length} actions</span>
      </div>

      {cleanActions.length === 0 ? (
        <div className="py-10 text-center">
          <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto mb-3">
            <History size={16} className="text-slate-700" />
          </div>
          <p className="text-xs text-slate-600 font-medium">No real bot actions yet.</p>
          <p className="text-[11px] text-slate-700 mt-1">
            Trade events will appear only after a real bot engine is implemented.
          </p>
        </div>
      ) : (
        <>
          <div className="hidden sm:grid grid-cols-4 px-3 mb-2 text-[10px] text-slate-700 uppercase tracking-[0.1em] font-black">
            <span>Time</span><span>Type</span><span>Symbol</span><span className="text-right">Details</span>
          </div>
          <div className="space-y-1.5">
            <AnimatePresence initial={false}>
              {cleanActions.map((action, i) => (
                <motion.div
                  key={`${action.timestamp || i}-${action.type || 'action'}`}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.25 }}
                  whileHover={{ x: 2, backgroundColor: 'rgba(225,29,72,0.03)' }}
                  className="grid grid-cols-2 sm:grid-cols-4 items-center px-3 py-2.5 bg-white/[0.02] border border-white/[0.045] rounded-xl transition-all duration-200 text-xs gap-1 sm:gap-0"
                >
                  <span className="text-slate-600 font-mono text-[10px]">{formatDateTime(action.timestamp)}</span>
                  <span className="text-slate-300 font-bold">{action.type || '--'}</span>
                  <span className="hidden sm:block text-slate-600 font-medium">{action.symbol || '--'}</span>
                  <span className="text-right text-slate-500 font-medium">{action.message || '--'}</span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </>
      )}
    </motion.div>
  )
}
