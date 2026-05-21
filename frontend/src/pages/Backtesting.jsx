import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, FlaskConical, Server } from 'lucide-react'
import BacktestForm from '../components/backtest/BacktestForm'
import BacktestResults from '../components/backtest/BacktestResults'
import BacktestChart from '../components/backtest/BacktestChart'
import { getBacktestCapabilities, runBacktest } from '../services/backtestService'

const fadeUp = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0.16, 1, 0.3, 1] } } }

const formatDateTime = (value) => {
  if (!value) return '--'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '--'
  return date.toLocaleString([], { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

export default function Backtesting() {
  const [response, setResponse] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [capabilities, setCapabilities] = useState(null)
  const [capabilitiesError, setCapabilitiesError] = useState('')

  useEffect(() => {
    let active = true

    getBacktestCapabilities().then((result) => {
      if (!active) return
      if (result.success) {
        setCapabilities(result)
        setCapabilitiesError('')
      } else {
        setCapabilities(null)
        setCapabilitiesError(result.error || 'Unable to load supported backtest symbols.')
      }
    })

    return () => {
      active = false
    }
  }, [])

  async function handleRun({ symbol, strategy, capital }) {
    setLoading(true)
    setError(null)

    const result = await runBacktest({
      symbol,
      strategy,
      initialCapital: capital,
      positionSize: 0.2,
    })

    setResponse(result)
    setError(result.success ? null : result.error || 'Unable to run backtest.')
    setLoading(false)
  }

  const warnings = [
    ...(response?.warnings || []),
    ...(response?.dataQuality?.warnings || []),
  ].filter(Boolean)

  return (
    <div className="space-y-5">
      <motion.div initial="hidden" animate="visible" variants={fadeUp}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <FlaskConical size={16} className="text-rose-400" />
              <h1 className="text-2xl font-black text-white">Backtesting</h1>
            </div>
            <p className="text-xs text-slate-500 font-medium">Run backend backtests only when real historical data is available</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-emerald-400">
              <Server size={10} />
              Backend source
            </span>
            {response?.fallback && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-amber-300">
                <AlertTriangle size={10} />
                Indicative
              </span>
            )}
          </div>
        </div>
      </motion.div>

      {response && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/[0.07] bg-[#0a1628]/70 px-4 py-3 text-[11px] font-bold text-slate-500">
          <span>Provider: <span className="text-slate-300">{response.provider || '--'}</span></span>
          <span>Source: <span className="text-slate-300">{response.source || '--'}</span></span>
          <span>Updated: <span className="text-slate-300">{formatDateTime(response.timestamp)}</span></span>
          <span>Real historical data: <span className={response.dataQuality?.usesRealHistoricalData ? 'text-emerald-400' : 'text-amber-300'}>{response.dataQuality?.usesRealHistoricalData ? 'Yes' : 'No'}</span></span>
        </div>
      )}

      {warnings.length > 0 && (
        <div className="space-y-2">
          {warnings.map((warning) => (
            <div key={warning} className="flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/8 px-4 py-3 text-xs font-semibold text-amber-300">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              {warning}
            </div>
          ))}
        </div>
      )}

      {capabilitiesError && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/8 px-4 py-3 text-xs font-semibold text-amber-300">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          <span>{capabilitiesError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <BacktestForm
            onRun={handleRun}
            loading={loading}
            error={error}
            supportedSymbols={capabilities?.supportedSymbols || []}
            supportedStrategies={capabilities?.strategies || []}
            historicalProvider={capabilities?.historicalProvider}
          />
        </motion.div>

        <div className="lg:col-span-2 space-y-3.5">
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
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-[#0a1628]/88 border border-white/[0.07] rounded-2xl p-10 backdrop-blur-2xl shadow-[0_4px_28px_rgba(0,0,0,0.28)] flex flex-col items-center justify-center text-center h-full min-h-[260px]"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-4">
                <FlaskConical size={22} className="text-rose-400" />
              </div>
              <p className="text-sm text-slate-500 font-bold">No backtest run yet</p>
              <p className="text-xs text-slate-700 mt-1 font-medium">Configure and run a strategy. Results are shown only from backend historical data.</p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
