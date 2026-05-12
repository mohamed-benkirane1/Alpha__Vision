import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { motion } from 'framer-motion'
import { TrendingUp } from 'lucide-react'

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#0a1628] border border-indigo-500/28 rounded-xl px-4 py-3 text-xs shadow-[0_8px_32px_rgba(0,0,0,0.55)]">
      <p className="text-slate-500 mb-1.5 font-medium">{label}</p>
      <p className="text-white font-black tabular-nums">${payload[0].value.toLocaleString()}</p>
    </div>
  )
}

export default function BacktestChart({ data, initialCapital }) {
  const min = Math.min(...data.map((d) => d.value), initialCapital) * 0.97
  const max = Math.max(...data.map((d) => d.value)) * 1.03

  return (
    <motion.div
      whileHover={{ borderColor: 'rgba(99,102,241,0.18)' }}
      className="bg-[#0a1628]/88 border border-white/[0.07] rounded-2xl p-5 backdrop-blur-2xl shadow-[0_4px_28px_rgba(0,0,0,0.32)] transition-all duration-300"
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <TrendingUp size={13} className="text-indigo-400" />
            <h2 className="text-sm font-bold text-white">Equity Curve</h2>
          </div>
          <p className="text-[11px] text-slate-600 font-medium">Portfolio value over backtest period</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#6366f1" stopOpacity={0.48} />
              <stop offset="55%"  stopColor="#6366f1" stopOpacity={0.08} />
              <stop offset="100%" stopColor="#6366f1" stopOpacity={0}    />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="2 5" stroke="rgba(255,255,255,0.035)" vertical={false} />
          <XAxis dataKey="day" tick={{ fill: '#3f4f68', fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false} interval={3} />
          <YAxis
            domain={[min, max]}
            tick={{ fill: '#3f4f68', fontSize: 10 }}
            axisLine={false} tickLine={false}
            tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
            width={38}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ stroke: 'rgba(99,102,241,0.18)', strokeWidth: 1, strokeDasharray: '3 3' }}
          />
          <ReferenceLine
            y={initialCapital}
            stroke="rgba(99,102,241,0.12)"
            strokeDasharray="4 4"
            strokeWidth={1}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#6366f1"
            strokeWidth={2.5}
            fill="url(#eqGrad)"
            dot={false}
            activeDot={{
              r: 5,
              fill: '#6366f1',
              stroke: '#0a1628',
              strokeWidth: 3,
              filter: 'drop-shadow(0 0 6px rgba(99,102,241,0.9))',
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  )
}
