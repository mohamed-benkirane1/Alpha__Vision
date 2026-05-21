import { motion, useReducedMotion } from 'framer-motion'
import { AlertTriangle, Bot, Clock, Cpu, Server, Shield } from 'lucide-react'

const formatDateTime = (value) => {
  if (!value) return '--'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '--'
  return date.toLocaleString([], { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

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
      className="bg-[#0a1628]/88 border border-white/[0.07] rounded-2xl p-5 backdrop-blur-2xl shadow-[0_4px_28px_rgba(0,0,0,0.32)] transition-colors duration-300 relative overflow-hidden"
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
          <h2 className="text-sm font-bold text-white">Bot Status</h2>
        </div>
        <div className={`relative flex items-center gap-1.5 text-[10px] font-black px-3 py-1 rounded-full border tracking-wider ${
          running
            ? 'bg-amber-500/10 border-amber-500/22 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.12)]'
            : 'bg-white/[0.04] border-white/[0.07] text-slate-600'
        }`}>
          {running && <span className="w-1.5 h-1.5 rounded-full bg-amber-300 animate-pulse" />}
          {running ? 'PAPER ACTIVE' : 'INACTIVE'}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5 mb-4">
        {[
          { label: 'Symbol', value: status.symbol || '--', color: 'text-white' },
          { label: 'Strategy', value: status.strategy ? status.strategy.toUpperCase() : '--', color: 'text-white' },
          { label: 'Mode', value: status.mode || '--', color: running ? 'text-amber-300' : 'text-slate-500' },
          { label: 'Started', value: formatDateTime(status.startedAt), color: 'text-white' },
        ].map((item) => (
          <div key={item.label} className="bg-white/[0.025] border border-white/[0.06] rounded-xl p-3">
            <p className="text-[10px] text-slate-600 mb-1 font-bold uppercase tracking-wider">{item.label}</p>
            <p className={`text-sm font-black tabular-nums ${item.color}`}>{item.value}</p>
          </div>
        ))}
      </div>

      <div className="flex items-start gap-3 bg-amber-500/8 border border-amber-500/20 rounded-xl px-4 py-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/22 flex items-center justify-center shrink-0">
          <Bot size={14} className="text-amber-300" />
        </div>
        <div>
          <p className="text-[10px] text-slate-600 font-bold uppercase tracking-wider mb-0.5">Engine status</p>
          <p className="text-xs font-semibold text-amber-300 leading-relaxed">
            {bot?.dataQuality?.hasRealBotEngine
              ? 'Real bot engine available.'
              : 'Real bot engine is not implemented yet. No performance or trades are generated.'}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-4">
        <span className="inline-flex items-center gap-1 rounded-lg border border-white/[0.08] bg-white/[0.04] px-2 py-1 text-[10px] font-bold text-slate-500">
          <Server size={10} />
          {bot?.provider || 'backend'}
        </span>
        <span className="inline-flex items-center gap-1 rounded-lg border border-white/[0.08] bg-white/[0.04] px-2 py-1 text-[10px] font-bold text-slate-500">
          <Shield size={10} />
          Mock P&L: {bot?.dataQuality?.usesMockPerformance ? 'yes' : 'no'}
        </span>
        {bot?.timestamp && (
          <span className="inline-flex items-center gap-1 rounded-lg border border-white/[0.08] bg-white/[0.04] px-2 py-1 text-[10px] font-bold text-slate-500">
            <Clock size={10} />
            {formatDateTime(bot.timestamp)}
          </span>
        )}
      </div>

      {warnings.length > 0 && (
        <div className="space-y-2">
          {[...new Set(warnings)].map((warning) => (
            <div key={warning} className="flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/8 px-3 py-2 text-xs font-semibold text-amber-300">
              <AlertTriangle size={12} className="mt-0.5 shrink-0" />
              <span>{warning}</span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  )
}
