import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Wallet, TrendingUp, Database, Cpu, Zap, RefreshCw, AlertTriangle } from 'lucide-react'

import StatCard         from '../components/dashboard/StatCard'
import PerformanceChart from '../components/dashboard/PerformanceChart'
import AISignalCard     from '../components/dashboard/AISignalCard'
import MarketOverview   from '../components/dashboard/MarketOverview'
import PortfolioSummary from '../components/dashboard/PortfolioSummary'
import RecentTrades     from '../components/dashboard/RecentTrades'
import { useAuth } from '../context/useAuth'
import { getDashboardLiveData } from '../services/dashboardService'
import { getValidNumber, formatCurrency, formatPercent, formatDateTime } from '../utils/formatters'

const fadeUp  = { hidden: { opacity: 0, y: 18 }, visible: { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0.16, 1, 0.3, 1] } } }
const stagger = { visible: { transition: { staggerChildren: 0.08 } } }
const AUTO_REFRESH_MS = 30000

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

const getFirstName = (name) => {
  if (!name) return 'Trader'
  return name.trim().split(' ')[0] || 'Trader'
}

function buildStats({ portfolio, trades, bot, loading }) {
  const totals = portfolio?.totals || {}
  const totalValue = totals.totalPortfolioValue
  const cashBalance = totals.cashBalance ?? portfolio?.balance
  const holdingsValue = totals.holdingsValue ?? portfolio?.totalValue
  const totalProfit = totals.totalProfit ?? portfolio?.totalProfit
  const totalProfitPercent = totals.totalProfitPercent ?? portfolio?.totalProfitPercent
  const holdingsCount = Array.isArray(portfolio?.holdings) ? portfolio.holdings.length : 0
  const investedValue = getValidNumber(totals.totalInvested)
  const hasPnlData = holdingsCount > 0 || (investedValue !== null && investedValue > 0)
  const hasTradeData = Array.isArray(trades)
  const tradeCount = hasTradeData ? trades.length : 0
  const botStatus = bot?.status || {}
  const botEngineAvailable = bot?.dataQuality?.hasRealBotEngine === true
    && bot?.fallback !== true
    && botStatus.mode !== 'unavailable'
  const activeBot = botEngineAvailable && botStatus.isRunning === true
  const botValue = !bot
    ? '--'
    : !botEngineAvailable
      ? 'UNAVAILABLE'
      : activeBot
        ? 'RUNNING'
        : 'STOPPED'

  const botDetails = !bot
    ? `Bot status unavailable / ${tradeCount} backend trades loaded`
    : activeBot
      ? [
          `Mode ${botStatus.mode || 'paper'}`,
          botStatus.strategy ? `${botStatus.strategy.toUpperCase()} strategy` : null,
          botStatus.symbol || null,
        ].filter(Boolean).join(' / ')
      : null

  const botSubNode = botDetails
    ? botDetails
    : (
        <span>
          No active bot —{' '}
          <Link to="/bot" className="text-amber-400 underline underline-offset-2 hover:text-amber-300 transition-colors">
            Create a bot →
          </Link>
        </span>
      )

  return [
    {
      icon: Wallet,
      label: 'Portfolio Value',
      value: loading && !portfolio ? 'Loading...' : formatCurrency(totalValue),
      sub: portfolio ? `${holdingsCount} backend holdings` : 'No portfolio data',
      subUp: true,
      accentColor: 'rose',
    },
    {
      icon: TrendingUp,
      label: 'Total Profit',
      value: loading && !portfolio ? 'Loading...' : (hasPnlData ? formatCurrency(totalProfit, { sign: true }) : '--'),
      sub: hasPnlData ? `${formatPercent(totalProfitPercent)} unrealized PnL` : 'Connect your first trade to see PnL',
      subUp: hasPnlData ? (getValidNumber(totalProfit) ?? 0) >= 0 : null,
      accentColor: 'emerald',
    },
    {
      icon: Database,
      label: 'Cash Balance',
      value: loading && !portfolio ? 'Loading...' : formatCurrency(cashBalance),
      sub: `Holdings ${formatCurrency(holdingsValue)}`,
      subUp: true,
      accentColor: 'cyan',
    },
    {
      icon: Cpu,
      label: 'Bot Status',
      value: loading && !bot ? 'Loading...' : botValue,
      sub: botSubNode,
      subUp: activeBot,
      accentColor: 'amber',
    },
  ]
}

export default function Dashboard() {
  const { user } = useAuth()
  const [portfolio, setPortfolio] = useState(null)
  const [portfolioHistory, setPortfolioHistory] = useState(null)
  const [trades, setTrades] = useState(null)
  const [markets, setMarkets] = useState([])
  const [marketDataQuality, setMarketDataQuality] = useState(null)
  const [serviceQuality, setServiceQuality] = useState(null)
  const [widgetStatus, setWidgetStatus] = useState(null)
  const [bot, setBot] = useState(null)
  const [aiSignal, setAiSignal] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const loadingRef = useRef(false)

  const loadDashboardData = useCallback(async ({ refresh = false } = {}) => {
    if (loadingRef.current) return
    loadingRef.current = true
    if (refresh) setRefreshing(true)
    else setLoading(true)
    setError('')

    try {
      const data = await getDashboardLiveData()
      setPortfolio(data.portfolio)
      setPortfolioHistory(data.portfolioHistory)
      setTrades(Array.isArray(data.trades) ? data.trades : [])
      setMarkets(Array.isArray(data.markets) ? data.markets : [])
      setMarketDataQuality(data.marketDataQuality)
      setServiceQuality(data.dataQuality)
      setWidgetStatus(data.widgets)
      setBot(data.bot)
      setAiSignal(data.aiSignal)
      if (!data.success) setError('Some dashboard data could not be refreshed. Showing available backend data only.')
    } catch (err) {
      console.error('Dashboard load failed:', err)
      setError('Dashboard data could not be refreshed from the backend.')
    } finally {
      loadingRef.current = false
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => loadDashboardData(), 0)
    const interval = window.setInterval(() => loadDashboardData({ refresh: true }), AUTO_REFRESH_MS)
    return () => {
      window.clearTimeout(timer)
      window.clearInterval(interval)
    }
  }, [loadDashboardData])

  const stats = useMemo(
    () => buildStats({ portfolio, trades, bot, loading }),
    [portfolio, trades, bot, loading],
  )
  const portfolioQuality = portfolio?.dataQuality
  const hasPortfolio = Boolean(portfolio)
  const portfolioReliable = hasPortfolio && portfolioQuality?.valuationReliable !== false
  const marketPartial = marketDataQuality?.hasErrors || marketDataQuality?.hasFallbacks || marketDataQuality?.hasStale || marketDataQuality?.hasUnavailable
  const failedWidgets = Object.entries(widgetStatus || {})
    .filter(([, value]) => value.status === 'rejected')
    .map(([key]) => key)

  return (
    <div className="space-y-5">

      {/* Header */}
      <motion.div
        initial="hidden" animate="visible" variants={fadeUp}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
      >
        <div>
          <p className="text-[11px] text-slate-600 font-bold tracking-widest uppercase mb-1">{getGreeting()}, {getFirstName(user?.name)}</p>
          <h1 className="text-2xl font-black text-white leading-tight">Dashboard</h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">Real-time overview of your trading intelligence</p>
          <p className="text-[11px] text-slate-700 mt-1 font-medium">
            Portfolio updated <span className="text-slate-500">{formatDateTime(portfolio?.lastUpdated || portfolio?.timestamp)}</span>
            {refreshing && <span className="text-rose-400/80 font-bold"> · Refreshing...</span>}
          </p>
          {error && (
            <p className="text-[11px] text-amber-400/80 mt-2 font-semibold">{error}</p>
          )}
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center gap-1.5 bg-rose-500/10 border border-rose-500/25 text-rose-400 text-[10px] font-black px-3 py-1.5 rounded-full shadow-[0_0_12px_rgba(225,29,72,0.12)] tracking-wider">
            <Zap size={10} />
            {loading ? 'SYNCING DATA' : 'BACKEND DATA'}
          </div>
          <button
            type="button"
            onClick={() => loadDashboardData({ refresh: true })}
            disabled={loading || refreshing}
            className="w-8 h-8 rounded-xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center hover:bg-white/[0.07] disabled:opacity-50 transition-colors"
            title="Refresh dashboard"
            aria-label="Refresh dashboard"
          >
            <RefreshCw size={13} className={`text-slate-400 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </motion.div>

      <motion.div initial="hidden" animate="visible" variants={fadeUp}
        className="bg-[#0a1628]/88 border border-white/[0.07] rounded-2xl p-4 backdrop-blur-2xl shadow-[0_4px_28px_rgba(0,0,0,0.24)]">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${portfolioReliable && !marketPartial ? 'bg-emerald-500/10 border-emerald-500/22 text-emerald-400' : 'bg-amber-500/10 border-amber-500/22 text-amber-400'}`}>
              <AlertTriangle size={15} />
            </div>
            <div>
              <p className="text-sm text-white font-black">Dashboard data quality</p>
              <p className="text-xs text-slate-600 mt-0.5 font-medium">
                Real backend data is shown where available. Empty widgets do not invent values.
              </p>
              {failedWidgets.length > 0 && (
                <p className="text-[11px] text-amber-300/85 mt-1 font-semibold">
                  Unavailable widgets: {failedWidgets.join(', ')}
                </p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
            <div className="rounded-xl bg-white/[0.025] border border-white/[0.055] px-3 py-2">
              <p className="text-slate-700 uppercase font-black">Portfolio</p>
              <p className="text-slate-300 font-black">{!portfolio ? 'Unavailable' : portfolioReliable ? 'Reliable' : 'Partial'}</p>
            </div>
            <div className="rounded-xl bg-white/[0.025] border border-white/[0.055] px-3 py-2">
              <p className="text-slate-700 uppercase font-black">Market</p>
              <p className="text-slate-300 font-black">{markets.length === 0 ? 'Unavailable' : marketPartial ? 'Partial' : 'Live'}</p>
            </div>
            <div className="rounded-xl bg-white/[0.025] border border-white/[0.055] px-3 py-2">
              <p className="text-slate-700 uppercase font-black">Trades</p>
              <p className="text-slate-300 font-black">{serviceQuality?.trades || '--'}</p>
            </div>
            <div className="rounded-xl bg-white/[0.025] border border-white/[0.055] px-3 py-2">
              <p className="text-slate-700 uppercase font-black">Warnings</p>
              <p className="text-slate-300 font-black">{portfolio?.warnings?.length || 0}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stat cards */}
      <motion.div
        initial="hidden" animate="visible" variants={stagger}
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5"
      >
        {stats.map((s) => (
          <motion.div key={s.label} variants={fadeUp}>
            <StatCard {...s} />
          </motion.div>
        ))}
      </motion.div>

      {/* Chart + AI Signal */}
      <motion.div
        initial="hidden" animate="visible" variants={stagger}
        className="grid grid-cols-1 lg:grid-cols-3 gap-3.5"
      >
        <motion.div variants={fadeUp} className="lg:col-span-2">
          <PerformanceChart
            history={portfolioHistory}
            loading={loading && !portfolioHistory}
            unavailable={serviceQuality?.history === 'rejected'}
          />
        </motion.div>
        <motion.div variants={fadeUp} className="h-full">
          <AISignalCard
            aiSignal={aiSignal}
            loading={loading && !aiSignal}
            unavailable={serviceQuality?.aiSignal === 'rejected'}
          />
        </motion.div>
      </motion.div>

      {/* Market + Portfolio */}
      <motion.div
        initial="hidden" animate="visible" variants={stagger}
        className="grid grid-cols-1 lg:grid-cols-2 gap-3.5"
      >
        <motion.div variants={fadeUp}><MarketOverview markets={markets} dataQuality={marketDataQuality} loading={loading && markets.length === 0} /></motion.div>
        <motion.div variants={fadeUp}><PortfolioSummary portfolio={portfolio} loading={loading && !portfolio} /></motion.div>
      </motion.div>

      {/* Recent trades */}
      <motion.div initial="hidden" animate="visible" variants={fadeUp}>
        <RecentTrades trades={trades || []} loading={loading && !trades} />
      </motion.div>

    </div>
  )
}
