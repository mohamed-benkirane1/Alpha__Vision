import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  AlertTriangle,
  BadgeCheck,
  CreditCard,
  RefreshCw,
  Shield,
  Wallet,
} from 'lucide-react'
import {
  addDemoFunds,
  checkCheckoutSession,
  createDepositCheckoutSession,
  createCheckoutSession,
  getPaymentStatus,
  getPaymentTransactions,
  getPlans,
  getWebhookInfo,
} from '../services/paymentService'
import { useAuth } from '../context/useAuth'

const DEMO_AMOUNT = 10000
const fadeUp = { hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } } }

function formatCurrencyFromCents(value, currency = 'eur') {
  const number = Number(value)
  if (!Number.isFinite(number)) return '--'

  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(number / 100)
}

function formatCurrency(value) {
  const number = Number(value)
  if (!Number.isFinite(number)) return '--'

  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
  }).format(number)
}

function formatTransactionAmount(value, currency = 'EUR') {
  const number = Number(value)
  if (!Number.isFinite(number)) return '--'

  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: String(currency || 'EUR').toUpperCase(),
  }).format(number)
}

function formatDateTime(value) {
  if (!value) return '--'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '--'

  return date.toLocaleString([], {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function Notice({ tone = 'warning', children }) {
  const styles = tone === 'success'
    ? 'border-emerald-500/20 bg-emerald-500/8 text-emerald-300'
    : 'border-amber-500/20 bg-amber-500/8 text-amber-300'
  const Icon = tone === 'success' ? BadgeCheck : AlertTriangle

  return (
    <div className={`flex items-start gap-2 rounded-xl border px-4 py-3 text-xs font-semibold ${styles}`}>
      <Icon size={14} className="mt-0.5 shrink-0" />
      <span>{children}</span>
    </div>
  )
}

export default function Payments() {
  const { refreshUser } = useAuth()
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState(null)
  const [plans, setPlans] = useState([])
  const [transactions, setTransactions] = useState([])
  const [webhookInfo, setWebhookInfo] = useState(null)
  const [checkoutStatus, setCheckoutStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState(null)
  const [demoLoading, setDemoLoading] = useState(false)
  const [depositLoading, setDepositLoading] = useState(false)
  const [depositAmount, setDepositAmount] = useState('10')
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)

  const sessionId = searchParams.get('session_id')
  const checkoutReturn = searchParams.get('checkout')

  const loadPayments = useCallback(async ({ refresh = false } = {}) => {
    if (refresh) setRefreshing(true)
    else setLoading(true)
    setError(null)

    const [statusResult, plansResult, transactionsResult, webhookResult] = await Promise.all([
      getPaymentStatus(),
      getPlans(),
      getPaymentTransactions(),
      getWebhookInfo(),
    ])

    if (statusResult.success) setStatus(statusResult)
    else setError(statusResult.error || 'Unable to load payment status.')

    if (plansResult.success) setPlans(plansResult.plans)
    else setError((current) => current || plansResult.error || 'Unable to load plans.')

    if (transactionsResult.success) setTransactions(transactionsResult.transactions)
    else setError((current) => current || transactionsResult.error || 'Unable to load payment transactions.')

    if (webhookResult.success) setWebhookInfo(webhookResult)
    else setError((current) => current || webhookResult.error || 'Unable to load webhook documentation.')

    if (refresh) setRefreshing(false)
    else setLoading(false)
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => loadPayments(), 0)
    return () => window.clearTimeout(timer)
  }, [loadPayments])

  useEffect(() => {
    if (!sessionId) return undefined

    const timer = window.setTimeout(async () => {
      const response = await checkCheckoutSession(sessionId)
      setCheckoutStatus(response)

      if (response.success && response.paymentStatus === 'paid') {
        setMessage(response.fulfilled
          ? 'Stripe checkout is paid and backend fulfillment is confirmed.'
          : `Stripe checkout is paid. Fulfillment status: ${response.fulfillmentReason || 'pending webhook'}.`)
        await loadPayments({ refresh: true })
        await refreshUser()
      }
    }, 0)

    return () => window.clearTimeout(timer)
  }, [loadPayments, refreshUser, sessionId])

  const warnings = useMemo(() => [
    ...(status?.warnings || []),
    ...(checkoutStatus?.warnings || []),
  ].filter(Boolean), [checkoutStatus?.warnings, status?.warnings])

  const currentPlan = status?.subscription?.plan || 'free'

  const handleCheckout = async (planId) => {
    setCheckoutLoading(planId)
    setError(null)
    setMessage(null)

    const response = await createCheckoutSession(planId)

    if (response.success && response.checkoutUrl) {
      window.location.assign(response.checkoutUrl)
      return
    }

    setError(response.error || 'Unable to start Stripe checkout.')
    setCheckoutLoading(null)
  }

  const handleStripeDeposit = async () => {
    setDepositLoading(true)
    setError(null)
    setMessage(null)

    const response = await createDepositCheckoutSession(depositAmount)

    if (response.success && response.checkoutUrl) {
      window.location.assign(response.checkoutUrl)
      return
    }

    setError(response.error || 'Unable to start Stripe deposit checkout.')
    setDepositLoading(false)
  }

  const handleDemoFunds = async () => {
    setDemoLoading(true)
    setError(null)
    setMessage(null)

    const response = await addDemoFunds(DEMO_AMOUNT)

    if (response.success) {
      setMessage(`${response.message || 'Demo funds added'}. Balance returned by backend: ${formatCurrency(response.balance)}.`)
      await loadPayments({ refresh: true })
      await refreshUser()
    } else {
      setError(response.error || 'Unable to add demo funds.')
    }

    setDemoLoading(false)
  }

  return (
    <div className="space-y-5">
      <motion.div initial="hidden" animate="visible" variants={fadeUp}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <CreditCard size={16} className="text-rose-400" />
              <h1 className="text-2xl font-black text-white">Payments</h1>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Stripe checkout, subscription status, transactions, and separate demo funding.
            </p>
          </div>
          <button
            type="button"
            onClick={() => loadPayments({ refresh: true })}
            disabled={loading || refreshing || Boolean(checkoutLoading) || demoLoading}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400 transition hover:border-white/[0.16] hover:text-white disabled:opacity-45"
          >
            <RefreshCw size={10} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </motion.div>

      {error && <Notice>{error}</Notice>}
      {message && <Notice tone="success">{message}</Notice>}
      {checkoutReturn === 'cancelled' && <Notice>Stripe checkout was cancelled. No payment success is assumed.</Notice>}
      {checkoutReturn === 'returned' && !checkoutStatus && <Notice>Returned from Stripe. The backend status and webhook decide whether a subscription is active.</Notice>}
      {checkoutStatus && !checkoutStatus.success && <Notice>{checkoutStatus.error || 'Unable to check checkout session.'}</Notice>}
      {warnings.map((warning) => <Notice key={warning}>{warning}</Notice>)}

      {loading && !status ? (
        <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-white/[0.07] bg-[#0a1628]/88 p-10 text-center shadow-[0_4px_28px_rgba(0,0,0,0.28)]">
          <span className="w-6 h-6 border-2 border-white/20 border-t-rose-400 rounded-full animate-spin mb-4" />
          <p className="text-sm font-bold text-slate-500">Loading payment status...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-3">
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-white/[0.07] bg-[#0a1628]/88 p-5 shadow-[0_4px_28px_rgba(0,0,0,0.28)] lg:col-span-2">
              <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-bold text-white">Subscription Status</h2>
                  <p className="text-xs font-medium text-slate-600">Read from `/api/payment/status`.</p>
                </div>
                <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-wider ${
                  status?.stripeCheckoutConfigured
                    ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
                    : 'border-amber-500/20 bg-amber-500/10 text-amber-300'
                }`}>
                  Stripe {status?.stripeCheckoutConfigured ? status?.stripeMode || 'ready' : 'not ready'}
                </span>
                <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-wider ${
                  status?.stripeTestMode
                    ? 'border-sky-500/20 bg-sky-500/10 text-sky-300'
                    : 'border-amber-500/20 bg-amber-500/10 text-amber-300'
                }`}>
                  {status?.stripeTestMode ? 'Test mode' : status?.stripeMode === 'live' ? 'Live mode' : 'Mode unknown'}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: 'Current plan', value: status?.subscription?.plan || '--' },
                  { label: 'Subscription state', value: status?.subscription?.status || '--' },
                  { label: 'Plan expires', value: formatDateTime(status?.subscription?.planExpiresAt) },
                  { label: 'Virtual trading balance', value: formatCurrency(status?.balance) },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-3">
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-600">{item.label}</p>
                    <p className="break-words text-sm font-black capitalize text-white">{item.value}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="rounded-2xl border border-amber-500/18 bg-[#0a1628]/88 p-5 shadow-[0_4px_28px_rgba(0,0,0,0.28)]">
              <div className="mb-4 flex items-center gap-2">
                <Wallet size={14} className="text-amber-300" />
                <h2 className="text-sm font-bold text-white">Demo Funding</h2>
              </div>
              <p className="mb-4 text-xs font-medium leading-relaxed text-slate-500">
                Demo funds change the virtual balance without Stripe. They are not a real payment and are stored as demo transactions.
              </p>
              <button
                type="button"
                onClick={handleDemoFunds}
                disabled={!status?.demoFundingEnabled || demoLoading}
                className="w-full rounded-xl border border-amber-500/22 bg-amber-500/10 px-3 py-2.5 text-xs font-black text-amber-300 transition hover:bg-amber-500/16 disabled:cursor-not-allowed disabled:opacity-45"
              >
                {demoLoading ? 'Adding demo funds...' : `Add ${formatCurrency(DEMO_AMOUNT)} demo funds`}
              </button>
              <p className="mt-3 text-[11px] font-semibold text-slate-600">
                Backend flag: {status?.demoFundingEnabled ? 'enabled' : 'disabled'}
              </p>
            </motion.div>
          </div>

          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-white/[0.07] bg-[#0a1628]/88 p-5 shadow-[0_4px_28px_rgba(0,0,0,0.28)]">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-white">Stripe Balance Deposit</h2>
                <p className="text-xs font-medium text-slate-600">
                  Opens Stripe Checkout. In test mode use Stripe test cards. This is separate from demo funding.
                </p>
              </div>
              <span className="rounded-full border border-sky-500/20 bg-sky-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-sky-300">
                {status?.stripeMode || 'stripe'} mode
              </span>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[180px_1fr]">
              <input
                type="number"
                min="10"
                step="1"
                value={depositAmount}
                onChange={(event) => setDepositAmount(event.target.value)}
                className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-sm font-bold text-white outline-none transition focus:border-rose-500/40"
              />
              <button
                type="button"
                onClick={handleStripeDeposit}
                disabled={!status?.stripeCheckoutConfigured || depositLoading}
                className="rounded-xl bg-gradient-to-r from-sky-600 to-indigo-700 px-3 py-2.5 text-xs font-black text-white transition hover:from-sky-500 hover:to-indigo-600 disabled:cursor-not-allowed disabled:opacity-45"
              >
                {depositLoading ? 'Opening Stripe...' : 'Open Stripe deposit checkout'}
              </button>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 gap-3.5 md:grid-cols-3">
            {plans.length === 0 ? (
              <div className="rounded-2xl border border-white/[0.07] bg-[#0a1628]/88 p-8 text-center text-sm font-bold text-slate-500 md:col-span-3">
                No backend plans available.
              </div>
            ) : plans.map((plan, index) => {
              const isCurrent = plan.id === currentPlan
              const isFree = Number(plan.price) <= 0
              const canCheckout = status?.stripeCheckoutConfigured && !isFree && !isCurrent

              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`flex min-h-72 flex-col rounded-2xl border p-5 shadow-[0_4px_28px_rgba(0,0,0,0.28)] ${
                    isCurrent
                      ? 'border-rose-500/28 bg-rose-500/[0.06]'
                      : 'border-white/[0.07] bg-[#0a1628]/88'
                  }`}
                >
                  <div className="mb-4 flex items-start justify-between gap-2">
                    <div>
                      <p className="text-lg font-black text-white">{plan.label || plan.id}</p>
                      <p className="text-sm font-bold text-slate-400">
                        {isFree ? 'Free' : `${formatCurrencyFromCents(plan.price, plan.currency)} / 30 days`}
                      </p>
                    </div>
                    {isCurrent && <span className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-rose-300">Current</span>}
                  </div>

                  <div className="mb-5 flex-1 space-y-2">
                    {(plan.features || []).map((feature) => (
                      <div key={feature} className="flex items-start gap-2 text-xs font-medium text-slate-400">
                        <Shield size={11} className="mt-0.5 shrink-0 text-emerald-400" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCheckout(plan.id)}
                    disabled={!canCheckout || checkoutLoading === plan.id}
                    className="rounded-xl bg-gradient-to-r from-rose-600 to-red-700 px-3 py-2.5 text-xs font-black text-white transition hover:from-rose-500 hover:to-red-600 disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    {checkoutLoading === plan.id
                      ? 'Opening Stripe...'
                      : isFree
                        ? 'No checkout'
                        : isCurrent
                          ? 'Current plan'
                            : status?.stripeCheckoutConfigured
                            ? 'Open Stripe Checkout'
                            : 'Stripe not configured'}
                  </button>
                </motion.div>
              )
            })}
          </div>

          <div className="rounded-2xl border border-white/[0.07] bg-[#0a1628]/70 p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-black text-white">Payment Transactions</p>
              <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-500">
                GET /api/payment/transactions
              </span>
            </div>
            {transactions.length > 0 ? (
              <div className="space-y-2">
                {transactions.slice(0, 5).map((transaction) => (
                  <div key={transaction._id || transaction.transactionId} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.025] px-3 py-2.5">
                    <div>
                      <p className="text-xs font-black capitalize text-white">
                        {transaction.type || 'transaction'} {transaction.plan ? `- ${transaction.plan}` : ''}
                      </p>
                      <p className="text-[11px] font-medium text-slate-600">
                        {formatDateTime(transaction.createdAt)} / {transaction.provider || transaction.paymentMethod || 'payment'} / {transaction.mode || '--'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black text-slate-300">{formatTransactionAmount(transaction.amount, transaction.currency)}</p>
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-600">{transaction.status || '--'}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs font-medium text-slate-500">
                No backend payment transactions yet. Self-service cancellation still needs a dedicated backend endpoint.
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-white/[0.07] bg-[#0a1628]/70 p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-black text-white">Stripe Webhook</p>
              <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${
                status?.webhookConfigured
                  ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
                  : 'border-amber-500/20 bg-amber-500/10 text-amber-300'
              }`}>
                {status?.webhookConfigured ? 'configured' : 'not configured'}
              </span>
            </div>
            <div className="space-y-1 text-xs font-medium text-slate-500">
              <p>Endpoint: <span className="font-black text-slate-300">{webhookInfo?.endpoint || '/api/payment/webhook'}</span></p>
              <p>Raw body required: <span className="font-black text-slate-300">{webhookInfo?.rawBodyRequired ? 'yes' : '--'}</span></p>
              <p>Local test: <span className="font-black text-slate-300">{webhookInfo?.localForwardCommand || 'stripe listen --forward-to localhost:5000/api/payment/webhook'}</span></p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
