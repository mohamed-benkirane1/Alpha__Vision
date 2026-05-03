import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, BarChart2 } from 'lucide-react'

const holdings = [
  { symbol: 'BTC',  name: 'Bitcoin',  qty: 0.23, avgPrice: 61200, currentPrice: 67432,  value: 15509.36, pnl: +1433.36, pnlPct: +10.2 },
  { symbol: 'ETH',  name: 'Ethereum', qty: 1.85, avgPrice: 3400,  currentPrice: 3847.20, value: 7117.32,  pnl: +826.82,  pnlPct: +13.1 },
  { symbol: 'SOL',  name: 'Solana',   qty: 8,    avgPrice: 155,   currentPrice: 178.32,  value: 1426.56,  pnl: +186.56,  pnlPct: +15.0 },
  { symbol: 'XAU',  name: 'Gold',     qty: 0.3,  avgPrice: 2280,  currentPrice: 2345.80, value: 703.74,   pnl: +19.74,   pnlPct: +2.9  },
  { symbol: 'AAPL', name: 'Apple',    qty: 2,    avgPrice: 195,   currentPrice: 189.45,  value: 378.90,   pnl: -11.10,   pnlPct: -2.8  },
]

const fmt  = (n) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const fmtP = (n) => `${n > 0 ? '+' : ''}${n.toFixed(2)}%`

function HoldingsTable() {
  return (
    <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-5 backdrop-blur-xl">
      <div className="flex items-center gap-2 mb-4">
        <BarChart2 size={13} className="text-indigo-400" />
        <h2 className="text-sm font-semibold text-white">Holdings</h2>
      </div>

      <div className="hidden md:grid grid-cols-6 px-3 mb-2 text-[11px] text-slate-500 uppercase tracking-widest font-semibold">
        <span className="col-span-2">Asset</span>
        <span className="text-right">Avg Price</span>
        <span className="text-right">Current</span>
        <span className="text-right">Value</span>
        <span className="text-right">P&amp;L</span>
      </div>

      <div className="space-y-1.5">
        {holdings.map((h, i) => {
          const up = h.pnl >= 0
          return (
            <motion.div
              key={h.symbol}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06, duration: 0.3 }}
              className="grid grid-cols-3 md:grid-cols-6 items-center px-3 py-3 bg-slate-900/40 border border-slate-700/30 rounded-xl hover:border-indigo-500/20 hover:bg-slate-900/60 transition-all duration-200 gap-2 md:gap-0"
            >
              <div className="flex items-center gap-2.5 col-span-1 md:col-span-2">
                <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700/40 flex items-center justify-center text-[11px] font-bold text-slate-300 shrink-0">
                  {h.symbol.slice(0, 2)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{h.symbol}</p>
                  <p className="text-[11px] text-slate-500">{h.qty} {h.symbol}</p>
                </div>
              </div>

              <span className="hidden md:block text-xs text-slate-400 text-right">{fmt(h.avgPrice)}</span>
              <span className="text-xs text-slate-200 text-right font-medium col-span-1">{fmt(h.currentPrice)}</span>
              <span className="hidden md:block text-xs text-white font-semibold text-right">{fmt(h.value)}</span>

              <div className="flex flex-col items-end col-span-1">
                <span className={`text-xs font-bold flex items-center gap-0.5 ${up ? 'text-emerald-400' : 'text-red-400'}`}>
                  {up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                  {fmt(Math.abs(h.pnl))}
                </span>
                <span className={`text-[11px] font-medium ${up ? 'text-emerald-500/80' : 'text-red-500/80'}`}>
                  {fmtP(h.pnlPct)}
                </span>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

export default HoldingsTable
