import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import BotControlPanel from '../components/bot/BotControlPanel'
import BotStatusCard   from '../components/bot/BotStatusCard'
import BotHistory      from '../components/bot/BotHistory'
import { Card, Badge, Button } from '../components/ui'
import { getBotStatus, runBotTick, startBot, stopBot } from '../services/botService'

const fadeUp = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0.16, 1, 0.3, 1] } } }

const emptyBot = {
  success: true, timestamp: null, source: 'backend', provider: 'internal-paper-bot', fallback: false,
  dataQuality: { hasRealBotEngine: true, usesMockPerformance: false, isIndicative: false, warnings: ['Bot status has not been loaded yet.'] },
  status: { isRunning: false, mode: 'paper', strategy: null, symbol: null, startedAt: null, stoppedAt: null, lastTickAt: null, positionSize: null },
  performance: null, recentActions: [], warnings: [], error: null, message: '',
}

export default function TradingBot() {
  const [bot,          setBot]          = useState(emptyBot)
  const [loading,      setLoading]      = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [tickLoading,  setTickLoading]  = useState(false)
  const [error,        setError]        = useState(null)

  const loadStatus = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true)
    setError(null)
    const data = await getBotStatus()
    setBot(data)
    if (!data.success) setError(data.error || data.message || 'Impossible de charger le statut.')
    if (!silent) setLoading(false)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => loadStatus(), 0)
    return () => clearTimeout(timer)
  }, [loadStatus])

  const handleStart = async (config) => {
    setActionLoading(true); setError(null)
    const data = await startBot(config)
    setBot(data)
    if (!data.success) setError(data.error || data.message || 'Impossible de démarrer le bot.')
    setActionLoading(false)
  }

  const handleStop = async () => {
    setActionLoading(true); setError(null)
    const data = await stopBot()
    setBot(data)
    if (!data.success) setError(data.error || data.message || 'Impossible d\'arrêter le bot.')
    setActionLoading(false)
  }

  const handleTick = async () => {
    setTickLoading(true); setError(null)
    const data = await runBotTick()
    setBot(data)
    if (!data.success) setError(data.error || data.message || 'Impossible d\'exécuter le tick.')
    setTickLoading(false)
  }

  const running = Boolean(bot?.status?.isRunning)

  return (
    <div className="space-y-6">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <motion.div initial="hidden" animate="visible" variants={fadeUp}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-label uppercase tracking-wider text-white/40 mb-1">Automatisation</p>
            <h1 className="text-display-sm font-black text-white">Trading Bot</h1>
            <p className="text-body text-white/40">Configurez et pilotez votre bot de paper trading</p>
          </div>
          <div className="flex items-center gap-2">
            {running ? (
              <Badge variant="success" dot size="sm">Actif</Badge>
            ) : (
              <Badge variant="neutral" size="sm">Inactif</Badge>
            )}
            <Button
              variant="secondary" size="sm"
              onClick={() => loadStatus()}
              disabled={loading || actionLoading}
              loading={loading}
            >
              <RefreshCw size={12} className="mr-1.5" />
              Actualiser
            </Button>
          </div>
        </div>
      </motion.div>

      {/* ── Erreur ──────────────────────────────────────────────────────── */}
      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/8 px-4 py-3 text-body-sm font-semibold text-amber-300">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" /><span>{error}</span>
        </div>
      )}

      {/* ── Contenu ─────────────────────────────────────────────────────── */}
      {loading ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card padding="lg" className="min-h-[260px] flex items-center justify-center text-center">
            <div>
              <span className="w-6 h-6 border-2 border-white/20 border-t-rose-400 rounded-full animate-spin inline-block mb-4" />
              <p className="text-body text-white/40 font-bold">Chargement du statut...</p>
            </div>
          </Card>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Panneau de contrôle + statut */}
          <motion.div
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="space-y-4"
          >
            <Card padding="none">
              <BotControlPanel
                running={running} loading={actionLoading} error={error}
                onStart={handleStart} onStop={handleStop}
                onTick={handleTick} tickLoading={tickLoading}
              />
            </Card>
            <BotStatusCard bot={bot} />
          </motion.div>

          {/* Historique */}
          <motion.div
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="lg:col-span-2"
          >
            <Card padding="md">
              <BotHistory actions={bot?.recentActions || []} />
            </Card>
          </motion.div>
        </div>
      )}
    </div>
  )
}
