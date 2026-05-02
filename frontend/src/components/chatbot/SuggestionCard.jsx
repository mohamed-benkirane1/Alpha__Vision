import { Sparkles } from 'lucide-react'

function SuggestionCard({ suggestions, onSelect }) {
  return (
    <div className="px-4 py-2 border-t border-gray-800/40">
      <div className="flex items-center gap-1.5 mb-2">
        <Sparkles size={11} className="text-indigo-400" />
        <span className="text-[11px] text-gray-500 font-medium">Quick suggestions</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((s) => (
          <button
            key={s.label}
            onClick={() => onSelect(s.text)}
            className="text-xs text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 hover:text-indigo-200 px-3 py-1.5 rounded-lg transition-all duration-150"
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export default SuggestionCard
