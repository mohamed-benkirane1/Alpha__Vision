import { memo, useMemo } from 'react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { motion } from 'framer-motion'
import { AlertTriangle, TrendingUp, Clock } from 'lucide-react'
import { getValidNumber, formatCurrency, formatDateTime } from '../../utils/formatters'

const formatTick = (value) => formatDateTime(value, 'date')

function HistoryTooltip({ active, payload }) {
  const point = payload?.[0]?.payload
  if (!active || !point) return null

  return (
    <div className="rounded-xl border border-rose-500/22 bg-[#0a1628] px-4 py-3 text-body-sm shadow-[0_8px_32px_rgba(0,0,0,0.55)]">
      <p className="mb-1.5 font-medium text-slate-500">{formatDateTime(point.timestamp)}</p>
      <p className="font-black tabular-nums text-white">{formatCurrency(point.totalPortfolioValue)}</p>
      <p className="mt-1 font-semibold text-slate-600">Source {point.source || '--'}</p>
    </div>
  )
}

function EmptyHistory({ loading, unavailable, warnings }) {
  return (
    <div className="flex h-[220px] flex-col items-center justify-center rounded-xl border border-dashed border-white/[0.08] bg-white/[0.02] px-5 text-center">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.03]">
        {unavailable ? <AlertTriangle size={16} className="text-amber-400" /> : <Clock size={16} className="text-slate-600" />}
      </div>
      <p className="text-body font-bold text-slate-400">
        {loading
          ? 'Loading real portfolio history...'
          : unavailable
            ? 'Unable to load real history'
            : 'Not enough real history yet'}
      </p>
      <p className="mt-1 max-w-sm text-body-sm font-medium text-slate-700">
        {unavailable
          ? 'The dashboard could not load portfolio snapshots from the backend.'
          : 'Portfolio refreshes and successful trades will build the snapshot series over time.'}
      </p>
      {warnings.length > 0 && (
        <p className="mt-2 max-w-sm text-label font-semibold text-amber-300">{warnings[0]}</p>
      )}
    </div>
  )
}

function PerformanceChart({ history = null, loading = false, unavailable = false }) {
  const warnings = Array.isArray(history?.warnings) ? history.warnings.filter(Boolean) : []
  const data = useMemo(
    () => Array.isArray(history?.data)
      ? history.data
        .map((point) => ({
          ...point,
          totalPortfolioValue: getValidNumber(point.totalPortfolioValue),
        }))
        .filter((point) => point.timestamp && point.totalPortfolioValue !== null)
      : [],
    [history],
  )
  const hasEnoughData = history?.dataQuality?.hasEnoughData === true && data.length >= 2
  const minValue = hasEnoughData ? Math.min(...data.map((point) => point.totalPortfolioValue)) : 0
  const maxValue = hasEnoughData ? Math.max(...data.map((point) => point.totalPortfolioValue)) : 0
  const padding = hasEnoughData ? Math.max((maxValue - minValue) * 0.08, maxValue * 0.01, 1) : 0
  const badgeLabel = loading
    ? 'Loading'
    : unavailable
      ? 'Unavailable'
      : hasEnoughData
        ? 'Real snapshots'
        : 'Waiting for data'
  const badgeClass = hasEnoughData
    ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
    : unavailable
      ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
      : 'text-slate-500 bg-white/[0.03] border-white/[0.07]'

  return (
    <motion.div
      whileHover={{ borderColor: 'rgba(225,29,72,0.14)' }}
      className="bg-[#0a1628]/88 border border-white/[0.07] rounded-2xl p-5 backdrop-blur-2xl shadow-[0_4px_28px_rgba(0,0,0,0.32)] transition-colors duration-300 h-full"
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <TrendingUp size={14} className="text-rose-400" />
            <h2 className="text-body font-bold text-white">Portfolio Performance</h2>
          </div>
          <p className="text-label text-slate-600">
            {history ? `${history.range || '30d'} real snapshot history` : 'Backend portfolio snapshot history'}
          </p>
        </div>
        <span className={`text-caption border px-2 py-0.5 rounded-full font-black ${badgeClass}`}>
          {badgeLabel}
        </span>
      </div>

      {!hasEnoughData ? (
        <EmptyHistory loading={loading} unavailable={unavailable} warnings={warnings} />
      ) : (
        <>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data} margin={{ top: 4, right: 6, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="portfolioHistoryFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#e11d48" stopOpacity={0.42} />
                  <stop offset="55%" stopColor="#e11d48" stopOpacity={0.07} />
                  <stop offset="100%" stopColor="#e11d48" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="2 5" stroke="rgba(255,255,255,0.035)" vertical={false} />
              <XAxis
                dataKey="timestamp"
                tick={{ fill: '#3f4f68', fontSize: 10, fontWeight: 600 }}
                tickFormatter={formatTick}
                axisLine={false}
                tickLine={false}
                minTickGap={24}
              />
              <YAxis
                domain={[minValue - padding, maxValue + padding]}
                tick={{ fill: '#3f4f68', fontSize: 10 }}
                tickFormatter={(value) => `$${Math.round(Number(value) / 1000)}k`}
                axisLine={false}
                tickLine={false}
                width={40}
              />
              <Tooltip
                content={<HistoryTooltip />}
                cursor={{ stroke: 'rgba(225,29,72,0.20)', strokeWidth: 1, strokeDasharray: '3 3' }}
              />
              <Area
                type="monotone"
                dataKey="totalPortfolioValue"
                stroke="#e11d48"
                strokeWidth={2.5}
                fill="url(#portfolioHistoryFill)"
                dot={false}
                activeDot={{ r: 5, fill: '#e11d48', stroke: '#0a1628', strokeWidth: 3 }}
              />
            </AreaChart>
          </ResponsiveContainer>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-label font-semibold">
            <span className="text-slate-600">{history.count || data.length} snapshot{(history.count || data.length) === 1 ? '' : 's'}</span>
            {warnings.length > 0 && <span className="text-amber-300">{warnings[0]}</span>}
          </div>
        </>
      )}
    </motion.div>
  )
}

export default memo(PerformanceChart)
