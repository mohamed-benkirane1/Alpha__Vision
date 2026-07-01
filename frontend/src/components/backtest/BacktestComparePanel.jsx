import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { GitCompareArrows, AlertTriangle, CheckCircle, ChevronDown, FileDown, Trophy } from 'lucide-react'
import {
  CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { compareBacktests, logBacktestExport } from '../../services/backtestService'
import { ASSET_GROUPS, TRADING_ASSETS } from '../../constants/tradingAssets'
import { Button, Badge } from '../ui'
import { formatCurrency, formatNumber, formatPercent } from '../../utils/formatters'
import { exportBacktestCompareCsv } from '../../utils/backtestCsvExport'

const STRATEGIES = [
  { value: 'rsi', label: 'RSI' },
  { value: 'macd', label: 'MACD' },
  { value: 'bollinger', label: 'Bollinger' },
  { value: 'ema_cross', label: 'EMA Cross' },
  { value: 'stochastic', label: 'Stochastic' },
  { value: 'multi', label: 'Multi' },
]

const COLORS = ['#e11d48', '#38bdf8', '#f59e0b']
const fieldCls = 'w-full bg-[#060D1C]/80 border border-white/[0.09] text-white text-body rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-rose-500/50 transition-all duration-200 appearance-none'

function buildChartData(comparisons) {
  const rows = []
  comparisons.forEach((comparison) => {
    comparison.equityCurve.forEach((point, index) => {
      if (!rows[index]) rows[index] = { day: point.day || `D${index + 1}` }
      rows[index][comparison.strategy] = Number(point.value)
    })
  })
  return rows.filter((row) => Object.keys(row).length > 1)
}

function CompareTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-rose-500/22 bg-[#0a1628] px-4 py-3 text-body-sm shadow-[0_8px_32px_rgba(0,0,0,0.55)]">
      <p className="mb-2 font-bold text-slate-500">{label}</p>
      <div className="space-y-1">
        {payload.map((item) => (
          <p key={item.dataKey} className="font-black tabular-nums" style={{ color: item.color }}>
            {String(item.dataKey).toUpperCase()}: {formatCurrency(item.value)}
          </p>
        ))}
      </div>
    </div>
  )
}

export default function BacktestComparePanel({ capabilities = null }) {
  const supportedSymbols = Array.isArray(capabilities?.supportedSymbols) && capabilities.supportedSymbols.length > 0
    ? capabilities.supportedSymbols
    : ['BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'ADA', 'DOGE']
  const supportedSet = new Set(supportedSymbols)
  const assets = TRADING_ASSETS.filter((asset) => supportedSet.has(asset.value))

  const [symbol, setSymbol] = useState('BTC')
  const [strategies, setStrategies] = useState(['rsi', 'macd', 'ema_cross'])
  const [initialCapital, setInitialCapital] = useState('10000')
  const [positionSize, setPositionSize] = useState('0.2')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [exporting, setExporting] = useState(false)
  const [exportMessage, setExportMessage] = useState('')
  const [exportError, setExportError] = useState('')

  const chartData = useMemo(() => buildChartData(result?.comparisons || []), [result])
  const compareWarnings = useMemo(() => {
    const warnings = [
      ...(Array.isArray(result?.warnings) ? result.warnings : []),
      ...(Array.isArray(result?.comparisons)
        ? result.comparisons.flatMap((row) => (Array.isArray(row.warnings) ? row.warnings : []))
        : []),
    ].filter(Boolean)

    return [...new Set(warnings)]
  }, [result])

  const toggleStrategy = (strategy) => {
    setStrategies((current) => {
      if (current.includes(strategy)) return current.filter((item) => item !== strategy)
      if (current.length >= 3) return current
      return [...current, strategy]
    })
  }

  const runCompare = async (event) => {
    event.preventDefault()
    if (strategies.length < 2) {
      setError('Choose at least two strategies.')
      return
    }
    setLoading(true)
    setError('')
    setExportMessage('')
    setExportError('')
    const response = await compareBacktests({
      symbol,
      strategies,
      initialCapital: Number(initialCapital),
      positionSize: Number(positionSize),
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    })
    setResult(response)
    if (!response.success) setError(response.error || 'Unable to compare strategies.')
    setLoading(false)
  }

  const exportCompare = async () => {
    if (!result?.comparisons?.length || exporting) return
    setExporting(true)
    setExportMessage('')
    setExportError('')

    try {
      const filename = exportBacktestCompareCsv(result)
      const exportStrategies = result.comparisons.map((row) => row.strategy).filter(Boolean)
      const logResult = await logBacktestExport({
        scope: 'compare',
        format: 'csv',
        symbol: result.params?.symbol || symbol,
        strategies: exportStrategies,
        rowCount: result.comparisons.length,
      })
      setExportMessage(logResult.success
        ? `${filename} exported.`
        : `${filename} exported. Activity log unavailable.`)
    } catch (err) {
      setExportError(err?.message || 'Unable to export comparison CSV.')
    } finally {
      setExporting(false)
    }
  }

  return (
    <motion.div
      whileHover={{ borderColor: 'rgba(225,29,72,0.12)' }}
      className="bg-[#0a1628]/88 border border-white/[0.07] rounded-2xl p-5 backdrop-blur-2xl shadow-[0_4px_28px_rgba(0,0,0,0.32)] transition-all duration-300"
    >
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <GitCompareArrows size={14} className="text-rose-400" />
            <h2 className="text-body font-bold text-white">Compare Strategies</h2>
          </div>
          <p className="text-body-sm font-medium text-slate-600">Run 2 or 3 backend backtests on the same symbol and period.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {result?.bestStrategy && (
            <Badge variant="warning" size="sm">
              <Trophy size={10} className="mr-1" />
              Best: {result.bestStrategy.toUpperCase()}
            </Badge>
          )}
          {result?.comparisons?.length > 0 && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={exportCompare}
              loading={exporting}
              disabled={exporting}
              leftIcon={!exporting ? <FileDown size={12} /> : null}
            >
              Export CSV
            </Button>
          )}
        </div>
      </div>

      <form onSubmit={runCompare} className="mb-5 grid grid-cols-1 gap-3 lg:grid-cols-5">
        <div>
          <label className="mb-1.5 block text-caption font-black uppercase tracking-wide text-slate-600">Asset</label>
          <div className="relative">
            <select value={symbol} onChange={(event) => setSymbol(event.target.value)} className={`${fieldCls} pr-9`}>
              {ASSET_GROUPS.map((group) => {
                const groupAssets = assets.filter((asset) => asset.type === group.type)
                if (groupAssets.length === 0) return null
                return (
                  <optgroup key={group.type} label={group.label}>
                    {groupAssets.map((asset) => (
                      <option key={asset.value} value={asset.value} className="bg-[#0a1628]">{asset.label}</option>
                    ))}
                  </optgroup>
                )
              })}
            </select>
            <ChevronDown size={13} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-600" />
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-caption font-black uppercase tracking-wide text-slate-600">Capital</label>
          <input className={fieldCls} type="number" min="1" value={initialCapital} onChange={(event) => setInitialCapital(event.target.value)} />
        </div>
        <div>
          <label className="mb-1.5 block text-caption font-black uppercase tracking-wide text-slate-600">Position Size</label>
          <input className={fieldCls} type="number" min="0.01" max="1" step="0.05" value={positionSize} onChange={(event) => setPositionSize(event.target.value)} />
        </div>
        <div>
          <label className="mb-1.5 block text-caption font-black uppercase tracking-wide text-slate-600">Start</label>
          <input className={fieldCls} type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
        </div>
        <div>
          <label className="mb-1.5 block text-caption font-black uppercase tracking-wide text-slate-600">End</label>
          <input className={fieldCls} type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
        </div>

        <div className="lg:col-span-5">
          <p className="mb-2 text-caption font-black uppercase tracking-wide text-slate-600">Strategies</p>
          <div className="flex flex-wrap gap-2">
            {STRATEGIES.map((strategy) => {
              const checked = strategies.includes(strategy.value)
              const disabled = !checked && strategies.length >= 3
              return (
                <button
                  key={strategy.value}
                  type="button"
                  onClick={() => toggleStrategy(strategy.value)}
                  disabled={disabled || loading}
                  className={`rounded-xl border px-3 py-2 text-body-sm font-black transition ${
                    checked
                      ? 'border-rose-500/35 bg-rose-500/12 text-rose-300'
                      : 'border-white/[0.07] bg-white/[0.025] text-slate-600 hover:text-slate-300'
                  } disabled:cursor-not-allowed disabled:opacity-40`}
                >
                  {strategy.label}
                </button>
              )
            })}
          </div>
        </div>

        <div className="lg:col-span-5">
          <Button type="submit" size="md" loading={loading} disabled={loading || strategies.length < 2}>
            Run comparison
          </Button>
        </div>
      </form>

      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/8 px-3 py-2 text-body-sm font-semibold text-amber-300">
          <AlertTriangle size={13} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {(exportMessage || exportError) && (
        <div className={`mb-4 flex items-start gap-2 rounded-xl border px-3 py-2 text-body-sm font-semibold ${
          exportError
            ? 'border-amber-500/20 bg-amber-500/8 text-amber-300'
            : 'border-emerald-500/20 bg-emerald-500/8 text-emerald-300'
        }`}
        >
          {exportError ? <AlertTriangle size={13} className="mt-0.5 shrink-0" /> : <CheckCircle size={13} className="mt-0.5 shrink-0" />}
          <span>{exportError || exportMessage}</span>
        </div>
      )}

      {compareWarnings.length > 0 && (
        <div className="mb-4 space-y-2">
          {compareWarnings.map((warning) => (
            <div key={warning} className="flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/8 px-3 py-2 text-body-sm font-semibold text-amber-300">
              <AlertTriangle size={13} className="mt-0.5 shrink-0" />
              <span>{warning}</span>
            </div>
          ))}
        </div>
      )}

      {!result && !error && (
        <div className="rounded-xl border border-dashed border-white/[0.08] bg-white/[0.02] px-4 py-8 text-center">
          <p className="text-body-sm font-bold text-slate-500">No comparison yet</p>
          <p className="mt-1 text-label text-slate-700">Select strategies and run a comparison.</p>
        </div>
      )}

      {result?.comparisons?.length > 0 && (
        <div className="space-y-5">
          <div className="overflow-x-auto">
            <table className="min-w-[720px] w-full text-left text-body-sm">
              <thead className="text-caption font-black uppercase tracking-wide text-slate-600">
                <tr className="border-b border-white/[0.06]">
                  <th className="py-2 pr-3">Strategy</th>
                  <th className="py-2 pr-3">Final Balance</th>
                  <th className="py-2 pr-3">Return</th>
                  <th className="py-2 pr-3">Win Rate</th>
                  <th className="py-2 pr-3">Drawdown</th>
                  <th className="py-2 pr-3">Trades</th>
                  <th className="py-2 pr-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {result.comparisons.map((row) => {
                  const best = row.strategy === result.bestStrategy
                  return (
                    <tr key={row.strategy} className="border-b border-white/[0.04]">
                      <td className="py-3 pr-3 font-black text-white">
                        {row.strategy?.toUpperCase()}
                        {best && <span className="ml-2 text-caption text-amber-300">BEST</span>}
                      </td>
                      <td className="py-3 pr-3 font-mono font-black text-white">{formatCurrency(row.finalBalance)}</td>
                      <td className={`py-3 pr-3 font-mono font-black ${(row.totalReturn ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{formatPercent(row.totalReturn)}</td>
                      <td className="py-3 pr-3 font-mono text-slate-300">{formatPercent(row.winRate)}</td>
                      <td className="py-3 pr-3 font-mono text-amber-300">{formatPercent(row.maxDrawdown)}</td>
                      <td className="py-3 pr-3 font-mono text-slate-300">{formatNumber(row.numberOfTrades)}</td>
                      <td className="py-3 pr-3">
                        <Badge variant={row.fallback ? 'warning' : row.success ? 'success' : 'danger'} size="sm">
                          {row.fallback ? 'Indicative' : row.success ? 'Real' : 'Error'}
                        </Badge>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {chartData.length > 0 && (
            <div className="rounded-xl border border-white/[0.055] bg-white/[0.02] p-4">
              <p className="mb-3 text-caption font-black uppercase tracking-wider text-rose-400">Equity Curves</p>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="2 5" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="day" tick={{ fill: '#3f4f68', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#3f4f68', fontSize: 10 }} axisLine={false} tickLine={false} width={42} tickFormatter={(value) => `$${Math.round(Number(value) / 1000)}k`} />
                  <Tooltip content={<CompareTooltip />} />
                  {result.comparisons.slice(0, 3).map((row, index) => (
                    <Line key={row.strategy} type="monotone" dataKey={row.strategy} stroke={COLORS[index]} strokeWidth={2.5} dot={false} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
    </motion.div>
  )
}
