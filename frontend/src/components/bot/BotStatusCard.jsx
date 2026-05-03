import { motion } from 'framer-motion'
import { Cpu, TrendingUp, TrendingDown, Minus, Zap } from 'lucide-react'

const SIGNAL_CONFIG = {
  BUY:  { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/25', glow: 'shadow-[0_0_16px_rgba(16,185,129,0.12)]', icon: TrendingUp  },
  SELL: { color: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/25',     glow: 'shadow-[0_0_16px_rgba(239,68,68,0.12)]',  icon: TrendingDown },
  HOLD: { color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/25',   glow: 'shadow-[0_0_16px_rgba(245,158,11,0.10)]', icon: Minus        },
}

function BotStatusCard({ bot }) {
  const sc = SIGNAL_CONFIG[bot.lastSignal] || SIGNAL_CONFIG.HOLD
  const SignalIcon = sc.icon

  const pnlColor = bot.profit > 0 ? 'text-emerald-400' : bot.profit < 0 ? 'text-red-400' : 'text-white'
  const pnlValue = bot.profit > 0
    ? `+$${bot.profit.toFixed(2)}`
    : bot.profit < 0
    ? `-$${Math.abs(bot.profit).toFixed(2)}`
    : '$0.00'

  return (
    <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-5 backdrop-blur-xl">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Cpu size={13} className="text-indigo-400" />
          <h2 className="text-sm font-semibold text-white">Bot Status</h2>
        </div>
        <div className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border ${
          bot.running
            ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
            : 'bg-slate-700/40 border-slate-700/40 text-slate-500'
        }`}>
          {bot.running && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
          {bot.running ? 'RUNNING' : 'STOPPED'}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        {[
          { label: 'Symbol',   value: bot.symbol   || '—', color: 'text-white' },
          { label: 'Strategy', value: bot.strategy ? bot.strategy.toUpperCase() : '—', color: 'text-white' },
          { label: 'Trades',   value: bot.trades || 0, color: 'text-white' },
          { label: 'P&L',      value: pnlValue, color: pnlColor },
        ].map((item) => (
          <div key={item.label} className="bg-slate-900/80 border border-slate-700/40 rounded-xl p-3">
            <p className="text-[11px] text-slate-500 mb-1 font-medium">{item.label}</p>
            <p className={`text-sm font-bold ${item.color}`}>{item.value}</p>
          </div>
        ))}
      </div>

      <div className={`flex items-center gap-3 ${sc.bg} border ${sc.border} rounded-xl px-4 py-3 ${sc.glow}`}>
        <div className={`w-9 h-9 rounded-xl ${sc.bg} border ${sc.border} flex items-center justify-center shrink-0`}>
          <SignalIcon size={15} className={sc.color} />
        </div>
        <div>
          <p className="text-[11px] text-slate-500">Last Signal</p>
          <div className="flex items-center gap-1.5">
            <Zap size={12} className={sc.color} />
            <p className={`text-base font-bold ${sc.color}`}>{bot.lastSignal || 'WAITING'}</p>
          </div>
        </div>
        {bot.confidence && (
          <div className="ml-auto text-right">
            <p className="text-[11px] text-slate-500">Confidence</p>
            <p className={`text-sm font-bold ${sc.color}`}>{bot.confidence}%</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default BotStatusCard
