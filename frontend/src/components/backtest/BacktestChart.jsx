import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { motion } from 'framer-motion'
import { AlertTriangle, TrendingUp } from 'lucide-react'
import { getValidNumber, formatCurrency } from '../../utils/formatters'

const isFiniteNumber = (value) => getValidNumber(value) !== null

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#0a1628] border border-rose-500/22 rounded-xl px-4 py-3 text-body-sm shadow-[0_8px_32px_rgba(0,0,0,0.55)]">
      <p className="text-slate-500 mb-1.5 font-medium">{label}</p>
      <p className="text-white font-black tabular-nums">{formatCurrency(payload[0].value)}</p>
    </div>
  )
}

export default function BacktestChart({ data, initialCapital, fallback }) {
  const cleanData = Array.isArray(data)
    ? data.filter((point) => isFiniteNumber(point?.value)).map((point, index) => ({
      ...point,
      day: point.day || `D${index + 1}`,
      value: Number(point.value),
    }))
    : []

  if (fallback || cleanData.length === 0) {
    return (
      <motion.div
        whileHover={{ borderColor: 'rgba(225,29,72,0.14)' }}
        className="bg-[#0a1628]/88 border border-white/[0.07] rounded-2xl p-5 backdrop-blur-2xl shadow-[0_4px_28px_rgba(0,0,0,0.32)] transition-all duration-300"
      >
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle size={14} className="text-amber-400" />
          <h2 className="text-body font-bold text-white">Equity Curve Unavailable</h2>
        </div>
        <p className="text-body-sm text-slate-500 font-medium">
          A chart is shown only when the backend returns a real equity curve from historical data.
        </p>
      </motion.div>
    )
  }

  const min = Math.min(...cleanData.map((d) => d.value), Number(initialCapital) || cleanData[0].value) * 0.97
  const max = Math.max(...cleanData.map((d) => d.value), Number(initialCapital) || cleanData[0].value) * 1.03

  return (
    <motion.div
      whileHover={{ borderColor: 'rgba(225,29,72,0.14)' }}
      className="bg-[#0a1628]/88 border border-white/[0.07] rounded-2xl p-5 backdrop-blur-2xl shadow-[0_4px_28px_rgba(0,0,0,0.32)] transition-all duration-300"
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <TrendingUp size={13} className="text-rose-400" />
            <h2 className="text-body font-bold text-white">Equity Curve</h2>
          </div>
          <p className="text-label text-slate-600 font-medium">Backend historical equity curve</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={cleanData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e11d48" stopOpacity={0.42} />
              <stop offset="55%" stopColor="#e11d48" stopOpacity={0.07} />
              <stop offset="100%" stopColor="#e11d48" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="2 5" stroke="rgba(255,255,255,0.035)" vertical={false} />
          <XAxis dataKey="day" tick={{ fill: '#3f4f68', fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false} interval={Math.max(1, Math.floor(cleanData.length / 8))} />
          <YAxis
            domain={[min, max]}
            tick={{ fill: '#3f4f68', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
            width={38}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(225,29,72,0.20)', strokeWidth: 1, strokeDasharray: '3 3' }} />
          <ReferenceLine y={Number(initialCapital) || cleanData[0].value} stroke="rgba(225,29,72,0.08)" strokeDasharray="4 4" strokeWidth={1} />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#e11d48"
            strokeWidth={2.5}
            fill="url(#eqGrad)"
            dot={false}
            activeDot={{ r: 5, fill: '#e11d48', stroke: '#0a1628', strokeWidth: 3, filter: 'drop-shadow(0 0 6px rgba(225,29,72,0.90))' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  )
}
