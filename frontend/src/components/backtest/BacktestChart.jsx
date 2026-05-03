import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#0A1628] border border-indigo-500/30 rounded-xl px-4 py-3 text-xs shadow-xl">
      <p className="text-slate-400 mb-1">{label}</p>
      <p className="text-white font-bold">${payload[0].value.toLocaleString()}</p>
    </div>
  )
}

function BacktestChart({ data, initialCapital }) {
  const min = Math.min(...data.map((d) => d.value), initialCapital) * 0.97
  const max = Math.max(...data.map((d) => d.value)) * 1.03

  return (
    <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-5 backdrop-blur-xl">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-sm font-semibold text-white">Equity Curve</h2>
          <p className="text-[11px] text-slate-500 mt-0.5">Portfolio value over backtest period</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.4}  />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} interval={3} />
          <YAxis domain={[min, max]} tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} width={40} />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={initialCapital} stroke="#334155" strokeDasharray="4 4" strokeWidth={1} />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#6366f1"
            strokeWidth={2.5}
            fill="url(#eqGrad)"
            dot={false}
            activeDot={{ r: 5, fill: '#6366f1', stroke: '#0A1628', strokeWidth: 3 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export default BacktestChart
