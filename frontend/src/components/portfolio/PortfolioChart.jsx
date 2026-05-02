import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { motion } from 'framer-motion'

const allocation = [
  { name: 'BTC',  value: 15509, pct: 61.7, color: '#6366f1' },
  { name: 'ETH',  value: 7117,  pct: 28.3, color: '#8b5cf6' },
  { name: 'SOL',  value: 1427,  pct: 5.7,  color: '#10b981' },
  { name: 'XAU',  value: 704,   pct: 2.8,  color: '#f59e0b' },
  { name: 'AAPL', value: 379,   pct: 1.5,  color: '#3b82f6' },
]

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-white font-semibold">{d.name}</p>
      <p className="text-gray-400">${d.value.toLocaleString()}</p>
      <p className="text-indigo-400">{d.pct}%</p>
    </div>
  )
}

function PortfolioChart() {
  return (
    <div className="bg-gray-900/50 border border-gray-800/60 rounded-xl p-5 backdrop-blur-sm">
      <h2 className="text-sm font-semibold text-white mb-5">Allocation</h2>

      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={allocation}
            cx="50%"
            cy="50%"
            innerRadius={58}
            outerRadius={88}
            paddingAngle={3}
            dataKey="value"
            strokeWidth={0}
          >
            {allocation.map((entry) => (
              <Cell key={entry.name} fill={entry.color} opacity={0.9} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="mt-4 space-y-2">
        {allocation.map((a) => (
          <motion.div
            key={a.name}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center justify-between text-xs"
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: a.color }} />
              <span className="text-gray-400">{a.name}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-16 h-1 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${a.pct}%`, backgroundColor: a.color }} />
              </div>
              <span className="text-gray-500 w-8 text-right">{a.pct}%</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export default PortfolioChart
