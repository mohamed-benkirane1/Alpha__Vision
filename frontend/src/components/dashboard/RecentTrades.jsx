import { motion } from 'framer-motion'
import { ClipboardList } from 'lucide-react'

const trades = [
  { symbol: 'BTC',  type: 'BUY',  qty: '0.15 BTC',  price: '$66,100.00', pnl: '+$197.40', up: true,  status: 'Closed' },
  { symbol: 'ETH',  type: 'SELL', qty: '1.2 ETH',   price: '$3,912.00',  pnl: '+$78.00',  up: true,  status: 'Closed' },
  { symbol: 'SOL',  type: 'BUY',  qty: '5 SOL',     price: '$171.50',    pnl: '+$34.10',  up: true,  status: 'Closed' },
  { symbol: 'AAPL', type: 'SELL', qty: '10 shares', price: '$191.20',    pnl: '-$17.50',  up: false, status: 'Closed' },
  { symbol: 'BTC',  type: 'BUY',  qty: '0.08 BTC',  price: '$67,100.00', pnl: '+$26.56',  up: true,  status: 'Open'   },
]

function RecentTrades() {
  return (
    <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-5 backdrop-blur-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ClipboardList size={13} className="text-indigo-400" />
          <h2 className="text-sm font-semibold text-white">Recent Trades</h2>
        </div>
        <span className="text-[11px] text-slate-500">{trades.length} entries</span>
      </div>

      <div className="hidden sm:grid grid-cols-5 px-3 mb-2 text-[11px] text-slate-500 uppercase tracking-widest font-semibold">
        <span>Asset</span><span>Type</span><span>Quantity</span><span>Price</span><span className="text-right">P&amp;L / Status</span>
      </div>

      <div className="space-y-1.5">
        {trades.map((t, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06, duration: 0.3 }}
            className="grid grid-cols-3 sm:grid-cols-5 items-center px-3 py-2.5 bg-slate-900/40 border border-slate-700/30 rounded-xl hover:border-indigo-500/20 hover:bg-slate-900/60 transition-all duration-200 text-xs gap-2 sm:gap-0"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700/40 flex items-center justify-center text-[10px] font-bold text-slate-300 shrink-0">
                {t.symbol.slice(0, 2)}
              </div>
              <span className="text-white font-semibold">{t.symbol}</span>
            </div>

            <span className={`hidden sm:inline-flex w-fit px-2.5 py-0.5 rounded-lg text-[10px] font-bold ${
              t.type === 'BUY' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
            }`}>
              {t.type}
            </span>

            <span className="hidden sm:block text-slate-400">{t.qty}</span>
            <span className="text-slate-300 text-right sm:text-left">{t.price}</span>

            <div className="flex flex-col items-end">
              <span className={`font-bold ${t.up ? 'text-emerald-400' : 'text-red-400'}`}>{t.pnl}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-md mt-0.5 font-medium ${
                t.status === 'Open' ? 'bg-indigo-500/15 text-indigo-400' : 'bg-slate-700/60 text-slate-500'
              }`}>
                {t.status}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export default RecentTrades
