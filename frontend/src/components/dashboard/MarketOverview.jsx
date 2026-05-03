import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Activity } from 'lucide-react'

const assets = [
  { symbol: 'BTC',  name: 'Bitcoin',  price: '$67,432.00', change: '+2.4%', up: true  },
  { symbol: 'ETH',  name: 'Ethereum', price: '$3,847.20',  change: '+1.8%', up: true  },
  { symbol: 'SOL',  name: 'Solana',   price: '$178.32',    change: '+4.1%', up: true  },
  { symbol: 'XAU',  name: 'Gold',     price: '$2,345.80',  change: '+0.3%', up: true  },
  { symbol: 'AAPL', name: 'Apple',    price: '$189.45',    change: '-0.3%', up: false },
  { symbol: 'NDX',  name: 'NASDAQ',   price: '18,234.10',  change: '+0.8%', up: true  },
]

const ICON_COLORS = {
  BTC: 'from-orange-500/20 to-yellow-500/5 text-orange-400',
  ETH: 'from-blue-500/20 to-indigo-500/5 text-blue-400',
  SOL: 'from-violet-500/20 to-purple-500/5 text-violet-400',
  XAU: 'from-yellow-500/20 to-amber-500/5 text-yellow-400',
  AAPL: 'from-slate-500/20 to-gray-500/5 text-slate-400',
  NDX: 'from-cyan-500/20 to-blue-500/5 text-cyan-400',
}

function MarketOverview() {
  return (
    <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-5 backdrop-blur-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity size={13} className="text-indigo-400" />
          <h2 className="text-sm font-semibold text-white">Market Overview</h2>
        </div>
        <span className="text-[11px] text-slate-500 bg-slate-800/60 px-2 py-0.5 rounded-full">Simulated</span>
      </div>

      <div className="space-y-1.5">
        {assets.map((a, i) => {
          const colors = ICON_COLORS[a.symbol] || ICON_COLORS.AAPL
          return (
            <motion.div
              key={a.symbol}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
              className="flex items-center justify-between px-3 py-2.5 bg-slate-900/40 border border-slate-700/30 rounded-xl hover:border-indigo-500/20 hover:bg-slate-900/60 transition-all duration-200"
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${colors.split(' ').slice(0,2).join(' ')} flex items-center justify-center text-[11px] font-bold shrink-0 border border-slate-700/30`}>
                  <span className={colors.split(' ')[2]}>{a.symbol.slice(0, 2)}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{a.symbol}</p>
                  <p className="text-[11px] text-slate-500">{a.name}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-white">{a.price}</p>
                <p className={`text-xs font-semibold flex items-center justify-end gap-0.5 ${a.up ? 'text-emerald-400' : 'text-red-400'}`}>
                  {a.up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                  {a.change}
                </p>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

export default MarketOverview
