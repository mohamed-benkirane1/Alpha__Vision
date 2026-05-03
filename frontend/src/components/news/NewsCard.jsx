import { motion } from 'framer-motion'
import { ExternalLink, Clock } from 'lucide-react'

const sentimentConfig = {
  bullish: { label: 'Bullish', text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/25' },
  bearish: { label: 'Bearish', text: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/25'     },
  neutral: { label: 'Neutral', text: 'text-slate-400',   bg: 'bg-slate-500/10',   border: 'border-slate-600/30'   },
}

function NewsCard({ article, index }) {
  const s = sentimentConfig[article.sentiment] || sentimentConfig.neutral

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.35 }}
      className="group bg-slate-900/60 border border-slate-700/50 rounded-xl p-5 backdrop-blur-xl hover:border-indigo-500/25 hover:shadow-[0_0_20px_rgba(99,102,241,0.06)] transition-all duration-300"
    >
      <div className="flex items-start justify-between gap-3 mb-2.5">
        <h3 className="text-sm font-semibold text-white leading-snug group-hover:text-indigo-300 transition-colors line-clamp-2">
          {article.title}
        </h3>
        <ExternalLink size={13} className="text-slate-600 group-hover:text-indigo-400 transition-colors shrink-0 mt-0.5" />
      </div>

      <p className="text-xs text-slate-500 leading-relaxed mb-4 line-clamp-2">
        {article.description}
      </p>

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-500 bg-slate-800/60 border border-slate-700/40 px-2 py-0.5 rounded-lg">
            {article.source}
          </span>
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-lg border ${s.text} ${s.bg} ${s.border}`}>
            {s.label}
          </span>
        </div>
        <span className="flex items-center gap-1 text-[11px] text-slate-600">
          <Clock size={10} />
          {article.publishedAt}
        </span>
      </div>
    </motion.div>
  )
}

export default NewsCard
