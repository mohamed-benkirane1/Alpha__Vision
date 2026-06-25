import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import {
  AlertTriangle, CheckCircle, Database, Lightbulb,
  Layers, RefreshCw, ShieldCheck, TrendingUp, Wallet,
} from 'lucide-react'

import PortfolioCard  from '../components/portfolio/PortfolioCard'
import HoldingsTable  from '../components/portfolio/HoldingsTable'
import PortfolioChart from '../components/portfolio/PortfolioChart'
import WatchlistPanel from '../components/portfolio/WatchlistPanel'

import { Card, Badge, Button } from '../components/ui'
import { demoDeposit, getPortfolio }             from '../services/portfolioService'
import { addWatchlistSymbol, getWatchlist, removeWatchlistSymbol } from '../services/watchlistService'
import { getValidNumber, toNumber, formatCurrency, formatPercent, formatDateTime } from '../utils/formatters'

const fadeUp  = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0.16, 1, 0.3, 1] } } }
const stagger = { visible: { transition: { staggerChildren: 0.08 } } }
const DEMO_DEPOSIT_AMOUNT = 10000
const AUTO_REFRESH_MS     = 30000
const showDemoFunding     = import.meta.env.DEV || import.meta.env.VITE_ALLOW_DEMO_FUNDING === 'true'

const getResponseData          = (r) => r?.data ?? r
const getPortfolioErrorMessage = (e) => e?.status === 401 ? 'Session expirée.' : 'Impossible de charger le portfolio.'
const getWatchlistErrorMessage = (e) => e?.normalized?.message || e?.message || 'Unable to update watchlist.'

function buildSummaryCards(portfolio, loading) {
  const holdings        = Array.isArray(portfolio?.holdings) ? portfolio.holdings : []
  const hasPortfolio    = Boolean(portfolio)
  const totals          = portfolio?.totals || {}
  const totalProfit     = getValidNumber(totals.totalProfit ?? portfolio?.totalProfit)
  const totalProfitPct  = getValidNumber(totals.totalProfitPercent ?? portfolio?.totalProfitPercent)

  return [
    {
      icon: Wallet, label: 'Valeur Portfolio', accentColor: 'rose',
      value: loading ? 'Loading...' : (hasPortfolio ? formatCurrency(totals.totalPortfolioValue) : '--'),
      sub: `Cash ${hasPortfolio ? formatCurrency(totals.cashBalance ?? portfolio.balance) : '--'}`,
      subUp: true,
    },
    {
      icon: Layers, label: 'Holdings Value', accentColor: 'amber',
      value: loading ? 'Loading...' : (hasPortfolio ? formatCurrency(totals.holdingsValue ?? portfolio.totalValue) : '--'),
      sub: `${holdings.length} actif${holdings.length === 1 ? '' : 's'} suivis`,
      subUp: true,
    },
    {
      icon: Database, label: 'Total Investi', accentColor: 'violet',
      value: loading ? 'Loading...' : (hasPortfolio ? formatCurrency(totals.totalInvested) : '--'),
      sub: 'Coût de base backend', subUp: true,
    },
    {
      icon: TrendingUp, label: 'Profit Total', accentColor: 'emerald',
      value: loading ? 'Loading...' : (hasPortfolio ? formatCurrency(totalProfit, { sign: true }) : '--'),
      sub: hasPortfolio ? `${formatPercent(totalProfitPct)} rendement global` : 'N/A',
      subUp: totalProfit === null ? true : totalProfit >= 0,
    },
  ]
}

function buildInsights(portfolio) {
  const holdings  = Array.isArray(portfolio?.holdings) ? portfolio.holdings : []
  const totalValue = toNumber(portfolio?.totalValue)
  if (!holdings.length || totalValue <= 0) return []

  const byAllocation = holdings
    .map((h) => ({ ...h, allocationPct: totalValue > 0 ? (toNumber(h.currentValue) / totalValue) * 100 : 0 }))
    .sort((a, b) => b.allocationPct - a.allocationPct)

  const largest  = byAllocation[0]
  const best     = [...holdings].sort((a, b) => toNumber(b.profitPercent) - toNumber(a.profitPercent))[0]
  const weakest  = [...holdings].sort((a, b) => toNumber(a.profitPercent) - toNumber(b.profitPercent))[0]
  const insights = []

  if (largest?.allocationPct >= 50)
    insights.push({ icon: AlertTriangle, title: `Concentration élevée — ${largest.symbol}`, body: `${largest.symbol} représente ${largest.allocationPct.toFixed(1)}% du portfolio.`, accent: { icon: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/22', hover: 'rgba(245,158,11,0.12)' } })
  if (best && toNumber(best.profitPercent) > 0)
    insights.push({ icon: TrendingUp, title: `${best.symbol} en tête`, body: `${best.symbol} est votre meilleur actif avec ${formatPercent(best.profitPercent)} non réalisé.`, accent: { icon: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/22', hover: 'rgba(16,185,129,0.12)' } })
  if (weakest && toNumber(weakest.profitPercent) < 0)
    insights.push({ icon: AlertTriangle, title: `${weakest.symbol} sous-performe`, body: `${weakest.symbol} est à ${formatPercent(weakest.profitPercent)} de rendement non réalisé.`, accent: { icon: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20', hover: 'rgba(225,29,72,0.12)' } })
  if (insights.length === 0)
    insights.push({ icon: CheckCircle, title: 'Portfolio connecté', body: 'Vos positions sont chargées. Des insights avancés arriveront avec l\'historique de performance.', accent: { icon: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/22', hover: 'rgba(16,185,129,0.12)' } })

  return insights.slice(0, 3)
}

export default function Portfolio() {
  const [portfolio,           setPortfolio]           = useState(null)
  const [loading,             setLoading]             = useState(true)
  const [refetching,          setRefetching]          = useState(false)
  const [funding,             setFunding]             = useState(false)
  const [fundingMessage,      setFundingMessage]      = useState('')
  const [error,               setError]               = useState('')
  const [watchlist,           setWatchlist]           = useState([])
  const [watchlistLoading,    setWatchlistLoading]    = useState(true)
  const [watchlistError,      setWatchlistError]      = useState('')
  const [watchlistMessage,    setWatchlistMessage]    = useState('')
  const [watchlistMutating,   setWatchlistMutating]   = useState(false)
  const mountedRef            = useRef(false)
  const loadingRef            = useRef(false)
  const watchlistLoadingRef   = useRef(false)

  const loadPortfolio = useCallback(async ({ refresh = false, silent = false } = {}) => {
    if (loadingRef.current) return
    loadingRef.current = true
    if (refresh) setRefetching(true)
    else if (!silent) setLoading(true)
    setError('')
    try {
      const response = await getPortfolio()
      if (!mountedRef.current) return
      setPortfolio(getResponseData(response))
    } catch (err) {
      if (!mountedRef.current) return
      if (!refresh) setPortfolio(null)
      setError(getPortfolioErrorMessage(err))
    } finally {
      loadingRef.current = false
      if (mountedRef.current) {
        if (refresh) setRefetching(false)
        else if (!silent) setLoading(false)
      }
    }
  }, [])

  const loadWatchlist = useCallback(async ({ silent = false } = {}) => {
    if (watchlistLoadingRef.current) return
    watchlistLoadingRef.current = true
    if (!silent) setWatchlistLoading(true)
    setWatchlistError('')
    try {
      const response = await getWatchlist()
      if (!mountedRef.current) return
      setWatchlist(Array.isArray(response.watchlist) ? response.watchlist : [])
    } catch (err) {
      if (!mountedRef.current) return
      setWatchlistError(getWatchlistErrorMessage(err))
    } finally {
      watchlistLoadingRef.current = false
      if (mountedRef.current && !silent) setWatchlistLoading(false)
    }
  }, [])

  const handleDemoDeposit = useCallback(async () => {
    setFunding(true); setFundingMessage(''); setError('')
    try {
      const response = await demoDeposit(DEMO_DEPOSIT_AMOUNT)
      if (!mountedRef.current) return
      const data = getResponseData(response)
      if (!data?.success) throw new Error(data?.message || 'Demo funding failed')
      setFundingMessage('Fonds demo ajoutés.')
      await loadPortfolio({ refresh: true })
    } catch (err) {
      if (!mountedRef.current) return
      setError(err?.response?.data?.message || err?.message || 'Demo funding failed.')
    } finally {
      if (mountedRef.current) setFunding(false)
    }
  }, [loadPortfolio])

  const handleAddWatchlist = useCallback(async (symbol) => {
    const s = String(symbol || '').trim().toUpperCase()
    if (!s || watchlistMutating) return false
    setWatchlistMutating(true); setWatchlistError(''); setWatchlistMessage('')
    try {
      const response = await addWatchlistSymbol(s)
      if (!mountedRef.current) return false
      setWatchlist(Array.isArray(response.watchlist) ? response.watchlist : [])
      setWatchlistMessage(response.message || `${s} ajouté.`)
      return true
    } catch (err) {
      if (!mountedRef.current) return false
      setWatchlistError(getWatchlistErrorMessage(err))
      return false
    } finally {
      if (mountedRef.current) setWatchlistMutating(false)
    }
  }, [watchlistMutating])

  const handleRemoveWatchlist = useCallback(async (symbol) => {
    const s = String(symbol || '').trim().toUpperCase()
    if (!s || watchlistMutating) return
    setWatchlistMutating(true); setWatchlistError(''); setWatchlistMessage('')
    try {
      const response = await removeWatchlistSymbol(s)
      if (!mountedRef.current) return
      setWatchlist(Array.isArray(response.watchlist) ? response.watchlist : [])
      setWatchlistMessage(response.message || `${s} retiré.`)
    } catch (err) {
      if (!mountedRef.current) return
      setWatchlistError(getWatchlistErrorMessage(err))
    } finally {
      if (mountedRef.current) setWatchlistMutating(false)
    }
  }, [watchlistMutating])

  useEffect(() => {
    mountedRef.current = true
    const timer    = window.setTimeout(() => { loadPortfolio(); loadWatchlist() }, 0)
    const interval = window.setInterval(() => {
      loadPortfolio({ refresh: true, silent: true })
      loadWatchlist({ silent: true })
    }, AUTO_REFRESH_MS)
    return () => { window.clearTimeout(timer); window.clearInterval(interval); mountedRef.current = false }
  }, [loadPortfolio, loadWatchlist])

  const holdings       = useMemo(() => Array.isArray(portfolio?.holdings) ? portfolio.holdings : [], [portfolio])
  const warnings       = useMemo(() => Array.isArray(portfolio?.warnings) ? portfolio.warnings.filter(Boolean) : [], [portfolio])
  const dataQuality    = portfolio?.dataQuality || {}
  const valuationReliable = dataQuality.valuationReliable !== false
  const lastUpdated    = formatDateTime(portfolio?.lastUpdated || portfolio?.timestamp)
  const summaryCards   = useMemo(() => buildSummaryCards(portfolio, loading), [portfolio, loading])
  const insights       = useMemo(() => buildInsights(portfolio), [portfolio])
  const balanceLabel   = loading ? 'Chargement...' : formatCurrency(portfolio?.balance)

  return (
    <div className="space-y-6">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <motion.div initial="hidden" animate="visible" variants={fadeUp}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-label uppercase tracking-wider text-white/40 mb-1">Portfolio</p>
            <h1 className="text-display-sm font-black text-white">Mes Actifs</h1>
            <p className="text-body text-white/40">Suivez et gérez vos positions en temps réel</p>
            <p className="text-label text-white/30 mt-1 font-mono tabular-nums">
              Cash disponible : <span className="text-white/55">{balanceLabel}</span>
              {' '}· Mis à jour <span className="text-white/55">{lastUpdated}</span>
              {refetching && <span className="text-rose-400/70 font-bold"> · Actualisation…</span>}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {showDemoFunding && (
              <Button
                variant="secondary" size="sm"
                onClick={handleDemoDeposit}
                disabled={loading || refetching || funding}
                loading={funding}
              >
                {funding ? 'Ajout…' : 'Fonds démo'}
              </Button>
            )}
            <button
              type="button"
              onClick={() => loadPortfolio({ refresh: true })}
              disabled={loading || refetching || funding}
              className="w-8 h-8 rounded-xl border border-white/[0.07] bg-white/[0.03] text-white/40 hover:text-white hover:border-rose-500/20 disabled:opacity-50 transition-all flex items-center justify-center"
              title="Actualiser"
            >
              <RefreshCw size={14} className={refetching ? 'animate-spin text-rose-400' : ''} />
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-3 flex items-center gap-2 text-label text-amber-400/80 font-semibold">
            <AlertTriangle size={12} className="shrink-0" />{error}
          </div>
        )}
        {fundingMessage && !error && (
          <p className="mt-2 text-label text-emerald-400/80 font-semibold">{fundingMessage}</p>
        )}
        {warnings.length > 0 && !error && (
          <div className="mt-2 flex items-start gap-2 text-label text-amber-400/80 font-semibold">
            <AlertTriangle size={12} className="mt-0.5 shrink-0" />
            <div>
              <p>{warnings.length} avertissement{warnings.length > 1 ? 's' : ''} de valorisation.</p>
              <ul className="mt-0.5 space-y-0.5">
                {warnings.slice(0, 3).map((w) => <li key={w} className="text-white/35 font-medium">{w}</li>)}
              </ul>
            </div>
          </div>
        )}
      </motion.div>

      {/* ── Data quality banner ──────────────────────────────────────────── */}
      <motion.div initial="hidden" animate="visible" variants={fadeUp}>
        <Card padding="sm">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${valuationReliable ? 'bg-emerald-500/10 border-emerald-500/22 text-emerald-400' : 'bg-amber-500/10 border-amber-500/22 text-amber-400'}`}>
                {valuationReliable ? <ShieldCheck size={15} /> : <AlertTriangle size={15} />}
              </div>
              <div>
                <p className="text-body font-bold text-white">
                  {valuationReliable ? 'Valorisation fiable' : 'Avertissement de valorisation'}
                </p>
                <p className="text-body-sm text-white/40 mt-0.5">
                  {valuationReliable ? 'Toutes les positions utilisent des prix live non-stale.' : 'Certaines valorisations utilisent des prix fallback ou obsolètes.'}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                ['Valorisés', `${toNumber(dataQuality.pricedHoldings)}/${toNumber(dataQuality.totalHoldings)}`],
                ['Indisponibles', String(toNumber(dataQuality.unpricedHoldings))],
                ['Fallback', dataQuality.hasFallbackPrices ? 'Oui' : 'Non'],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl bg-white/[0.025] border border-white/[0.055] px-3 py-1.5">
                  <p className="text-caption text-white/30 uppercase tracking-wide font-black">{label}</p>
                  <p className="text-body-sm text-white/70 font-mono font-black tabular-nums">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </motion.div>

      {/* ── Summary cards ────────────────────────────────────────────────── */}
      <motion.div initial="hidden" animate="visible" variants={stagger}
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {summaryCards.map((c) => (
          <motion.div key={c.label} variants={fadeUp}>
            <PortfolioCard {...c} />
          </motion.div>
        ))}
      </motion.div>

      {/* ── Holdings + Chart ─────────────────────────────────────────────── */}
      <motion.div initial="hidden" animate="visible" variants={stagger}
        className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div variants={fadeUp} className="lg:col-span-2">
          <HoldingsTable holdings={holdings} loading={loading} />
        </motion.div>
        <motion.div variants={fadeUp}>
          <PortfolioChart
            holdings={holdings}
            totalValue={portfolio?.totals?.holdingsValue ?? portfolio?.totalValue}
            loading={loading}
          />
        </motion.div>
      </motion.div>

      {/* ── Watchlist ────────────────────────────────────────────────────── */}
      <motion.div initial="hidden" animate="visible" variants={fadeUp}>
        <WatchlistPanel
          items={watchlist} loading={watchlistLoading}
          error={watchlistError} message={watchlistMessage}
          mutating={watchlistMutating}
          onAdd={handleAddWatchlist} onRemove={handleRemoveWatchlist}
          onRefresh={() => loadWatchlist()}
        />
      </motion.div>

      {/* ── Insights ─────────────────────────────────────────────────────── */}
      <motion.div initial="hidden" animate="visible" variants={stagger}>
        <motion.div variants={fadeUp} className="flex items-center gap-2 mb-4">
          <Lightbulb size={14} className="text-rose-400" />
          <h2 className="text-heading-sm font-semibold text-white">Insights Portfolio</h2>
        </motion.div>

        {insights.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {insights.map((ins) => (
              <motion.div
                key={ins.title} variants={fadeUp}
                whileHover={{ y: -2, borderColor: ins.accent.hover }}
                className={`bg-app-surface border ${ins.accent.border} rounded-card p-5 backdrop-blur-card shadow-card transition-all duration-300`}
              >
                <div className={`w-8 h-8 rounded-xl ${ins.accent.bg} border ${ins.accent.border} flex items-center justify-center mb-3.5`}>
                  <ins.icon size={14} className={ins.accent.icon} />
                </div>
                <p className="text-body font-bold text-white mb-1.5">{ins.title}</p>
                <p className="text-body-sm text-white/40 leading-relaxed font-medium">{ins.body}</p>
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div variants={fadeUp}>
            <Card padding="md">
              <p className="text-body text-white/40 font-bold">Aucun insight disponible</p>
              <p className="text-body-sm text-white/25 mt-1">Les insights apparaîtront après vos premiers trades.</p>
            </Card>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
