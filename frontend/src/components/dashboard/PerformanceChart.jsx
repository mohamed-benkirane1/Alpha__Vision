import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { motion, useInView, useReducedMotion } from 'framer-motion'
import { useRef } from 'react'
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
    <div className="bg-[#0a1628] border border-rose-500/22 rounded-xl px-4 py-3 text-xs shadow-[0_8px_32px_rgba(0,0,0,0.55),0_0_0_1px_rgba(225,29,72,0.08)]">
      <p className="text-slate-500 mb-1.5 font-medium">{label}</p>
      <p className="text-white font-black text-sm tabular-nums">${payload[0].value.toLocaleString()}</p>
      <p className="text-emerald-400 text-[10px] mt-1 font-bold">↑ Portfolio value</p>
    </div>
  )
}

function ChartSkeleton() {
  return (
    <div className="bg-[#0a1628]/88 border border-white/[0.07] rounded-2xl p-5 backdrop-blur-2xl shadow-[0_4px_28px_rgba(0,0,0,0.32)]">
      <div className="flex items-center justify-between mb-5">
        <div className="space-y-2">
          <div className="h-3.5 w-40 bg-white/[0.06] rounded-lg" />
          <div className="h-2.5 w-24 bg-white/[0.04] rounded-lg" />
        </div>
        <div className="h-6 w-32 bg-white/[0.04] rounded-lg" />
      </div>
      <div className="relative h-[200px] bg-white/[0.025] rounded-xl overflow-hidden">
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.055] to-transparent"
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'linear' }}
        />
        <div className="absolute bottom-4 left-4 right-4 space-y-2">
          <div className="h-1.5 w-full bg-white/[0.04] rounded-full" />
          <div className="h-1.5 w-4/5 bg-white/[0.03] rounded-full" />
        </div>
      </div>
    </div>
  )
}

export default function PerformanceChart({ loading = false }) {
  const ref         = useRef(null)
  const inView      = useInView(ref, { once: true, margin: '-40px' })
  const shouldReduce = useReducedMotion()

  if (loading) return <ChartSkeleton />

  return (
    <motion.div
      ref={ref}
      whileHover={{ borderColor: 'rgba(225,29,72,0.14)' }}
      initial={{ opacity: 0, y: shouldReduce ? 0 : 14 }}
      animate={{ opacity: inView ? 1 : 0, y: inView ? 0 : (shouldReduce ? 0 : 14) }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      className="bg-[#0a1628]/88 border border-white/[0.07] rounded-2xl p-5 backdrop-blur-2xl shadow-[0_4px_28px_rgba(0,0,0,0.32)] transition-colors duration-300"
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <TrendingUp size={14} className="text-rose-400" />
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
                  ? 'bg-rose-500/12 text-rose-400 border border-rose-500/22'
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
              <stop offset="0%"   stopColor="#e11d48" stopOpacity={0.42} />
              <stop offset="55%"  stopColor="#e11d48" stopOpacity={0.07} />
              <stop offset="100%" stopColor="#e11d48" stopOpacity={0}    />
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
            cursor={{ stroke: 'rgba(225,29,72,0.20)', strokeWidth: 1, strokeDasharray: '3 3' }}
          />
          <ReferenceLine
            y={21200}
            stroke="rgba(225,29,72,0.08)"
            strokeDasharray="4 4"
            strokeWidth={1}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#e11d48"
            strokeWidth={2.5}
            fill="url(#perfGrad)"
            dot={false}
            activeDot={{
              r: 5,
              fill: '#e11d48',
              stroke: '#0a1628',
              strokeWidth: 3,
              filter: 'drop-shadow(0 0 6px rgba(225,29,72,0.90))',
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  )
}
