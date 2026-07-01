import { useState } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, BrainCircuit, CheckCircle, RefreshCw, ShieldAlert } from 'lucide-react'
import { analyzePortfolio } from '../../services/portfolioService'
import { Badge, Button, Card } from '../ui'
import { formatDateTime } from '../../utils/formatters'

function AnalysisList({ title, items, tone = 'slate' }) {
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

export default function PortfolioAIAnalysis() {
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleAnalyze = async () => {
    if (loading) return
    setLoading(true)
    setError('')
    const result = await analyzePortfolio()
    if (result.success && result.analysis) {
      setAnalysis(result)
    } else {
      setError(result.error || 'Unable to analyze portfolio.')
    }
    setLoading(false)
  }

  const providerLabel = analysis?.fallback
    ? 'Rules fallback'
    : analysis?.provider === 'groq'
      ? 'Groq AI'
      : analysis?.provider || 'AI'

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <Card padding="md" className="border-rose-500/16">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <BrainCircuit size={15} className="text-rose-400" />
              <h2 className="text-body font-bold text-white">Portfolio AI Analysis</h2>
              {analysis && (
                <Badge variant={analysis.fallback ? 'warning' : 'accent'} size="sm">
                  {providerLabel}
                </Badge>
              )}
            </div>
            <p className="text-body-sm font-medium text-slate-600">
              Educational review of allocation, diversification and paper portfolio risks.
            </p>
            {analysis?.timestamp && (
              <p className="mt-1 text-caption font-bold text-slate-700">Updated {formatDateTime(analysis.timestamp)}</p>
            )}
          </div>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleAnalyze}
            loading={loading}
            leftIcon={!loading ? <RefreshCw size={12} /> : null}
          >
            {analysis ? 'Analyze again' : 'Analyze with AI'}
          </Button>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/8 px-3 py-2 text-body-sm font-semibold text-amber-300">
            <AlertTriangle size={13} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!analysis && !error && (
          <div className="rounded-xl border border-dashed border-white/[0.08] bg-white/[0.02] px-4 py-6">
            <div className="flex items-start gap-3">
              <ShieldAlert size={16} className="mt-0.5 shrink-0 text-slate-600" />
              <div>
                <p className="text-body-sm font-black text-slate-400">No analysis generated yet</p>
                <p className="mt-1 text-label font-medium text-slate-700">
                  Run an analysis after loading your portfolio. If Groq is unavailable, Alpha Vision will show a rules-based fallback.
                </p>
              </div>
            </div>
          </div>
        )}

        {analysis?.analysis && (
          <div className="space-y-3">
            {analysis.fallback && (
              <div className="rounded-xl border border-amber-500/18 bg-amber-500/[0.06] px-3 py-2 text-label font-semibold text-amber-300">
                AI provider unavailable. Rules-based fallback is shown.
              </div>
            )}
            <div className="rounded-xl border border-white/[0.055] bg-white/[0.025] px-4 py-3">
              <div className="mb-2 flex items-center gap-2">
                <CheckCircle size={13} className="text-emerald-400" />
                <p className="text-caption font-black uppercase tracking-wider text-emerald-300">Summary</p>
              </div>
              <p className="text-body-sm font-medium leading-relaxed text-slate-300">{analysis.analysis.summary}</p>
              {analysis.analysis.allocation && (
                <p className="mt-2 text-label font-medium text-slate-500">{analysis.analysis.allocation}</p>
              )}
              {analysis.analysis.diversification && (
                <p className="mt-1 text-label font-medium text-slate-500">{analysis.analysis.diversification}</p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
              <AnalysisList title="Dominant assets" items={analysis.analysis.dominantAssets} />
              <AnalysisList title="Risks" items={analysis.analysis.risks} tone="risk" />
              <AnalysisList title="Positives" items={analysis.analysis.positives} tone="positive" />
            </div>

            <AnalysisList title="Notes" items={analysis.analysis.notes} />

            <p className="rounded-xl border border-white/[0.055] bg-white/[0.02] px-3 py-2 text-caption font-bold text-slate-600">
              {analysis.analysis.disclaimer}
            </p>
          </div>
        )}
      </Card>
    </motion.div>
  )
}
