import { motion } from 'framer-motion'
import { TrendingUp, Clock } from 'lucide-react'

export default function PerformanceChart({ loading = false }) {
  return (
    <motion.div
      whileHover={{ borderColor: 'rgba(225,29,72,0.14)' }}
      className="bg-[#0a1628]/88 border border-white/[0.07] rounded-2xl p-5 backdrop-blur-2xl shadow-[0_4px_28px_rgba(0,0,0,0.32)] transition-colors duration-300 h-full"
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <TrendingUp size={14} className="text-rose-400" />
            <h2 className="text-sm font-bold text-white">Portfolio Performance</h2>
          </div>
          <p className="text-[11px] text-slate-600">Historical snapshots are not connected yet</p>
        </div>
        <span className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full font-black">
          Coming soon
        </span>
      </div>

      <div className="h-[200px] rounded-xl border border-dashed border-white/[0.08] bg-white/[0.02] flex flex-col items-center justify-center text-center px-5">
        <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-3">
          <Clock size={16} className="text-slate-600" />
        </div>
        <p className="text-sm text-slate-400 font-bold">{loading ? 'Syncing dashboard data...' : 'Performance chart coming soon'}</p>
        <p className="text-xs text-slate-700 mt-1 max-w-sm">
          This needs historical portfolio snapshots from the backend. No demo curve is shown as real data.
        </p>
      </div>
    </motion.div>
  )
}
