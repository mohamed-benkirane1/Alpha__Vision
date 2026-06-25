import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Wallet, TrendingUp, Layers, Lightbulb, AlertTriangle, CheckCircle, RefreshCw, Database, ShieldCheck } from 'lucide-react'

import PortfolioCard  from '../components/portfolio/PortfolioCard'
import HoldingsTable  from '../components/portfolio/HoldingsTable'
import PortfolioChart from '../components/portfolio/PortfolioChart'
import WatchlistPanel from '../components/portfolio/WatchlistPanel'
import { demoDeposit, getPortfolio } from '../services/portfolioService'
import { addWatchlistSymbol, getWatchlist, removeWatchlistSymbol } from '../services/watchlistService'
import { getValidNumber, toNumber, formatCurrency, formatPercent, formatDateTime } from '../utils/formatters'

const fadeUp  = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0.16, 1, 0.3, 1] } } }
const stagger = { visible: { transition: { staggerChildren: 0.08 } } }
const DEMO_DEPOSIT_AMOUNT = 10000
const AUTO_REFRESH_MS = 30000
const showDemoFunding = import.meta.env.DEV || import.meta.env.VITE_ALLOW_DEMO_FUNDING === 'true'

const getResponseData = (response) => response?.data ?? response

const getPortfolioErrorMessage = (error) => {
  if (error?.status === 401) {
    return 'Votre session a expiré. Veuillez vous reconnecter.'
  }

  return 'Impossible de charger votre portfolio pour le moment. Veuillez réessayer.'
}

const getWatchlistErrorMessage = (error) => (
  error?.normalized?.message ||
  error?.response?.data?.message ||
  error?.message ||
  'Unable to update watchlist right now.'
)

function buildSummaryCards(portfolio, loading) {
  const holdings = Array.isArray(portfolio?.holdings) ? portfolio.holdings : []
  const hasPortfolio = Boolean(portfolio)
  const totals = portfolio?.totals || {}
  const totalProfit = getValidNumber(totals.totalProfit ?? portfolio?.totalProfit)
  const totalProfitPercent = getValidNumber(totals.totalProfitPercent ?? portfolio?.totalProfitPercent)

  return [
    {
      icon: Wallet,
      label: 'Portfolio Value',
      value: loading ? 'Loading...' : (hasPortfolio ? formatCurrency(totals.totalPortfolioValue) : '--'),
      sub: `Cash ${hasPortfolio ? formatCurrency(totals.cashBalance ?? portfolio.balance) : '--'}`,
      subUp: true,
      accentColor: 'rose',
    },
    {
      icon: Layers,
      label: 'Holdings Value',
      value: loading ? 'Loading...' : (hasPortfolio ? formatCurrency(totals.holdingsValue ?? portfolio.totalValue) : '--'),
      sub: `${holdings.length} asset${holdings.length === 1 ? '' : 's'} tracked`,
      subUp: true,
      accentColor: 'amber',
    },
    {
      icon: Database,
      label: 'Total Invested',
      value: loading ? 'Loading...' : (hasPortfolio ? formatCurrency(totals.totalInvested) : '--'),
      sub: 'Backend cost basis',
      subUp: true,
      accentColor: 'violet',
    },
    {
      icon: TrendingUp,
      label: 'Total Profit',
      value: loading ? 'Loading...' : (hasPortfolio ? formatCurrency(totalProfit, { sign: true }) : '--'),
      sub: hasPortfolio ? `${formatPercent(totalProfitPercent)} overall return` : 'Overall return N/A',
      subUp: totalProfit === null ? true : totalProfit >= 0,
      accentColor: 'emerald',
    },
  ]
}

function buildInsights(portfolio) {
  const holdings = Array.isArray(portfolio?.holdings) ? portfolio.holdings : []
  const totalValue = toNumber(portfolio?.totalValue)
  if (!holdings.length || totalValue <= 0) return []

  const byAllocation = holdings
    .map((holding) => ({
      ...holding,
      allocationPct: totalValue > 0 ? (toNumber(holding.currentValue) / totalValue) * 100 : 0,
    }))
    .sort((a, b) => b.allocationPct - a.allocationPct)

  const largest = byAllocation[0]
  const best = [...holdings].sort((a, b) => toNumber(b.profitPercent) - toNumber(a.profitPercent))[0]
  const weakest = [...holdings].sort((a, b) => toNumber(a.profitPercent) - toNumber(b.profitPercent))[0]

  const insights = []

  if (largest?.allocationPct >= 50) {
    insights.push({
      icon: AlertTriangle,
      title: `High ${largest.symbol} concentration`,
      body: `${largest.symbol} represents ${largest.allocationPct.toFixed(1)}% of your portfolio. Consider reviewing concentration risk before adding more exposure.`,
      accent: { icon: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/22', hover: 'rgba(245,158,11,0.12)' },
    })
  }

  if (best && toNumber(best.profitPercent) > 0) {
    insights.push({
      icon: TrendingUp,
      title: `${best.symbol} leads performance`,
      body: `${best.symbol} is your best-performing asset with ${formatPercent(best.profitPercent)} unrealized return.`,
      accent: { icon: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/22', hover: 'rgba(16,185,129,0.12)' },
    })
  }

  if (weakest && toNumber(weakest.profitPercent) < 0) {
    insights.push({
      icon: AlertTriangle,
      title: `${weakest.symbol} is underperforming`,
      body: `${weakest.symbol} is currently at ${formatPercent(weakest.profitPercent)} unrealized return. Review the position before increasing allocation.`,
      accent: { icon: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20', hover: 'rgba(225,29,72,0.12)' },
    })
  }

  if (insights.length === 0) {
    insights.push({
      icon: CheckCircle,
      title: 'Portfolio data loaded',
      body: 'Your holdings are connected. More advanced risk insights need historical performance and risk endpoints.',
      accent: { icon: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/22', hover: 'rgba(16,185,129,0.12)' },
    })
  }

  return insights.slice(0, 3)
}

export default function Portfolio() {
  const [portfolio, setPortfolio] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refetching, setRefetching] = useState(false)
  const [funding, setFunding] = useState(false)
  const [fundingMessage, setFundingMessage] = useState('')
  const [error, setError] = useState('')
  const [watchlist, setWatchlist] = useState([])
  const [watchlistLoading, setWatchlistLoading] = useState(true)
  const [watchlistError, setWatchlistError] = useState('')
  const [watchlistMessage, setWatchlistMessage] = useState('')
  const [watchlistMutating, setWatchlistMutating] = useState(false)
  const mountedRef = useRef(false)
  const loadingRef = useRef(false)
  const watchlistLoadingRef = useRef(false)

  const loadPortfolio = useCallback(async ({ refresh = false, silent = false } = {}) => {
    if (loadingRef.current) return
    loadingRef.current = true

    if (refresh) {
      setRefetching(true)
    } else if (!silent) {
      setLoading(true)
    }
    setError('')

    try {
      const response = await getPortfolio()
      if (!mountedRef.current) return
      setPortfolio(getResponseData(response))
    } catch (err) {
      if (!mountedRef.current) return
      console.error('Portfolio load failed:', err)
      if (!refresh) setPortfolio(null)
      setError(getPortfolioErrorMessage(err))
    } finally {
      loadingRef.current = false
      if (mountedRef.current) {
        if (refresh) {
          setRefetching(false)
        } else if (!silent) {
          setLoading(false)
        }
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
      console.error('Watchlist load failed:', err)
      setWatchlistError(getWatchlistErrorMessage(err))
    } finally {
      watchlistLoadingRef.current = false
      if (mountedRef.current && !silent) setWatchlistLoading(false)
    }
  }, [])

  const handleDemoDeposit = useCallback(async () => {
    setFunding(true)
    setFundingMessage('')
    setError('')

    try {
      const response = await demoDeposit(DEMO_DEPOSIT_AMOUNT)
      if (!mountedRef.current) return

      const data = getResponseData(response)
      if (!data?.success) {
        throw new Error(data?.message || 'Demo funding failed')
      }

      setFundingMessage('Demo balance added.')
      await loadPortfolio({ refresh: true })
    } catch (err) {
      if (!mountedRef.current) return
      setFundingMessage('')
      setError(err?.response?.data?.message || err?.message || 'Demo funding failed.')
    } finally {
      if (mountedRef.current) setFunding(false)
    }
  }, [loadPortfolio])

  const handleAddWatchlist = useCallback(async (symbol) => {
    const normalizedSymbol = String(symbol || '').trim().toUpperCase()
    if (!normalizedSymbol || watchlistMutating) return false

    setWatchlistMutating(true)
    setWatchlistError('')
    setWatchlistMessage('')

    try {
      const response = await addWatchlistSymbol(normalizedSymbol)
      if (!mountedRef.current) return false
      setWatchlist(Array.isArray(response.watchlist) ? response.watchlist : [])
      setWatchlistMessage(response.message || `${normalizedSymbol} added to watchlist.`)
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
    const normalizedSymbol = String(symbol || '').trim().toUpperCase()
    if (!normalizedSymbol || watchlistMutating) return

    setWatchlistMutating(true)
    setWatchlistError('')
    setWatchlistMessage('')

    try {
      const response = await removeWatchlistSymbol(normalizedSymbol)
      if (!mountedRef.current) return
      setWatchlist(Array.isArray(response.watchlist) ? response.watchlist : [])
      setWatchlistMessage(response.message || `${normalizedSymbol} removed from watchlist.`)
    } catch (err) {
      if (!mountedRef.current) return
      setWatchlistError(getWatchlistErrorMessage(err))
    } finally {
      if (mountedRef.current) setWatchlistMutating(false)
    }
  }, [watchlistMutating])

  useEffect(() => {
    mountedRef.current = true
    const timer = window.setTimeout(() => {
      loadPortfolio()
      loadWatchlist()
    }, 0)
    const interval = window.setInterval(() => {
      loadPortfolio({ refresh: true, silent: true })
      loadWatchlist({ silent: true })
    }, AUTO_REFRESH_MS)

    return () => {
      window.clearTimeout(timer)
      window.clearInterval(interval)
      mountedRef.current = false
    }
  }, [loadPortfolio, loadWatchlist])

  const holdings = useMemo(() => (
    Array.isArray(portfolio?.holdings) ? portfolio.holdings : []
  ), [portfolio])

  const warnings = useMemo(() => (
    Array.isArray(portfolio?.warnings) ? portfolio.warnings.filter(Boolean) : []
  ), [portfolio])

  const balanceLabel = loading ? 'Loading...' : formatCurrency(portfolio?.balance)
  const dataQuality = portfolio?.dataQuality || {}
  const valuationReliable = dataQuality.valuationReliable !== false
  const lastUpdated = formatDateTime(portfolio?.lastUpdated || portfolio?.timestamp)
  const qualityItems = [
    ['Priced', `${toNumber(dataQuality.pricedHoldings)}/${toNumber(dataQuality.totalHoldings)}`],
    ['Unavailable', String(toNumber(dataQuality.unpricedHoldings))],
    ['Fallback', dataQuality.hasFallbackPrices ? 'Yes' : 'No'],
    ['Stale', dataQuality.hasStalePrices ? 'Yes' : 'No'],
    ['Cached', dataQuality.hasCachedPrices ? 'Yes' : 'No'],
  ]

  const summaryCards = useMemo(
    () => buildSummaryCards(portfolio, loading),
    [portfolio, loading],
  )

  const insights = useMemo(
    () => buildInsights(portfolio),
    [portfolio],
  )

  return (
    <div className="space-y-6">

      <motion.div initial="hidden" animate="visible" variants={fadeUp}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-display-sm font-black text-white">Portfolio</h1>
            <p className="text-body-sm text-slate-500 mt-0.5 font-medium">Track your assets, performance and allocation</p>
            <p className="text-label text-slate-600 mt-1 font-bold tabular-nums font-mono">
              Cash balance <span className="text-slate-300">{balanceLabel}</span>
            </p>
            <p className="text-label text-slate-700 mt-1 font-medium">
              Last updated <span className="text-slate-500">{lastUpdated}</span>
              {refetching && <span className="text-rose-400/80 font-bold"> · Refreshing...</span>}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {showDemoFunding && (
              <button
                type="button"
                onClick={handleDemoDeposit}
                disabled={loading || refetching || funding}
                className="h-9 px-3 rounded-xl border border-white/[0.07] bg-[#0a1628]/88 text-label text-slate-500 font-black hover:text-white hover:border-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {funding ? 'Adding...' : 'Add demo funds'}
              </button>
            )}
            <button
              type="button"
              onClick={() => loadPortfolio({ refresh: true })}
              disabled={loading || refetching || funding}
              className="h-9 w-9 rounded-xl border border-white/[0.07] bg-[#0a1628]/88 text-slate-500 hover:text-white hover:border-rose-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
              title="Refresh portfolio"
              aria-label="Refresh portfolio"
            >
              <RefreshCw size={14} className={refetching ? 'animate-spin text-rose-400' : ''} />
            </button>
          </div>
        </div>
        {error && (
          <p className="text-label text-amber-400/80 mt-2 font-semibold">{error}</p>
        )}
        {fundingMessage && !error && (
          <p className="text-label text-emerald-400/80 mt-2 font-semibold">{fundingMessage}</p>
        )}
        {warnings.length > 0 && !error && (
          <div className="mt-2 flex items-start gap-2 text-label text-amber-400/80 font-semibold">
            <AlertTriangle size={12} className="mt-0.5 shrink-0" />
            <div>
              <p>
                Some valuations need attention.
                <span className="text-slate-600 font-medium"> {warnings.length} warning{warnings.length > 1 ? 's' : ''} returned.</span>
              </p>
              <ul className="mt-1 space-y-0.5">
                {warnings.slice(0, 3).map((warning) => (
                  <li key={warning} className="text-slate-500 font-medium">{warning}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </motion.div>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        className={`bg-[#0a1628]/88 border ${valuationReliable ? 'border-emerald-500/16' : 'border-amber-500/22'} rounded-2xl p-4 backdrop-blur-2xl shadow-[0_4px_28px_rgba(0,0,0,0.26)]`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${valuationReliable ? 'bg-emerald-500/10 border-emerald-500/22 text-emerald-400' : 'bg-amber-500/10 border-amber-500/22 text-amber-400'}`}>
              {valuationReliable ? <ShieldCheck size={15} /> : <AlertTriangle size={15} />}
            </div>
            <div>
              <p className="text-body text-white font-black">
                {valuationReliable ? 'Valuation reliable' : 'Valuation reliability warning'}
              </p>
              <p className="text-body-sm text-slate-600 mt-0.5 font-medium">
                {valuationReliable
                  ? 'All priced holdings are using available non-stale market data.'
                  : 'Certaines valorisations ne sont pas fiables à cause de prix indisponibles, fallback ou stale.'}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {qualityItems.map(([label, value]) => (
              <div key={label} className="min-w-20 rounded-xl bg-white/[0.025] border border-white/[0.055] px-3 py-2">
                <p className="text-caption text-slate-700 uppercase tracking-wide font-black">{label}</p>
                <p className="text-body-sm text-slate-300 font-black mt-0.5 tabular-nums font-mono">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      <motion.div initial="hidden" animate="visible" variants={stagger}
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {summaryCards.map((c) => (
          <motion.div key={c.label} variants={fadeUp}>
            <PortfolioCard {...c} />
          </motion.div>
        ))}
      </motion.div>

      <motion.div initial="hidden" animate="visible" variants={stagger}
        className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div variants={fadeUp} className="lg:col-span-2">
          <HoldingsTable holdings={holdings} loading={loading} />
        </motion.div>
        <motion.div variants={fadeUp}>
          <PortfolioChart holdings={holdings} totalValue={portfolio?.totals?.holdingsValue ?? portfolio?.totalValue} loading={loading} />
        </motion.div>
      </motion.div>

      <motion.div initial="hidden" animate="visible" variants={fadeUp}>
        <WatchlistPanel
          items={watchlist}
          loading={watchlistLoading}
          error={watchlistError}
          message={watchlistMessage}
          mutating={watchlistMutating}
          onAdd={handleAddWatchlist}
          onRemove={handleRemoveWatchlist}
          onRefresh={() => loadWatchlist()}
        />
      </motion.div>

      {/* Insights */}
      <motion.div initial="hidden" animate="visible" variants={stagger}>
        <motion.div variants={fadeUp} className="flex items-center gap-2 mb-3.5">
          <Lightbulb size={13} className="text-rose-400" />
          <h2 className="text-body font-bold text-white">Portfolio Insights</h2>
        </motion.div>

        {insights.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {insights.map((ins) => (
              <motion.div
                key={ins.title}
                variants={fadeUp}
                whileHover={{ y: -2, borderColor: ins.accent.hover }}
                className={`bg-[#0a1628]/88 border ${ins.accent.border} rounded-2xl p-5 backdrop-blur-2xl shadow-[0_4px_28px_rgba(0,0,0,0.28)] transition-all duration-300`}
              >
                <div className={`w-8 h-8 rounded-xl ${ins.accent.bg} border ${ins.accent.border} flex items-center justify-center mb-3.5`}>
                  <ins.icon size={14} className={ins.accent.icon} />
                </div>
                <p className="text-body font-bold text-white mb-1.5">{ins.title}</p>
                <p className="text-body-sm text-slate-500 leading-relaxed font-medium">{ins.body}</p>
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div
            variants={fadeUp}
            className="bg-[#0a1628]/88 border border-white/[0.07] rounded-2xl p-6 backdrop-blur-2xl shadow-[0_4px_28px_rgba(0,0,0,0.28)]"
          >
            <p className="text-body text-slate-500 font-bold">No portfolio insights yet</p>
            <p className="text-body-sm text-slate-700 mt-1 font-medium">Insights will appear after real trades create holdings. Risk score and performance history need backend endpoints.</p>
          </motion.div>
        )}
      </motion.div>

    </div>
  )
}
