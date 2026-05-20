const router = require('express').Router();
const auth = require('../middleware/auth');
const User = require('../models/user');
const Transaction = require('../models/Transaction');
const createStripeClient = require('stripe');
const express = require('express');

const PLANS = {
  free: { price: 0, features: ['1 API call/min', '5 trades/jour'] },
  pro: { price: 2999, features: ['10 API calls/min', '50 trades/jour', 'Backtesting'] },
  elite: { price: 9999, features: ['Unlimited API calls', '1000 trades/jour', 'AI Assistant', 'Trading bot'] }
};

const MAX_DEMO_DEPOSIT = 100000;

function isDemoFundingAllowed() {
  return process.env.ALLOW_DEMO_FUNDING === 'true';
}

function parseDemoDepositAmount(body) {
  const amount = Number(body?.amount);

  if (!Number.isFinite(amount)) {
    return { error: 'amount is required and must be numeric' };
  }

  if (amount <= 0) {
    return { error: 'amount must be greater than 0' };
  }

  if (amount > MAX_DEMO_DEPOSIT) {
    return { error: `amount must be less than or equal to ${MAX_DEMO_DEPOSIT}` };
  }

  return { amount: Number(amount.toFixed(2)) };
}

function getStripeClient() {
  if (!process.env.STRIPE_SECRET_KEY) {
    const error = new Error('Stripe is not configured');
    error.statusCode = 503;
    throw error;
  }

  return createStripeClient(process.env.STRIPE_SECRET_KEY);
}

// 1. Obtenir les plans disponibles
router.get('/plans', (req, res) => {
  res.json(PLANS);
});

// Demo funding for PFA/dev environments only. This is not a real payment.
router.post('/demo-deposit', auth, async (req, res) => {
  try {
    if (!isDemoFundingAllowed()) {
      return res.status(403).json({
        success: false,
        message: 'Demo funding is disabled'
      });
    }

    const input = parseDemoDepositAmount(req.body);
    if (input.error) {
      return res.status(400).json({
        success: false,
        message: input.error
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const currentBalance = Number(user.balance);
    user.balance = Number(((Number.isFinite(currentBalance) ? currentBalance : 0) + input.amount).toFixed(2));
    await user.save();

    res.json({
      success: true,
      message: 'Demo balance added',
      balance: user.balance
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Server error'
    });
  }
});

// 2. Créer une session de paiement Stripe
router.post('/create-checkout-session', auth, async (req, res) => {
  try {
    const { type, planId, amount } = req.body;
    const user = await User.findById(req.user.id);
    
    let sessionConfig = {};
    
    if (type === 'subscription' && planId && PLANS[planId]) {
      sessionConfig = {
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'eur',
            product_data: {
              name: `Abonnement Alpha Vision ${planId.toUpperCase()}`,
              description: `Accès au plan ${planId} pour 30 jours`,
            },
            unit_amount: PLANS[planId].price,
          },
          quantity: 1,
        }],
        mode: 'payment',
        success_url: 'http://localhost:5171/payment/success?session_id={CHECKOUT_SESSION_ID}&type=subscription&plan=' + planId,
        cancel_url: 'http://localhost:5171/payment/cancel',
        metadata: {
          userId: req.user.id,
          type: 'subscription',
          plan: planId
        }
      };
    } else if (type === 'deposit' && amount && amount >= 10) {
      sessionConfig = {
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'eur',
            product_data: {
              name: `Dépôt de ${amount} €`,
              description: `Ajout de ${amount} € à votre solde de trading`,
            },
            unit_amount: amount * 100,
          },
          quantity: 1,
        }],
        mode: 'payment',
        success_url: 'http://localhost:5171/payment/success?session_id={CHECKOUT_SESSION_ID}&type=deposit&amount=' + amount,
        cancel_url: 'http://localhost:5171/payment/cancel',
        metadata: {
          userId: req.user.id,
          type: 'deposit',
          amount: amount
        }
      };
    } else {
      return res.status(400).json({ message: 'Paramètres invalides' });
    }
    
    const stripe = getStripeClient();
    const session = await stripe.checkout.sessions.create(sessionConfig);
    res.json({ id: session.id, url: session.url });
    
  } catch (err) {
    res.status(err.statusCode || 500).json({ message: err.message });
  }
});

// 3. Webhook Stripe
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  
  try {
    const stripe = getStripeClient();
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { userId, type, plan, amount } = session.metadata;
    
    if (type === 'subscription') {
      await User.findByIdAndUpdate(userId, {
        plan: plan,
        planExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });
      
      await Transaction.create({
        userId: userId,
        type: 'subscription',
        amount: PLANS[plan].price / 100,
        plan: plan,
        paymentMethod: 'card',
        transactionId: session.id,
        status: 'completed'
      });
      
    } else if (type === 'deposit') {
      await User.findByIdAndUpdate(userId, {
        $inc: { balance: parseFloat(amount) }
      });
      
      await Transaction.create({
        userId: userId,
        type: 'deposit',
        amount: parseFloat(amount),
        paymentMethod: 'card',
        transactionId: session.id,
        status: 'completed'
      });
    }
  }
  
  res.json({ received: true });
});

// 4. Vérifier le statut d'une transaction
router.get('/check-session/:sessionId', auth, async (req, res) => {
  try {
    const stripe = getStripeClient();
    const session = await stripe.checkout.sessions.retrieve(req.params.sessionId);
    res.json({ status: session.payment_status });
  } catch (err) {
    res.status(err.statusCode || 500).json({ message: err.message });
  }
});

// 5. Obtenir le solde et plan de l'utilisateur
router.get('/status', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('balance plan planExpiresAt');
    res.json({
      balance: user.balance,
      plan: user.plan,
      planExpiresAt: user.planExpiresAt,
      features: PLANS[user.plan].features
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 6. Historique des transactions
router.get('/transactions', auth, async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(50);
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 7. Obtenir les fonctionnalités selon le plan
router.get('/features', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    const features = {
      free: {
        realTimePrices: true,
        news: true,
        tradesPerDay: 5,
        backtesting: false,
        chatbot: false,
        tradingBot: false,
        apiCallsPerDay: 10
      },
      pro: {
        realTimePrices: true,
        news: true,
        tradesPerDay: 50,
        backtesting: true,
        chatbot: false,
        tradingBot: false,
        apiCallsPerDay: 100
      },
      elite: {
        realTimePrices: true,
        news: true,
        tradesPerDay: 1000,
        backtesting: true,
        chatbot: true,
        tradingBot: true,
        apiCallsPerDay: 1000
      }
    };
    
    res.json({
      currentPlan: user.plan,
      features: features[user.plan]
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
