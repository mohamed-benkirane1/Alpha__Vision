import { motion } from 'framer-motion'
import { Cpu, TrendingUp, TrendingDown, Minus } from 'lucide-react'

const SIGNAL_CONFIG = {
  BUY:  { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: TrendingUp  },
  SELL: { color: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/20',     icon: TrendingDown },
  HOLD: { color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/20',   icon: Minus        },
}

function BotStatusCard({ bot }) {
  const sc = SIGNAL_CONFIG[bot.lastSignal] || SIGNAL_CONFIG.HOLD
  const SignalIcon = sc.icon

  return (
    <div className="bg-gray-900/50 border border-gray-800/60 rounded-xl p-5 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Cpu size={13} className="text-indigo-400" />
          <h2 className="text-sm font-semibold text-white">Bot Status</h2>
        </div>
        <div className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${
          bot.running
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
            : 'bg-gray-700/40 border-gray-700/40 text-gray-500'
        }`}>
          {bot.running && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
          {bot.running ? 'RUNNING' : 'STOPPED'}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        {[
          { label: 'Symbol',   value: bot.symbol   || '—' },
          { label: 'Strategy', value: bot.strategy ? bot.strategy.toUpperCase() : '—' },
          { label: 'Trades',   value: bot.trades || 0 },
          { label: 'P&L',      value: bot.profit > 0 ? `+$${bot.profit.toFixed(2)}` : bot.profit < 0 ? `-$${Math.abs(bot.profit).toFixed(2)}` : '$0.00', green: bot.profit > 0 ? true : bot.profit < 0 ? false : null },
        ].map((item) => (
          <div key={item.label} className="bg-gray-900/80 border border-gray-800/60 rounded-lg p-3">
            <p className="text-[11px] text-gray-500 mb-1">{item.label}</p>
            <p className={`text-sm font-bold ${item.green ? 'text-emerald-400' : item.green === false ? 'text-red-400' : 'text-white'}`}>
              {item.value}
            </p>
          </div>
        ))}
      </div>

      {/* Last signal */}
      <div className={`flex items-center gap-2.5 ${sc.bg} border ${sc.border} rounded-xl px-4 py-3`}>
        <div className={`w-8 h-8 rounded-lg ${sc.bg} border ${sc.border} flex items-center justify-center shrink-0`}>
          <SignalIcon size={15} className={sc.color} />
        </div>
        <div>
          <p className="text-[11px] text-gray-500">Last Signal</p>
          <p className={`text-base font-bold ${sc.color}`}>{bot.lastSignal || 'WAITING'}</p>
        </div>
        {bot.confidence && (
          <div className="ml-auto text-right">
            <p className="text-[11px] text-gray-500">Confidence</p>
            <p className={`text-sm font-bold ${sc.color}`}>{bot.confidence}%</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default BotStatusCard
