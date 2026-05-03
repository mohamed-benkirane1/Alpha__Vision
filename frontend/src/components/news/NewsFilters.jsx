const filters = [
  { key: 'all',     label: 'All'     },
  { key: 'bullish', label: 'Bullish' },
  { key: 'bearish', label: 'Bearish' },
  { key: 'neutral', label: 'Neutral' },
]

const countColors = {
  all:     'bg-slate-700/60 text-slate-400',
  bullish: 'bg-emerald-500/15 text-emerald-400',
  bearish: 'bg-red-500/15 text-red-400',
  neutral: 'bg-slate-600/30 text-slate-400',
}

function NewsFilters({ active, onChange, counts }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {filters.map((f) => {
        const isActive = active === f.key
        return (
          <button
            key={f.key}
            onClick={() => onChange(f.key)}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
              isActive
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-[0_0_14px_rgba(99,102,241,0.3)]'
                : 'bg-slate-900/60 border border-slate-700/50 text-slate-400 hover:text-white hover:border-indigo-500/25'
            }`}
          >
            {f.label}
            {counts[f.key] !== undefined && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${isActive ? 'bg-white/15 text-white' : countColors[f.key]}`}>
                {counts[f.key]}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

export default NewsFilters
