import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { AlertTriangle, RefreshCw, Wallet, TrendingUp, Database, Cpu, Zap } from 'lucide-react'
import useCountUp from '../hooks/useCountUp'

import StatCard         from '../components/dashboard/StatCard'
import PerformanceChart from '../components/dashboard/PerformanceChart'
import AISignalCard     from '../components/dashboard/AISignalCard'
import MarketOverview   from '../components/dashboard/MarketOverview'
import PortfolioSummary from '../components/dashboard/PortfolioSummary'
import RecentTrades     from '../components/dashboard/RecentTrades'

import { Card, Badge } from '../components/ui'
import { useAuth } from '../context/useAuth'
import { getDashboardLiveData } from '../services/dashboardService'
import { getValidNumber, formatCurrency, formatPercent, formatDateTime } from '../utils/formatters'

const fadeUp  = { hidden: { opacity: 0, y: 18 }, visible: { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0.16, 1, 0.3, 1] } } }
const stagger = { visible: { transition: { staggerChildren: 0.08 } } }
const AUTO_REFRESH_MS = 30000

function getGreeting() {
  try {
    const h = new Date().getHours()
    if (h < 12) return 'Bonjour'
    if (h < 17) return 'Bon après-midi'
    return 'Bonsoir'
  } catch {
    return 'Bonjour'
  }
}

const getFirstName = (name) => {
  if (!name || typeof name !== 'string') return 'Trader'
  return name.trim().split(' ')[0] || 'Trader'
}

/** Construit les 4 StatCards secondaires depuis les données portfolio/bot/trades */
function buildStats({ portfolio, trades, bot, loading }) {
  const totals         = portfolio?.totals || {}
  const cashBalance    = getValidNumber(totals.cashBalance ?? portfolio?.balance)
  const holdingsValue  = getValidNumber(totals.holdingsValue ?? portfolio?.totalValue)
  const totalProfit    = getValidNumber(totals.totalProfit ?? portfolio?.totalProfit)
  const totalProfitPct = getValidNumber(totals.totalProfitPercent ?? portfolio?.totalProfitPercent)
  const holdingsCount  = Array.isArray(portfolio?.holdings) ? portfolio.holdings.length : 0
  const investedValue  = getValidNumber(totals.totalInvested)
  const hasPnlData     = holdingsCount > 0 || (investedValue !== null && investedValue > 0)
  const tradeCount     = Array.isArray(trades) ? trades.length : 0

  const botStatus          = bot?.status || {}
  const botEngineAvailable = bot?.dataQuality?.hasRealBotEngine === true
    && bot?.fallback !== true
    && botStatus.mode !== 'unavailable'
  const activeBot = botEngineAvailable && botStatus.isRunning === true
  const botValue  = !bot ? '--'
    : !botEngineAvailable ? 'UNAVAILABLE'
    : activeBot ? 'RUNNING'
    : 'STOPPED'

  const botDetails = !bot
    ? `Bot unavailable / ${tradeCount} trades`
    : activeBot
      ? [
          `Mode ${botStatus.mode || 'paper'}`,
          botStatus.strategy ? botStatus.strategy.toUpperCase() : null,
          botStatus.symbol || null,
        ].filter(Boolean).join(' / ')
      : null

  const botSubNode = botDetails
    ? botDetails
    : (
        <span>
          No active bot —{' '}
          <Link to="/bot" className="text-amber-400 underline underline-offset-2 hover:text-amber-300 transition-colors">
            Créer un bot →
          </Link>
        </span>
      )

  return [
    {
      icon: TrendingUp,
      label: 'Profit total',
      value: (loading && !portfolio) ? '…'
        : hasPnlData ? formatCurrency(totalProfit, { sign: true })
        : '--',
      sub:   hasPnlData
        ? `${formatPercent(totalProfitPct, 1)} non réalisé`
        : 'Aucune position ouverte',
      subUp: hasPnlData ? (totalProfit ?? 0) >= 0 : null,
    },
    {
      icon: Database,
      label: 'Cash disponible',
      value: (loading && !portfolio) ? '…' : formatCurrency(cashBalance),
      sub:   `Holdings ${formatCurrency(holdingsValue)}`,
      subUp: true,
    },
    {
      icon: Wallet,
      label: 'Positions ouvertes',
      value: (loading && !portfolio) ? '…' : String(holdingsCount),
      sub:   portfolio ? `${tradeCount} trades exécutés` : 'Aucune donnée',
      subUp: holdingsCount > 0,
    },
    {
      icon: Cpu,
      label: 'Bot status',
      value: (loading && !bot) ? '…' : botValue,
      sub:   botSubNode,
      subUp: activeBot,
    },
  ]
}

export default function Dashboard() {
  const { user } = useAuth()

  const [portfolio,         setPortfolio]         = useState(null)
  const [portfolioHistory,  setPortfolioHistory]  = useState(null)
  const [trades,            setTrades]            = useState(null)
  const [markets,           setMarkets]           = useState([])
  const [marketDataQuality, setMarketDataQuality] = useState(null)
  const [serviceQuality,    setServiceQuality]    = useState(null)
  const [bot,               setBot]               = useState(null)
  const [aiSignal,          setAiSignal]          = useState(null)
  const [loading,           setLoading]           = useState(true)
  const [refreshing,        setRefreshing]        = useState(false)
  const [error,             setError]             = useState('')
  const loadingRef   = useRef(false)
  const errorCountRef = useRef(0)

  const loadDashboardData = useCallback(async ({ refresh = false } = {}) => {
    if (loadingRef.current) return
    loadingRef.current = true
    if (refresh) setRefreshing(true)
    else setLoading(true)
    setError('')

    try {
      const data = await getDashboardLiveData()
      setPortfolio(data.portfolio ?? null)
      setPortfolioHistory(data.portfolioHistory ?? null)
      setTrades(Array.isArray(data.trades) ? data.trades : [])
      setMarkets(Array.isArray(data.markets) ? data.markets : [])
      setMarketDataQuality(data.marketDataQuality ?? null)
      setServiceQuality(data.dataQuality ?? null)
      setBot(data.bot ?? null)
      setAiSignal(data.aiSignal ?? null)
      errorCountRef.current = 0
      if (!data.success) setError('Some dashboard data could not be refreshed.')
    } catch (err) {
      console.error('[Dashboard] load failed:', err)
      setError('Dashboard data could not be refreshed from the backend.')
      errorCountRef.current += 1
    } finally {
      loadingRef.current = false
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => loadDashboardData(), 0)
    let intervalId

    const scheduleNext = () => {
      const backoffMs = errorCountRef.current === 0
        ? AUTO_REFRESH_MS
        : errorCountRef.current === 1
          ? AUTO_REFRESH_MS * 2
          : Math.min(AUTO_REFRESH_MS * 4, 120_000)
      intervalId = window.setTimeout(async () => {
        await loadDashboardData({ refresh: true })
        scheduleNext()
      }, backoffMs)
    }
    scheduleNext()

    return () => { window.clearTimeout(timer); window.clearTimeout(intervalId) }
  }, [loadDashboardData])

  // ── Derived values — toutes sécurisées ──────────────────────────────────────
  const stats = useMemo(
    () => buildStats({ portfolio, trades, bot, loading }),
    [portfolio, trades, bot, loading],
  )

  // portfolioValue : null si pas de donnée, number si disponible
  const portfolioValue  = getValidNumber(portfolio?.totals?.totalPortfolioValue)
  // portfolioChange : null si pas de donnée
  const portfolioChange = getValidNumber(portfolio?.totals?.totalProfitPercent)
  const hasDataError    = Boolean(error)

  // shouldReduce peut être null (SSR-like env dans framer-motion v12)
  const reducedMotionRaw = useReducedMotion()
  const shouldReduce     = reducedMotionRaw === true // null/undefined → false

  // Count-up Hero KPI — uniquement si on a un vrai nombre > 0
  const animationEnabled   = portfolioValue !== null && portfolioValue > 0 && !shouldReduce
  const animatedPortfolioVal = useCountUp(
    portfolioValue ?? 0,  // toujours un number, jamais null/NaN
    900,
    animationEnabled,
  )

  // Valeur affichée dans le Hero KPI (toujours formatée proprement)
  const heroDisplay = portfolioValue !== null
    ? formatCurrency(animatedPortfolioVal)
    : '--'

  // Nombre de holdings (toujours un number ou '--')
  const holdingsDisplay = Array.isArray(portfolio?.holdings)
    ? String(portfolio.holdings.length)
    : '--'

  return (
    <div className="space-y-6">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <motion.div
        initial="hidden" animate="visible" variants={fadeUp}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
      >
        <div>
          <p className="text-label uppercase tracking-wide text-white/35 mb-1">
            {getGreeting()}, {getFirstName(user?.name)}
          </p>
          <h1 className="text-heading font-black text-white leading-tight">Dashboard</h1>
          <p className="text-body-sm text-white/40 mt-1 font-medium">
            Dernière mise à jour{' '}
            <span className="text-white/55">
              {formatDateTime(portfolio?.lastUpdated || portfolio?.timestamp || null, 'time')}
            </span>
            {refreshing && <span className="text-rose-400/70 font-bold"> · Actualisation…</span>}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center gap-1.5 bg-rose-500/10 border border-rose-500/25 text-rose-400
                          text-caption font-black px-3 py-1.5 rounded-full tracking-wider">
            <Zap size={10} />
            {loading ? 'SYNCING' : 'LIVE'}
          </div>
          <button
            type="button"
            onClick={() => loadDashboardData({ refresh: true })}
            disabled={loading || refreshing}
            className="w-8 h-8 rounded-xl bg-white/[0.04] border border-white/[0.07]
                       flex items-center justify-center hover:bg-white/[0.07]
                       disabled:opacity-50 transition-colors"
            title="Actualiser"
            aria-label="Actualiser le dashboard"
          >
            <RefreshCw size={13} className={`text-white/40 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </motion.div>

      {/* ── Erreur discrète ─────────────────────────────────────────────── */}
      {hasDataError && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg
                          bg-amber-500/8 border border-amber-500/20 text-amber-400/70 text-body-sm">
            <AlertTriangle size={13} className="shrink-0" />
            <span>Certaines données sont temporairement indisponibles</span>
          </div>
        </motion.div>
      )}

      {/* ── Hero KPI ─────────────────────────────────────────────────────── */}
      <motion.div initial="hidden" animate="visible" variants={fadeUp}>
        <Card padding="lg" className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-rose-500/[0.05] to-transparent" />

          <div className="relative flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <p className="text-label uppercase tracking-wide text-white/40 mb-2">
                Valeur du Portfolio
              </p>

              {(loading && !portfolio) ? (
                <div className="w-48 h-10 rounded-xl bg-white/[0.06] animate-shimmer mb-3" />
              ) : (
                <p className="text-display font-black text-white tabular-nums font-mono leading-none mb-3">
                  {heroDisplay}
                </p>
              )}

              {portfolioChange !== null && (
                <div className="flex items-center gap-2">
                  <Badge
                    variant={portfolioChange >= 0 ? 'success' : 'danger'}
                    size="md"
                  >
                    {portfolioChange >= 0 ? '+' : ''}{formatPercent(portfolioChange, 2)}
                  </Badge>
                  <span className="text-body-sm text-white/35">variation non réalisée</span>
                </div>
              )}
            </div>

            <div className="sm:text-right shrink-0">
              <p className="text-label uppercase tracking-wide text-white/35 mb-1">Actifs</p>
              <p className="text-heading font-black text-white tabular-nums font-mono">
                {holdingsDisplay}
              </p>
              <p className="text-body-sm text-white/35 mt-0.5">positions</p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* ── StatCards secondaires ──────────────────────────────────────── */}
      <motion.div
        initial="hidden" animate="visible" variants={stagger}
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
      >
        {stats.map((s) => (
          <motion.div key={s.label} variants={fadeUp}>
            <StatCard {...s} />
          </motion.div>
        ))}
      </motion.div>

      {/* ── Chart + AI Signal ─────────────────────────────────────────── */}
      <motion.div
        initial="hidden" animate="visible" variants={stagger}
        className="grid grid-cols-1 lg:grid-cols-3 gap-4"
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

      {/* ── Market + Portfolio ────────────────────────────────────────── */}
      <motion.div
        initial="hidden" animate="visible" variants={stagger}
        className="grid grid-cols-1 lg:grid-cols-2 gap-4"
      >
        <motion.div variants={fadeUp}>
          <MarketOverview
            markets={markets}
            dataQuality={marketDataQuality}
            loading={loading && markets.length === 0}
          />
        </motion.div>
        <motion.div variants={fadeUp}>
          <PortfolioSummary portfolio={portfolio} loading={loading && !portfolio} />
        </motion.div>
      </motion.div>

      {/* ── Recent trades ─────────────────────────────────────────────── */}
      <motion.div initial="hidden" animate="visible" variants={fadeUp}>
        <RecentTrades trades={trades || []} loading={loading && !trades} />
      </motion.div>

    </div>
  )
}
