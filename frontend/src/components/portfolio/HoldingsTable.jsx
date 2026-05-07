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
const fmtP = (n) => `${n > 0 ? '+' : ''}${n.toFixed(1)}%`

const assetColors = {
  BTC: '#f97316', ETH: '#6366f1', SOL: '#8b5cf6',
  XAU: '#eab308', AAPL: '#64748b',
}

export default function HoldingsTable() {
  return (
    <motion.div
      whileHover={{ borderColor: 'rgba(99,102,241,0.14)' }}
      className="bg-[#0a1628]/88 border border-white/[0.07] rounded-2xl p-5 backdrop-blur-2xl shadow-[0_4px_28px_rgba(0,0,0,0.32)] transition-all duration-300"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart2 size={13} className="text-indigo-400" />
          <h2 className="text-sm font-bold text-white">Holdings</h2>
        </div>
        <span className="text-[10px] text-slate-700 font-bold">{holdings.length} assets</span>
      </div>

      <div className="hidden md:grid grid-cols-6 px-3 mb-2 text-[10px] text-slate-700 uppercase tracking-[0.1em] font-black">
        <span className="col-span-2">Asset</span>
        <span className="text-right">Avg Price</span>
        <span className="text-right">Current</span>
        <span className="text-right">Value</span>
        <span className="text-right">P&amp;L</span>
      </div>

      <div className="space-y-1.5">
        {holdings.map((h, i) => {
          const up    = h.pnl >= 0
          const color = assetColors[h.symbol] || '#6366f1'
          return (
            <motion.div
              key={h.symbol}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.055 }}
              whileHover={{ x: 2, backgroundColor: 'rgba(99,102,241,0.04)' }}
              className="grid grid-cols-3 md:grid-cols-6 items-center px-3 py-2.5 bg-white/[0.02] border border-white/[0.045] rounded-xl transition-all duration-200 gap-2 md:gap-0"
            >
              <div className="flex items-center gap-2.5 col-span-1 md:col-span-2">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black shrink-0"
                  style={{ background: `${color}16`, border: `1px solid ${color}28`, color }}
                >
                  {h.symbol.slice(0, 2)}
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{h.symbol}</p>
                  <p className="text-[10px] text-slate-700 font-medium">{h.qty} {h.symbol}</p>
                </div>
              </div>

              <span className="hidden md:block text-xs text-slate-600 text-right tabular-nums font-medium">{fmt(h.avgPrice)}</span>
              <span className="text-xs text-slate-300 text-right font-bold col-span-1 tabular-nums">{fmt(h.currentPrice)}</span>
              <span className="hidden md:block text-xs text-white font-black text-right tabular-nums">{fmt(h.value)}</span>

              <div className="flex flex-col items-end col-span-1">
                <span className={`text-xs font-black flex items-center gap-0.5 tabular-nums ${up ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {up ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                  {fmt(Math.abs(h.pnl))}
                </span>
                <span className={`text-[10px] font-bold ${up ? 'text-emerald-500/80' : 'text-rose-500/80'}`}>
                  {fmtP(h.pnlPct)}
                </span>
              </div>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}
