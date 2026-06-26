const router = require('express').Router();
const { body, param } = require('express-validator');

const auth = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const PriceAlert = require('../models/PriceAlert');
const { getPrice, getPricesBatch, normalizeSymbol } = require('../services/marketService');
const { logActivityDeferred } = require('../services/activityService');

const VALID_CONDITIONS = ['above', 'below'];
const VALID_PATCH_STATUSES = ['active', 'disabled'];

function nowIso() {
  return new Date().toISOString();
}

function toPositiveNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

function getQuotePrice(quote = {}) {
  const price = Number(quote.price);
  return quote.priceAvailable === true && Number.isFinite(price) && price > 0 ? price : null;
}

function createQuoteMeta(quote = {}) {
  return {
    source: quote.source || null,
    provider: quote.provider || null,
    providerSymbol: quote.providerSymbol || null,
    isLive: quote.isLive === true,
    isStale: quote.stale === true || quote.isStale === true,
    cached: quote.cached === true,
    fallback: quote.fallback === true,
    fetchedAt: quote.fetchedAt || quote.timestamp || null,
    timestamp: quote.timestamp || null,
    error: quote.error || null,
  };
}

function isUnsupportedQuote(quote = {}) {
  return quote.priceAvailable === false && /not supported/i.test(quote.error || '');
}

function isTriggered(alert, price) {
  if (!Number.isFinite(price)) return false;
  if (alert.condition === 'above') return price >= alert.targetPrice;
  if (alert.condition === 'below') return price <= alert.targetPrice;
  return false;
}

function serializeAlert(alert, quote = null) {
  const data = alert?.toObject ? alert.toObject() : alert;
  if (!data) return null;
  const price = quote ? getQuotePrice(quote) : null;

  return {
    id: data._id ? String(data._id) : data.id ? String(data.id) : null,
    _id: data._id ? String(data._id) : data.id ? String(data.id) : null,
    user: data.user ? String(data.user) : null,
    symbol: data.symbol,
    condition: data.condition,
    targetPrice: data.targetPrice,
    currentPriceAtCreation: data.currentPriceAtCreation ?? null,
    currentPrice: price,
    lastCheckedPrice: data.lastCheckedPrice ?? null,
    lastCheckedAt: data.lastCheckedAt || null,
    status: data.status || 'active',
    triggeredAt: data.triggeredAt || null,
    createdAt: data.createdAt || null,
    updatedAt: data.updatedAt || null,
    priceAvailable: price !== null,
    priceMeta: quote ? createQuoteMeta(quote) : null,
    warning: quote && price === null ? quote.error || `Price unavailable for ${data.symbol}` : null,
  };
}

function createAlertsPayload({ alerts = [], message = null, warnings = [], extras = {} } = {}) {
  return {
    success: true,
    timestamp: nowIso(),
    count: alerts.length,
    alerts,
    data: alerts,
    message,
    warnings,
    error: null,
    ...extras,
  };
}

function createErrorPayload(error, extras = {}) {
  return {
    success: false,
    timestamp: nowIso(),
    count: 0,
    alerts: [],
    data: [],
    message: error,
    warnings: [],
    error,
    ...extras,
  };
}

async function getUserAlerts(userId) {
  const alerts = await PriceAlert.find({ user: userId }).sort({ createdAt: -1 });
  return alerts.map((alert) => serializeAlert(alert)).filter(Boolean);
}

async function resolveCreationQuote(symbol) {
  const quote = await getPrice(symbol);
  if (isUnsupportedQuote(quote)) {
    const error = new Error(quote.error || `Symbol ${symbol} is not supported.`);
    error.statusCode = 400;
    throw error;
  }
  return quote;
}

const createAlertValidator = [
  body('symbol')
    .exists({ checkFalsy: true }).withMessage('symbol is required.')
    .isString().withMessage('symbol must be a string.')
    .trim()
    .isLength({ min: 1, max: 20 }).withMessage('symbol must be between 1 and 20 characters.'),
  body('condition')
    .exists({ checkFalsy: true }).withMessage('condition is required.')
    .isString().withMessage('condition must be a string.')
    .trim()
    .toLowerCase()
    .isIn(VALID_CONDITIONS).withMessage('condition must be above or below.'),
  body('targetPrice')
    .exists({ checkFalsy: true }).withMessage('targetPrice is required.')
    .isFloat({ gt: 0 }).withMessage('targetPrice must be a positive number.')
    .toFloat(),
];

const updateAlertValidator = [
  param('id').isMongoId().withMessage('id must be a valid alert id.'),
  body('symbol')
    .optional()
    .isString().withMessage('symbol must be a string.')
    .trim()
    .isLength({ min: 1, max: 20 }).withMessage('symbol must be between 1 and 20 characters.'),
  body('condition')
    .optional()
    .isString().withMessage('condition must be a string.')
    .trim()
    .toLowerCase()
    .isIn(VALID_CONDITIONS).withMessage('condition must be above or below.'),
  body('targetPrice')
    .optional()
    .isFloat({ gt: 0 }).withMessage('targetPrice must be a positive number.')
    .toFloat(),
  body('status')
    .optional()
    .isString().withMessage('status must be a string.')
    .trim()
    .toLowerCase()
    .isIn(VALID_PATCH_STATUSES).withMessage('status must be active or disabled.'),
];

const idValidator = [
  param('id').isMongoId().withMessage('id must be a valid alert id.'),
];

router.get('/', auth, async (req, res) => {
  try {
    return res.json(createAlertsPayload({
      alerts: await getUserAlerts(req.user.id),
    }));
  } catch (error) {
    return res.status(500).json(createErrorPayload(error.message || 'Unable to load alerts.'));
  }
});

router.post('/', auth, validate(createAlertValidator), async (req, res) => {
  try {
    const symbol = normalizeSymbol(req.body.symbol);
    const condition = String(req.body.condition || '').trim().toLowerCase();
    const targetPrice = toPositiveNumber(req.body.targetPrice);

    if (!symbol || !VALID_CONDITIONS.includes(condition) || targetPrice === null) {
      return res.status(400).json(createErrorPayload('Invalid alert payload.'));
    }

    const existing = await PriceAlert.findOne({
      user: req.user.id,
      symbol,
      condition,
      targetPrice,
      status: 'active',
    });
    if (existing) {
      return res.status(409).json(createErrorPayload(`${symbol} already has this active alert.`, {
        alert: serializeAlert(existing),
      }));
    }

    const quote = await resolveCreationQuote(symbol);
    const price = getQuotePrice(quote);
    const alert = await PriceAlert.create({
      user: req.user.id,
      symbol,
      condition,
      targetPrice,
      currentPriceAtCreation: price,
      status: 'active',
    });

    logActivityDeferred({
      user: req.user.id,
      type: 'alert:create',
      title: 'Price alert created',
      description: `${symbol} alert created for price ${condition} ${targetPrice}.`,
      metadata: {
        symbol,
        condition,
        targetPrice,
        currentPrice: price,
        status: 'active',
      },
    });

    return res.status(201).json(createAlertsPayload({
      alerts: await getUserAlerts(req.user.id),
      message: `${symbol} price alert created.`,
      extras: { alert: serializeAlert(alert, quote) },
    }));
  } catch (error) {
    return res.status(error.statusCode || 500).json(createErrorPayload(error.message || 'Unable to create alert.'));
  }
});

router.patch('/:id', auth, validate(updateAlertValidator), async (req, res) => {
  try {
    const alert = await PriceAlert.findOne({ _id: req.params.id, user: req.user.id });
    if (!alert) {
      return res.status(404).json(createErrorPayload('Alert not found.'));
    }

    const previousStatus = alert.status;
    const symbolChanged = req.body.symbol !== undefined;
    const coreChanged = symbolChanged || req.body.condition !== undefined || req.body.targetPrice !== undefined;

    let quote = null;
    if (symbolChanged) {
      const nextSymbol = normalizeSymbol(req.body.symbol);
      if (!nextSymbol) return res.status(400).json(createErrorPayload('symbol is required.'));
      quote = await resolveCreationQuote(nextSymbol);
      alert.symbol = nextSymbol;
      alert.currentPriceAtCreation = getQuotePrice(quote);
    } else if (coreChanged) {
      quote = await resolveCreationQuote(alert.symbol);
      alert.currentPriceAtCreation = getQuotePrice(quote);
    }

    if (req.body.condition !== undefined) {
      alert.condition = String(req.body.condition).trim().toLowerCase();
    }
    if (req.body.targetPrice !== undefined) {
      alert.targetPrice = toPositiveNumber(req.body.targetPrice);
    }
    if (req.body.status !== undefined) {
      alert.status = String(req.body.status).trim().toLowerCase();
    } else if (coreChanged && alert.status === 'triggered') {
      alert.status = 'active';
    }

    if (alert.status === 'active') {
      alert.triggeredAt = null;
    }
    if (coreChanged) {
      alert.lastCheckedAt = null;
      alert.lastCheckedPrice = null;
      if (alert.status !== 'disabled') alert.status = 'active';
    }

    await alert.save();

    if (previousStatus !== 'disabled' && alert.status === 'disabled') {
      logActivityDeferred({
        user: req.user.id,
        type: 'alert:disable',
        title: 'Price alert disabled',
        description: `${alert.symbol} price alert was disabled.`,
        metadata: {
          symbol: alert.symbol,
          condition: alert.condition,
          targetPrice: alert.targetPrice,
          status: 'disabled',
        },
      });
    }

    return res.json(createAlertsPayload({
      alerts: await getUserAlerts(req.user.id),
      message: `${alert.symbol} price alert updated.`,
      extras: { alert: serializeAlert(alert, quote) },
    }));
  } catch (error) {
    return res.status(error.statusCode || 500).json(createErrorPayload(error.message || 'Unable to update alert.'));
  }
});

router.delete('/:id', auth, validate(idValidator), async (req, res) => {
  try {
    const alert = await PriceAlert.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!alert) {
      return res.status(404).json(createErrorPayload('Alert not found.'));
    }

    logActivityDeferred({
      user: req.user.id,
      type: 'alert:delete',
      title: 'Price alert deleted',
      description: `${alert.symbol} price alert was deleted.`,
      metadata: {
        symbol: alert.symbol,
        condition: alert.condition,
        targetPrice: alert.targetPrice,
        status: 'deleted',
      },
    });

    return res.json(createAlertsPayload({
      alerts: await getUserAlerts(req.user.id),
      message: `${alert.symbol} price alert deleted.`,
      extras: { deleted: true },
    }));
  } catch (error) {
    return res.status(500).json(createErrorPayload(error.message || 'Unable to delete alert.'));
  }
});

router.post('/check', auth, async (req, res) => {
  try {
    const activeAlerts = await PriceAlert.find({ user: req.user.id, status: 'active' }).sort({ createdAt: -1 });
    const symbols = [...new Set(activeAlerts.map((alert) => alert.symbol).filter(Boolean))];
    const warnings = [];
    const quoteMap = new Map();

    if (symbols.length > 0) {
      const quotes = await getPricesBatch(symbols);
      symbols.forEach((symbol, index) => {
        quoteMap.set(symbol, quotes[index]);
      });
    }

    const now = new Date();
    const triggered = [];

    for (const alert of activeAlerts) {
      const quote = quoteMap.get(alert.symbol);
      const price = getQuotePrice(quote);

      alert.lastCheckedAt = now;
      alert.lastCheckedPrice = price;

      if (quote && (quote.fallback === true || quote.stale === true || quote.isStale === true)) {
        warnings.push(`${alert.symbol} was checked with fallback or stale market data.`);
      }
      if (price === null) {
        warnings.push(quote?.error || `Price unavailable for ${alert.symbol}.`);
        await alert.save();
        continue;
      }

      if (isTriggered(alert, price)) {
        alert.status = 'triggered';
        alert.triggeredAt = now;
        triggered.push(serializeAlert(alert, quote));

        logActivityDeferred({
          user: req.user.id,
          type: 'alert:triggered',
          title: 'Price alert triggered',
          description: `${alert.symbol} reached ${price} and triggered the ${alert.condition} ${alert.targetPrice} alert.`,
          metadata: {
            symbol: alert.symbol,
            condition: alert.condition,
            targetPrice: alert.targetPrice,
            currentPrice: price,
            status: 'triggered',
          },
        });
      }

      await alert.save();
    }

    logActivityDeferred({
      user: req.user.id,
      type: 'alert:check',
      title: 'Price alerts checked',
      description: `${activeAlerts.length} active price alerts checked.`,
      metadata: {
        checkedCount: activeAlerts.length,
        triggeredCount: triggered.length,
        status: 'completed',
      },
    });

    return res.json(createAlertsPayload({
      alerts: await getUserAlerts(req.user.id),
      message: triggered.length > 0
        ? `${triggered.length} price alert${triggered.length > 1 ? 's' : ''} triggered.`
        : 'No price alert triggered.',
      warnings: [...new Set(warnings)].slice(0, 10),
      extras: {
        checkedCount: activeAlerts.length,
        triggeredCount: triggered.length,
        triggered,
      },
    }));
  } catch (error) {
    return res.status(500).json(createErrorPayload(error.message || 'Unable to check alerts.'));
  }
});

module.exports = router;
