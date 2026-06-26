import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  AlertTriangle,
  BadgeCheck,
  CheckCircle,
  ChevronDown,
  CreditCard,
  RefreshCw,
  Shield,
  Wallet,
} from 'lucide-react'
import {
  addDemoFunds,
  cancelSubscription,
  checkCheckoutSession,
  createDepositCheckoutSession,
  createCheckoutSession,
  getPaymentStatus,
  getPaymentTransactions,
  getPlans,
  getWebhookInfo,
} from '../services/paymentService'
import { useAuth } from '../context/useAuth'
import { Card, Badge, Button } from '../components/ui'
import { formatCurrency, formatCurrencyFromCents, formatDateTime } from '../utils/formatters'

const formatTransactionAmount = (value, currency = 'EUR') =>
  formatCurrencyFromCents(Number(value) * 100, currency)

const DEMO_AMOUNT = 10000
const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
}

const FAQS = [
  {
    q: 'Puis-je annuler à tout moment ?',
    a: "Oui, vous pouvez annuler votre abonnement à tout moment depuis cette page. Votre accès reste actif jusqu'à la fin de la période payée.",
  },
  {
    q: 'Les données sont-elles en temps réel ?',
    a: 'Oui, les plans Pro et Elite incluent des données de marché en temps réel avec une latence inférieure à 100ms.',
  },
  {
    q: 'Y a-t-il un essai gratuit ?',
    a: 'Le plan Free est disponible sans limite de durée. Les plans payants offrent un remboursement intégral sous 7 jours.',
  },
  {
    q: 'Quels actifs sont disponibles ?',
    a: 'Plus de 12 actifs incluant crypto (BTC, ETH, BNB...), forex (XAUUSD, EURUSD...) et indices majeurs.',
  },
]

function Notice({ tone = 'warning', children }) {
  const styles = tone === 'success'
    ? 'border-emerald-500/20 bg-emerald-500/8 text-emerald-300'
    : 'border-amber-500/20 bg-amber-500/8 text-amber-300'
  const Icon = tone === 'success' ? BadgeCheck : AlertTriangle
  return (
    <div className={`flex items-start gap-2 rounded-xl border px-4 py-3 text-body-sm font-semibold ${styles}`}>
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
  const [cancelLoading, setCancelLoading] = useState(false)
  const [depositLoading, setDepositLoading] = useState(false)
  const [depositAmount, setDepositAmount] = useState('10')
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)
  const [openFaq, setOpenFaq] = useState(null)

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
    else setError(statusResult.error || 'Impossible de charger le statut.')

    if (plansResult.success) setPlans(plansResult.plans)
    else setError((c) => c || plansResult.error || 'Impossible de charger les plans.')

    if (transactionsResult.success) setTransactions(transactionsResult.transactions)
    else setError((c) => c || transactionsResult.error || 'Impossible de charger les transactions.')

    if (webhookResult.success) setWebhookInfo(webhookResult)
    else setError((c) => c || webhookResult.error || 'Impossible de charger le webhook.')

    if (refresh) setRefreshing(false)
    else setLoading(false)
  }, [])

  useEffect(() => {
    const t = window.setTimeout(() => loadPayments(), 0)
    return () => window.clearTimeout(t)
  }, [loadPayments])

  useEffect(() => {
    if (!sessionId) return undefined
    const t = window.setTimeout(async () => {
      const response = await checkCheckoutSession(sessionId)
      setCheckoutStatus(response)
      if (response.success && response.paymentStatus === 'paid') {
        setMessage(response.fulfilled
          ? 'Paiement confirmé et abonnement activé.'
          : `Paiement reçu. Statut : ${response.fulfillmentReason || 'webhook en attente'}.`)
        await loadPayments({ refresh: true })
        await refreshUser()
      }
    }, 0)
    return () => window.clearTimeout(t)
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
    setError(response.error || 'Impossible de démarrer le checkout Stripe.')
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
    setError(response.error || 'Impossible de démarrer le dépôt Stripe.')
    setDepositLoading(false)
  }

  const handleCancelSubscription = async () => {
    if (!window.confirm('Annuler votre abonnement à la fin de la période en cours ?')) return
    setCancelLoading(true)
    setError(null)
    setMessage(null)
    const response = await cancelSubscription()
    if (response.success) {
      setMessage(`Abonnement annulé le ${response.cancelAt ? new Date(response.cancelAt).toLocaleDateString('fr-FR') : 'fin de période'}.`)
      await loadPayments({ refresh: true })
      await refreshUser()
    } else {
      setError(response.error || "Impossible d'annuler l'abonnement.")
    }
    setCancelLoading(false)
  }

  const handleDemoFunds = async () => {
    setDemoLoading(true)
    setError(null)
    setMessage(null)
    const response = await addDemoFunds(DEMO_AMOUNT)
    if (response.success) {
      setMessage(`${response.message || 'Fonds démo ajoutés'}. Solde : ${formatCurrency(response.balance)}.`)
      await loadPayments({ refresh: true })
      await refreshUser()
    } else {
      setError(response.error || 'Impossible de créditer les fonds démo.')
    }
    setDemoLoading(false)
  }

  const toggleFaq = (q) => setOpenFaq((prev) => (prev === q ? null : q))

  return (
    <div className="space-y-6">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <motion.div initial="hidden" animate="visible" variants={fadeUp}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-label uppercase tracking-wider text-white/40 mb-1">Abonnement</p>
            <h1 className="text-display-sm font-black text-white">Plans & Tarifs</h1>
            <p className="text-body text-white/40">Choisissez le plan adapté à votre style de trading</p>
          </div>
          <button
            type="button"
            onClick={() => loadPayments({ refresh: true })}
            disabled={loading || refreshing || Boolean(checkoutLoading) || demoLoading}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-caption font-black uppercase tracking-wider text-slate-400 transition hover:border-white/[0.16] hover:text-white disabled:opacity-45"
          >
            <RefreshCw size={10} className={refreshing ? 'animate-spin' : ''} />
            Rafraîchir
          </button>
        </div>
      </motion.div>

      {/* ── Notices ─────────────────────────────────────────────────────────── */}
      {error && <Notice>{error}</Notice>}
      {message && <Notice tone="success">{message}</Notice>}
      {checkoutReturn === 'cancelled' && <Notice>Checkout Stripe annulé. Aucun paiement effectué.</Notice>}
      {checkoutReturn === 'returned' && !checkoutStatus && (
        <Notice>Retour depuis Stripe. Le statut backend et le webhook déterminent l'activation.</Notice>
      )}
      {checkoutStatus && !checkoutStatus.success && (
        <Notice>{checkoutStatus.error || 'Impossible de vérifier la session checkout.'}</Notice>
      )}
      {warnings.map((w) => <Notice key={w}>{w}</Notice>)}

      {loading && !status ? (
        <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-white/[0.07] bg-[#0a1628]/88 p-10 text-center shadow-[0_4px_28px_rgba(0,0,0,0.28)]">
          <span className="w-6 h-6 border-2 border-white/20 border-t-rose-400 rounded-full animate-spin mb-4" />
          <p className="text-body font-bold text-slate-500">Chargement...</p>
        </div>
      ) : (
        <>
          {/* ── Statut abonnement + Fonds démo ────────────────────────────── */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              className="lg:col-span-2"
            >
              <Card padding="md">
                <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <CreditCard size={13} className="text-rose-400" />
                      <h2 className="text-body font-bold text-white">Statut abonnement</h2>
                    </div>
                    <p className="text-body-sm font-medium text-slate-600">Données depuis /api/payment/status</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className={`rounded-full border px-3 py-1 text-caption font-black uppercase tracking-wider ${
                      status?.stripeCheckoutConfigured
                        ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
                        : 'border-amber-500/20 bg-amber-500/10 text-amber-300'
                    }`}>
                      Stripe {status?.stripeCheckoutConfigured ? status?.stripeMode || 'actif' : 'non configuré'}
                    </span>
                    <span className={`rounded-full border px-3 py-1 text-caption font-black uppercase tracking-wider ${
                      status?.stripeTestMode
                        ? 'border-sky-500/20 bg-sky-500/10 text-sky-300'
                        : 'border-amber-500/20 bg-amber-500/10 text-amber-300'
                    }`}>
                      {status?.stripeTestMode ? 'Mode test' : status?.stripeMode === 'live' ? 'Mode live' : 'Mode inconnu'}
                    </span>
                  </div>
                </div>
                {currentPlan !== 'free' && status?.subscription?.status === 'active' && (
                  <div className="mb-4">
                    <button
                      type="button"
                      onClick={handleCancelSubscription}
                      disabled={cancelLoading}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/20 bg-rose-500/8 px-3 py-2 text-body-sm font-bold text-rose-300 transition hover:bg-rose-500/14 disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      {cancelLoading ? 'Annulation...' : "Annuler l'abonnement"}
                    </button>
                    <p className="mt-1.5 text-caption text-slate-600 font-medium">
                      L'accès continue jusqu'à la fin de la période payée.
                    </p>
                  </div>
                )}
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    { label: 'Plan actuel', value: status?.subscription?.plan || '--' },
                    { label: 'Statut', value: status?.subscription?.status || '--' },
                    { label: 'Expire le', value: formatDateTime(status?.subscription?.planExpiresAt) },
                    { label: 'Solde virtuel', value: formatCurrency(status?.balance) },
                  ].map((item) => (
                    <div key={item.label} className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-3">
                      <p className="mb-1 text-caption font-bold uppercase tracking-wider text-slate-600">{item.label}</p>
                      <p className="break-words text-body font-black capitalize text-white">{item.value}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
            >
              <Card padding="md" className="h-full border-amber-500/18">
                <div className="mb-4 flex items-center gap-2">
                  <Wallet size={14} className="text-amber-300" />
                  <h2 className="text-body font-bold text-white">Fonds Démo</h2>
                </div>
                <p className="mb-4 text-body-sm font-medium leading-relaxed text-slate-500">
                  Crédite le solde virtuel sans passer par Stripe. Non-réel, stocké comme transaction démo.
                </p>
                <button
                  type="button"
                  onClick={handleDemoFunds}
                  disabled={!status?.demoFundingEnabled || demoLoading}
                  className="w-full rounded-xl border border-amber-500/22 bg-amber-500/10 px-3 py-2.5 text-body-sm font-black text-amber-300 transition hover:bg-amber-500/16 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {demoLoading ? 'Ajout en cours...' : `Ajouter ${formatCurrency(DEMO_AMOUNT)} démo`}
                </button>
                <p className="mt-3 text-label font-semibold text-slate-600">
                  Backend : {status?.demoFundingEnabled ? 'activé' : 'désactivé'}
                </p>
              </Card>
            </motion.div>
          </div>

          {/* ── Dépôt Stripe ────────────────────────────────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
            <Card padding="md">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-body font-bold text-white">Dépôt Stripe</h2>
                  <p className="text-body-sm font-medium text-slate-600">
                    Ouvre Stripe Checkout. En mode test, utilisez les cartes test Stripe.
                  </p>
                </div>
                <span className="rounded-full border border-sky-500/20 bg-sky-500/10 px-3 py-1 text-caption font-black uppercase tracking-wider text-sky-300">
                  {status?.stripeMode || 'stripe'} mode
                </span>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-[180px_1fr]">
                <input
                  type="number"
                  min="10"
                  step="1"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-body font-bold text-white outline-none transition focus:border-rose-500/40"
                />
                <button
                  type="button"
                  onClick={handleStripeDeposit}
                  disabled={!status?.stripeCheckoutConfigured || depositLoading}
                  className="rounded-xl bg-gradient-to-r from-sky-600 to-indigo-700 px-3 py-2.5 text-body-sm font-black text-white transition hover:from-sky-500 hover:to-indigo-600 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {depositLoading ? 'Ouverture Stripe...' : 'Ouvrir le checkout de dépôt'}
                </button>
              </div>
            </Card>
          </motion.div>

          {/* ── Plan actuel banner ──────────────────────────────────────────── */}
          <Card padding="md" className="border-rose-500/20 bg-rose-500/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-500/15 flex items-center justify-center shrink-0">
                  <BadgeCheck size={18} className="text-rose-400" />
                </div>
                <div>
                  <p className="text-body font-semibold text-white">
                    Plan actuel : <span className="text-rose-400 capitalize">{currentPlan}</span>
                  </p>
                  <p className="text-body-sm text-white/40">
                    {currentPlan === 'free'
                      ? 'Passez au Pro pour débloquer plus de fonctionnalités'
                      : 'Merci de votre confiance'}
                  </p>
                </div>
              </div>
              {currentPlan === 'free' && (
                <Badge variant="accent" size="md">Upgrade disponible</Badge>
              )}
            </div>
          </Card>

          {/* ── Plans ───────────────────────────────────────────────────────── */}
          <div>
            {plans.length === 0 ? (
              <Card padding="md" className="text-center">
                <p className="text-body font-bold text-slate-500">Aucun plan disponible depuis le backend.</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.map((plan, index) => {
                  const isCurrent = plan.id === currentPlan
                  const isFree = Number(plan.price) <= 0
                  const isRecommended = plan.id === 'pro'
                  const canCheckout = status?.stripeCheckoutConfigured && !isFree && !isCurrent

                  return (
                    <motion.div
                      key={plan.id}
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="relative"
                    >
                      {isRecommended && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                          <Badge variant="accent" size="md">Recommandé</Badge>
                        </div>
                      )}
                      <Card
                        padding="lg"
                        className={`flex flex-col h-full ${
                          isRecommended
                            ? 'border-rose-500/40 bg-rose-500/5'
                            : isCurrent
                              ? 'border-rose-500/28 bg-rose-500/[0.06]'
                              : ''
                        }`}
                      >
                        {/* Plan header */}
                        <div className="mb-6">
                          <div className="flex items-start justify-between mb-2">
                            <p className="text-label uppercase tracking-wider text-white/40">
                              {plan.label || plan.id}
                            </p>
                            {isCurrent && (
                              <span className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-2 py-0.5 text-caption font-black uppercase tracking-wider text-rose-300">
                                Actuel
                              </span>
                            )}
                          </div>
                          <div className="flex items-end gap-1.5 mb-2">
                            <span className="text-3xl font-black text-white tabular-nums font-mono">
                              {isFree ? 'Gratuit' : formatCurrencyFromCents(plan.price, plan.currency)}
                            </span>
                            {!isFree && (
                              <span className="text-body text-white/40 mb-1">/ 30j</span>
                            )}
                          </div>
                          <p className="text-body-sm text-white/50">
                            {plan.description || (isFree ? 'Accès de base à la plateforme' : `Plan ${plan.label || plan.id}`)}
                          </p>
                        </div>

                        {/* Features */}
                        <ul className="space-y-3 flex-1 mb-6">
                          {(plan.features || []).map((feature) => (
                            <li key={feature} className="flex items-start gap-2">
                              <CheckCircle size={14} className="text-emerald-400 mt-0.5 shrink-0" />
                              <span className="text-body-sm text-white/60">{feature}</span>
                            </li>
                          ))}
                        </ul>

                        {/* CTA */}
                        <Button
                          variant={isRecommended ? 'primary' : 'secondary'}
                          size="lg"
                          className="w-full"
                          onClick={() => handleCheckout(plan.id)}
                          loading={checkoutLoading === plan.id}
                          disabled={!canCheckout || Boolean(checkoutLoading)}
                        >
                          {isFree
                            ? 'Plan de base'
                            : isCurrent
                              ? 'Plan actuel'
                              : !status?.stripeCheckoutConfigured
                                ? 'Stripe non configuré'
                                : 'Souscrire via Stripe'}
                        </Button>
                      </Card>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </div>

          {/* ── Transactions ────────────────────────────────────────────────── */}
          <Card padding="md">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <p className="text-body font-black text-white">Historique des paiements</p>
              <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-caption font-black uppercase tracking-wider text-slate-500">
                GET /api/payment/transactions
              </span>
            </div>
            {transactions.length > 0 ? (
              <div className="space-y-2">
                {transactions.slice(0, 5).map((tx) => (
                  <div
                    key={tx._id || tx.transactionId}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.025] px-3 py-2.5"
                  >
                    <div>
                      <p className="text-body-sm font-black capitalize text-white">
                        {tx.type || 'transaction'}{tx.plan ? ` — ${tx.plan}` : ''}
                      </p>
                      <p className="text-label font-medium text-slate-600">
                        {formatDateTime(tx.createdAt)} / {tx.provider || tx.paymentMethod || 'paiement'} / {tx.mode || '--'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-body-sm font-black text-slate-300">
                        {formatTransactionAmount(tx.amount, tx.currency)}
                      </p>
                      <p className="text-caption font-black uppercase tracking-wider text-slate-600">
                        {tx.status || '--'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-body-sm font-medium text-slate-500">
                Aucune transaction backend pour l'instant.
              </p>
            )}
          </Card>

          {/* ── Webhook Stripe ──────────────────────────────────────────────── */}
          <Card padding="md">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-body font-black text-white">Webhook Stripe</p>
              <span className={`rounded-full border px-2.5 py-1 text-caption font-black uppercase tracking-wider ${
                status?.webhookConfigured
                  ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
                  : 'border-amber-500/20 bg-amber-500/10 text-amber-300'
              }`}>
                {status?.webhookConfigured ? 'configuré' : 'non configuré'}
              </span>
            </div>
            <div className="space-y-1 text-body-sm font-medium text-slate-500">
              <p>Endpoint : <span className="font-black text-slate-300">{webhookInfo?.endpoint || '/api/payment/webhook'}</span></p>
              <p>Raw body requis : <span className="font-black text-slate-300">{webhookInfo?.rawBodyRequired ? 'oui' : '--'}</span></p>
              <p>Test local : <span className="font-black text-slate-300">{webhookInfo?.localForwardCommand || 'stripe listen --forward-to localhost:5000/api/payment/webhook'}</span></p>
            </div>
          </Card>

          {/* ── FAQ ─────────────────────────────────────────────────────────── */}
          <div className="max-w-2xl mx-auto w-full pb-6">
            <h2 className="text-heading-sm font-semibold text-white text-center mb-6">Questions fréquentes</h2>
            <div className="space-y-3">
              {FAQS.map((faq) => (
                <Card key={faq.q} padding="md" onClick={() => toggleFaq(faq.q)}>
                  <div className="flex justify-between items-center">
                    <p className="text-body font-medium text-white pr-4">{faq.q}</p>
                    <ChevronDown
                      size={16}
                      className={`text-white/40 transition-transform duration-200 shrink-0 ${openFaq === faq.q ? 'rotate-180' : ''}`}
                    />
                  </div>
                  {openFaq === faq.q && (
                    <p className="text-body-sm text-white/50 mt-3 pt-3 border-t border-app-border leading-relaxed">
                      {faq.a}
                    </p>
                  )}
                </Card>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
