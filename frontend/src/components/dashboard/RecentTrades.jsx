import { motion } from 'framer-motion'

const trades = [
  { symbol: 'BTC',  type: 'BUY',  qty: '0.15 BTC',   price: '$66,100.00', pnl: '+$197.40', up: true,  status: 'Closed' },
  { symbol: 'ETH',  type: 'SELL', qty: '1.2 ETH',    price: '$3,912.00',  pnl: '+$78.00',  up: true,  status: 'Closed' },
  { symbol: 'SOL',  type: 'BUY',  qty: '5 SOL',      price: '$171.50',    pnl: '+$34.10',  up: true,  status: 'Closed' },
  { symbol: 'AAPL', type: 'SELL', qty: '10 shares',  price: '$191.20',    pnl: '-$17.50',  up: false, status: 'Closed' },
  { symbol: 'BTC',  type: 'BUY',  qty: '0.08 BTC',   price: '$67,100.00', pnl: '+$26.56',  up: true,  status: 'Open'   },
]

function RecentTrades() {
  return (
    <div className="bg-gray-900/50 border border-gray-800/60 rounded-xl p-5 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-white">Recent Trades</h2>
        <span className="text-[11px] text-gray-500">{trades.length} entries</span>
      </div>

      {/* Table header — desktop */}
      <div className="hidden sm:grid grid-cols-5 px-3 mb-2 text-[11px] text-gray-500 uppercase tracking-wide">
        <span>Asset</span>
        <span>Type</span>
        <span>Quantity</span>
        <span>Price</span>
        <span className="text-right">P&amp;L / Status</span>
      </div>

      <div className="space-y-1.5">
        {trades.map((t, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06, duration: 0.3 }}
            className="grid grid-cols-3 sm:grid-cols-5 items-center px-3 py-2.5 bg-gray-900/60 border border-gray-800/40 rounded-lg hover:border-gray-700/60 transition-colors text-xs gap-2 sm:gap-0"
          >
            {/* Asset */}
            <div className="flex items-center gap-2.5 col-span-1">
              <div className="w-7 h-7 rounded-full bg-gray-800 flex items-center justify-center text-[10px] font-bold text-gray-300 shrink-0">
                {t.symbol.slice(0, 2)}
              </div>
              <span className="text-white font-medium">{t.symbol}</span>
            </div>

            {/* Type */}
            <span className={`hidden sm:inline-flex w-fit px-2 py-0.5 rounded text-[10px] font-semibold ${
              t.type === 'BUY'
                ? 'bg-emerald-500/15 text-emerald-400'
                : 'bg-red-500/15 text-red-400'
            }`}>
              {t.type}
            </span>

            {/* Quantity */}
            <span className="hidden sm:block text-gray-400">{t.qty}</span>

            {/* Price */}
            <span className="text-gray-300 text-right sm:text-left col-span-1">{t.price}</span>

            {/* P&L + Status */}
            <div className="flex flex-col items-end col-span-1">
              <span className={`font-semibold ${t.up ? 'text-emerald-400' : 'text-red-400'}`}>
                {t.pnl}
              </span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded mt-0.5 ${
                t.status === 'Open'
                  ? 'bg-indigo-500/15 text-indigo-400'
                  : 'bg-gray-700/60 text-gray-500'
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
