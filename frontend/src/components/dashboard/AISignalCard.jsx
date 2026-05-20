import { motion } from 'framer-motion'
import { Zap, Clock, Activity } from 'lucide-react'

export default function AISignalCard() {
  return (
    <motion.div
      whileHover={{ borderColor: 'rgba(225,29,72,0.18)' }}
      className="relative bg-[#0a1628]/88 border border-white/[0.07] rounded-2xl p-5 backdrop-blur-2xl flex flex-col h-full shadow-[0_4px_28px_rgba(0,0,0,0.32)] transition-colors duration-300"
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
            <Zap size={13} className="text-rose-400" />
          </div>
          <h2 className="text-sm font-bold text-white">AI Signal</h2>
        </div>
        <span className="text-[9px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full font-black tracking-widest">
          Coming soon
        </span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
        <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-4">
          <Clock size={18} className="text-slate-600" />
        </div>
        <p className="text-base font-black text-white">No live AI signal yet</p>
        <p className="text-xs text-slate-600 mt-2 max-w-xs">
          This widget needs a dedicated backend signal endpoint. Demo predictions are not displayed as live signals.
        </p>
      </div>

      <div className="bg-white/[0.025] border border-white/[0.06] rounded-xl p-3.5 mt-4">
        <div className="flex items-center gap-1.5 mb-2">
          <Activity size={11} className="text-rose-400" />
          <span className="text-[10px] font-black text-rose-400 uppercase tracking-wider">Status</span>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          Indicative AI content has been removed until real backend analysis is available.
        </p>
      </div>
    </motion.div>
  )
}
