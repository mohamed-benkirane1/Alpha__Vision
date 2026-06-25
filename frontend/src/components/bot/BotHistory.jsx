import { motion, AnimatePresence } from 'framer-motion'
import { History } from 'lucide-react'
import { formatDateTime, formatPrice, formatNumber } from '../../utils/formatters'

const formatQuantity = (value) => formatNumber(value, 8)

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
          <h2 className="text-body font-bold text-white">Recent Bot Actions</h2>
        </div>
        <span className="text-caption text-slate-700 font-bold">{cleanActions.length} actions</span>
      </div>

      {cleanActions.length === 0 ? (
        <div className="py-10 text-center">
          <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto mb-3">
            <History size={16} className="text-slate-700" />
          </div>
          <p className="text-body-sm text-slate-600 font-medium">No real bot actions yet.</p>
          <p className="text-label text-slate-700 mt-1">
            Start the paper bot and run a tick to record a backend-priced decision.
          </p>
        </div>
      ) : (
        /* overflow-x-auto pour scroll horizontal mobile */
        <div className="overflow-x-auto">
          <div className="min-w-[500px]">
            <div className="hidden sm:grid grid-cols-5 px-3 mb-2 text-caption text-slate-700 uppercase tracking-wide font-black">
              <span>Time</span><span>Action</span><span>Symbol</span><span>Quote</span><span className="text-right">Reason</span>
            </div>
            <div className="space-y-1.5">
              <AnimatePresence initial={false}>
                {cleanActions.map((action, i) => (
                  <motion.div
                    key={`${action.id || action.timestamp || i}-${action.action || 'action'}`}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.25 }}
                    whileHover={{ x: 2, backgroundColor: 'rgba(225,29,72,0.03)' }}
                    className="grid grid-cols-2 sm:grid-cols-5 items-center px-3 py-2.5 bg-white/[0.02] border border-white/[0.045] rounded-xl transition-all duration-200 text-body-sm gap-1 sm:gap-2"
                  >
                    <span className="text-slate-600 font-mono text-caption">
                      {formatDateTime(action.createdAt || action.timestamp)}
                    </span>
                    <span className="text-slate-300 font-bold">
                      {action.decision || action.action || '--'}
                    </span>
                    <span className="hidden sm:block text-slate-600 font-medium">
                      {action.symbol || '--'}
                    </span>
                    <span className="text-slate-500 font-medium">
                      {formatPrice(action.price)}
                      <span className="block text-caption text-slate-700">
                        {formatQuantity(action.quantity)} / {action.priceProvider || '--'}
                      </span>
                    </span>
                    <span className="text-right text-slate-500 font-medium">
                      {action.reason || action.error || '--'}
                      <span className="block text-caption text-slate-700">
                        {action.executed ? 'Simulated trade executed' : action.error ? action.error : 'Decision recorded only'}
                      </span>
                    </span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}
