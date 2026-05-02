import { TrendingUp, TrendingDown, Activity, Bot, Shield } from 'lucide-react'
import { motion } from 'framer-motion'

const marketData = [
  { symbol: 'BTC', name: 'Bitcoin',  price: '$67,432', change: '+2.4%', up: true  },
  { symbol: 'ETH', name: 'Ethereum', price: '$3,847',  change: '+1.8%', up: true  },
  { symbol: 'SOL', name: 'Solana',   price: '$178.32', change: '+4.1%', up: true  },
]

const indicators = [
  { label: 'BTC RSI',   value: '62',      note: 'Bullish',  color: 'text-emerald-400' },
  { label: 'Sentiment', value: 'Bullish', note: '50% news', color: 'text-emerald-400' },
  { label: 'Volatility',value: 'Medium',  note: '24h',      color: 'text-amber-400'   },
]

const CONFIDENCE = 87

function MarketContextPanel() {
  return (
    <>
      {/* Market Prices */}
      <div className="bg-gray-900/50 border border-gray-800/60 rounded-xl p-5 backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-4">
          <Activity size={13} className="text-indigo-400" />
          <h3 className="text-sm font-semibold text-white">Market Context</h3>
        </div>

        <div className="space-y-2 mb-5">
          {marketData.map((a) => (
            <div key={a.symbol} className="flex items-center justify-between py-2 border-b border-gray-800/50 last:border-0">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-gray-800 flex items-center justify-center text-[10px] font-bold text-gray-300 shrink-0">
                  {a.symbol.slice(0, 2)}
                </div>
                <span className="text-xs text-gray-300 font-medium">{a.symbol}</span>
              </div>
              <div className="text-right">
                <p className="text-xs text-white font-semibold">{a.price}</p>
                <p className={`text-[11px] flex items-center justify-end gap-0.5 ${a.up ? 'text-emerald-400' : 'text-red-400'}`}>
                  {a.up ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                  {a.change}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Indicators */}
        <div className="space-y-2">
          {indicators.map((ind) => (
            <div key={ind.label} className="flex items-center justify-between text-xs">
              <span className="text-gray-500">{ind.label}</span>
              <span className={`font-semibold ${ind.color}`}>{ind.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* AI Decision */}
      <div className="bg-gray-900/50 border border-gray-800/60 rounded-xl p-5 backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-4">
          <Bot size={13} className="text-indigo-400" />
          <h3 className="text-sm font-semibold text-white">AI Decision</h3>
        </div>

        {/* Signal */}
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 mb-4 text-center">
          <p className="text-[11px] text-gray-500 mb-0.5">Current Signal</p>
          <p className="text-lg font-bold text-emerald-400">STRONG BUY</p>
        </div>

        {/* Confidence */}
        <div className="mb-3">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-gray-500">Confidence</span>
            <span className="text-white font-semibold">{CONFIDENCE}%</span>
          </div>
          <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${CONFIDENCE}%` }}
              transition={{ duration: 0.9, ease: 'easeOut' }}
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-400"
            />
          </div>
        </div>

        {/* Risk */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-gray-500">
            <Shield size={11} />
            <span>Risk level</span>
          </div>
          <span className="text-amber-400 font-semibold bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded text-[11px]">
            Medium
          </span>
        </div>
      </div>
    </>
  )
}

export default MarketContextPanel
