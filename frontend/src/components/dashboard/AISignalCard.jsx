import { motion } from 'framer-motion'
import { Zap, Clock, Activity, AlertTriangle, BrainCircuit, ShieldAlert } from 'lucide-react'

const DISCLAIMER = 'Educational signal, not financial advice.'

const formatDateTime = (value) => {
  if (!value) return '--'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '--'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

const formatPrice = (value) => {
  const number = Number(value)
  if (!Number.isFinite(number)) return '--'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(number)
}

const formatPercent = (value) => {
  const number = Number(value)
  if (!Number.isFinite(number)) return '--'
  return `${number >= 0 ? '+' : ''}${number.toFixed(2)}%`
}

const badgeTone = {
  buy: 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300',
  sell: 'bg-rose-500/10 border-rose-500/25 text-rose-300',
  hold: 'bg-cyan-500/10 border-cyan-500/25 text-cyan-300',
}

const getLabelTone = (label) => badgeTone[String(label || '').toLowerCase()] || badgeTone.hold

const formatRisk = (riskLevel) => {
  if (!riskLevel) return '--'
  return `${riskLevel.charAt(0).toUpperCase()}${riskLevel.slice(1)}`
}

function SignalBadge({ children, className = '' }) {
  return (
    <span className={`text-[9px] border px-2 py-0.5 rounded-full font-black tracking-widest uppercase ${className}`}>
      {children}
    </span>
  )
}

export default function AISignalCard({ aiSignal, loading = false, unavailable = false }) {
  const signal = aiSignal?.signal || null
  const dataQuality = aiSignal?.dataQuality || {}
  const warnings = [
    ...(Array.isArray(dataQuality.warnings) ? dataQuality.warnings : []),
    ...(Array.isArray(aiSignal?.warnings) ? aiSignal.warnings : []),
  ].filter(Boolean)
  const isRulesBased = aiSignal?.provider === 'rules-based' || aiSignal?.fallback === true
  const hasSignal = aiSignal?.success === true && signal
  const market = signal?.marketSnapshot || {}
  const news = signal?.newsContext || {}
  const statusText = loading
    ? 'Loading'
    : hasSignal
      ? dataQuality.usesLLM
        ? 'AI / DeepSeek'
        : 'Rules-based'
      : 'Unavailable'

  return (
    <motion.div
      whileHover={{ borderColor: 'rgba(225,29,72,0.18)' }}
      className="relative bg-[#0a1628]/88 border border-white/[0.07] rounded-2xl p-5 backdrop-blur-2xl flex flex-col h-full shadow-[0_4px_28px_rgba(0,0,0,0.32)] transition-colors duration-300"
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
            <Zap size={13} className="text-rose-400" />
          </div>
          <h2 className="text-sm font-bold text-white">AI Signal</h2>
        </div>
        {dataQuality.usesLLM === true && hasSignal && (
          <SignalBadge className="text-rose-300 bg-rose-500/10 border-rose-500/25">AI / DeepSeek</SignalBadge>
        )}
        {isRulesBased && hasSignal && (
          <SignalBadge className="text-amber-300 bg-amber-500/10 border-amber-500/25">Indicative</SignalBadge>
        )}
        {!hasSignal && !loading && (
          <SignalBadge className="text-slate-400 bg-white/[0.035] border-white/[0.08]">Unavailable</SignalBadge>
        )}
      </div>

      {loading && (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
          <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-4">
            <Clock size={18} className="text-slate-600" />
          </div>
          <p className="text-base font-black text-white">Loading backend signal</p>
          <p className="text-xs text-slate-600 mt-2 max-w-xs">
            Market reliability is checked before a signal is displayed.
          </p>
        </div>
      )}

      {!loading && !hasSignal && (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/[0.07] border border-amber-500/[0.16] flex items-center justify-center mb-4">
            <AlertTriangle size={18} className="text-amber-300" />
          </div>
          <p className="text-base font-black text-white">Signal unavailable</p>
          <p className="text-xs text-slate-600 mt-2 max-w-xs">
            {aiSignal?.error || (unavailable
              ? 'The backend signal endpoint could not be refreshed.'
              : 'Reliable market data is required before a signal can be generated.')}
          </p>
        </div>
      )}

      {!loading && hasSignal && (
        <div className="flex-1 space-y-3.5">
          <div className="rounded-xl bg-white/[0.025] border border-white/[0.06] p-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {dataQuality.usesLLM ? (
                  <BrainCircuit size={14} className="text-rose-300" />
                ) : (
                  <ShieldAlert size={14} className="text-amber-300" />
                )}
                <SignalBadge className={getLabelTone(signal.label)}>{signal.label || 'No label'}</SignalBadge>
              </div>
              <p className="text-[11px] text-slate-500 font-bold">
                Confidence <span className="text-white">{Number.isFinite(Number(signal.confidence)) ? `${Number(signal.confidence)}%` : '--'}</span>
              </p>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mt-3">{signal.summary || '--'}</p>
            {isRulesBased && (
              <p className="text-[11px] text-amber-300/85 font-semibold mt-2">Rules-based signal, not AI.</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="rounded-xl bg-white/[0.02] border border-white/[0.055] px-3 py-2">
              <p className="text-slate-700 uppercase font-black">Risk</p>
              <p className="text-slate-300 font-bold">{formatRisk(signal.riskLevel)}</p>
            </div>
            <div className="rounded-xl bg-white/[0.02] border border-white/[0.055] px-3 py-2">
              <p className="text-slate-700 uppercase font-black">Horizon</p>
              <p className="text-slate-300 font-bold">{signal.timeHorizon || '--'}</p>
            </div>
          </div>

          {Array.isArray(signal.reasons) && signal.reasons.length > 0 && (
            <div className="rounded-xl bg-white/[0.02] border border-white/[0.055] px-3 py-2.5">
              <p className="text-[10px] text-slate-700 uppercase font-black mb-1.5">Reasons</p>
              <ul className="space-y-1 text-[11px] text-slate-400 leading-relaxed">
                {signal.reasons.slice(0, 3).map((reason) => (
                  <li key={reason} className="flex gap-1.5">
                    <span className="text-slate-700">-</span>
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="rounded-xl bg-white/[0.02] border border-white/[0.055] px-3 py-2.5 text-[11px]">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Activity size={11} className="text-rose-400" />
              <p className="text-[10px] text-rose-400 uppercase font-black">Market Snapshot</p>
            </div>
            <p className="text-slate-400">
              {market.symbol || aiSignal.symbol || '--'} at <span className="text-slate-200 font-bold">{formatPrice(market.price)}</span>
              <span className="text-slate-600"> / </span>{formatPercent(market.change24h)} 24h
            </p>
            <p className="text-slate-600 mt-1">
              {market.provider || aiSignal.provider || '--'} / {market.source || aiSignal.source || '--'} / {formatDateTime(market.timestamp || aiSignal.timestamp)}
            </p>
            <p className="text-slate-600 mt-1">
              News used {Number.isFinite(Number(news.articlesUsed)) ? Number(news.articlesUsed) : 0} / latest {formatDateTime(news.latestPublishedAt)}
            </p>
          </div>
        </div>
      )}

      {warnings.length > 0 && (
        <div className="bg-amber-500/[0.06] border border-amber-500/[0.16] rounded-xl p-3 mt-3">
          <p className="text-[10px] font-black text-amber-300 uppercase tracking-wider mb-1">Warnings</p>
          <ul className="space-y-1 text-[11px] text-amber-100/75 leading-relaxed">
            {warnings.slice(0, 3).map((warning) => (
              <li key={warning} className="flex gap-1.5">
                <span>-</span>
                <span>{warning}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="bg-white/[0.025] border border-white/[0.06] rounded-xl p-3.5 mt-4">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5">
            <Activity size={11} className="text-rose-400" />
            <span className="text-[10px] font-black text-rose-400 uppercase tracking-wider">Status</span>
          </div>
          <span className="text-[10px] text-slate-500 font-black">{statusText}</span>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">{signal?.disclaimer || DISCLAIMER}</p>
      </div>
    </motion.div>
  )
}
