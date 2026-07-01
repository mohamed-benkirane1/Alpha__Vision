import { motion } from 'framer-motion'
import { AlertTriangle, BarChart2, CheckCircle, DollarSign, Target, TrendingUp } from 'lucide-react'
import { getValidNumber, formatCurrency, formatPercent, formatNumber } from '../../utils/formatters'

const isFiniteNumber = (value) => getValidNumber(value) !== null

export default function BacktestResults({ response }) {
  const results  = response?.results
  const params   = response?.params || {}
  const warnings = [
    ...(response?.warnings || []),
    ...(response?.dataQuality?.warnings || []),
  ].filter(Boolean)

  if (!results) {
    return (
      <motion.div
        whileHover={{ borderColor: 'rgba(225,29,72,0.12)' }}
        className="bg-[#0a1628]/88 border border-white/[0.07] rounded-2xl p-5 backdrop-blur-2xl shadow-[0_4px_28px_rgba(0,0,0,0.32)] transition-all duration-300"
      >
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle size={14} className="text-amber-400" />
          <h2 className="text-body font-bold text-white">No Real Backtest Result</h2>
        </div>
        <p className="text-body-sm text-slate-500 font-medium">
          Historical data was not available, so no simulated performance is displayed as real.
        </p>
        {warnings.length > 0 && (
          <div className="mt-4 space-y-2">
            {warnings.map((warning) => (
              <div key={warning} className="rounded-xl border border-amber-500/20 bg-amber-500/8 px-3 py-2 text-body-sm font-semibold text-amber-300">
                {warning}
              </div>
            ))}
          </div>
        )}
      </motion.div>
    )
  }

  const stats = [
    { label: 'Final Capital',  value: formatCurrency(results.finalCapital),  color: 'text-white',        icon: DollarSign },
    { label: 'Total Profit',   value: formatCurrency(results.totalProfit),    color: Number(results.totalProfit)  >= 0 ? 'text-emerald-400' : 'text-rose-400', icon: TrendingUp },
    { label: 'Return',         value: formatPercent(results.totalReturn),     color: Number(results.totalReturn)  >= 0 ? 'text-emerald-400' : 'text-rose-400', icon: TrendingUp },
    { label: 'Win Rate',       value: formatPercent(results.winRate),         color: 'text-rose-400',     icon: Target   },
    { label: 'Total Trades',   value: formatNumber(results.totalTrades),      color: 'text-white',        icon: BarChart2 },
    { label: 'Max Drawdown',   value: formatPercent(results.maxDrawdown),     color: 'text-amber-400',    icon: CheckCircle },
    { label: 'Profit Factor',  value: isFiniteNumber(results.profitFactor) ? Number(results.profitFactor).toFixed(2) : '--', color: 'text-white', icon: BarChart2 },
    { label: 'Wins / Losses',  value: `${formatNumber(results.wins)} / ${formatNumber(results.losses)}`, color: 'text-white', icon: CheckCircle },
  ]

  return (
    <motion.div
      whileHover={{ borderColor: 'rgba(225,29,72,0.12)' }}
      className="bg-[#0a1628]/88 border border-white/[0.07] rounded-2xl p-5 backdrop-blur-2xl shadow-[0_4px_28px_rgba(0,0,0,0.32)] transition-all duration-300"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
        <div>
          <h2 className="text-body font-bold text-white">Backtest Results</h2>
          <p className="text-label text-slate-600 font-medium">
            {response?.provider || 'backend'} · {response?.source || 'source unavailable'}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-caption text-slate-600 bg-white/[0.03] border border-white/[0.06] px-2 py-0.5 rounded-lg font-bold">{params.symbol || '--'}</span>
          <span className="text-caption text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-lg capitalize font-black">{params.strategy || '--'}</span>
          {response?.fallback && (
            <span className="text-caption text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-lg font-black">Indicative</span>
          )}
        </div>
      </div>

      {warnings.length > 0 && (
        <div className="mb-4 space-y-2">
          {warnings.map((warning) => (
            <div key={warning} className="rounded-xl border border-amber-500/20 bg-amber-500/8 px-3 py-2 text-body-sm font-semibold text-amber-300">
              {warning}
            </div>
          ))}
        </div>
      )}

      {/* overflow-x-auto pour mobile */}
      <div className="overflow-x-auto">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 min-w-[300px]">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.04, type: 'spring', stiffness: 180 }}
              whileHover={{ backgroundColor: 'rgba(255,255,255,0.04)' }}
              className="bg-white/[0.025] border border-white/[0.06] rounded-xl p-3.5 transition-colors"
            >
              <div className="flex items-center gap-1.5 mb-2">
                <s.icon size={10} className="text-slate-600" />
                <p className="text-caption text-slate-600 font-bold uppercase tracking-wider">{s.label}</p>
              </div>
              <p className={`text-ui font-black tabular-nums font-mono ${s.color}`}>{s.value}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
