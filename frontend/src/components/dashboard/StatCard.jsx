import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'

const accents = {
  rose: {
    icon:     'text-rose-400',
    gradient: 'from-rose-500/18 to-red-500/5',
    border:   'border-rose-500/20',
    glow:     'hover:shadow-[0_0_40px_rgba(225,29,72,0.14)] hover:border-rose-500/35',
    orb:      'bg-rose-500/8',
    ring:     'border-rose-400/20',
    sub:      'text-rose-400/70',
  },
  indigo: {
    icon:     'text-indigo-400',
    gradient: 'from-indigo-500/18 to-violet-500/5',
    border:   'border-indigo-500/20',
    glow:     'hover:shadow-[0_0_40px_rgba(99,102,241,0.12)] hover:border-indigo-500/35',
    orb:      'bg-indigo-500/8',
    ring:     'border-indigo-400/20',
    sub:      'text-indigo-400/70',
  },
  emerald: {
    icon:     'text-emerald-400',
    gradient: 'from-emerald-500/18 to-teal-500/5',
    border:   'border-emerald-500/20',
    glow:     'hover:shadow-[0_0_40px_rgba(16,185,129,0.10)] hover:border-emerald-500/35',
    orb:      'bg-emerald-500/8',
    ring:     'border-emerald-400/20',
    sub:      'text-emerald-400',
  },
  cyan: {
    icon:     'text-cyan-400',
    gradient: 'from-cyan-500/18 to-blue-500/5',
    border:   'border-cyan-500/20',
    glow:     'hover:shadow-[0_0_40px_rgba(6,182,212,0.10)] hover:border-cyan-500/35',
    orb:      'bg-cyan-500/8',
    ring:     'border-cyan-400/20',
    sub:      'text-cyan-400/70',
  },
  amber: {
    icon:     'text-amber-400',
    gradient: 'from-amber-500/18 to-orange-500/5',
    border:   'border-amber-500/20',
    glow:     'hover:shadow-[0_0_40px_rgba(245,158,11,0.10)] hover:border-amber-500/35',
    orb:      'bg-amber-500/8',
    ring:     'border-amber-400/20',
    sub:      'text-amber-400/70',
  },
}

export default function StatCard({ icon: Icon, label, value, sub, subUp, accentColor = 'rose' }) {
  const c = accents[accentColor] ?? accents.rose
  const shouldReduce = useReducedMotion()

  return (
    <motion.div
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className={`relative bg-[#0d0212]/90 border ${c.border} rounded-2xl p-5 backdrop-blur-2xl ${c.glow} transition-all duration-300 overflow-hidden shadow-[0_4px_28px_rgba(0,0,0,0.32)]`}
    >
      {/* Background orb */}
      <div className={`absolute -top-8 -right-8 w-36 h-36 ${c.orb} rounded-full blur-2xl pointer-events-none`} />

      {/* Icon block */}
      <div className="relative mb-4 w-fit">
        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${c.gradient} border ${c.border} flex items-center justify-center`}>
          <Icon size={19} className={c.icon} />
        </div>
        <div className={`absolute -inset-0.5 rounded-xl border ${c.ring} opacity-50 blur-[2px] pointer-events-none`} />
      </div>

      <p className="text-[10px] text-slate-600 mb-1.5 uppercase tracking-[0.13em] font-black">{label}</p>
      <p className="text-[1.6rem] font-black text-white leading-none tracking-tight tabular-nums overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.span
            key={String(value)}
            initial={{ opacity: 0, y: shouldReduce ? 0 : 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: shouldReduce ? 0 : -6 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="inline-block"
          >
            {value}
          </motion.span>
        </AnimatePresence>
      </p>

      {sub && (
        <p className={`text-xs mt-2 font-semibold flex items-center gap-1 ${subUp ? 'text-emerald-400' : 'text-red-400'}`}>
          <span className="text-[10px]">{subUp ? '↑' : '↓'}</span>
          {sub}
        </p>
      )}

      <div className="absolute bottom-0 left-5 right-5 h-px bg-gradient-to-r from-transparent via-white/[0.05] to-transparent" />
    </motion.div>
  )
}
