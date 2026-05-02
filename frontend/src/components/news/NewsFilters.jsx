const filters = [
  { key: 'all',     label: 'All'     },
  { key: 'bullish', label: 'Bullish' },
  { key: 'bearish', label: 'Bearish' },
  { key: 'neutral', label: 'Neutral' },
]

const countColors = {
  all:     'bg-gray-700/60 text-gray-400',
  bullish: 'bg-emerald-500/15 text-emerald-400',
  bearish: 'bg-red-500/15 text-red-400',
  neutral: 'bg-gray-600/30 text-gray-400',
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
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
              isActive
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
                : 'bg-gray-900/60 border border-gray-800/60 text-gray-400 hover:text-white hover:border-gray-700/60'
            }`}
          >
            {f.label}
            {counts[f.key] !== undefined && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${isActive ? 'bg-white/15 text-white' : countColors[f.key]}`}>
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
