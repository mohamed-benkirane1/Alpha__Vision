import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, Cpu, RefreshCw, Server } from 'lucide-react'
import BotControlPanel from '../components/bot/BotControlPanel'
import BotStatusCard from '../components/bot/BotStatusCard'
import BotHistory from '../components/bot/BotHistory'
import { getBotStatus, startBot, stopBot } from '../services/botService'

const fadeUp = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0.16, 1, 0.3, 1] } } }

const emptyBot = {
  success: true,
  timestamp: null,
  source: 'backend',
  provider: 'internal-bot-controller',
  fallback: true,
  dataQuality: {
    hasRealBotEngine: false,
    usesMockPerformance: false,
    isIndicative: true,
    warnings: ['Bot status has not been loaded yet.'],
  },
  status: {
    isRunning: false,
    mode: 'unavailable',
    strategy: null,
    symbol: null,
    startedAt: null,
    stoppedAt: null,
  },
  performance: null,
  recentActions: [],
  warnings: [],
  error: null,
  message: '',
}

export default function TradingBot() {
  const [bot, setBot] = useState(emptyBot)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState(null)

  const loadStatus = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true)
    setError(null)

    const data = await getBotStatus()
    setBot(data)
    if (!data.success) setError(data.error || data.message || 'Unable to load bot status.')

    if (!silent) setLoading(false)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => loadStatus(), 0)
    return () => clearTimeout(timer)
  }, [loadStatus])

  const handleStart = async (config) => {
    setActionLoading(true)
    setError(null)

    const data = await startBot(config)
    setBot(data)
    if (!data.success) setError(data.error || data.message || 'Unable to start bot.')

    setActionLoading(false)
  }

  const handleStop = async () => {
    setActionLoading(true)
    setError(null)

    const data = await stopBot()
    setBot(data)
    if (!data.success) setError(data.error || data.message || 'Unable to stop bot.')

    setActionLoading(false)
  }

  const running = Boolean(bot?.status?.isRunning)

  return (
    <div className="space-y-5">
      <motion.div initial="hidden" animate="visible" variants={fadeUp}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <Cpu size={16} className="text-rose-400" />
              <h1 className="text-2xl font-black text-white">Trading Bot</h1>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Backend bot controller. Real execution engine is not implemented yet.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-emerald-400">
              <Server size={10} />
              Backend API
            </span>
            <button
              type="button"
              onClick={() => loadStatus()}
              disabled={loading || actionLoading}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400 transition hover:border-white/[0.16] hover:text-white disabled:opacity-45"
            >
              <RefreshCw size={10} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>
      </motion.div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/8 px-4 py-3 text-xs font-semibold text-amber-300">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="bg-[#0a1628]/88 border border-white/[0.07] rounded-2xl p-10 backdrop-blur-2xl shadow-[0_4px_28px_rgba(0,0,0,0.28)] flex flex-col items-center justify-center text-center min-h-[260px]">
          <span className="w-6 h-6 border-2 border-white/20 border-t-rose-400 rounded-full animate-spin mb-4" />
          <p className="text-sm text-slate-500 font-bold">Loading bot status...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="space-y-3.5"
          >
            <BotControlPanel
              running={running}
              loading={actionLoading}
              error={error}
              onStart={handleStart}
              onStop={handleStop}
            />
            <BotStatusCard bot={bot} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2"
          >
            <BotHistory actions={bot?.recentActions || []} />
          </motion.div>
        </div>
      )}
    </div>
  )
}
