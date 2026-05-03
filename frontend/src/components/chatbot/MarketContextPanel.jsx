import { TrendingUp, TrendingDown, Activity, Bot, Shield, Zap } from 'lucide-react'
import { motion } from 'framer-motion'

const marketData = [
  { symbol: 'BTC', name: 'Bitcoin',  price: '$67,432', change: '+2.4%', up: true  },
  { symbol: 'ETH', name: 'Ethereum', price: '$3,847',  change: '+1.8%', up: true  },
  { symbol: 'SOL', name: 'Solana',   price: '$178.32', change: '+4.1%', up: true  },
]

const indicators = [
  { label: 'BTC RSI',    value: '62',      color: 'text-emerald-400' },
  { label: 'Sentiment',  value: 'Bullish', color: 'text-emerald-400' },
  { label: 'Volatility', value: 'Medium',  color: 'text-amber-400'   },
]

const CONFIDENCE = 87

function MarketContextPanel() {
  return (
    <>
      <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-5 backdrop-blur-xl">
        <div className="flex items-center gap-2 mb-4">
          <Activity size={13} className="text-indigo-400" />
          <h3 className="text-sm font-semibold text-white">Market Context</h3>
        </div>

        <div className="space-y-1 mb-5">
          {marketData.map((a) => (
            <div key={a.symbol} className="flex items-center justify-between py-2.5 border-b border-slate-700/30 last:border-0">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700/40 flex items-center justify-center text-[10px] font-bold text-slate-300 shrink-0">
                  {a.symbol.slice(0, 2)}
                </div>
                <span className="text-xs text-slate-200 font-semibold">{a.symbol}</span>
              </div>
              <div className="text-right">
                <p className="text-xs text-white font-bold">{a.price}</p>
                <p className={`text-[11px] flex items-center justify-end gap-0.5 font-medium ${a.up ? 'text-emerald-400' : 'text-red-400'}`}>
                  {a.up ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                  {a.change}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          {indicators.map((ind) => (
            <div key={ind.label} className="flex items-center justify-between text-xs">
              <span className="text-slate-500">{ind.label}</span>
              <span className={`font-bold ${ind.color}`}>{ind.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-5 backdrop-blur-xl">
        <div className="flex items-center gap-2 mb-4">
          <Bot size={13} className="text-indigo-400" />
          <h3 className="text-sm font-semibold text-white">AI Decision</h3>
        </div>

        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3.5 mb-4 text-center shadow-[0_0_16px_rgba(16,185,129,0.08)]">
          <p className="text-[11px] text-slate-500 mb-0.5">Current Signal</p>
          <div className="flex items-center justify-center gap-2">
            <Zap size={14} className="text-emerald-400" />
            <p className="text-lg font-bold text-emerald-400">STRONG BUY</p>
          </div>
        </div>

        <div className="mb-3">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-slate-500">Confidence</span>
            <span className="text-white font-bold">{CONFIDENCE}%</span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${CONFIDENCE}%` }}
              transition={{ duration: 0.9, ease: 'easeOut' }}
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-emerald-400"
            />
          </div>
        </div>

        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-500">
            <Shield size={11} />
            <span>Risk level</span>
          </div>
          <span className="text-amber-400 font-semibold bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-lg text-[11px]">
            Medium
          </span>
        </div>
      </div>
    </>
  )
}

export default MarketContextPanel
