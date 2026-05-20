import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Newspaper, TrendingUp, TrendingDown, Minus, RefreshCw, AlertTriangle } from 'lucide-react'

import NewsCard from '../components/news/NewsCard'
import NewsFilters from '../components/news/NewsFilters'
import { getMarketNews } from '../services/newsService'

const fadeUp = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0.16, 1, 0.3, 1] } } }
const stagger = { visible: { transition: { staggerChildren: 0.07 } } }
const AUTO_REFRESH_MS = 120000

const sentimentConfig = {
  bullish: { label: 'Bullish', icon: TrendingUp, accent: { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/22', bar: 'bg-emerald-500' } },
  bearish: { label: 'Bearish', icon: TrendingDown, accent: { text: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/22', bar: 'bg-rose-500' } },
  neutral: { label: 'Neutral', icon: Minus, accent: { text: 'text-slate-400', bg: 'bg-white/[0.04]', border: 'border-white/[0.08]', bar: 'bg-slate-600' } },
}

const formatDateTime = (value) => {
  if (!value) return '--'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '--'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function buildSentimentOverview(articles) {
  const total = articles.length
  return ['bullish', 'bearish', 'neutral'].map((key) => {
    const count = articles.filter((article) => article.sentiment === key).length
    return {
      key,
      ...sentimentConfig[key],
      count,
      pct: total > 0 ? Math.round((count / total) * 100) : 0,
    }
  })
}

export default function News() {
  const [activeFilter, setActiveFilter] = useState('all')
  const [news, setNews] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const loadingRef = useRef(false)

  const loadNews = useCallback(async ({ refresh = false } = {}) => {
    if (loadingRef.current) return
    loadingRef.current = true
    if (refresh) setRefreshing(true)
    else setLoading(true)
    setError('')

    try {
      const response = await getMarketNews()
      setNews(response)
      if (!response.success && response.error) setError(response.error)
    } catch (err) {
      console.error('News load failed:', err)
      setError(err?.message || 'Unable to load market news.')
    } finally {
      loadingRef.current = false
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => loadNews(), 0)
    const interval = window.setInterval(() => loadNews({ refresh: true }), AUTO_REFRESH_MS)
    return () => {
      window.clearTimeout(timer)
      window.clearInterval(interval)
    }
  }, [loadNews])

  const articles = useMemo(() => (Array.isArray(news?.articles) ? news.articles : []), [news])
  const filtered = useMemo(() => (
    activeFilter === 'all' ? articles : articles.filter((article) => article.sentiment === activeFilter)
  ), [activeFilter, articles])

  const counts = useMemo(() => ({
    all: articles.length,
    bullish: articles.filter((article) => article.sentiment === 'bullish').length,
    bearish: articles.filter((article) => article.sentiment === 'bearish').length,
    neutral: articles.filter((article) => article.sentiment === 'neutral').length,
  }), [articles])

  const sentimentOverview = useMemo(() => buildSentimentOverview(articles), [articles])
  const warnings = Array.isArray(news?.warnings) ? news.warnings : []

  return (
    <div className="space-y-5">
      <motion.div initial="hidden" animate="visible" variants={fadeUp}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <Newspaper size={16} className="text-rose-400" />
              <h1 className="text-2xl font-black text-white">Market News</h1>
            </div>
            <p className="text-xs text-slate-500 font-medium">Financial news from backend provider</p>
            <p className="text-[11px] text-slate-700 mt-1 font-medium">
              Provider <span className="text-slate-500">{news?.provider || '--'}</span>
              {' '}· Source <span className="text-slate-500">{news?.source || '--'}</span>
              {' '}· Updated <span className="text-slate-500">{formatDateTime(news?.timestamp)}</span>
              {refreshing && <span className="text-rose-400/80 font-bold"> · Refreshing...</span>}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-black px-3 py-1.5 rounded-full border ${news?.fallback ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'}`}>
              {loading ? 'SYNCING' : news?.fallback ? 'FALLBACK' : 'BACKEND NEWS'}
            </span>
            <button
              type="button"
              onClick={() => loadNews({ refresh: true })}
              disabled={loading || refreshing}
              className="h-9 w-9 rounded-xl border border-white/[0.07] bg-[#0a1628]/88 text-slate-500 hover:text-white hover:border-rose-500/20 disabled:opacity-50 transition-all flex items-center justify-center"
              title="Refresh news"
              aria-label="Refresh news"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin text-rose-400' : ''} />
            </button>
          </div>
        </div>

        {(error || warnings.length > 0 || news?.fallback) && (
          <div className="mt-3 flex items-start gap-2 text-[11px] text-amber-400/85 font-semibold">
            <AlertTriangle size={12} className="mt-0.5 shrink-0" />
            <div>
              {error && <p>{error}</p>}
              {news?.fallback && <p>News provider fallback is active. No demo articles are shown as real news.</p>}
              {warnings.map((warning) => <p key={warning} className="text-slate-500">{warning}</p>)}
            </div>
          </div>
        )}
      </motion.div>

      <motion.div initial="hidden" animate="visible" variants={stagger} className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {sentimentOverview.map((s) => (
          <motion.div
            key={s.key}
            variants={fadeUp}
            whileHover={{ borderColor: 'rgba(225,29,72,0.15)' }}
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
            <p className="text-[10px] text-slate-600 mt-1.5 font-medium">{s.pct}% of loaded backend news</p>
          </motion.div>
        ))}
      </motion.div>

      <motion.div initial="hidden" animate="visible" variants={fadeUp} className="flex items-center justify-between gap-4 flex-wrap">
        <NewsFilters active={activeFilter} onChange={setActiveFilter} counts={counts} />
        <span className="text-[11px] text-slate-600 font-bold">
          {loading ? 'Loading...' : `${filtered.length} article${filtered.length !== 1 ? 's' : ''}`}
        </span>
      </motion.div>

      {filtered.length > 0 ? (
        <motion.div key={activeFilter} initial="hidden" animate="visible" variants={stagger} className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
          {filtered.map((article, i) => (
            <motion.div key={article.id} variants={fadeUp}>
              <NewsCard article={article} index={i} />
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-16 text-center bg-[#0a1628]/88 border border-white/[0.07] rounded-2xl">
          <Newspaper size={18} className="text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500 text-sm font-bold">
            {loading ? 'Loading market news...' : news?.fallback ? 'News provider unavailable' : 'No articles found'}
          </p>
          <p className="text-slate-700 text-xs mt-1 font-medium">
            {loading
              ? 'News are being requested from the backend.'
              : news?.fallback
                ? 'Configure GNEWS_API_KEY on the backend to load real articles.'
                : 'Try refreshing or changing the sentiment filter.'}
          </p>
        </motion.div>
      )}
    </div>
  )
}
