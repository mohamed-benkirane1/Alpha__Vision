import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, CheckCircle, Gauge, RefreshCw, ShieldCheck } from 'lucide-react'
import { getPortfolioRiskScore } from '../../services/portfolioService'
import { Badge, Button, Card } from '../ui'
import { formatDateTime } from '../../utils/formatters'

const LEVEL_STYLE = {
  Low: {
    badge: 'success',
    color: '#10b981',
    text: 'text-emerald-300',
    border: 'border-emerald-500/20',
    bg: 'bg-emerald-500/[0.06]',
  },
  Medium: {
    badge: 'warning',
    color: '#f59e0b',
    text: 'text-amber-300',
    border: 'border-amber-500/20',
    bg: 'bg-amber-500/[0.06]',
  },
  High: {
    badge: 'danger',
    color: '#e11d48',
    text: 'text-rose-300',
    border: 'border-rose-500/20',
    bg: 'bg-rose-500/[0.06]',
  },
}

function RiskList({ title, items, tone = 'slate' }) {
  if (!Array.isArray(items) || items.length === 0) return null
  const color = tone === 'risk' ? 'text-amber-300' : tone === 'positive' ? 'text-emerald-300' : 'text-slate-400'

  return (
    <div className="rounded-xl border border-white/[0.055] bg-white/[0.025] px-3.5 py-3">
      <p className={`mb-2 text-caption font-black uppercase tracking-wider ${color}`}>{title}</p>
      <ul className="space-y-1.5 text-body-sm font-medium text-slate-400">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-current opacity-60" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function PortfolioRiskScore() {
  const [risk, setRisk] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const loadRiskScore = useCallback(async ({ refresh = false } = {}) => {
    if (refresh) setRefreshing(true)
    else setLoading(true)
    setError('')

    const result = await getPortfolioRiskScore()
    if (result.success) setRisk(result)
    else setError(result.error || 'Unable to calculate portfolio risk score.')

    setLoading(false)
    setRefreshing(false)
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => loadRiskScore(), 0)
    return () => window.clearTimeout(timer)
  }, [loadRiskScore])

  const score = Number.isFinite(Number(risk?.score)) ? Number(risk.score) : 0
  const level = risk?.level || 'Low'
  const style = LEVEL_STYLE[level] || LEVEL_STYLE.Low

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <Card padding="md" className={`${style.border}`}>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <Gauge size={15} className="text-rose-400" />
              <h2 className="text-body font-bold text-white">Portfolio Risk Score</h2>
              {risk && (
                <Badge variant={style.badge} size="sm">
                  {level}
                </Badge>
              )}
            </div>
            <p className="text-body-sm font-medium text-slate-600">
              Educational estimate based on concentration, asset count, exposure and price quality.
            </p>
            {risk?.timestamp && (
              <p className="mt-1 text-caption font-bold text-slate-700">Updated {formatDateTime(risk.timestamp)}</p>
            )}
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => loadRiskScore({ refresh: true })}
            loading={refreshing}
            disabled={loading || refreshing}
            leftIcon={!refreshing ? <RefreshCw size={12} /> : null}
          >
            Refresh
          </Button>
        </div>

        {loading && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[180px_1fr]">
            <div className="h-40 animate-pulse rounded-2xl border border-white/[0.055] bg-white/[0.025]" />
            <div className="space-y-2">
              <div className="h-16 animate-pulse rounded-xl border border-white/[0.055] bg-white/[0.025]" />
              <div className="h-16 animate-pulse rounded-xl border border-white/[0.055] bg-white/[0.025]" />
            </div>
          </div>
        )}

        {!loading && error && (
          <div className="flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/8 px-3 py-2 text-body-sm font-semibold text-amber-300">
            <AlertTriangle size={13} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!loading && !error && !risk && (
          <div className="rounded-xl border border-dashed border-white/[0.08] bg-white/[0.02] px-4 py-6 text-center">
            <p className="text-body-sm font-bold text-slate-500">No risk score available</p>
            <p className="mt-1 text-label text-slate-700">The score will appear when portfolio data is available.</p>
          </div>
        )}

        {!loading && !error && risk && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[180px_1fr]">
            <div className={`flex flex-col items-center justify-center rounded-2xl border ${style.border} ${style.bg} px-4 py-5`}>
              <div
                className="flex h-28 w-28 items-center justify-center rounded-full"
                style={{
                  background: `conic-gradient(${style.color} ${score * 3.6}deg, rgba(255,255,255,0.06) 0deg)`,
                }}
              >
                <div className="flex h-20 w-20 flex-col items-center justify-center rounded-full bg-[#0a1628]">
                  <span className={`text-heading-sm font-black tabular-nums ${style.text}`}>{score}</span>
                  <span className="text-caption font-black uppercase text-slate-700">/100</span>
                </div>
              </div>
              <p className={`mt-3 text-body-sm font-black ${style.text}`}>{level} Risk</p>
            </div>

            <div className="space-y-3">
              <div className="rounded-xl border border-white/[0.055] bg-white/[0.025] px-4 py-3">
                <div className="mb-2 flex items-center gap-2">
                  <ShieldCheck size={13} className="text-rose-400" />
                  <p className="text-caption font-black uppercase tracking-wider text-rose-300">Summary</p>
                </div>
                <p className="text-body-sm font-medium leading-relaxed text-slate-300">{risk.summary}</p>
              </div>

              <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
                <RiskList title="Risk factors" items={risk.riskFactors} tone="risk" />
                <RiskList title="Positive points" items={risk.positivePoints} tone="positive" />
                <RiskList title="Educational suggestions" items={risk.suggestions} />
              </div>

              {risk.warnings.length > 0 && (
                <div className="rounded-xl border border-amber-500/18 bg-amber-500/[0.06] px-3 py-2 text-label font-semibold text-amber-300">
                  {risk.warnings.slice(0, 2).join(' ')}
                </div>
              )}

              <p className="flex items-start gap-2 rounded-xl border border-white/[0.055] bg-white/[0.02] px-3 py-2 text-caption font-bold text-slate-600">
                <CheckCircle size={12} className="mt-0.5 shrink-0" />
                <span>{risk.disclaimer}</span>
              </p>
            </div>
          </div>
        )}
      </Card>
    </motion.div>
  )
}
