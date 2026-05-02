import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown } from 'lucide-react'

const assets = [
  { symbol: 'BTC',  name: 'Bitcoin',   price: '$67,432.00', change: '+2.4%', up: true  },
  { symbol: 'ETH',  name: 'Ethereum',  price: '$3,847.20',  change: '+1.8%', up: true  },
  { symbol: 'SOL',  name: 'Solana',    price: '$178.32',    change: '+4.1%', up: true  },
  { symbol: 'XAU',  name: 'Gold',      price: '$2,345.80',  change: '+0.3%', up: true  },
  { symbol: 'AAPL', name: 'Apple',     price: '$189.45',    change: '-0.3%', up: false },
  { symbol: 'NDX',  name: 'NASDAQ',    price: '18,234.10',  change: '+0.8%', up: true  },
]

function MarketOverview() {
  return (
    <div className="bg-gray-900/50 border border-gray-800/60 rounded-xl p-5 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-white">Market Overview</h2>
        <span className="text-[11px] text-gray-500">Simulated</span>
      </div>

      <div className="space-y-1.5">
        {assets.map((a, i) => (
          <motion.div
            key={a.symbol}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05, duration: 0.3 }}
            className="flex items-center justify-between px-3 py-2.5 bg-gray-900/60 border border-gray-800/40 rounded-lg hover:border-gray-700/60 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-[11px] font-bold text-gray-300 shrink-0">
                {a.symbol.slice(0, 2)}
              </div>
              <div>
                <p className="text-sm font-medium text-white">{a.symbol}</p>
                <p className="text-[11px] text-gray-500">{a.name}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-white">{a.price}</p>
              <p className={`text-xs font-medium flex items-center justify-end gap-0.5 ${a.up ? 'text-emerald-400' : 'text-red-400'}`}>
                {a.up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                {a.change}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export default MarketOverview
