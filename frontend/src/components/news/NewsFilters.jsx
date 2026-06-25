import { motion } from 'framer-motion'

const filters = [
  { key: 'all',     label: 'All'     },
  { key: 'bullish', label: 'Bullish' },
  { key: 'bearish', label: 'Bearish' },
  { key: 'neutral', label: 'Neutral' },
]

const countColors = {
  all:     'bg-white/[0.08] text-slate-400',
  bullish: 'bg-emerald-500/18 text-emerald-400',
  bearish: 'bg-rose-500/18 text-rose-400',
  neutral: 'bg-white/[0.06] text-slate-500',
}

export default function NewsFilters({ active, onChange, counts }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {filters.map((f) => {
        const isActive = active === f.key
        return (
          <motion.button
            key={f.key}
            onClick={() => onChange(f.key)}
            whileHover={{ y: isActive ? 0 : -1 }}
            whileTap={{ scale: 0.97 }}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-body-sm font-black transition-all duration-200 ${
              isActive
                ? 'bg-gradient-to-r from-rose-600 to-red-700 text-white shadow-[0_0_16px_rgba(225,29,72,0.30)]'
                : 'bg-white/[0.03] border border-white/[0.07] text-slate-500 hover:text-white hover:border-rose-500/22'
            }`}
          >
            {f.label}
            {counts[f.key] !== undefined && (
              <span className={`text-caption px-1.5 py-0.5 rounded-md font-black ${isActive ? 'bg-white/20 text-white' : countColors[f.key]}`}>
                {counts[f.key]}
              </span>
            )}
          </motion.button>
        )
      })}
    </div>
  )
}
