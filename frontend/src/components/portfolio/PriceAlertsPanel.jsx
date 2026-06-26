import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  AlertTriangle, Bell, BellRing, Loader2, Plus, Power, RefreshCw, Trash2,
} from 'lucide-react'
import { checkAlerts, createAlert, deleteAlert, getAlerts, updateAlert } from '../../services/alertService'
import { formatDateTime, formatPrice } from '../../utils/formatters'

const STATUS_STYLE = {
  active: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300',
  triggered: 'border-rose-500/25 bg-rose-500/10 text-rose-300',
  disabled: 'border-white/[0.07] bg-white/[0.03] text-slate-500',
}

function StatusBadge({ status }) {
  const label = status || 'active'
  return (
    <span className={`rounded-full border px-2 py-0.5 text-caption font-black uppercase ${STATUS_STYLE[label] || STATUS_STYLE.active}`}>
      {label}
    </span>
  )
}

function getConditionLabel(condition) {
  return condition === 'below' ? 'Below' : 'Above'
}

function getDisplayPrice(alert) {
  return alert.lastCheckedPrice ?? alert.currentPrice ?? alert.currentPriceAtCreation
}

export default function PriceAlertsPanel() {
  const [alerts, setAlerts] = useState([])
  const [form, setForm] = useState({ symbol: '', condition: 'above', targetPrice: '' })
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState(false)
  const [creating, setCreating] = useState(false)
  const [mutatingId, setMutatingId] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [warnings, setWarnings] = useState([])

  const loadAlerts = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true)
    setError('')
    const result = await getAlerts()
    if (result.success) {
      setAlerts(result.alerts)
      setWarnings(result.warnings)
    } else {
      setError(result.error || 'Unable to load price alerts.')
    }
    if (!silent) setLoading(false)
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => loadAlerts(), 0)
    return () => window.clearTimeout(timer)
  }, [loadAlerts])

  const triggeredAlerts = useMemo(
    () => alerts.filter((alert) => alert.status === 'triggered'),
    [alerts],
  )

  const hasAlerts = alerts.length > 0
  const isBusy = loading || checking || creating || Boolean(mutatingId)
  const targetPriceValue = String(form.targetPrice || '').trim()
  const targetPriceNumber = Number(targetPriceValue)
  const targetPriceInvalid = targetPriceValue !== '' && (!Number.isFinite(targetPriceNumber) || targetPriceNumber <= 0)
  const canCreateAlert = form.symbol.trim() && targetPriceValue && !targetPriceInvalid

  const handleCreate = async (event) => {
    event.preventDefault()
    const symbol = form.symbol.trim().toUpperCase()
    const targetPrice = Number(form.targetPrice)

    if (!symbol) {
      setError('Symbol is required.')
      return
    }
    if (!Number.isFinite(targetPrice) || targetPrice <= 0) {
      setError('Target price must be greater than 0.')
      return
    }
    if (creating) return

    setCreating(true)
    setError('')
    setMessage('')
    setWarnings([])

    const result = await createAlert({
      symbol,
      condition: form.condition,
      targetPrice,
    })

    if (result.success) {
      setAlerts(result.alerts)
      setMessage(result.message || `${symbol} alert created.`)
      setWarnings(result.warnings)
      setForm((current) => ({ ...current, symbol: '', targetPrice: '' }))
    } else {
      setError(result.error || 'Unable to create price alert.')
    }

    setCreating(false)
  }

  const handleCheck = async () => {
    if (checking) return
    setChecking(true)
    setError('')
    setMessage('')
    setWarnings([])

    const result = await checkAlerts()
    if (result.success) {
      setAlerts(result.alerts)
      setWarnings(result.warnings)
      setMessage(result.message || 'Price alerts checked.')
    } else {
      setError(result.error || 'Unable to check price alerts.')
    }
    setChecking(false)
  }

  const handleToggle = async (alert) => {
    if (!alert.id || mutatingId) return
    const nextStatus = alert.status === 'active' ? 'disabled' : 'active'
    setMutatingId(alert.id)
    setError('')
    setMessage('')

    const result = await updateAlert(alert.id, { status: nextStatus })
    if (result.success) {
      setAlerts(result.alerts)
      setMessage(result.message || `${alert.symbol} alert updated.`)
      setWarnings(result.warnings)
    } else {
      setError(result.error || 'Unable to update price alert.')
    }
    setMutatingId('')
  }

  const handleDelete = async (alert) => {
    if (!alert.id || mutatingId) return
    setMutatingId(alert.id)
    setError('')
    setMessage('')

    const result = await deleteAlert(alert.id)
    if (result.success) {
      setAlerts(result.alerts)
      setMessage(result.message || `${alert.symbol} alert deleted.`)
      setWarnings(result.warnings)
    } else {
      setError(result.error || 'Unable to delete price alert.')
    }
    setMutatingId('')
  }

  return (
    <motion.section
      whileHover={{ borderColor: 'rgba(225,29,72,0.12)' }}
      className="bg-[#0a1628]/88 border border-white/[0.07] rounded-2xl p-5 backdrop-blur-2xl shadow-[0_4px_28px_rgba(0,0,0,0.32)] transition-all duration-300"
    >
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Bell size={13} className="text-rose-400" />
            <h2 className="text-body font-bold text-white">Price Alerts</h2>
            <span className="text-caption text-slate-700 font-bold">{loading ? 'Loading' : `${alerts.length} alerts`}</span>
          </div>
          <p className="mt-1 text-label font-medium text-slate-600">
            Manual checks against backend market prices. No real-time push or broker action.
          </p>
        </div>

        <button
          type="button"
          onClick={handleCheck}
          disabled={isBusy || !hasAlerts}
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-rose-500/22 bg-rose-500/10 px-3 text-label font-black text-rose-300 transition hover:bg-rose-500/15 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {checking ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
          Check alerts
        </button>
      </div>

      <form onSubmit={handleCreate} className="mb-4 grid grid-cols-1 gap-2 lg:grid-cols-[1fr_140px_160px_auto]">
        <input
          value={form.symbol}
          onChange={(event) => setForm((current) => ({ ...current, symbol: event.target.value.toUpperCase() }))}
          placeholder="BTC, ETH, AAPL"
          disabled={isBusy}
          className="h-9 min-w-0 rounded-xl border border-white/[0.08] bg-[#060D1C]/80 px-3 text-body-sm font-bold text-white placeholder-slate-700 outline-none transition focus:border-rose-500/45 disabled:cursor-not-allowed disabled:opacity-60"
        />
        <select
          value={form.condition}
          onChange={(event) => setForm((current) => ({ ...current, condition: event.target.value }))}
          disabled={isBusy}
          className="h-9 rounded-xl border border-white/[0.08] bg-[#060D1C]/80 px-3 text-body-sm font-bold text-white outline-none transition focus:border-rose-500/45 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <option value="above">Above</option>
          <option value="below">Below</option>
        </select>
        <input
          type="number"
          min="0.000001"
          step="0.000001"
          value={form.targetPrice}
          onChange={(event) => setForm((current) => ({ ...current, targetPrice: event.target.value }))}
          placeholder="Target price"
          disabled={isBusy}
          className="h-9 rounded-xl border border-white/[0.08] bg-[#060D1C]/80 px-3 text-body-sm font-bold text-white placeholder-slate-700 outline-none transition focus:border-rose-500/45 disabled:cursor-not-allowed disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={isBusy || !canCreateAlert}
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-white/[0.07] bg-white/[0.035] px-3 text-label font-black text-slate-300 transition hover:border-rose-500/22 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {creating ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
          Add alert
        </button>
      </form>

      {targetPriceInvalid && (
        <p className="mb-3 text-label font-semibold text-amber-300/90">
          Target price must be greater than 0.
        </p>
      )}

      {triggeredAlerts.length > 0 && (
        <div className="mb-3 flex items-start gap-2 rounded-xl border border-rose-500/22 bg-rose-500/[0.075] px-3 py-2 text-label font-semibold text-rose-200">
          <BellRing size={13} className="mt-0.5 shrink-0" />
          <span>
            {triggeredAlerts.length} triggered alert{triggeredAlerts.length > 1 ? 's' : ''}: {triggeredAlerts.slice(0, 3).map((alert) => alert.symbol).join(', ')}
          </span>
        </div>
      )}

      {error && (
        <div className="mb-3 flex items-start gap-2 rounded-xl border border-amber-500/18 bg-amber-500/[0.055] px-3 py-2 text-label font-semibold text-amber-300/90">
          <AlertTriangle size={12} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {message && !error && (
        <p className="mb-3 text-label font-semibold text-emerald-400/85">{message}</p>
      )}

      {warnings.length > 0 && !error && (
        <div className="mb-3 rounded-xl border border-amber-500/18 bg-amber-500/[0.055] px-3 py-2 text-label font-semibold text-amber-300/90">
          {warnings.slice(0, 2).join(' ')}
        </div>
      )}

      <div className="space-y-1.5">
        {loading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-20 animate-pulse rounded-xl border border-white/[0.045] bg-white/[0.02]" />
          ))
        ) : hasAlerts ? (
          alerts.map((alert, index) => {
            const rowBusy = mutatingId === alert.id
            const displayPrice = getDisplayPrice(alert)
            const toggleLabel = alert.status === 'active' ? 'Disable' : 'Activate'

            return (
              <motion.div
                key={alert.id || `${alert.symbol}-${index}`}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.035 }}
                className="grid grid-cols-1 gap-3 rounded-xl border border-white/[0.045] bg-white/[0.02] px-3 py-3 lg:grid-cols-[1fr_auto] lg:items-center"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-body font-black text-white">{alert.symbol}</p>
                    <StatusBadge status={alert.status} />
                    <span className="text-caption font-black uppercase text-slate-700">
                      {getConditionLabel(alert.condition)} {formatPrice(alert.targetPrice)}
                    </span>
                  </div>
                  <p className="mt-1 text-label font-medium text-slate-600">
                    Last checked {formatDateTime(alert.lastCheckedAt)} at <span className="text-slate-400">{formatPrice(displayPrice)}</span>
                  </p>
                  <p className="mt-0.5 text-caption font-medium text-slate-700">
                    Created {formatDateTime(alert.createdAt)}
                    {alert.triggeredAt ? ` - Triggered ${formatDateTime(alert.triggeredAt)}` : ''}
                  </p>
                  {alert.warning && (
                    <p className="mt-1 text-caption font-semibold text-amber-400/75">{alert.warning}</p>
                  )}
                </div>

                <div className="flex flex-wrap justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggle(alert)}
                    disabled={isBusy}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.025] px-2.5 text-caption font-black text-slate-500 transition hover:border-rose-500/22 hover:text-rose-300 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {rowBusy ? <Loader2 size={12} className="animate-spin" /> : <Power size={12} />}
                    {toggleLabel}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(alert)}
                    disabled={isBusy}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.025] px-2.5 text-caption font-black text-slate-500 transition hover:border-rose-500/22 hover:text-rose-300 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Trash2 size={12} />
                    Delete
                  </button>
                </div>
              </motion.div>
            )
          })
        ) : (
          <div className="py-10 text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.03]">
              <Bell size={16} className="text-slate-700" />
            </div>
            <p className="text-body-sm font-medium text-slate-600">No price alerts yet.</p>
            <p className="mt-1 text-label text-slate-700">Create one for a symbol you want to monitor manually.</p>
          </div>
        )}
      </div>
    </motion.section>
  )
}
