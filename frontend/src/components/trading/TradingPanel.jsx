import { Shield, Target, AlertTriangle, TrendingUp } from 'lucide-react'
import { motion } from 'framer-motion'

const fmt = (n) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export default function TradingPanel({ symbol, price, type }) {
  const isLong     = type !== 'SELL'
  const stopLoss   = isLong ? price * 0.97 : price * 1.03
  const takeProfit = isLong ? price * 1.06 : price * 0.94

  const rows = [
    { label: 'Entry Price', value: fmt(price),      icon: TrendingUp,    color: 'text-white'      },
    { label: 'Stop Loss',   value: fmt(stopLoss),   icon: AlertTriangle, color: 'text-rose-400'   },
    { label: 'Take Profit', value: fmt(takeProfit), icon: Target,        color: 'text-emerald-400' },
    { label: 'Risk',        value: '-3.0%',         icon: null,          color: 'text-rose-400'   },
    { label: 'Reward',      value: '+6.0%',         icon: null,          color: 'text-emerald-400' },
  ]

  return (
    <motion.div
      whileHover={{ borderColor: 'rgba(99,102,241,0.14)' }}
      className="bg-[#0a1628]/88 border border-white/[0.07] rounded-2xl p-5 backdrop-blur-2xl shadow-[0_4px_28px_rgba(0,0,0,0.32)] transition-all duration-300"
    >
      <div className="flex items-center gap-2 mb-4">
        <Shield size={13} className="text-indigo-400" />
        <h3 className="text-sm font-bold text-white">Risk Preview</h3>
        <span className={`ml-auto text-[10px] px-2.5 py-0.5 rounded-lg font-black ${
          isLong
            ? 'bg-emerald-500/12 text-emerald-400 border border-emerald-500/22'
            : 'bg-rose-500/12 text-rose-400 border border-rose-500/22'
        }`}>
          {type} — {symbol}
        </span>
      </div>

      <div className="space-y-3">
        {rows.map((r, i) => (
          <motion.div
            key={r.label}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
            className="flex items-center justify-between text-xs"
          >
            <div className="flex items-center gap-1.5 text-slate-600 font-medium">
              {r.icon && <r.icon size={10} />}
              {r.label}
            </div>
            <span className={`font-black tabular-nums ${r.color}`}>{r.value}</span>
          </motion.div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-white/[0.05]">
        <div className="flex justify-between text-xs mb-2">
          <span className="text-slate-600 font-medium">Risk / Reward</span>
          <span className="text-white font-black">1 : 2</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden bg-slate-800/80 flex gap-px">
          <div className="bg-rose-500/75 h-full rounded-l-full" style={{ width: '33%' }} />
          <div className="bg-emerald-500/75 h-full rounded-r-full" style={{ width: '67%' }} />
        </div>
        <div className="flex justify-between text-[10px] mt-1.5">
          <span className="text-rose-500/70 font-bold">Risk 33%</span>
          <span className="text-emerald-500/70 font-bold">Reward 67%</span>
        </div>
      </div>
    </motion.div>
  )
}
