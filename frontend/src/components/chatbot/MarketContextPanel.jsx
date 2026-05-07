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

const assetColors = { BTC: '#f97316', ETH: '#6366f1', SOL: '#8b5cf6' }

export default function MarketContextPanel() {
  return (
    <>
      {/* Market Context */}
      <motion.div
        whileHover={{ borderColor: 'rgba(99,102,241,0.14)' }}
        className="bg-[#0a1628]/88 border border-white/[0.07] rounded-2xl p-5 backdrop-blur-2xl shadow-[0_4px_28px_rgba(0,0,0,0.32)] transition-all duration-300"
      >
        <div className="flex items-center gap-2 mb-4">
          <Activity size={13} className="text-indigo-400" />
          <h3 className="text-sm font-bold text-white">Market Context</h3>
        </div>

        <div className="space-y-0 mb-5">
          {marketData.map((a, i) => {
            const color = assetColors[a.symbol] || '#6366f1'
            return (
              <motion.div
                key={a.symbol}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07 }}
                className="flex items-center justify-between py-2.5 border-b border-white/[0.05] last:border-0"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0"
                    style={{ background: `${color}16`, border: `1px solid ${color}28`, color }}
                  >
                    {a.symbol.slice(0, 2)}
                  </div>
                  <span className="text-xs text-slate-300 font-bold">{a.symbol}</span>
                </div>
                <div className="text-right">
                  <p className="text-xs text-white font-black tabular-nums">{a.price}</p>
                  <p className={`text-[10px] flex items-center justify-end gap-0.5 font-bold ${a.up ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {a.up ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
                    {a.change}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </div>

        <div className="space-y-2">
          {indicators.map((ind) => (
            <div key={ind.label} className="flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">{ind.label}</span>
              <span className={`font-black ${ind.color}`}>{ind.value}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* AI Decision */}
      <motion.div
        whileHover={{ borderColor: 'rgba(99,102,241,0.14)' }}
        className="bg-[#0a1628]/88 border border-white/[0.07] rounded-2xl p-5 backdrop-blur-2xl shadow-[0_4px_28px_rgba(0,0,0,0.32)] transition-all duration-300"
      >
        <div className="flex items-center gap-2 mb-4">
          <Bot size={13} className="text-indigo-400" />
          <h3 className="text-sm font-bold text-white">AI Decision</h3>
        </div>

        <div className="bg-emerald-500/8 border border-emerald-500/20 rounded-xl px-4 py-3.5 mb-4 text-center shadow-[0_0_20px_rgba(16,185,129,0.08)]">
          <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest mb-1">Current Signal</p>
          <div className="flex items-center justify-center gap-2">
            <Zap size={14} className="text-emerald-400" />
            <p className="text-lg font-black text-emerald-400 tracking-wide">STRONG BUY</p>
          </div>
        </div>

        <div className="mb-3.5">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-slate-600 font-medium">Confidence</span>
            <span className="text-white font-black">{CONFIDENCE}%</span>
          </div>
          <div className="h-2 bg-slate-800/80 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${CONFIDENCE}%` }}
              transition={{ duration: 1.1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.35)]"
            />
          </div>
        </div>

        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-600 font-medium">
            <Shield size={10} />
            Risk level
          </div>
          <span className="text-amber-400 font-black bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-lg text-[10px]">
            Medium
          </span>
        </div>
      </motion.div>
    </>
  )
}
