import { motion } from 'framer-motion'
import { ExternalLink, Clock, AlertTriangle } from 'lucide-react'

const sentimentConfig = {
  bullish: { label: 'Bullish', text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/22' },
  bearish: { label: 'Bearish', text: 'text-rose-400',    bg: 'bg-rose-500/10',    border: 'border-rose-500/22'    },
  neutral: { label: 'Neutral', text: 'text-slate-400',   bg: 'bg-white/[0.04]',   border: 'border-white/[0.07]'   },
}

export default function NewsCard({ article, index }) {
  const s = sentimentConfig[article.sentiment] || sentimentConfig.neutral
  const date = article.publishedAt ? new Date(article.publishedAt) : null
  const publishedAt = date && !Number.isNaN(date.getTime())
    ? new Intl.DateTimeFormat('en-US', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(date)
    : '--'

  const content = (
    <>
      {article.image && (
        <div className="mb-4 h-32 rounded-xl overflow-hidden border border-white/[0.06] bg-white/[0.03]">
          <img src={article.image} alt="" className="w-full h-full object-cover" loading="lazy" />
        </div>
      )}

      <div className="flex items-start justify-between gap-3 mb-2.5">
        <h3 className="text-body font-bold text-white leading-snug group-hover:text-rose-300 transition-colors line-clamp-2">
          {article.title || 'Untitled market news'}
        </h3>
        {article.url ? (
          <ExternalLink size={12} className="text-slate-700 group-hover:text-rose-400 transition-colors shrink-0 mt-0.5" />
        ) : (
          <AlertTriangle size={12} className="text-amber-400/80 shrink-0 mt-0.5" />
        )}
      </div>

      <p className="text-body-sm text-slate-500 leading-relaxed mb-4 line-clamp-2 font-medium">
        {article.description || 'No description provided by the news provider.'}
      </p>

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-caption text-slate-600 bg-white/[0.03] border border-white/[0.06] px-2 py-0.5 rounded-lg font-bold">
            {article.source || 'Unknown source'}
          </span>
          <span className={`text-caption font-black px-2 py-0.5 rounded-lg border ${s.text} ${s.bg} ${s.border}`}>
            {s.label}
          </span>
          {article.fallback && (
            <span className="text-caption text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-lg font-black">
              Fallback
            </span>
          )}
        </div>
        <span className="flex items-center gap-1 text-caption text-slate-700 font-medium">
          <Clock size={9} />
          {publishedAt}
        </span>
      </div>
    </>
  )

  const className = 'group bg-[#0a1628]/88 border border-white/[0.07] rounded-2xl p-5 backdrop-blur-2xl shadow-[0_4px_28px_rgba(0,0,0,0.28)] transition-all duration-300'

  return article.url ? (
    <motion.a
      href={article.url}
      target="_blank"
      rel="noreferrer"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -2, borderColor: 'rgba(225,29,72,0.15)' }}
      className={`${className} cursor-pointer block`}
    >
      {content}
    </motion.a>
  ) : (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {content}
    </motion.div>
  )
}
