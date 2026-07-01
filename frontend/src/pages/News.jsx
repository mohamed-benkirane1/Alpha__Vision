import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, Minus, Newspaper, RefreshCw, TrendingDown, TrendingUp } from 'lucide-react'

import NewsCard    from '../components/news/NewsCard'
import NewsFilters from '../components/news/NewsFilters'
import { Card, Badge, EmptyState, Skeleton } from '../components/ui'
import { getMarketNews } from '../services/newsService'
import { formatDateTime } from '../utils/formatters'

const fadeUp  = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0.16, 1, 0.3, 1] } } }
const stagger = { visible: { transition: { staggerChildren: 0.07 } } }
const AUTO_REFRESH_MS = 120000

const sentimentConfig = {
  bullish: { label: 'Haussier', icon: TrendingUp,   accent: { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/22', bar: 'bg-emerald-500' } },
  bearish: { label: 'Baissier', icon: TrendingDown,  accent: { text: 'text-rose-400',    bg: 'bg-rose-500/10',    border: 'border-rose-500/22',    bar: 'bg-rose-500'    } },
  neutral: { label: 'Neutre',   icon: Minus,          accent: { text: 'text-slate-400',   bg: 'bg-white/[0.04]',   border: 'border-white/[0.08]',   bar: 'bg-slate-600'   } },
}

function buildSentimentOverview(articles) {
  const total = articles.length
  return ['bullish', 'bearish', 'neutral'].map((key) => {
    const count = articles.filter((a) => a.sentiment === key).length
    return { key, ...sentimentConfig[key], count, pct: total > 0 ? Math.round((count / total) * 100) : 0 }
  })
}

export default function News() {
  const [activeFilter, setActiveFilter] = useState('all')
  const [news,         setNews]         = useState(null)
  const [loading,      setLoading]      = useState(true)
  const [refreshing,   setRefreshing]   = useState(false)
  const [error,        setError]        = useState('')
  const loadingRef = useRef(false)

  const loadNews = useCallback(async ({ refresh = false } = {}) => {
    if (loadingRef.current) return
    loadingRef.current = true
    if (refresh) setRefreshing(true); else setLoading(true)
    setError('')
    try {
      const response = await getMarketNews()
      setNews(response)
      if (!response.success && response.error) setError(response.error)
    } catch (err) {
      setError(err?.message || 'Impossible de charger les actualités.')
    } finally {
      loadingRef.current = false
      setLoading(false); setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    const timer    = window.setTimeout(() => loadNews(), 0)
    const interval = window.setInterval(() => loadNews({ refresh: true }), AUTO_REFRESH_MS)
    return () => { window.clearTimeout(timer); window.clearInterval(interval) }
  }, [loadNews])

  const articles         = useMemo(() => Array.isArray(news?.articles) ? news.articles : [], [news])
  const filtered         = useMemo(() => activeFilter === 'all' ? articles : articles.filter((a) => a.sentiment === activeFilter), [activeFilter, articles])
  const counts           = useMemo(() => ({
    all: articles.length,
    bullish: articles.filter((a) => a.sentiment === 'bullish').length,
    bearish: articles.filter((a) => a.sentiment === 'bearish').length,
    neutral: articles.filter((a) => a.sentiment === 'neutral').length,
  }), [articles])
  const sentimentOverview = useMemo(() => buildSentimentOverview(articles), [articles])
  const warnings          = Array.isArray(news?.warnings) ? news.warnings : []

  return (
    <div className="space-y-6">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <motion.div initial="hidden" animate="visible" variants={fadeUp}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-label uppercase tracking-wider text-white/40 mb-1">Actualités</p>
            <h1 className="text-display-sm font-black text-white">Marché & News</h1>
            <p className="text-body text-white/40">Restez informé des dernières actualités financières</p>
            <p className="text-label text-white/25 mt-1">
              Provider <span className="text-white/40">{news?.provider || '--'}</span>
              {' '}· Mis à jour <span className="text-white/40">{formatDateTime(news?.timestamp)}</span>
              {refreshing && <span className="text-rose-400/70 font-bold"> · Actualisation…</span>}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge
              variant={news?.fallback ? 'warning' : 'success'}
              size="sm"
            >
              {loading ? 'Syncing…' : news?.fallback ? 'Fallback' : 'Live'}
            </Badge>
            <button
              type="button"
              onClick={() => loadNews({ refresh: true })}
              disabled={loading || refreshing}
              className="w-8 h-8 rounded-xl border border-white/[0.07] bg-white/[0.03] text-white/40 hover:text-white hover:border-rose-500/20 disabled:opacity-50 transition-all flex items-center justify-center"
              title="Actualiser"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin text-rose-400' : ''} />
            </button>
          </div>
        </div>

        {(error || warnings.length > 0 || news?.fallback) && (
          <div className="mt-3 flex items-start gap-2 text-label text-amber-400/80 font-semibold">
            <AlertTriangle size={12} className="mt-0.5 shrink-0" />
            <div>
              {error && <p>{error}</p>}
              {news?.fallback && <p>Fournisseur de news en mode fallback. Configurez GNEWS_API_KEY pour les articles réels.</p>}
              {warnings.map((w) => <p key={w} className="text-white/35">{w}</p>)}
            </div>
          </div>
        )}
      </motion.div>

      {/* ── Sentiment overview ───────────────────────────────────────────── */}
      <motion.div initial="hidden" animate="visible" variants={stagger}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {sentimentOverview.map((s) => (
          <motion.div key={s.key} variants={fadeUp}
            whileHover={{ borderColor: 'rgba(225,29,72,0.15)' }}>
            <Card padding="md" className={`border ${s.accent.border}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-xl ${s.accent.bg} border ${s.accent.border} flex items-center justify-center`}>
                    <s.icon size={12} className={s.accent.text} />
                  </div>
                  <span className={`text-body-sm font-black ${s.accent.text}`}>{s.label}</span>
                </div>
                <span className="text-heading font-black text-white">{s.count}</span>
              </div>
              <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }} animate={{ width: `${s.pct}%` }}
                  transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                  className={`h-full rounded-full ${s.accent.bar}`}
                />
              </div>
              <p className="text-caption text-white/25 mt-1.5 font-medium">{s.pct}% des articles</p>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Filtres ──────────────────────────────────────────────────────── */}
      <motion.div initial="hidden" animate="visible" variants={fadeUp}>
        <Card padding="sm">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <NewsFilters active={activeFilter} onChange={setActiveFilter} counts={counts} />
            <span className="text-label text-white/30 font-bold">
              {loading ? 'Chargement...' : `${filtered.length} article${filtered.length !== 1 ? 's' : ''}`}
            </span>
          </div>
        </Card>
      </motion.div>

      {/* ── Skeletons loading ─────────────────────────────────────────────── */}
      {loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} padding="md" className="space-y-3">
              <Skeleton height="h-28" rounded="rounded-xl" />
              <Skeleton height="h-5" width="w-3/4" />
              <Skeleton height="h-4" />
              <Skeleton height="h-4" width="w-1/2" />
            </Card>
          ))}
        </div>
      )}

      {/* ── Articles ─────────────────────────────────────────────────────── */}
      {!loading && filtered.length > 0 && (
        <motion.div key={activeFilter} initial="hidden" animate="visible" variants={stagger}
          className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((article, i) => (
            <motion.div key={article.id || i} variants={fadeUp}>
              <NewsCard article={article} index={i} />
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* ── Empty state ──────────────────────────────────────────────────── */}
      {!loading && filtered.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card padding="lg">
            <EmptyState
              icon={Newspaper}
              title="Aucune actualité"
              description={
                news?.fallback
                  ? 'Fournisseur de news indisponible. Configurez GNEWS_API_KEY sur le backend.'
                  : 'Essayez d\'actualiser ou de changer le filtre de sentiment.'
              }
            />
          </Card>
        </motion.div>
      )}
    </div>
  )
}
