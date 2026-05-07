import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { motion } from 'framer-motion'
import { PieChart as PieIcon } from 'lucide-react'

const allocation = [
  { name: 'BTC',  value: 15509, pct: 61.7, color: '#6366f1', glow: 'rgba(99,102,241,0.6)'  },
  { name: 'ETH',  value: 7117,  pct: 28.3, color: '#8b5cf6', glow: 'rgba(139,92,246,0.6)' },
  { name: 'SOL',  value: 1427,  pct: 5.7,  color: '#10b981', glow: 'rgba(16,185,129,0.6)' },
  { name: 'XAU',  value: 704,   pct: 2.8,  color: '#f59e0b', glow: 'rgba(245,158,11,0.6)' },
  { name: 'AAPL', value: 379,   pct: 1.5,  color: '#3b82f6', glow: 'rgba(59,130,246,0.6)' },
]

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-[#0a1628] border border-indigo-500/28 rounded-xl px-3.5 py-3 text-xs shadow-[0_8px_32px_rgba(0,0,0,0.55)]">
      <p className="text-white font-black mb-1">{d.name}</p>
      <p className="text-slate-400 tabular-nums">${d.value.toLocaleString()}</p>
      <p className="text-indigo-400 font-black mt-0.5">{d.pct}%</p>
    </div>
  )
}

export default function PortfolioChart() {
  return (
    <motion.div
      whileHover={{ borderColor: 'rgba(99,102,241,0.14)' }}
      className="bg-[#0a1628]/88 border border-white/[0.07] rounded-2xl p-5 backdrop-blur-2xl shadow-[0_4px_28px_rgba(0,0,0,0.32)] transition-all duration-300"
    >
      <div className="flex items-center gap-2 mb-5">
        <PieIcon size={13} className="text-indigo-400" />
        <h2 className="text-sm font-bold text-white">Allocation</h2>
      </div>

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
              <Cell
                key={entry.name}
                fill={entry.color}
                opacity={0.88}
                style={{ filter: `drop-shadow(0 0 6px ${entry.glow})` }}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      <div className="mt-4 space-y-2.5">
        {allocation.map((a, i) => (
          <motion.div
            key={a.name}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 + i * 0.08 }}
            className="flex items-center justify-between text-xs"
          >
            <div className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: a.color, boxShadow: `0 0 5px ${a.glow}` }}
              />
              <span className="text-slate-400 font-medium">{a.name}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-20 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${a.pct}%`, backgroundColor: a.color }} />
              </div>
              <span className="text-slate-600 w-9 text-right font-black tabular-nums">{a.pct}%</span>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
