import api, { extractApiError } from './api'
import { getErrorMessage } from '../utils/errorMessage'

const toNumberOrNull = (value) => {
  if (value === null || value === undefined || value === '') return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

const normalizeArray = (value) => (Array.isArray(value) ? value.filter(Boolean) : [])

const normalizeWarnings = (value) => normalizeArray(value).map(getErrorMessage).filter(Boolean)

const normalizeSubscription = (subscription = {}) => ({
  plan: subscription.plan || 'free',
  planExpiresAt: subscription.planExpiresAt || null,
  status: subscription.status || 'inactive',
})

const normalizePaymentResponse = (payload = {}) => ({
  success: Boolean(payload.success),
  timestamp: payload.timestamp || null,
  provider: payload.provider || null,
  source: payload.source || null,
  stripeConfigured: payload.stripeConfigured === true,
  stripeCheckoutConfigured: payload.stripeCheckoutConfigured === true,
  stripeMode: payload.stripeMode || null,
  stripeTestMode: payload.stripeTestMode === true,
  stripeSecretConfigured: payload.stripeSecretConfigured === true,
  webhookConfigured: payload.webhookConfigured === true,
  fulfillmentMode: payload.fulfillmentMode || null,
  demoFundingEnabled: payload.demoFundingEnabled === true,
  balanceType: payload.balanceType || null,
  subscription: payload.subscription ? normalizeSubscription(payload.subscription) : null,
  features: payload.features || null,
  plans: normalizeArray(payload.plans),
  checkoutUrl: payload.checkoutUrl || payload.url || null,
  sessionId: payload.sessionId || payload.id || null,
  checkoutMode: payload.checkoutMode || null,
  paymentStatus: payload.paymentStatus || payload.status || null,
  fulfilled: payload.fulfilled === true,
  fulfillmentReason: payload.fulfillmentReason || null,
  currentPlan: payload.currentPlan || payload.subscription?.plan || null,
  transactions: normalizeArray(payload.transactions),
  endpoint: payload.endpoint || null,
  requiredEvents: normalizeArray(payload.requiredEvents),
  localForwardCommand: payload.localForwardCommand || null,
  rawBodyRequired: payload.rawBodyRequired === true,
  demo: payload.demo === true,
  balance: toNumberOrNull(payload.balance),
  message: getErrorMessage(payload.message) || '',
  warnings: normalizeWarnings(payload.warnings),
  error: getErrorMessage(payload.error || payload.message) || null,
  raw: payload,
})

const normalizePaymentError = (error, fallbackMessage) => {
  const apiError = extractApiError(error)
  const payload = apiError.data || {}

  return normalizePaymentResponse({
    success: false,
    timestamp: payload.timestamp || null,
    provider: payload.provider || 'stripe',
    source: payload.source || 'backend',
    stripeConfigured: Boolean(payload.stripeConfigured),
    stripeCheckoutConfigured: Boolean(payload.stripeCheckoutConfigured),
    stripeMode: payload.stripeMode || null,
    subscription: payload.subscription || null,
    checkoutUrl: payload.checkoutUrl || null,
    sessionId: payload.sessionId || null,
    paymentStatus: payload.paymentStatus || null,
    demo: Boolean(payload.demo),
    balanceType: payload.balanceType || null,
    balance: payload.balance ?? null,
    message: getErrorMessage(payload.message) || '',
    warnings: normalizeWarnings(payload.warnings),
    error: getErrorMessage(payload.error || payload.message || apiError.message || fallbackMessage),
  })
}

export const getPlans = async () => {
  try {
    const response = await api.get('/payment/plans', { skipAuth: true })
    return normalizePaymentResponse(response.data)
  } catch (error) {
    return normalizePaymentError(error, 'Unable to load payment plans.')
  }
}

export const getPaymentTransactions = async () => {
  try {
    const response = await api.get('/payment/transactions')
    return normalizePaymentResponse(response.data)
  } catch (error) {
    return normalizePaymentError(error, 'Unable to load payment transactions.')
  }
}

export const getPlanFeatures = async () => {
  try {
    const response = await api.get('/payment/features')
    return normalizePaymentResponse(response.data)
  } catch (error) {
    return normalizePaymentError(error, 'Unable to load plan features.')
  }
}

export const getPaymentStatus = async () => {
  try {
    const response = await api.get('/payment/status')
    return normalizePaymentResponse(response.data)
  } catch (error) {
    return normalizePaymentError(error, 'Unable to load payment status.')
  }
}

export const createCheckoutSession = async (planId) => {
  try {
    const response = await api.post('/payment/create-checkout-session', {
      type: 'subscription',
      planId,
    })
    return normalizePaymentResponse(response.data)
  } catch (error) {
    return normalizePaymentError(error, 'Unable to create checkout session.')
  }
}

export const createDepositCheckoutSession = async (amount) => {
  try {
    const response = await api.post('/payment/create-checkout-session', {
      type: 'deposit',
      amount,
    })
    return normalizePaymentResponse(response.data)
  } catch (error) {
    return normalizePaymentError(error, 'Unable to create deposit checkout session.')
  }
}

export const getWebhookInfo = async () => {
  try {
    const response = await api.get('/payment/webhook-info', { skipAuth: true })
    return normalizePaymentResponse(response.data)
  } catch (error) {
    return normalizePaymentError(error, 'Unable to load Stripe webhook documentation.')
  }
}

export const addDemoFunds = async (amount) => {
  try {
    const response = await api.post('/payment/demo-deposit', { amount })
    return normalizePaymentResponse(response.data)
  } catch (error) {
    return normalizePaymentError(error, 'Unable to add demo funds.')
  }
}

export const checkCheckoutSession = async (sessionId) => {
  try {
    const response = await api.get(`/payment/check-session/${encodeURIComponent(sessionId)}`)
    return normalizePaymentResponse(response.data)
  } catch (error) {
    return normalizePaymentError(error, 'Unable to check checkout session.')
  }
}

export const cancelSubscription = async () => {
  try {
    const response = await api.post('/payment/cancel-subscription')
    return normalizePaymentResponse(response.data)
  } catch (error) {
    return normalizePaymentError(error, 'Unable to cancel subscription.')
  }
}

export const getSubscription = getPaymentStatus

export default {
  addDemoFunds,
  cancelSubscription,
  checkCheckoutSession,
  createCheckoutSession,
  createDepositCheckoutSession,
  getPaymentTransactions,
  getPaymentStatus,
  getPlanFeatures,
  getPlans,
  getSubscription,
  getWebhookInfo,
}
