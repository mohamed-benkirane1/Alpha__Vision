import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const data = [
  { date: 'Apr 25', value: 21200 },
  { date: 'Apr 26', value: 20800 },
  { date: 'Apr 27', value: 22100 },
  { date: 'Apr 28', value: 21750 },
  { date: 'Apr 29', value: 23400 },
  { date: 'Apr 30', value: 22900 },
  { date: 'May 01', value: 24856 },
]

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#0A1628] border border-indigo-500/30 rounded-xl px-4 py-3 text-xs shadow-xl shadow-indigo-500/10">
      <p className="text-slate-400 mb-1">{label}</p>
      <p className="text-white font-bold text-sm">${payload[0].value.toLocaleString()}</p>
    </div>
  )
}

function PerformanceChart() {
  return (
    <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-5 backdrop-blur-xl hover:border-indigo-500/20 transition-all duration-300">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-sm font-semibold text-white">Portfolio Performance</h2>
          <p className="text-[11px] text-slate-500 mt-0.5">7-day value history</p>
        </div>
        <span className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full font-semibold">
          +17.2%
        </span>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="perfGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.4}  />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} width={40} />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#6366f1"
            strokeWidth={2.5}
            fill="url(#perfGradient)"
            dot={false}
            activeDot={{ r: 5, fill: '#6366f1', stroke: '#0A1628', strokeWidth: 3 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export default PerformanceChart
