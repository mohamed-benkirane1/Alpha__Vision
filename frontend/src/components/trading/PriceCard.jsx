import { TrendingUp, TrendingDown } from 'lucide-react'
import { motion } from 'framer-motion'

const assetColors = {
  BTC: '#f97316', ETH: '#6366f1', SOL: '#8b5cf6',
  XAU: '#eab308', AAPL: '#64748b',
}

export default function PriceCard({ symbol, name, price, change, selected, onSelect }) {
  const up    = change >= 0
  const color = assetColors[symbol] || '#6366f1'
  return (
    <motion.button
      onClick={() => onSelect(symbol)}
      whileHover={{ x: 2 }}
      whileTap={{ scale: 0.98 }}
      className={`w-full text-left rounded-xl p-3.5 border transition-all duration-200 ${
        selected
          ? 'border-indigo-500/45 bg-indigo-500/10 shadow-[0_0_22px_rgba(99,102,241,0.20)]'
          : 'bg-white/[0.02] border-white/[0.045] hover:border-indigo-500/20 hover:bg-white/[0.04]'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black shrink-0"
            style={
              selected
                ? { background: 'rgba(99,102,241,0.18)', border: '1px solid rgba(99,102,241,0.3)', color: '#818cf8' }
                : { background: `${color}16`, border: `1px solid ${color}28`, color }
            }
          >
            {symbol.slice(0, 2)}
          </div>
          <div>
            <p className="text-sm font-bold text-white">{symbol}</p>
            <p className="text-[10px] text-slate-700 font-medium">{name}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-black text-white tabular-nums">${price.toLocaleString()}</p>
          <p className={`text-[11px] font-bold flex items-center justify-end gap-0.5 ${up ? 'text-emerald-400' : 'text-rose-400'}`}>
            {up ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {up ? '+' : ''}{change}%
          </p>
        </div>
      </div>
    </motion.button>
  )
}
