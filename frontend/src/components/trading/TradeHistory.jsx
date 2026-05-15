import { motion, AnimatePresence } from 'framer-motion'
import { ClipboardList } from 'lucide-react'

const fmt = (n) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export default function TradeHistory({ trades }) {
  return (
    <motion.div
      whileHover={{ borderColor: 'rgba(225,29,72,0.12)' }}
      className="bg-[#0a1628]/88 border border-white/[0.07] rounded-2xl p-5 backdrop-blur-2xl shadow-[0_4px_28px_rgba(0,0,0,0.32)] transition-all duration-300"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ClipboardList size={13} className="text-rose-400" />
          <h2 className="text-sm font-bold text-white">Trade History</h2>
        </div>
        <span className="text-[10px] text-slate-700 font-bold">{trades.length} orders</span>
      </div>

      {trades.length === 0 ? (
        <div className="py-10 text-center">
          <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto mb-3">
            <ClipboardList size={16} className="text-slate-700" />
          </div>
          <p className="text-xs text-slate-600 font-medium">No trades placed yet.</p>
          <p className="text-[11px] text-slate-700 mt-1">Use the order form to simulate your first trade.</p>
        </div>
      ) : (
        <>
          <div className="hidden sm:grid grid-cols-5 px-3 mb-2 text-[10px] text-slate-700 uppercase tracking-[0.1em] font-black">
            <span>Asset</span><span>Type</span><span className="text-right">Qty</span>
            <span className="text-right">Price</span><span className="text-right">Value / Time</span>
          </div>
          <div className="space-y-1.5">
            <AnimatePresence initial={false}>
              {trades.map((t) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.25 }}
                  whileHover={{ x: 2, backgroundColor: 'rgba(225,29,72,0.03)' }}
                  className="grid grid-cols-3 sm:grid-cols-5 items-center px-3 py-2.5 bg-white/[0.02] border border-white/[0.045] rounded-xl transition-all duration-200 text-xs gap-1 sm:gap-0"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-white/[0.05] border border-white/[0.07] flex items-center justify-center text-[9px] font-black text-slate-400 shrink-0">
                      {t.symbol.slice(0, 2)}
                    </div>
                    <span className="text-white font-bold">{t.symbol}</span>
                  </div>
                  <span className={`hidden sm:inline-flex w-fit px-2 py-0.5 rounded-lg text-[10px] font-black ${
                    t.type === 'BUY'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/18'
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/18'
                  }`}>
                    {t.type}
                  </span>
                  <span className="text-slate-500 text-right sm:text-left font-medium tabular-nums">{t.qty}</span>
                  <span className="hidden sm:block text-slate-400 text-right font-medium tabular-nums">{fmt(t.price)}</span>
                  <div className="text-right">
                    <p className="text-white font-black tabular-nums">{fmt(t.total)}</p>
                    <p className="text-[10px] text-slate-700 font-medium">{t.time}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </>
      )}
    </motion.div>
  )
}
