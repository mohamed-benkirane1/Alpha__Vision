import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { motion } from 'framer-motion'
import { TrendingUp } from 'lucide-react'

const data = [
  { date: 'Apr 25', value: 21200 },
  { date: 'Apr 26', value: 20800 },
  { date: 'Apr 27', value: 22100 },
  { date: 'Apr 28', value: 21750 },
  { date: 'Apr 29', value: 23400 },
  { date: 'Apr 30', value: 22900 },
  { date: 'May 01', value: 24856 },
]

const PERIODS = ['1W', '1M', '3M', '1Y']

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#0a1628] border border-indigo-500/28 rounded-xl px-4 py-3 text-xs shadow-[0_8px_32px_rgba(0,0,0,0.55),0_0_0_1px_rgba(99,102,241,0.1)]">
      <p className="text-slate-500 mb-1.5 font-medium">{label}</p>
      <p className="text-white font-black text-sm tabular-nums">${payload[0].value.toLocaleString()}</p>
      <p className="text-emerald-400 text-[10px] mt-1 font-bold">↑ Portfolio value</p>
    </div>
  )
}

export default function PerformanceChart() {
  return (
    <motion.div
      whileHover={{ borderColor: 'rgba(99,102,241,0.18)' }}
      className="bg-[#0a1628]/88 border border-white/[0.07] rounded-2xl p-5 backdrop-blur-2xl shadow-[0_4px_28px_rgba(0,0,0,0.32)] transition-all duration-300"
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <TrendingUp size={14} className="text-indigo-400" />
            <h2 className="text-sm font-bold text-white">Portfolio Performance</h2>
          </div>
          <p className="text-[11px] text-slate-600">7-day value history</p>
        </div>

        <div className="flex items-center gap-1.5">
          {PERIODS.map((p, i) => (
            <button
              key={p}
              className={`text-[10px] font-bold px-2 py-0.5 rounded-lg transition-colors ${
                i === 0
                  ? 'bg-indigo-500/14 text-indigo-400 border border-indigo-500/25'
                  : 'text-slate-700 hover:text-slate-400'
              }`}
            >
              {p}
            </button>
          ))}
          <span className="ml-1 text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-black">
            +17.2%
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="perfGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#6366f1" stopOpacity={0.48} />
              <stop offset="55%"  stopColor="#6366f1" stopOpacity={0.08} />
              <stop offset="100%" stopColor="#6366f1" stopOpacity={0}    />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="2 5" stroke="rgba(255,255,255,0.035)" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fill: '#3f4f68', fontSize: 11, fontWeight: 600 }}
            axisLine={false} tickLine={false}
          />
          <YAxis
            tick={{ fill: '#3f4f68', fontSize: 11 }}
            axisLine={false} tickLine={false}
            tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
            width={36}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ stroke: 'rgba(99,102,241,0.18)', strokeWidth: 1, strokeDasharray: '3 3' }}
          />
          <ReferenceLine
            y={21200}
            stroke="rgba(99,102,241,0.10)"
            strokeDasharray="4 4"
            strokeWidth={1}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#6366f1"
            strokeWidth={2.5}
            fill="url(#perfGrad)"
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
