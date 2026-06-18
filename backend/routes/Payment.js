const router = require('express').Router();
const express = require('express');
const createStripeClient = require('stripe');
const auth = require('../middleware/auth');
const User = require('../models/user');
const Transaction = require('../models/Transaction');

const PLANS = {
  free: {
    id: 'free',
    label: 'Free',
    price: 0,
    currency: 'eur',
    billingInterval: null,
    checkoutType: 'none',
    features: ['1 API call/min', '5 trades/jour'],
  },
  pro: {
    id: 'pro',
    label: 'Pro',
    price: 2999,
    currency: 'eur',
    billingInterval: 'month',
    checkoutType: 'stripe_subscription',
    features: ['10 API calls/min', '50 trades/jour', 'Backtesting'],
  },
  elite: {
    id: 'elite',
    label: 'Elite',
    price: 9999,
    currency: 'eur',
    billingInterval: 'month',
    checkoutType: 'stripe_subscription',
    features: ['Unlimited API calls', '1000 trades/jour', 'AI Assistant', 'Trading bot'],
  },
};

const FEATURES = {
  free: {
    realTimePrices: true,
    news: true,
    tradesPerDay: 5,
    backtesting: false,
    chatbot: false,
    tradingBot: false,
    apiCallsPerDay: 10,
  },
  pro: {
    realTimePrices: true,
    news: true,
    tradesPerDay: 50,
    backtesting: true,
    chatbot: false,
    tradingBot: false,
    apiCallsPerDay: 100,
  },
  elite: {
    realTimePrices: true,
    news: true,
    tradesPerDay: 1000,
    backtesting: true,
    chatbot: true,
    tradingBot: true,
    apiCallsPerDay: 1000,
  },
};

const MAX_DEMO_DEPOSIT = 100000;
const MIN_STRIPE_DEPOSIT = 10;
const MAX_STRIPE_DEPOSIT = 100000;

function nowIso() {
  return new Date().toISOString();
}

function isDemoFundingAllowed() {
  return process.env.ALLOW_DEMO_FUNDING === 'true';
}

function isStripeSecretConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

function isStripeWebhookConfigured() {
  return Boolean(process.env.STRIPE_WEBHOOK_SECRET);
}

function isStripeConfigured() {
  return isStripeSecretConfigured();
}

function getStripeMode() {
  const secret = String(process.env.STRIPE_SECRET_KEY || '').trim();
  if (!secret) return 'not_configured';
  if (secret.startsWith('sk_test_') || secret.startsWith('rk_test_')) return 'test';
  if (secret.startsWith('sk_live_') || secret.startsWith('rk_live_')) return 'live';
  return 'unknown';
}

function getTransactionMode() {
  return getStripeMode() === 'live' ? 'stripe_live' : 'stripe_test';
}

function getFrontendUrl() {
  return (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
}

function getStripeClient() {
  if (!isStripeSecretConfigured()) {
    const error = new Error('Payment provider unavailable');
    error.statusCode = 503;
    throw error;
  }

  return createStripeClient(process.env.STRIPE_SECRET_KEY);
}

function getStripeWarnings() {
  const warnings = [];
  if (!isStripeSecretConfigured()) warnings.push('Stripe secret key is not configured on the backend.');
  if (!isStripeWebhookConfigured()) warnings.push('Stripe webhook secret is not configured. Checkout can open, but fulfillment depends on webhook or session verification.');
  if (getStripeMode() === 'live' && process.env.NODE_ENV !== 'production') warnings.push('Stripe live key detected outside production.');
  return warnings;
}

function paymentError(error, extras = {}) {
  return {
    success: false,
    timestamp: nowIso(),
    source: 'backend',
    provider: 'stripe',
    warnings: [],
    error,
    ...extras,
  };
}

function getSubscription(user) {
  const plan = PLANS[user?.plan] ? user.plan : 'free';
  const planExpiresAt = user?.planExpiresAt || null;
  const expiresAt = planExpiresAt ? new Date(planExpiresAt) : null;

  let status = 'inactive';
  if (plan !== 'free') {
    if (!expiresAt || Number.isNaN(expiresAt.getTime())) status = 'unknown';
    else status = expiresAt.getTime() > Date.now() ? 'active' : 'expired';
  }

  return {
    plan,
    planExpiresAt,
    status,
    stripeSubscriptionId: user?.stripeSubscriptionId || null,
    stripeSubscriptionStatus: user?.stripeSubscriptionStatus || null,
  };
}

function statusResponse(user) {
  const balance = Number(user?.balance);

  return {
    success: true,
    timestamp: nowIso(),
    source: 'backend',
    provider: 'stripe',
    stripeConfigured: isStripeConfigured(),
    stripeCheckoutConfigured: isStripeConfigured(),
    stripeMode: getStripeMode(),
    stripeTestMode: getStripeMode() === 'test',
    stripeSecretConfigured: isStripeSecretConfigured(),
    webhookConfigured: isStripeWebhookConfigured(),
    fulfillmentMode: isStripeWebhookConfigured() ? 'webhook' : 'session-verification',
    demoFundingEnabled: isDemoFundingAllowed(),
    balanceType: 'virtual',
    subscription: getSubscription(user),
    balance: Number.isFinite(balance) ? balance : 0,
    features: FEATURES[user?.plan] || FEATURES.free,
    warnings: getStripeWarnings(),
    error: null,
  };
}

function checkoutUnavailableResponse() {
  return paymentError('Payment provider unavailable', {
    stripeConfigured: false,
    stripeCheckoutConfigured: false,
    stripeMode: getStripeMode(),
    checkoutUrl: null,
    sessionId: null,
    warnings: getStripeWarnings().length
      ? getStripeWarnings()
      : ['Stripe is not configured on the backend.'],
  });
}

function parseAmount(value, { min = 0, max = Number.POSITIVE_INFINITY } = {}) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) return { error: 'amount is required and must be numeric' };
  if (amount <= min) return { error: `amount must be greater than ${min}` };
  if (amount > max) return { error: `amount must be less than or equal to ${max}` };

  return { amount: Number(amount.toFixed(2)) };
}

function parseDemoDepositAmount(body) {
  return parseAmount(body?.amount, { min: 0, max: MAX_DEMO_DEPOSIT });
}

function checkoutBaseConfig(userId, metadata) {
  const frontendUrl = getFrontendUrl();

  return {
    payment_method_types: ['card'],
    mode: 'payment',
    success_url: `${frontendUrl}/payments?checkout=returned&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${frontendUrl}/payments?checkout=cancelled`,
    metadata: {
      userId: String(userId),
      ...metadata,
    },
  };
}

function createCheckoutConfig(userId, body = {}) {
  const type = typeof body.type === 'string' ? body.type.trim().toLowerCase() : '';

  if (type === 'subscription') {
    const planId = typeof body.planId === 'string' ? body.planId.trim().toLowerCase() : '';
    const plan = PLANS[planId];

    if (!plan || plan.id === 'free' || plan.price <= 0) {
      return { error: 'Invalid paid subscription plan.' };
    }

    return {
      sessionConfig: {
        ...checkoutBaseConfig(userId, { type: 'subscription', plan: plan.id }),
        mode: 'subscription',
        subscription_data: {
          metadata: {
            userId: String(userId),
            plan: plan.id,
          },
        },
        line_items: [{
          price_data: {
            currency: plan.currency,
            product_data: {
              name: `Alpha Vision ${plan.label}`,
              description: `Access to the ${plan.label} plan`,
            },
            recurring: {
              interval: 'month',
            },
            unit_amount: plan.price,
          },
          quantity: 1,
        }],
      },
    };
  }

  if (type === 'deposit') {
    const input = parseAmount(body.amount, { min: MIN_STRIPE_DEPOSIT - 0.01, max: MAX_STRIPE_DEPOSIT });
    if (input.error) return { error: input.error };

    return {
      sessionConfig: {
        ...checkoutBaseConfig(userId, { type: 'deposit', amount: String(input.amount) }),
        line_items: [{
          price_data: {
            currency: 'eur',
            product_data: {
              name: `Trading balance deposit`,
              description: `Add ${input.amount} EUR to your Alpha Vision virtual paper trading balance`,
            },
            unit_amount: Math.round(input.amount * 100),
          },
          quantity: 1,
        }],
      },
    };
  }

  return { error: 'Invalid checkout type.' };
}

async function fulfillCheckoutSession(session) {
  if (!session || session.payment_status !== 'paid') return { fulfilled: false, reason: 'session_not_paid' };

  const userId = session.metadata?.userId;
  const type = session.metadata?.type;
  const plan = session.metadata?.plan;
  const existing = await Transaction.findOne({ transactionId: session.id });

  if (!userId) return { fulfilled: false, reason: 'missing_user' };
  if (existing) return { fulfilled: false, reason: 'already_fulfilled' };

  if (type === 'subscription' && PLANS[plan] && plan !== 'free') {
    const user = await User.findById(userId);
    if (!user) return { fulfilled: false, reason: 'user_not_found' };

    user.plan = plan;
    user.planExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    user.stripeCustomerId = session.customer || user.stripeCustomerId || null;
    user.stripeSubscriptionId = session.subscription || user.stripeSubscriptionId || null;
    user.stripeSubscriptionStatus = 'active';
    user.updatedAt = new Date();
    await user.save();

    await Transaction.create({
      userId,
      type: 'subscription',
      amount: Number(session.amount_total || PLANS[plan].price) / 100,
      currency: session.currency || PLANS[plan].currency,
      plan,
      provider: 'stripe',
      mode: getTransactionMode(),
      paymentMethod: 'stripe_checkout',
      transactionId: session.id,
      stripeSessionId: session.id,
      stripeSubscriptionId: session.subscription || null,
      stripeCustomerId: session.customer || null,
      status: 'completed',
      description: `Stripe subscription checkout for ${plan}`,
      metadata: {
        checkoutMode: session.mode || 'subscription',
        paymentStatus: session.payment_status,
      },
    });

    return { fulfilled: true, type: 'subscription', plan };
  }

  if (type === 'deposit') {
    const amount = Number(session.amount_total) / 100;
    if (!Number.isFinite(amount) || amount <= 0) return { fulfilled: false, reason: 'invalid_amount' };

    const user = await User.findById(userId);
    if (!user) return { fulfilled: false, reason: 'user_not_found' };

    const balance = Number(user.balance);
    user.balance = Number(((Number.isFinite(balance) ? balance : 0) + amount).toFixed(2));
    user.stripeCustomerId = session.customer || user.stripeCustomerId || null;
    user.updatedAt = new Date();
    await user.save();

    await Transaction.create({
      userId,
      type: 'deposit',
      amount,
      currency: session.currency || 'eur',
      provider: 'stripe',
      mode: getTransactionMode(),
      paymentMethod: 'stripe_checkout',
      transactionId: session.id,
      stripeSessionId: session.id,
      stripeCustomerId: session.customer || null,
      status: 'completed',
      description: 'Stripe checkout deposit to virtual paper trading balance',
      metadata: {
        checkoutMode: session.mode || 'payment',
        paymentStatus: session.payment_status,
      },
    });

    return { fulfilled: true, type: 'deposit', amount };
  }

  return { fulfilled: false, reason: 'unsupported_checkout_type' };
}

router.get('/plans', (req, res) => {
  res.json({
    success: true,
    timestamp: nowIso(),
    source: 'backend',
    provider: 'stripe',
    stripeConfigured: isStripeConfigured(),
    stripeCheckoutConfigured: isStripeConfigured(),
    stripeMode: getStripeMode(),
    stripeTestMode: getStripeMode() === 'test',
    plans: Object.values(PLANS).map((plan) => ({
      ...plan,
      provider: plan.id === 'free' ? 'internal' : 'stripe',
      testMode: getStripeMode() === 'test',
    })),
    warnings: getStripeWarnings(),
    error: null,
  });
});

router.get('/webhook-info', (req, res) => {
  res.json({
    success: true,
    timestamp: nowIso(),
    source: 'backend',
    provider: 'stripe',
    endpoint: '/api/payment/webhook',
    requiredEvents: [
      'checkout.session.completed',
      'customer.subscription.deleted',
      'invoice.payment_succeeded',
      'invoice.payment_failed',
    ],
    rawBodyRequired: true,
    localForwardCommand: 'stripe listen --forward-to localhost:5000/api/payment/webhook',
    envVariables: ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'FRONTEND_URL'],
    warnings: getStripeWarnings(),
    error: null,
  });
});

// Demo funding for PFA/dev environments only. This is not a real payment.
router.post('/demo-deposit', auth, async (req, res) => {
  try {
    if (!isDemoFundingAllowed()) {
      return res.status(403).json(paymentError('Demo funding is disabled', {
        source: 'demo',
        provider: 'internal-demo-funding',
        demo: true,
        balanceType: 'virtual',
        balance: null,
        message: 'Demo funding is disabled',
        warnings: ['Demo funding is disabled on the backend.'],
      }));
    }

    const input = parseDemoDepositAmount(req.body);
    if (input.error) {
      return res.status(400).json(paymentError(input.error, {
        source: 'demo',
        provider: 'internal-demo-funding',
        demo: true,
        balanceType: 'virtual',
        balance: null,
        message: input.error,
      }));
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json(paymentError('User not found', {
        source: 'demo',
        provider: 'internal-demo-funding',
        demo: true,
        balanceType: 'virtual',
        balance: null,
        message: 'User not found',
      }));
    }

    const balance = Number(user.balance);
    user.balance = Number(((Number.isFinite(balance) ? balance : 0) + input.amount).toFixed(2));
    user.updatedAt = new Date();
    await user.save();

    await Transaction.create({
      userId: req.user.id,
      type: 'demo_deposit',
      amount: input.amount,
      currency: 'usd',
      provider: 'internal-demo-funding',
      mode: 'demo',
      paymentMethod: 'demo',
      transactionId: `demo_${req.user.id}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      status: 'completed',
      description: 'Demo funding added to virtual paper trading balance',
      metadata: {
        demo: true,
        notRealPayment: true,
      },
    });

    return res.json({
      success: true,
      timestamp: nowIso(),
      source: 'demo',
      provider: 'internal-demo-funding',
      demo: true,
      balanceType: 'virtual',
      balance: user.balance,
      message: 'Demo paper trading funds added',
      warnings: ['Demo funding is enabled. This updates virtual paper trading balance only. This is not a real payment.'],
      error: null,
    });
  } catch (err) {
    return res.status(500).json(paymentError(err.message || 'Unable to add demo funds', {
      source: 'demo',
      provider: 'internal-demo-funding',
      demo: true,
      balanceType: 'virtual',
      balance: null,
      message: 'Unable to add demo funds',
    }));
  }
});

router.post('/create-checkout-session', auth, async (req, res) => {
  try {
    const input = createCheckoutConfig(req.user.id, req.body);
    if (input.error) {
      return res.status(400).json(paymentError(input.error, {
        stripeConfigured: isStripeConfigured(),
        checkoutUrl: null,
        sessionId: null,
      }));
    }

    if (!isStripeConfigured()) {
      return res.status(503).json(checkoutUnavailableResponse());
    }

    const stripe = getStripeClient();
    const session = await stripe.checkout.sessions.create(input.sessionConfig);

    return res.json({
      success: true,
      timestamp: nowIso(),
      source: 'backend',
      provider: 'stripe',
      stripeConfigured: true,
      stripeCheckoutConfigured: true,
      stripeMode: getStripeMode(),
      stripeTestMode: getStripeMode() === 'test',
      checkoutMode: input.sessionConfig.mode,
      checkoutUrl: session.url || null,
      sessionId: session.id || null,
      warnings: isStripeWebhookConfigured()
        ? []
        : ['Stripe webhook is not configured. The app will verify the returned session, but webhook fulfillment is recommended.'],
      error: null,
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json(paymentError(err.message || 'Unable to create checkout session', {
      stripeConfigured: isStripeConfigured(),
      checkoutUrl: null,
      sessionId: null,
      warnings: err.statusCode === 503 ? getStripeWarnings() : [],
    }));
  }
});

router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!isStripeSecretConfigured() || !isStripeWebhookConfigured()) {
    return res.status(503).json(paymentError('Stripe webhook is not configured', {
      stripeConfigured: false,
      warnings: getStripeWarnings(),
    }));
  }

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    const stripe = getStripeClient();
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return res.status(400).json(paymentError('Invalid Stripe webhook signature', {
      stripeConfigured: true,
    }));
  }

  try {
    if (event.type === 'checkout.session.completed') {
      await fulfillCheckoutSession(event.data.object);
    }

    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object;
      const user = await User.findOne({ stripeSubscriptionId: subscription.id });
      if (user) {
        user.plan = 'free';
        user.planExpiresAt = null;
        user.stripeSubscriptionStatus = 'canceled';
        user.updatedAt = new Date();
        await user.save();
      }
    }

    if (event.type === 'invoice.payment_succeeded') {
      const invoice = event.data.object;
      const subscriptionId = invoice.subscription;

      if (subscriptionId) {
        const user = await User.findOne({ stripeSubscriptionId: subscriptionId });
        if (user && (user.plan === 'pro' || user.plan === 'elite')) {
          user.planExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
          user.stripeSubscriptionStatus = 'active';
          user.updatedAt = new Date();
          await user.save();
          console.log(`[Stripe] Renouvellement pour user ${user._id} — plan ${user.plan} prolongé jusqu'au ${user.planExpiresAt.toISOString()}`);
        }
      }
    }

    if (event.type === 'invoice.payment_failed') {
      const invoice = event.data.object;
      const subscriptionId = invoice.subscription;

      if (subscriptionId) {
        const user = await User.findOne({ stripeSubscriptionId: subscriptionId });
        if (user && (user.plan === 'pro' || user.plan === 'elite')) {
          const nextPaymentAttempt = invoice.next_payment_attempt;
          const invoiceCreated = invoice.created;
          const GRACE_PERIOD_SECONDS = 7 * 24 * 60 * 60;
          const nowSeconds = Math.floor(Date.now() / 1000);
          const graceExpired = nextPaymentAttempt === null
            || (typeof invoiceCreated === 'number' && nowSeconds - invoiceCreated > GRACE_PERIOD_SECONDS);

          if (graceExpired) {
            const previousPlan = user.plan;
            user.plan = 'free';
            user.planExpiresAt = null;
            user.stripeSubscriptionStatus = 'past_due';
            user.updatedAt = new Date();
            await user.save();
            console.log(`[Stripe] Paiement échoué — user ${user._id} rétrogradé de ${previousPlan} vers free (période de grâce expirée)`);
          } else {
            const nextAttemptDate = typeof nextPaymentAttempt === 'number'
              ? new Date(nextPaymentAttempt * 1000).toISOString()
              : 'aucune date planifiée';
            console.warn(`[Stripe] Paiement échoué pour user ${user._id} (plan ${user.plan}) — prochaine tentative : ${nextAttemptDate}`);
          }
        }
      }
    }

    return res.json({
      success: true,
      timestamp: nowIso(),
      source: 'stripe-webhook',
      provider: 'stripe',
      received: true,
      eventType: event.type,
      webhookMode: getStripeMode(),
      warnings: [],
      error: null,
    });
  } catch (err) {
    return res.status(500).json(paymentError(err.message || 'Unable to process Stripe webhook', {
      stripeConfigured: true,
    }));
  }
});

router.get('/check-session/:sessionId', auth, async (req, res) => {
  try {
    const stripe = getStripeClient();
    const session = await stripe.checkout.sessions.retrieve(req.params.sessionId);

    if (String(session.metadata?.userId || '') !== String(req.user.id)) {
      return res.status(403).json(paymentError('Checkout session does not belong to current user', {
        stripeConfigured: isStripeConfigured(),
        paymentStatus: null,
      }));
    }

    const fulfillment = session.payment_status === 'paid'
      ? await fulfillCheckoutSession(session)
      : { fulfilled: false, reason: 'session_not_paid' };

    return res.json({
      success: true,
      timestamp: nowIso(),
      source: 'backend',
      provider: 'stripe',
      stripeConfigured: isStripeConfigured(),
      stripeCheckoutConfigured: isStripeConfigured(),
      stripeMode: getStripeMode(),
      stripeTestMode: getStripeMode() === 'test',
      sessionId: session.id,
      checkoutMode: session.mode || null,
      paymentStatus: session.payment_status || null,
      fulfilled: fulfillment.fulfilled === true,
      fulfillmentReason: fulfillment.reason || null,
      warnings: [],
      error: null,
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json(paymentError(err.message || 'Unable to check Stripe session', {
      stripeConfigured: isStripeConfigured(),
      paymentStatus: null,
      warnings: err.statusCode === 503 ? getStripeWarnings() : [],
    }));
  }
});

router.get('/status', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('balance plan planExpiresAt stripeCustomerId stripeSubscriptionId stripeSubscriptionStatus');
    if (!user) {
      return res.status(404).json(paymentError('User not found'));
    }

    return res.json(statusResponse(user));
  } catch (err) {
    return res.status(500).json(paymentError(err.message || 'Unable to load payment status'));
  }
});

router.get('/transactions', auth, async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);

    return res.json({
      success: true,
      timestamp: nowIso(),
      source: 'backend',
      provider: 'stripe',
      transactions,
      warnings: [],
      error: null,
    });
  } catch (err) {
    return res.status(500).json(paymentError(err.message || 'Unable to load transactions', {
      transactions: [],
    }));
  }
});

router.get('/features', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('plan');
    if (!user) {
      return res.status(404).json(paymentError('User not found'));
    }

    return res.json({
      success: true,
      timestamp: nowIso(),
      source: 'backend',
      provider: 'stripe',
      currentPlan: PLANS[user.plan] ? user.plan : 'free',
      features: FEATURES[user.plan] || FEATURES.free,
      warnings: [],
      error: null,
    });
  } catch (err) {
    return res.status(500).json(paymentError(err.message || 'Unable to load plan features'));
  }
});

module.exports = router;
