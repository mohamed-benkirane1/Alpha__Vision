import { motion } from 'framer-motion'
import { ClipboardList } from 'lucide-react'

const trades = [
  { symbol: 'BTC',  type: 'BUY',  qty: '0.15 BTC',  price: '$66,100.00', pnl: '+$197.40', up: true,  status: 'Closed' },
  { symbol: 'ETH',  type: 'SELL', qty: '1.2 ETH',   price: '$3,912.00',  pnl: '+$78.00',  up: true,  status: 'Closed' },
  { symbol: 'SOL',  type: 'BUY',  qty: '5 SOL',     price: '$171.50',    pnl: '+$34.10',  up: true,  status: 'Closed' },
  { symbol: 'AAPL', type: 'SELL', qty: '10 shares', price: '$191.20',    pnl: '-$17.50',  up: false, status: 'Closed' },
  { symbol: 'BTC',  type: 'BUY',  qty: '0.08 BTC',  price: '$67,100.00', pnl: '+$26.56',  up: true,  status: 'Open'   },
]

export default function RecentTrades() {
  return (
    <motion.div
      whileHover={{ borderColor: 'rgba(225,29,72,0.12)' }}
      className="bg-[#0a1628]/88 border border-white/[0.07] rounded-2xl p-5 backdrop-blur-2xl shadow-[0_4px_28px_rgba(0,0,0,0.32)] transition-all duration-300"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ClipboardList size={13} className="text-rose-400" />
          <h2 className="text-sm font-bold text-white">Recent Trades</h2>
        </div>
        <span className="text-[10px] text-slate-700 font-bold">{trades.length} entries</span>
      </div>

      <div className="hidden sm:grid grid-cols-5 px-3 mb-2 text-[10px] text-slate-700 uppercase tracking-[0.1em] font-black">
        <span>Asset</span><span>Type</span><span>Quantity</span><span>Price</span><span className="text-right">P&amp;L / Status</span>
      </div>

      <div className="space-y-1.5">
        {trades.map((t, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
            whileHover={{ x: 2, backgroundColor: 'rgba(225,29,72,0.03)' }}
            className="grid grid-cols-3 sm:grid-cols-5 items-center px-3 py-2.5 bg-white/[0.02] border border-white/[0.045] rounded-xl transition-all duration-200 text-xs gap-2 sm:gap-0"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-white/[0.05] border border-white/[0.07] flex items-center justify-center text-[10px] font-black text-slate-400 shrink-0">
                {t.symbol.slice(0, 2)}
              </div>
              <span className="text-white font-bold">{t.symbol}</span>
            </div>

            <span className={`hidden sm:inline-flex w-fit px-2.5 py-0.5 rounded-lg text-[10px] font-black ${
              t.type === 'BUY'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/18'
                : 'bg-red-500/10 text-red-400 border border-red-500/18'
            }`}>
              {t.type}
            </span>

            <span className="hidden sm:block text-slate-600 font-medium">{t.qty}</span>
            <span className="text-slate-400 text-right sm:text-left font-medium tabular-nums">{t.price}</span>

            <div className="flex flex-col items-end">
              <span className={`font-black tabular-nums ${t.up ? 'text-emerald-400' : 'text-red-400'}`}>{t.pnl}</span>
              <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md mt-0.5 font-bold ${
                t.status === 'Open'
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/18'
                  : 'bg-white/[0.04] text-slate-700 border border-white/[0.06]'
              }`}>
                {t.status}
                {t.status === 'Open' && (
                  <span className="w-1 h-1 rounded-full bg-amber-400 animate-pulse" />
                )}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
