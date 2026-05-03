import { motion, AnimatePresence } from 'framer-motion'
import { ClipboardList } from 'lucide-react'

const fmt = (n) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

function TradeHistory({ trades }) {
  return (
    <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-5 backdrop-blur-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ClipboardList size={13} className="text-indigo-400" />
          <h2 className="text-sm font-semibold text-white">Trade History</h2>
        </div>
        <span className="text-[11px] text-slate-500">{trades.length} orders</span>
      </div>

      {trades.length === 0 ? (
        <div className="py-10 text-center">
          <p className="text-xs text-slate-600">No trades placed yet.</p>
          <p className="text-[11px] text-slate-700 mt-1">Use the order form to simulate your first trade.</p>
        </div>
      ) : (
        <>
          <div className="hidden sm:grid grid-cols-5 px-3 mb-2 text-[11px] text-slate-500 uppercase tracking-widest font-semibold">
            <span>Asset</span><span>Type</span><span className="text-right">Qty</span><span className="text-right">Price</span><span className="text-right">Value / Time</span>
          </div>
          <div className="space-y-1.5">
            <AnimatePresence initial={false}>
              {trades.map((t) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className="grid grid-cols-3 sm:grid-cols-5 items-center px-3 py-2.5 bg-slate-900/40 border border-slate-700/30 rounded-xl hover:border-indigo-500/20 transition-all duration-200 text-xs gap-1 sm:gap-0"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-slate-800 border border-slate-700/40 flex items-center justify-center text-[10px] font-bold text-slate-300 shrink-0">
                      {t.symbol.slice(0, 2)}
                    </div>
                    <span className="text-white font-semibold">{t.symbol}</span>
                  </div>
                  <span className={`hidden sm:inline-flex w-fit px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                    t.type === 'BUY' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
                  }`}>
                    {t.type}
                  </span>
                  <span className="text-slate-400 text-right sm:text-left">{t.qty}</span>
                  <span className="hidden sm:block text-slate-300 text-right font-medium">{fmt(t.price)}</span>
                  <div className="text-right">
                    <p className="text-white font-bold">{fmt(t.total)}</p>
                    <p className="text-[10px] text-slate-600">{t.time}</p>
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
