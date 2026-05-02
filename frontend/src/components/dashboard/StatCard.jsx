import { motion } from 'framer-motion'

const accents = {
  indigo:  { icon: 'text-indigo-400',  bg: 'bg-indigo-500/10',  border: 'border-indigo-500/20'  },
  emerald: { icon: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  violet:  { icon: 'text-violet-400',  bg: 'bg-violet-500/10',  border: 'border-violet-500/20'  },
  amber:   { icon: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/20'   },
}

function StatCard({ icon: Icon, label, value, sub, subUp, accentColor = 'indigo' }) {
  const c = accents[accentColor] || accents.indigo

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-900/50 border border-gray-800/60 rounded-xl p-5 backdrop-blur-sm hover:border-gray-700/60 transition-colors"
    >
      <div className={`w-9 h-9 rounded-lg ${c.bg} border ${c.border} flex items-center justify-center mb-4`}>
        <Icon size={16} className={c.icon} />
      </div>
      <p className="text-[11px] text-gray-500 mb-1 uppercase tracking-wide">{label}</p>
      <p className="text-xl font-bold text-white leading-tight">{value}</p>
      {sub && (
        <p className={`text-xs mt-1.5 ${subUp ? 'text-emerald-400' : 'text-red-400'}`}>{sub}</p>
      )}
    </motion.div>
  )
}

export default StatCard
