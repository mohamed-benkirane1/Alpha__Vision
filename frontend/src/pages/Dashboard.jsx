import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Wallet, TrendingUp, Target, Cpu, Zap, Bell, Search } from 'lucide-react'

import StatCard         from '../components/dashboard/StatCard'
import PerformanceChart from '../components/dashboard/PerformanceChart'
import AISignalCard     from '../components/dashboard/AISignalCard'
import MarketOverview   from '../components/dashboard/MarketOverview'
import PortfolioSummary from '../components/dashboard/PortfolioSummary'
import RecentTrades     from '../components/dashboard/RecentTrades'
import { useAuth } from '../context/useAuth'
import { getBotStatus } from '../services/botService'
import { getAllPrices } from '../services/marketService'
import { getPortfolio } from '../services/portfolioService'
import { getTradeHistory } from '../services/tradingService'

const fadeUp  = { hidden: { opacity: 0, y: 18 }, visible: { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0.16, 1, 0.3, 1] } } }
const stagger = { visible: { transition: { staggerChildren: 0.08 } } }

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

const toNumber = (value) => {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

const formatCurrency = (value, { sign = false } = {}) => {
  const number = toNumber(value)
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(Math.abs(number))

  if (!sign) return formatted
  return `${number >= 0 ? '+' : '-'}${formatted}`
}

const formatPercent = (value) => {
  const number = toNumber(value)
  return `${number >= 0 ? '+' : ''}${number.toFixed(1)}%`
}

const getFirstName = (name) => {
  if (!name) return 'Trader'
  return name.trim().split(' ')[0] || 'Trader'
}

function buildStats({ portfolio, trades, bot, loading }) {
  const totalValue = portfolio?.totalValue
  const totalProfit = portfolio?.totalProfit
  const totalProfitPercent = portfolio?.totalProfitPercent
  const hasTradeData = Array.isArray(trades)
  const tradeCount = hasTradeData ? trades.length : 0
  const activeBot = bot?.status === 'running'

  return [
    {
      icon: Wallet,
      label: 'Portfolio Value',
      value: loading && !portfolio ? 'Loading...' : (portfolio ? formatCurrency(totalValue) : '$24,856.40'),
      sub: portfolio ? `${portfolio.holdings?.length || 0} assets tracked` : '+$1,234 today (+5.2%)',
      subUp: true,
      accentColor: 'rose',
    },
    {
      icon: TrendingUp,
      label: 'Total Profit',
      value: loading && !portfolio ? 'Loading...' : (portfolio ? formatCurrency(totalProfit, { sign: true }) : '+$3,241.20'),
      sub: portfolio ? `${formatPercent(totalProfitPercent)} all time` : '+15.8% all time',
      subUp: toNumber(totalProfit) >= 0,
      accentColor: 'emerald',
    },
    {
      icon: Target,
      label: 'Win Rate',
      value: '72.4%',
      sub: hasTradeData ? `${tradeCount} trades completed` : '48 trades completed',
      subUp: true,
      accentColor: 'cyan',
    },
    {
      icon: Cpu,
      label: 'Active Bot',
      value: loading && !bot ? 'Loading...' : (activeBot ? 'RUNNING' : 'STOPPED'),
      sub: activeBot ? `${bot.symbol || 'BOT'}/USDT - ${(bot.strategy || 'multi').toUpperCase()} strategy` : 'No active bot',
      subUp: activeBot,
      accentColor: 'amber',
    },
  ]
}

export default function Dashboard() {
  const { user } = useAuth()
  const [portfolio, setPortfolio] = useState(null)
  const [trades, setTrades] = useState(null)
  const [markets, setMarkets] = useState([])
  const [bot, setBot] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    async function loadDashboardData() {
      setLoading(true)
      setError('')

      const [portfolioResult, tradesResult, marketsResult, botResult] = await Promise.allSettled([
        getPortfolio(),
        getTradeHistory(),
        getAllPrices(),
        getBotStatus(),
      ])

      if (!isMounted) return

      if (portfolioResult.status === 'fulfilled') setPortfolio(portfolioResult.value)
      if (tradesResult.status === 'fulfilled') setTrades(Array.isArray(tradesResult.value) ? tradesResult.value : [])
      if (marketsResult.status === 'fulfilled') setMarkets(Array.isArray(marketsResult.value) ? marketsResult.value : [])
      if (botResult.status === 'fulfilled') setBot(botResult.value)

      const failed = [portfolioResult, tradesResult, marketsResult, botResult].some((result) => result.status === 'rejected')
      if (failed) setError('Some dashboard data could not be refreshed. Showing the latest available view.')

      setLoading(false)
    }

    loadDashboardData()

    return () => {
      isMounted = false
    }
  }, [])

  const stats = useMemo(
    () => buildStats({ portfolio, trades, bot, loading }),
    [portfolio, trades, bot, loading],
  )

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
          {error && (
            <p className="text-[11px] text-amber-400/80 mt-2 font-semibold">{error}</p>
          )}
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Search */}
          <div className="hidden sm:flex items-center gap-2 bg-white/[0.04] border border-white/[0.07] rounded-xl px-3 py-2 w-44">
            <Search size={12} className="text-slate-600 shrink-0" />
            <input
              placeholder="Search..."
              className="bg-transparent text-xs text-slate-400 placeholder-slate-700 outline-none w-full font-medium"
            />
          </div>

          {/* Bell */}
          <button className="relative w-8 h-8 rounded-xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center hover:bg-white/[0.07] transition-colors">
            <Bell size={13} className="text-slate-400" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-rose-400 ring-[1.5px] ring-[#070E20]" />
          </button>

          {/* Live badge */}
          <div className="flex items-center gap-1.5 bg-rose-500/10 border border-rose-500/25 text-rose-400 text-[10px] font-black px-3 py-1.5 rounded-full shadow-[0_0_12px_rgba(225,29,72,0.12)] tracking-wider">
            <Zap size={10} />
            {loading ? 'SYNCING DATA' : 'LIVE DATA'}
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
          <PerformanceChart loading={loading && !portfolio} />
        </motion.div>
        <motion.div variants={fadeUp} className="h-full">
          <AISignalCard />
        </motion.div>
      </motion.div>

      {/* Market + Portfolio */}
      <motion.div
        initial="hidden" animate="visible" variants={stagger}
        className="grid grid-cols-1 lg:grid-cols-2 gap-3.5"
      >
        <motion.div variants={fadeUp}><MarketOverview markets={markets} loading={loading && markets.length === 0} /></motion.div>
        <motion.div variants={fadeUp}><PortfolioSummary portfolio={portfolio} loading={loading && !portfolio} /></motion.div>
      </motion.div>

      {/* Recent trades */}
      <motion.div initial="hidden" animate="visible" variants={fadeUp}>
        <RecentTrades trades={trades || []} loading={loading && !trades} />
      </motion.div>

    </div>
  )
}
