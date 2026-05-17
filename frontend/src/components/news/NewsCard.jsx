import { motion } from 'framer-motion'
import { ExternalLink, Clock } from 'lucide-react'

const sentimentConfig = {
  bullish: { label: 'Bullish', text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/22' },
  bearish: { label: 'Bearish', text: 'text-rose-400',    bg: 'bg-rose-500/10',    border: 'border-rose-500/22'    },
  neutral: { label: 'Neutral', text: 'text-slate-400',   bg: 'bg-white/[0.04]',   border: 'border-white/[0.07]'   },
}

export default function NewsCard({ article, index }) {
  const s = sentimentConfig[article.sentiment] || sentimentConfig.neutral

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -2, borderColor: 'rgba(225,29,72,0.15)' }}
      className="group bg-[#0a1628]/88 border border-white/[0.07] rounded-2xl p-5 backdrop-blur-2xl shadow-[0_4px_28px_rgba(0,0,0,0.28)] transition-all duration-300 cursor-pointer"
    >
      <div className="flex items-start justify-between gap-3 mb-2.5">
        <h3 className="text-sm font-bold text-white leading-snug group-hover:text-rose-300 transition-colors line-clamp-2">
          {article.title}
        </h3>
        <ExternalLink size={12} className="text-slate-700 group-hover:text-rose-400 transition-colors shrink-0 mt-0.5" />
      </div>

      <p className="text-xs text-slate-500 leading-relaxed mb-4 line-clamp-2 font-medium">
        {article.description}
      </p>

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-slate-600 bg-white/[0.03] border border-white/[0.06] px-2 py-0.5 rounded-lg font-bold">
            {article.source}
          </span>
          <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border ${s.text} ${s.bg} ${s.border}`}>
            {s.label}
          </span>
        </div>
        <span className="flex items-center gap-1 text-[10px] text-slate-700 font-medium">
          <Clock size={9} />
          {article.publishedAt}
        </span>
      </div>
    </motion.div>
  )
}
