import { useState } from 'react'
import { motion } from 'framer-motion'
import { Newspaper, TrendingUp, TrendingDown, Minus } from 'lucide-react'

import NewsCard    from '../components/news/NewsCard'
import NewsFilters from '../components/news/NewsFilters'

const articles = [
  { id: 1, title: 'Bitcoin breaks above $67K as institutional demand surges to record highs',     description: 'Major asset managers report increased Bitcoin allocations as spot ETF inflows hit $1.2B this week, pushing BTC to its highest level in six months.',    source: 'CoinDesk',       sentiment: 'bullish', publishedAt: '2 hours ago' },
  { id: 2, title: 'Federal Reserve signals potential rate cuts in Q3 — markets rally on the news', description: 'Fed Chair remarks suggest easing conditions ahead, with equity markets surging 1.8% and crypto markets following with double-digit gains.',             source: 'Reuters',        sentiment: 'bullish', publishedAt: '4 hours ago' },
  { id: 3, title: 'Ethereum ETF inflows hit record $450M in a single week across all issuers',    description: 'Institutional appetite for Ethereum exposure continues to grow as ETF products attract nearly half a billion dollars in a single trading week.',        source: 'Bloomberg',      sentiment: 'bullish', publishedAt: '6 hours ago' },
  { id: 4, title: 'DeFi total value locked surpasses $100B for the first time in 2025',           description: 'Decentralized finance protocols have collectively crossed the $100B TVL milestone, driven by liquid staking and restaking protocols.',               source: 'DeFi Pulse',     sentiment: 'bullish', publishedAt: '8 hours ago' },
  { id: 5, title: 'Solana network congestion raises scalability concerns ahead of major launch',   description: 'Transaction failure rates spiked to 12% during peak hours as multiple high-traffic applications launched simultaneously on the Solana network.',      source: 'The Block',      sentiment: 'bearish', publishedAt: '10 hours ago' },
  { id: 6, title: 'Tech stocks decline as inflation data disappoints analysts across Wall Street', description: 'CPI figures came in higher than expected at 3.4%, triggering a broad sell-off in growth stocks and pushing NASDAQ down 1.2% intraday.',               source: 'CNBC',           sentiment: 'bearish', publishedAt: '12 hours ago' },
  { id: 7, title: 'Gold holds steady near $2,345 amid ongoing geopolitical uncertainty',          description: 'The precious metal is trading sideways as investors weigh safe-haven demand against a stronger dollar. Analysts see a tight range ahead.',              source: 'MarketWatch',    sentiment: 'neutral', publishedAt: '14 hours ago' },
  { id: 8, title: 'NASDAQ recovers earlier losses after mixed Q1 earnings season concludes',      description: 'The tech-heavy index ended the week flat as strong cloud earnings offset weakness in semiconductor stocks. Analysts remain cautiously optimistic.',     source: 'Financial Times', sentiment: 'neutral', publishedAt: '1 day ago' },
]

const sentimentOverview = [
  {
    key: 'bullish', label: 'Bullish', icon: TrendingUp,   count: 4, pct: 50,
    accent: { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/22', bar: 'bg-emerald-500' },
  },
  {
    key: 'bearish', label: 'Bearish', icon: TrendingDown, count: 2, pct: 25,
    accent: { text: 'text-rose-400',   bg: 'bg-rose-500/10',    border: 'border-rose-500/22',    bar: 'bg-rose-500'    },
  },
  {
    key: 'neutral', label: 'Neutral', icon: Minus,        count: 2, pct: 25,
    accent: { text: 'text-slate-400',  bg: 'bg-white/[0.04]',   border: 'border-white/[0.08]',   bar: 'bg-slate-600'   },
  },
]

const fadeUp  = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0.16, 1, 0.3, 1] } } }
const stagger = { visible: { transition: { staggerChildren: 0.07 } } }

export default function News() {
  const [activeFilter, setActiveFilter] = useState('all')

  const filtered = activeFilter === 'all' ? articles : articles.filter((a) => a.sentiment === activeFilter)
  const counts = {
    all:     articles.length,
    bullish: articles.filter((a) => a.sentiment === 'bullish').length,
    bearish: articles.filter((a) => a.sentiment === 'bearish').length,
    neutral: articles.filter((a) => a.sentiment === 'neutral').length,
  }

  return (
    <div className="space-y-5">

      <motion.div initial="hidden" animate="visible" variants={fadeUp}>
        <div className="flex items-center gap-2.5 mb-1">
          <Newspaper size={16} className="text-indigo-400" />
          <h1 className="text-2xl font-black text-white">Market News</h1>
        </div>
        <p className="text-xs text-slate-500 font-medium">Stay updated with financial market sentiment</p>
      </motion.div>

      {/* Sentiment overview */}
      <motion.div initial="hidden" animate="visible" variants={stagger}
        className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {sentimentOverview.map((s) => (
          <motion.div
            key={s.key}
            variants={fadeUp}
            whileHover={{ borderColor: 'rgba(99,102,241,0.18)' }}
            className={`bg-[#0a1628]/88 border ${s.accent.border} rounded-2xl p-4 backdrop-blur-2xl shadow-[0_4px_28px_rgba(0,0,0,0.28)] transition-all duration-300`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-xl ${s.accent.bg} border ${s.accent.border} flex items-center justify-center`}>
                  <s.icon size={12} className={s.accent.text} />
                </div>
                <span className={`text-xs font-black ${s.accent.text}`}>{s.label}</span>
              </div>
              <span className="text-xl font-black text-white">{s.count}</span>
            </div>
            <div className="h-1.5 bg-slate-800/80 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${s.pct}%` }}
                transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                className={`h-full rounded-full ${s.accent.bar}`}
              />
            </div>
            <p className="text-[10px] text-slate-600 mt-1.5 font-medium">{s.pct}% of today's news</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Filters */}
      <motion.div initial="hidden" animate="visible" variants={fadeUp}
        className="flex items-center justify-between gap-4 flex-wrap">
        <NewsFilters active={activeFilter} onChange={setActiveFilter} counts={counts} />
        <span className="text-[11px] text-slate-600 font-bold">
          {filtered.length} article{filtered.length !== 1 ? 's' : ''}
        </span>
      </motion.div>

      {/* Articles */}
      {filtered.length > 0 ? (
        <motion.div key={activeFilter} initial="hidden" animate="visible" variants={stagger}
          className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
          {filtered.map((article, i) => (
            <motion.div key={article.id} variants={fadeUp}>
              <NewsCard article={article} index={i} />
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="py-16 text-center">
          <p className="text-slate-600 text-sm font-medium">No articles found for this filter.</p>
        </motion.div>
      )}
    </div>
  )
}
