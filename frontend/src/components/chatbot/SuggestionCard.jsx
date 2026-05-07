import { Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'

export default function SuggestionCard({ suggestions, onSelect }) {
  return (
    <div className="px-4 py-3 border-t border-white/[0.06]">
      <div className="flex items-center gap-1.5 mb-2.5">
        <Sparkles size={11} className="text-indigo-400" />
        <span className="text-[10px] text-slate-600 font-black tracking-wider uppercase">Quick suggestions</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {suggestions.map((s) => (
          <motion.button
            key={s.label}
            onClick={() => onSelect(s.text)}
            whileHover={{ y: -1, backgroundColor: 'rgba(99,102,241,0.18)' }}
            whileTap={{ scale: 0.97 }}
            className="text-[11px] text-indigo-300 bg-indigo-500/8 border border-indigo-500/18 hover:border-indigo-500/35 px-3 py-1.5 rounded-lg transition-all duration-200 font-medium"
          >
            {s.label}
          </motion.button>
        ))}
      </div>
    </div>
  )
}
