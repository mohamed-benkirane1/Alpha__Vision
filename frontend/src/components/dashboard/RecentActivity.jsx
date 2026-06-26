import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Activity, Bot, BrainCircuit, CreditCard, FlaskConical,
  ListPlus, LogIn, RefreshCw, ShoppingCart,
} from 'lucide-react'
import { getActivities } from '../../services/activityService'
import { formatDateTime } from '../../utils/formatters'

const TYPE_ICON = {
  'auth:login': LogIn,
  'auth:signup': LogIn,
  'payment:demo_deposit': CreditCard,
  'payment:deposit': CreditCard,
  'payment:subscription': CreditCard,
  'trade:executed': ShoppingCart,
  'bot:start': Bot,
  'bot:stop': Bot,
  'backtest:run': FlaskConical,
  'backtest:compare': FlaskConical,
  'watchlist:add': ListPlus,
  'watchlist:remove': ListPlus,
  'portfolio:analysis': BrainCircuit,
}

function getActivityIcon(type) {
  return TYPE_ICON[type] || Activity
}

export default function RecentActivity({ limit = 8 }) {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const loadActivity = useCallback(async ({ refresh = false } = {}) => {
    if (refresh) setRefreshing(true)
    else setLoading(true)
    setError('')

    const result = await getActivities({ limit })
    if (result.success) setActivities(result.activities)
    else setError(result.error || 'Unable to load activity.')

    setLoading(false)
    setRefreshing(false)
  }, [limit])

  useEffect(() => {
    const timer = window.setTimeout(() => loadActivity(), 0)
    return () => window.clearTimeout(timer)
  }, [loadActivity])

  return (
    <motion.div
      whileHover={{ borderColor: 'rgba(225,29,72,0.14)' }}
      className="bg-[#0a1628]/88 border border-white/[0.07] rounded-2xl p-5 backdrop-blur-2xl shadow-[0_4px_28px_rgba(0,0,0,0.32)] transition-colors duration-300 h-full"
    >
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <div className="mb-0.5 flex items-center gap-2">
            <Activity size={14} className="text-rose-400" />
            <h2 className="text-body font-bold text-white">Recent Activity</h2>
          </div>
          <p className="text-label font-medium text-slate-600">Account, paper trades, bot and backtest events</p>
        </div>
        <button
          type="button"
          onClick={() => loadActivity({ refresh: true })}
          disabled={loading || refreshing}
          className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.03] text-white/40 transition hover:text-white disabled:opacity-50"
          title="Refresh activity"
        >
          <RefreshCw size={13} className={refreshing ? 'animate-spin text-rose-400' : ''} />
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/8 px-3 py-2 text-body-sm font-semibold text-amber-300">
          {error}
        </div>
      )}

      {!error && loading && (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-14 animate-pulse rounded-xl border border-white/[0.05] bg-white/[0.025]" />
          ))}
        </div>
      )}

      {!error && !loading && activities.length === 0 && (
        <div className="rounded-xl border border-dashed border-white/[0.08] bg-white/[0.02] px-4 py-8 text-center">
          <p className="text-body-sm font-bold text-slate-500">No activity yet</p>
          <p className="mt-1 text-label text-slate-700">Important actions will appear here automatically.</p>
        </div>
      )}

      {!error && !loading && activities.length > 0 && (
        <div className="space-y-2">
          {activities.map((item) => {
            const Icon = getActivityIcon(item.type)
            return (
              <div key={item.id} className="flex items-start gap-3 rounded-xl border border-white/[0.055] bg-white/[0.025] px-3 py-2.5">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-rose-500/16 bg-rose-500/8 text-rose-300">
                  <Icon size={13} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-body-sm font-black text-white">{item.title}</p>
                  <p className="mt-0.5 line-clamp-2 text-label font-medium text-slate-500">{item.description || item.type}</p>
                  <p className="mt-1 text-caption font-bold text-slate-700">{formatDateTime(item.createdAt)}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </motion.div>
  )
}
