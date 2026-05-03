import { motion } from 'framer-motion'

const accents = {
  indigo:  { icon: 'text-indigo-400',  gradient: 'from-indigo-600/20 to-violet-600/5',  border: 'border-indigo-500/25',  glow: 'hover:shadow-[0_0_28px_rgba(99,102,241,0.14)] hover:border-indigo-500/40',  orb: 'bg-indigo-500/10'  },
  emerald: { icon: 'text-emerald-400', gradient: 'from-emerald-600/20 to-teal-600/5',  border: 'border-emerald-500/25', glow: 'hover:shadow-[0_0_28px_rgba(16,185,129,0.12)] hover:border-emerald-500/40', orb: 'bg-emerald-500/10' },
  violet:  { icon: 'text-violet-400',  gradient: 'from-violet-600/20 to-purple-600/5', border: 'border-violet-500/25',  glow: 'hover:shadow-[0_0_28px_rgba(139,92,246,0.14)] hover:border-violet-500/40',  orb: 'bg-violet-500/10'  },
  amber:   { icon: 'text-amber-400',   gradient: 'from-amber-600/20 to-orange-600/5',  border: 'border-amber-500/25',   glow: 'hover:shadow-[0_0_28px_rgba(245,158,11,0.12)] hover:border-amber-500/40',   orb: 'bg-amber-500/10'   },
}

function StatCard({ icon: Icon, label, value, sub, subUp, accentColor = 'indigo' }) {
  const c = accents[accentColor] || accents.indigo
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative bg-slate-900/60 border ${c.border} rounded-xl p-5 backdrop-blur-xl ${c.glow} transition-all duration-300 overflow-hidden`}
    >
      <div className={`absolute -top-6 -right-6 w-28 h-28 ${c.orb} rounded-full blur-2xl pointer-events-none`} />
      <div className={`relative w-10 h-10 rounded-xl bg-gradient-to-br ${c.gradient} border ${c.border} flex items-center justify-center mb-4`}>
        <Icon size={18} className={c.icon} />
      </div>
      <p className="text-[11px] text-slate-400 mb-1.5 uppercase tracking-widest font-semibold">{label}</p>
      <p className="text-2xl font-bold text-white leading-tight tracking-tight">{value}</p>
      {sub && <p className={`text-xs mt-2 font-medium ${subUp ? 'text-emerald-400' : 'text-red-400'}`}>{sub}</p>}
    </motion.div>
  )
}

export default StatCard
