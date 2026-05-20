import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Wallet, TrendingUp, Star, Layers, Lightbulb, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react'

import PortfolioCard  from '../components/portfolio/PortfolioCard'
import HoldingsTable  from '../components/portfolio/HoldingsTable'
import PortfolioChart from '../components/portfolio/PortfolioChart'
import { demoDeposit, getPortfolio } from '../services/portfolioService'

const fadeUp  = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0.16, 1, 0.3, 1] } } }
const stagger = { visible: { transition: { staggerChildren: 0.08 } } }
const DEMO_DEPOSIT_AMOUNT = 10000
const showDemoFunding = import.meta.env.DEV || import.meta.env.VITE_ALLOW_DEMO_FUNDING === 'true'

const getValidNumber = (value) => {
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

const toNumber = (value) => {
  const number = getValidNumber(value)
  return number ?? 0
}

const formatCurrency = (value, { sign = false } = {}) => {
  const number = getValidNumber(value)
  if (number === null) return '--'

  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(number))

  if (!sign) return formatted
  return `${number >= 0 ? '+' : '-'}${formatted}`
}

const formatPercent = (value) => {
  const number = getValidNumber(value)
  if (number === null) return 'N/A'

  return `${number >= 0 ? '+' : ''}${number.toFixed(1)}%`
}

const getResponseData = (response) => response?.data ?? response

const getPortfolioErrorMessage = (error) => {
  if (error?.status === 401) {
    return 'Votre session a expiré. Veuillez vous reconnecter.'
  }

  return 'Impossible de charger votre portfolio pour le moment. Veuillez réessayer.'
}

function buildSummaryCards(portfolio, loading) {
  const holdings = Array.isArray(portfolio?.holdings) ? portfolio.holdings : []
  const hasPortfolio = Boolean(portfolio)
  const totalProfit = getValidNumber(portfolio?.totalProfit)
  const bestHolding = holdings.reduce((best, holding) => {
    const profitPercent = getValidNumber(holding.profitPercent)
    if (profitPercent === null) return best
    if (!best) return holding

    return profitPercent > toNumber(best.profitPercent) ? holding : best
  }, null)
  const bestProfitPercent = getValidNumber(bestHolding?.profitPercent)

  return [
    {
      icon: Wallet,
      label: 'Total Value',
      value: loading ? 'Loading...' : (hasPortfolio ? formatCurrency(portfolio.totalValue) : '--'),
      sub: 'Daily change not available yet',
      subUp: true,
      accentColor: 'rose',
    },
    {
      icon: TrendingUp,
      label: 'Total Profit',
      value: loading ? 'Loading...' : (hasPortfolio ? formatCurrency(portfolio.totalProfit, { sign: true }) : '--'),
      sub: hasPortfolio ? `${formatPercent(portfolio.totalProfitPercent)} overall return` : 'Overall return N/A',
      subUp: totalProfit === null ? true : totalProfit >= 0,
      accentColor: 'emerald',
    },
    {
      icon: Star,
      label: 'Best Asset',
      value: loading ? 'Loading...' : (bestHolding?.symbol || '--'),
      sub: bestHolding ? `${formatPercent(bestHolding.profitPercent)} unrealized return` : 'No valid asset data',
      subUp: bestProfitPercent === null ? true : bestProfitPercent >= 0,
      accentColor: 'violet',
    },
    {
      icon: Layers,
      label: 'Assets Held',
      value: loading ? 'Loading...' : String(holdings.length),
      sub: holdings.length > 0 ? 'Live backend holdings' : 'No holdings yet',
      subUp: true,
      accentColor: 'amber',
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
  const mountedRef = useRef(false)

  const loadPortfolio = useCallback(async ({ refresh = false } = {}) => {
    if (refresh) {
      setRefetching(true)
    } else {
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
      if (mountedRef.current) {
        if (refresh) {
          setRefetching(false)
        } else {
          setLoading(false)
        }
      }
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

  useEffect(() => {
    mountedRef.current = true
    const timer = window.setTimeout(() => {
      loadPortfolio()
    }, 0)

    return () => {
      window.clearTimeout(timer)
      mountedRef.current = false
    }
  }, [loadPortfolio])

  const holdings = useMemo(() => (
    Array.isArray(portfolio?.holdings) ? portfolio.holdings : []
  ), [portfolio])

  const warnings = useMemo(() => (
    Array.isArray(portfolio?.warnings) ? portfolio.warnings.filter(Boolean) : []
  ), [portfolio])

  const balanceLabel = loading ? 'Loading...' : formatCurrency(portfolio?.balance)

  const summaryCards = useMemo(
    () => buildSummaryCards(portfolio, loading),
    [portfolio, loading],
  )

  const insights = useMemo(
    () => buildInsights(portfolio),
    [portfolio],
  )

  return (
    <div className="space-y-5">

      <motion.div initial="hidden" animate="visible" variants={fadeUp}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black text-white">Portfolio</h1>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">Track your assets, performance and allocation</p>
            <p className="text-[11px] text-slate-600 mt-1 font-bold tabular-nums">
              Cash balance <span className="text-slate-300">{balanceLabel}</span>
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {showDemoFunding && (
              <button
                type="button"
                onClick={handleDemoDeposit}
                disabled={loading || refetching || funding}
                className="h-9 px-3 rounded-xl border border-white/[0.07] bg-[#0a1628]/88 text-[11px] text-slate-500 font-black hover:text-white hover:border-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
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
          <p className="text-[11px] text-amber-400/80 mt-2 font-semibold">{error}</p>
        )}
        {fundingMessage && !error && (
          <p className="text-[11px] text-emerald-400/80 mt-2 font-semibold">{fundingMessage}</p>
        )}
        {warnings.length > 0 && !error && (
          <div className="mt-2 flex items-start gap-2 text-[11px] text-amber-400/80 font-semibold">
            <AlertTriangle size={12} className="mt-0.5 shrink-0" />
            <p>
              Some prices are temporarily unavailable.
              <span className="text-slate-600 font-medium"> {warnings.length} warning{warnings.length > 1 ? 's' : ''} returned.</span>
            </p>
          </div>
        )}
      </motion.div>

      <motion.div initial="hidden" animate="visible" variants={stagger}
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
        {summaryCards.map((c) => (
          <motion.div key={c.label} variants={fadeUp}>
            <PortfolioCard {...c} />
          </motion.div>
        ))}
      </motion.div>

      <motion.div initial="hidden" animate="visible" variants={stagger}
        className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
        <motion.div variants={fadeUp} className="lg:col-span-2">
          <HoldingsTable holdings={holdings} loading={loading} />
        </motion.div>
        <motion.div variants={fadeUp}>
          <PortfolioChart holdings={holdings} totalValue={portfolio?.totalValue} loading={loading} />
        </motion.div>
      </motion.div>

      {/* Insights */}
      <motion.div initial="hidden" animate="visible" variants={stagger}>
        <motion.div variants={fadeUp} className="flex items-center gap-2 mb-3.5">
          <Lightbulb size={13} className="text-rose-400" />
          <h2 className="text-sm font-bold text-white">Portfolio Insights</h2>
        </motion.div>

        {insights.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
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
                <p className="text-sm font-bold text-white mb-1.5">{ins.title}</p>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">{ins.body}</p>
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div
            variants={fadeUp}
            className="bg-[#0a1628]/88 border border-white/[0.07] rounded-2xl p-6 backdrop-blur-2xl shadow-[0_4px_28px_rgba(0,0,0,0.28)]"
          >
            <p className="text-sm text-slate-500 font-bold">No portfolio insights yet</p>
            <p className="text-xs text-slate-700 mt-1 font-medium">Insights will appear after real trades create holdings. Risk score and performance history need backend endpoints.</p>
          </motion.div>
        )}
      </motion.div>

    </div>
  )
}
