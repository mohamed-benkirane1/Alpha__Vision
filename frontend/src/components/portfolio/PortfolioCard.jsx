import { motion } from 'framer-motion'

const accents = {
  rose:    { icon: 'text-rose-400',    gradient: 'from-rose-500/18 to-red-500/5',       border: 'border-rose-500/20',    hover: 'rgba(225,29,72,0.14)',   orb: 'bg-rose-500/8'     },
  indigo:  { icon: 'text-indigo-400',  gradient: 'from-indigo-500/18 to-violet-500/6',  border: 'border-indigo-500/22',  hover: 'rgba(99,102,241,0.14)',  orb: 'bg-indigo-500/10'  },
  emerald: { icon: 'text-emerald-400', gradient: 'from-emerald-500/18 to-teal-500/6',  border: 'border-emerald-500/22', hover: 'rgba(16,185,129,0.12)',  orb: 'bg-emerald-500/10' },
  violet:  { icon: 'text-violet-400',  gradient: 'from-violet-500/18 to-purple-500/6', border: 'border-violet-500/22',  hover: 'rgba(139,92,246,0.14)',  orb: 'bg-violet-500/10'  },
  amber:   { icon: 'text-amber-400',   gradient: 'from-amber-500/18 to-orange-500/6',  border: 'border-amber-500/22',   hover: 'rgba(245,158,11,0.12)',  orb: 'bg-amber-500/10'   },
}

export default function PortfolioCard({ icon: Icon, label, value, sub, subUp, accentColor = 'indigo' }) {
  const c = accents[accentColor] || accents.indigo
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3, borderColor: c.hover }}
      className={`relative bg-[#0a1628]/88 border ${c.border} rounded-2xl p-5 backdrop-blur-2xl shadow-[0_4px_28px_rgba(0,0,0,0.32)] transition-all duration-300 overflow-hidden`}
    >
      <div className={`absolute -top-8 -right-8 w-36 h-36 ${c.orb} rounded-full blur-2xl pointer-events-none`} />
      <div className={`relative w-10 h-10 rounded-xl bg-gradient-to-br ${c.gradient} border ${c.border} flex items-center justify-center mb-4 shadow-[0_0_14px_rgba(0,0,0,0.2)]`}>
        <div className={`absolute -inset-0.5 rounded-xl border ${c.border} opacity-50 blur-[2px]`} />
        <Icon size={17} className={`relative ${c.icon}`} />
      </div>
      <p className="text-[10px] text-slate-600 mb-1.5 uppercase tracking-[0.12em] font-black">{label}</p>
      <p className="text-[1.55rem] font-black text-white leading-tight tracking-tight tabular-nums">{value}</p>
      {sub && (
        <p className={`text-[11px] mt-2 font-bold ${subUp ? 'text-emerald-400' : 'text-rose-400'}`}>{sub}</p>
      )}
    </motion.div>
  )
}
