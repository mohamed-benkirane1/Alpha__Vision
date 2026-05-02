import { motion } from 'framer-motion'
import { ExternalLink, Clock } from 'lucide-react'

const sentimentConfig = {
  bullish: { label: 'Bullish', text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  bearish: { label: 'Bearish', text: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/20'     },
  neutral: { label: 'Neutral', text: 'text-gray-400',    bg: 'bg-gray-500/10',    border: 'border-gray-600/30'    },
}

function NewsCard({ article, index }) {
  const s = sentimentConfig[article.sentiment] || sentimentConfig.neutral

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.35 }}
      className="group bg-gray-900/50 border border-gray-800/60 rounded-xl p-5 backdrop-blur-sm hover:border-gray-700/60 transition-all duration-200"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="text-sm font-semibold text-white leading-snug group-hover:text-indigo-300 transition-colors line-clamp-2">
          {article.title}
        </h3>
        <ExternalLink size={13} className="text-gray-600 group-hover:text-gray-400 transition-colors shrink-0 mt-0.5" />
      </div>

      <p className="text-xs text-gray-500 leading-relaxed mb-4 line-clamp-2">
        {article.description}
      </p>

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {/* Source */}
          <span className="text-[11px] text-gray-500 bg-gray-800/60 px-2 py-0.5 rounded">
            {article.source}
          </span>
          {/* Sentiment */}
          <span className={`text-[11px] font-medium px-2 py-0.5 rounded border ${s.text} ${s.bg} ${s.border}`}>
            {s.label}
          </span>
        </div>
        {/* Time */}
        <span className="flex items-center gap-1 text-[11px] text-gray-600">
          <Clock size={10} />
          {article.publishedAt}
        </span>
      </div>
    </motion.div>
  )
}

export default NewsCard
