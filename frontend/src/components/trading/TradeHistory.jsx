import { motion, AnimatePresence } from 'framer-motion'
import { ClipboardList } from 'lucide-react'

const fmt = (n) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

function TradeHistory({ trades }) {
  return (
    <div className="bg-gray-900/50 border border-gray-800/60 rounded-xl p-5 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ClipboardList size={13} className="text-indigo-400" />
          <h2 className="text-sm font-semibold text-white">Trade History</h2>
        </div>
        <span className="text-[11px] text-gray-500">{trades.length} orders</span>
      </div>

      {trades.length === 0 ? (
        <div className="py-10 text-center">
          <p className="text-xs text-gray-600">No trades placed yet.</p>
          <p className="text-[11px] text-gray-700 mt-1">Use the order form to simulate your first trade.</p>
        </div>
      ) : (
        <>
          <div className="hidden sm:grid grid-cols-5 px-3 mb-2 text-[11px] text-gray-500 uppercase tracking-wide">
            <span>Asset</span>
            <span>Type</span>
            <span className="text-right">Qty</span>
            <span className="text-right">Price</span>
            <span className="text-right">Value / Time</span>
          </div>
          <div className="space-y-1.5">
            <AnimatePresence initial={false}>
              {trades.map((t) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className="grid grid-cols-3 sm:grid-cols-5 items-center px-3 py-2.5 bg-gray-900/60 border border-gray-800/40 rounded-lg hover:border-gray-700/60 transition-colors text-xs gap-1 sm:gap-0"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center text-[10px] font-bold text-gray-300 shrink-0">
                      {t.symbol.slice(0, 2)}
                    </div>
                    <span className="text-white font-medium">{t.symbol}</span>
                  </div>
                  <span className={`hidden sm:inline-flex w-fit px-2 py-0.5 rounded text-[10px] font-semibold ${
                    t.type === 'BUY' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
                  }`}>
                    {t.type}
                  </span>
                  <span className="text-gray-400 text-right sm:text-left">{t.qty}</span>
                  <span className="hidden sm:block text-gray-300 text-right">{fmt(t.price)}</span>
                  <div className="text-right col-span-1">
                    <p className="text-white font-medium">{fmt(t.total)}</p>
                    <p className="text-[10px] text-gray-600">{t.time}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </>
      )}
    </div>
  )
}

export default TradeHistory
