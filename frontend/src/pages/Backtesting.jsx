import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, BarChart2, Server } from 'lucide-react'
import BacktestForm    from '../components/backtest/BacktestForm'
import BacktestResults from '../components/backtest/BacktestResults'
import BacktestChart   from '../components/backtest/BacktestChart'
import BacktestComparePanel from '../components/backtest/BacktestComparePanel'
import { Card, Badge, EmptyState } from '../components/ui'
import { getBacktestCapabilities, runBacktest } from '../services/backtestService'
import { formatDateTime } from '../utils/formatters'

const fadeUp = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0.16, 1, 0.3, 1] } } }

export default function Backtesting() {
  const [response,           setResponse]          = useState(null)
  const [loading,            setLoading]           = useState(false)
  const [error,              setError]             = useState(null)
  const [capabilities,       setCapabilities]      = useState(null)
  const [capabilitiesError,  setCapabilitiesError] = useState('')
  const [mode,               setMode]              = useState('single')

  useEffect(() => {
    let active = true
    getBacktestCapabilities().then((result) => {
      if (!active) return
      if (result.success) { setCapabilities(result); setCapabilitiesError('') }
      else { setCapabilities(null); setCapabilitiesError(result.error || 'Impossible de charger les symboles supportés.') }
    })
    return () => { active = false }
  }, [])

  async function handleRun(payload) {
    setLoading(true); setError(null)
    const result = await runBacktest(payload)
    setResponse(result)
    setError(result.success ? null : result.error || 'Impossible de lancer le backtest.')
    setLoading(false)
  }

  const warnings = [...(response?.warnings || []), ...(response?.dataQuality?.warnings || [])].filter(Boolean)

  return (
    <div className="space-y-6">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <motion.div initial="hidden" animate="visible" variants={fadeUp}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-label uppercase tracking-wider text-white/40 mb-1">Backtesting</p>
            <h1 className="text-display-sm font-black text-white">Testez vos Stratégies</h1>
            <p className="text-body text-white/40">Simulez vos stratégies sur des données historiques</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="success" size="sm">
              <Server size={9} className="mr-1 inline" />
              Backend réel
            </Badge>
            {response?.fallback && (
              <Badge variant="warning" size="sm">
                <AlertTriangle size={9} className="mr-1 inline" />
                Indicatif
              </Badge>
            )}
          </div>
        </div>
      </motion.div>

      {/* ── Meta bar si résultats ────────────────────────────────────────── */}
      <div className="inline-flex rounded-xl border border-white/[0.07] bg-white/[0.025] p-1">
        {[
          ['single', 'Single Backtest'],
          ['compare', 'Compare Strategies'],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setMode(value)}
            className={`rounded-lg px-3 py-2 text-body-sm font-black transition ${
              mode === value
                ? 'bg-rose-500/14 text-rose-300 border border-rose-500/24'
                : 'text-slate-600 hover:text-slate-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === 'single' && response && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <Card padding="sm">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-label font-bold text-white/35">
              <span>Provider : <span className="text-white/55">{response.provider || '--'}</span></span>
              <span>Source : <span className="text-white/55">{response.source || '--'}</span></span>
              <span>Données réelles : <span className={response.dataQuality?.usesRealHistoricalData ? 'text-emerald-400' : 'text-amber-400'}>{response.dataQuality?.usesRealHistoricalData ? 'Oui' : 'Non'}</span></span>
              <span>Mis à jour : <span className="text-white/55">{formatDateTime(response.timestamp)}</span></span>
              {response.params && (
                <span>
                  Stratégie : <span className="text-white/55 uppercase">{response.params.strategy || '--'}</span>
                  {' | '}Capital : <span className="font-mono text-white/55">{response.params.initialCapital}</span>
                </span>
              )}
            </div>
          </Card>
        </motion.div>
      )}

      {/* ── Warnings ─────────────────────────────────────────────────────── */}
      {mode === 'single' && warnings.length > 0 && (
        <div className="space-y-2">
          {warnings.map((w) => (
            <div key={w} className="flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/8 px-4 py-3 text-body-sm font-semibold text-amber-300">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />{w}
            </div>
          ))}
        </div>
      )}

      {capabilitiesError && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/8 px-4 py-3 text-body-sm font-semibold text-amber-300">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" /><span>{capabilitiesError}</span>
        </div>
      )}

      {/* ── Layout 2 colonnes ───────────────────────────────────────────── */}
      {mode === 'compare' ? (
        <BacktestComparePanel capabilities={capabilities} />
      ) : (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Formulaire */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card padding="none">
            <BacktestForm
              onRun={handleRun}
              loading={loading}
              error={error}
              supportedSymbols={capabilities?.supportedSymbols}
            />
          </Card>
        </motion.div>

        {/* Résultats */}
        <div className="space-y-4">
          {response ? (
            <>
              <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
                <BacktestResults response={response} />
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <BacktestChart
                  data={response.equityCurve}
                  initialCapital={response.params?.initialCapital}
                  fallback={response.fallback || !response.dataQuality?.usesRealHistoricalData}
                />
              </motion.div>
            </>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card padding="lg" className="min-h-[280px] flex items-center justify-center">
                <EmptyState
                  icon={BarChart2}
                  title="Aucun résultat"
                  description="Configurez et lancez un backtest pour voir les résultats ici"
                />
              </Card>
            </motion.div>
          )}
        </div>
      </div>
      )}
    </div>
  )
}
