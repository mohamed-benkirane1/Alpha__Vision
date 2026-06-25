import { motion, useReducedMotion } from 'framer-motion'
import { AlertTriangle, Bot, Clock, Cpu, Server, Shield } from 'lucide-react'
import { formatDateTime } from '../../utils/formatters'
import Badge from '../ui/Badge'

export default function BotStatusCard({ bot }) {
  const shouldReduce = useReducedMotion()
  const status = bot?.status || {}
  const running = Boolean(status.isRunning)
  const warnings = [
    ...(bot?.warnings || []),
    ...(bot?.dataQuality?.warnings || []),
  ].filter(Boolean)

  return (
    <motion.div
      whileHover={{ borderColor: 'rgba(225,29,72,0.12)' }}
      animate={running && !shouldReduce ? {
        boxShadow: [
          '0 4px 28px rgba(0,0,0,0.32)',
          '0 4px 28px rgba(0,0,0,0.32), 0 0 24px rgba(245,158,11,0.09)',
          '0 4px 28px rgba(0,0,0,0.32)',
        ],
      } : { boxShadow: '0 4px 28px rgba(0,0,0,0.32)' }}
      transition={{ boxShadow: { duration: 3.5, repeat: Infinity, ease: 'easeInOut' } }}
      className="bg-app-surface border border-white/[0.07] rounded-card p-5 backdrop-blur-card shadow-card transition-colors duration-300 relative overflow-hidden"
    >
      {running && !shouldReduce && (
        <motion.div
          className="absolute bottom-0 left-0 h-[1px] bg-gradient-to-r from-transparent via-amber-400/45 to-transparent pointer-events-none"
          style={{ width: '40%' }}
          animate={{ x: ['-120%', '340%'] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear', repeatDelay: 1 }}
        />
      )}

      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Cpu size={13} className="text-rose-400" />
          <h2 className="text-body font-bold text-white">Bot Status</h2>
        </div>
        <Badge
          variant={running ? 'warning' : 'neutral'}
          dot={running}
        >
          {running ? 'PAPER ACTIVE' : 'INACTIVE'}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-2.5 mb-4">
        {[
          { label: 'Symbol',   value: status.symbol || '--',                                                    color: 'text-white' },
          { label: 'Strategy', value: status.strategy ? status.strategy.toUpperCase() : '--',                  color: 'text-white' },
          { label: 'Mode',     value: status.mode || '--',                                                      color: running ? 'text-amber-300' : 'text-slate-500' },
          { label: 'Status',   value: status.status ? status.status.toUpperCase() : '--',                      color: running ? 'text-amber-300' : 'text-slate-500' },
        ].map((item) => (
          <div key={item.label} className="bg-white/[0.025] border border-white/[0.06] rounded-xl p-3">
            <p className="text-caption text-slate-600 mb-1 font-bold uppercase tracking-wider">{item.label}</p>
            <p className={`text-body font-black tabular-nums font-mono ${item.color}`}>{item.value}</p>
          </div>
        ))}
      </div>

      <div className="flex items-start gap-3 bg-amber-500/8 border border-amber-500/20 rounded-xl px-4 py-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/22 flex items-center justify-center shrink-0">
          <Bot size={14} className="text-amber-300" />
        </div>
        <div>
          <p className="text-caption text-slate-600 font-bold uppercase tracking-wider mb-0.5">Engine status</p>
          <p className="text-body-sm font-semibold text-amber-300 leading-relaxed">
            {bot?.dataQuality?.hasRealBotEngine
              ? 'Persistent paper bot engine available. Ticks use backend OHLC candles and can execute simulated paper trades when enabled.'
              : 'Paper bot engine unavailable.'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5 mb-4">
        <div className="bg-white/[0.025] border border-white/[0.06] rounded-xl p-3">
          <p className="text-caption text-slate-600 mb-1 font-bold uppercase tracking-wider">Started</p>
          <p className="text-body font-black tabular-nums font-mono text-white">{formatDateTime(status.startedAt)}</p>
        </div>
        <div className="bg-white/[0.025] border border-white/[0.06] rounded-xl p-3">
          <p className="text-caption text-slate-600 mb-1 font-bold uppercase tracking-wider">Last Tick</p>
          <p className="text-body font-black tabular-nums font-mono text-white">{formatDateTime(status.lastRunAt || status.lastTickAt)}</p>
        </div>
        <div className="bg-white/[0.025] border border-white/[0.06] rounded-xl p-3">
          <p className="text-caption text-slate-600 mb-1 font-bold uppercase tracking-wider">Position Size</p>
          <p className="text-body font-black tabular-nums font-mono text-white">
            {status.positionSize === null || status.positionSize === undefined ? '--' : `$${Number(status.positionSize).toFixed(2)}`}
          </p>
        </div>
        <div className="bg-white/[0.025] border border-white/[0.06] rounded-xl p-3">
          <p className="text-caption text-slate-600 mb-1 font-bold uppercase tracking-wider">Execution</p>
          <p className={`text-body font-black tabular-nums font-mono ${status.executeTrades ? 'text-emerald-400' : 'text-slate-500'}`}>
            {status.executeTrades ? 'PAPER ON' : 'DECISIONS ONLY'}
          </p>
        </div>
      </div>

      {bot?.performance && (
        <div className="rounded-xl bg-white/[0.025] border border-white/[0.06] p-3 mb-4">
          <div className="grid grid-cols-4 gap-2 text-center">
            {[
              { label: 'Actions', value: bot.performance.actionsCount },
              { label: 'Buy',     value: bot.performance.buyCount     },
              { label: 'Sell',    value: bot.performance.sellCount    },
              { label: 'Hold',    value: bot.performance.holdCount    },
            ].map((item) => (
              <div key={item.label}>
                <p className="text-caption text-slate-600 font-bold uppercase">{item.label}</p>
                <p className="text-body text-white font-black">{item.value ?? 0}</p>
              </div>
            ))}
          </div>
          <p className="text-label text-slate-600 font-semibold mt-3">
            Executed paper trades: {bot.performance.executedCount ?? 0}. Realized P&amp;L {bot.performance.pnlAvailable ? 'comes from executed bot SELL trades.' : 'appears after executed bot trades with realized P&L.'}
          </p>
        </div>
      )}

      <div className="flex flex-wrap gap-1.5 mb-4">
        <span className="inline-flex items-center gap-1 rounded-lg border border-white/[0.08] bg-white/[0.04] px-2 py-1 text-caption font-bold text-slate-500">
          <Server size={10} />
          {bot?.provider || 'backend'}
        </span>
        <span className="inline-flex items-center gap-1 rounded-lg border border-white/[0.08] bg-white/[0.04] px-2 py-1 text-caption font-bold text-slate-500">
          <Shield size={10} />
          Paper only: no broker
        </span>
        {bot?.timestamp && (
          <span className="inline-flex items-center gap-1 rounded-lg border border-white/[0.08] bg-white/[0.04] px-2 py-1 text-caption font-bold text-slate-500">
            <Clock size={10} />
            {formatDateTime(bot.timestamp)}
          </span>
        )}
      </div>

      {warnings.length > 0 && (
        <div className="space-y-2">
          {[...new Set(warnings)].map((warning) => (
            <div key={warning} className="flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/8 px-3 py-2 text-body-sm font-semibold text-amber-300">
              <AlertTriangle size={12} className="mt-0.5 shrink-0" />
              <span>{warning}</span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  )
}
