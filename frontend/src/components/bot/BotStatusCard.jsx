import { motion } from 'framer-motion'
import { Cpu, TrendingUp, TrendingDown, Minus, Zap } from 'lucide-react'

const SIGNAL_CONFIG = {
  BUY:  { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/22', glow: 'shadow-[0_0_18px_rgba(16,185,129,0.14)]',  icon: TrendingUp  },
  SELL: { color: 'text-rose-400',    bg: 'bg-rose-500/10',    border: 'border-rose-500/22',    glow: 'shadow-[0_0_18px_rgba(244,63,94,0.14)]',   icon: TrendingDown },
  HOLD: { color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/22',   glow: 'shadow-[0_0_18px_rgba(245,158,11,0.12)]',  icon: Minus        },
}

export default function BotStatusCard({ bot }) {
  const sc = SIGNAL_CONFIG[bot.lastSignal] || SIGNAL_CONFIG.HOLD
  const SignalIcon = sc.icon

  const pnlColor = bot.profit > 0 ? 'text-emerald-400' : bot.profit < 0 ? 'text-rose-400' : 'text-white'
  const pnlValue = bot.profit > 0
    ? `+$${bot.profit.toFixed(2)}`
    : bot.profit < 0
    ? `-$${Math.abs(bot.profit).toFixed(2)}`
    : '$0.00'

  return (
    <motion.div
      whileHover={{ borderColor: 'rgba(225,29,72,0.12)' }}
      className="bg-[#0a1628]/88 border border-white/[0.07] rounded-2xl p-5 backdrop-blur-2xl shadow-[0_4px_28px_rgba(0,0,0,0.32)] transition-all duration-300"
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Cpu size={13} className="text-rose-400" />
          <h2 className="text-sm font-bold text-white">Bot Status</h2>
        </div>
        <div className={`flex items-center gap-1.5 text-[10px] font-black px-3 py-1 rounded-full border tracking-wider ${
          bot.running
            ? 'bg-emerald-500/10 border-emerald-500/22 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
            : 'bg-white/[0.04] border-white/[0.07] text-slate-600'
        }`}>
          {bot.running && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
          {bot.running ? 'RUNNING' : 'STOPPED'}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5 mb-4">
        {[
          { label: 'Symbol',   value: bot.symbol   || '—', color: 'text-white' },
          { label: 'Strategy', value: bot.strategy ? bot.strategy.toUpperCase() : '—', color: 'text-white' },
          { label: 'Trades',   value: bot.trades || 0, color: 'text-white' },
          { label: 'P&L',      value: pnlValue,         color: pnlColor     },
        ].map((item) => (
          <div key={item.label} className="bg-white/[0.025] border border-white/[0.06] rounded-xl p-3">
            <p className="text-[10px] text-slate-600 mb-1 font-bold uppercase tracking-wider">{item.label}</p>
            <p className={`text-sm font-black tabular-nums ${item.color}`}>{item.value}</p>
          </div>
        ))}
      </div>

      <div className={`flex items-center gap-3 ${sc.bg} border ${sc.border} rounded-xl px-4 py-3 ${sc.glow}`}>
        <div className={`w-9 h-9 rounded-xl ${sc.bg} border ${sc.border} flex items-center justify-center shrink-0`}>
          <SignalIcon size={14} className={sc.color} />
        </div>
        <div>
          <p className="text-[10px] text-slate-600 font-bold uppercase tracking-wider mb-0.5">Last Signal</p>
          <div className="flex items-center gap-1.5">
            <Zap size={11} className={sc.color} />
            <p className={`text-base font-black ${sc.color}`}>{bot.lastSignal || 'WAITING'}</p>
          </div>
        </div>
        {bot.confidence && (
          <div className="ml-auto text-right">
            <p className="text-[10px] text-slate-600 font-medium">Confidence</p>
            <p className={`text-sm font-black tabular-nums ${sc.color}`}>{bot.confidence}%</p>
          </div>
        )}
      </div>
    </motion.div>
  )
}
