const router = require('express').Router();
const auth = require('../middleware/auth');
const Watchlist = require('../models/watchlist');
const { getPrice, getPricesBatch, normalizeSymbol } = require('../services/marketService');
const { logActivitySafe } = require('../services/activityService');

function nowIso() {
  return new Date().toISOString();
}

function isUnsupportedQuote(quote = {}) {
  return quote.priceAvailable === false && /not supported/i.test(quote.error || '');
}

function createPriceMeta(quote = {}) {
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

function serializeWatchlistItem(item, quote = {}) {
  const data = item.toObject ? item.toObject() : item;
  const price = Number(quote.price);
  const priceAvailable = quote.priceAvailable === true && quote.price !== null && Number.isFinite(price) && price > 0;

  return {
    _id: data._id,
    symbol: data.symbol,
    name: quote.name || data.symbol,
    type: quote.type || 'unknown',
    currentPrice: priceAvailable ? price : null,
    change24h: Number.isFinite(Number(quote.change24h)) ? Number(quote.change24h) : null,
    volume: Number.isFinite(Number(quote.volume)) ? Number(quote.volume) : null,
    marketCap: Number.isFinite(Number(quote.marketCap)) ? Number(quote.marketCap) : null,
    priceAvailable,
    priceMeta: createPriceMeta(quote),
    createdAt: data.createdAt || null,
    updatedAt: data.updatedAt || null,
    warning: priceAvailable ? null : quote.error || `Price unavailable for ${data.symbol}`,
  };
}

function createDataQuality(items) {
  const data = Array.isArray(items) ? items : [];

  return {
    hasUnavailablePrices: data.some((item) => item.priceAvailable === false),
    hasFallbackPrices: data.some((item) => item.priceMeta?.fallback === true),
    hasStalePrices: data.some((item) => item.priceMeta?.isStale === true),
    hasCachedPrices: data.some((item) => item.priceMeta?.cached === true),
    liveCount: data.filter((item) => item.priceMeta?.isLive === true).length,
    totalItems: data.length,
    valuationReliable: data.every((item) => (
      item.priceAvailable === true &&
      item.priceMeta?.fallback !== true &&
      item.priceMeta?.isStale !== true
    )),
  };
}

function enrichWatchlistItemWithQuote(item, quote) {
  return serializeWatchlistItem(item, quote || {
    symbol: item.symbol,
    priceAvailable: false,
    error: `Price unavailable for ${item.symbol}`,
  });
}

async function buildWatchlistResponse(userId) {
  const items = await Watchlist.find({ userId }).sort({ createdAt: 1 });

  // Batch-fetch all watchlist prices with a single Binance call for crypto
  const symbols = items.map((item) => item.symbol).filter(Boolean);
  let quoteMap = new Map();
  if (symbols.length > 0) {
    try {
      const quotes = await getPricesBatch(symbols);
      symbols.forEach((sym, i) => quoteMap.set(sym, quotes[i]));
    } catch {
      // Fall back to individual calls on batch failure
      await Promise.all(symbols.map(async (sym, i) => {
        try {
          const q = await getPrice(sym);
          quoteMap.set(sym, q);
        } catch (err) {
          quoteMap.set(sym, { symbol: sym, priceAvailable: false, error: err.message });
        }
      }));
    }
  }

  const data = items.map((item) => enrichWatchlistItemWithQuote(item, quoteMap.get(item.symbol)));

  return {
    success: true,
    timestamp: nowIso(),
    count: data.length,
    data,
    watchlist: data,
    dataQuality: createDataQuality(data),
  };
}

router.get('/', auth, async (req, res) => {
  try {
    return res.json(await buildWatchlistResponse(req.user.id));
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Unable to load watchlist.',
      timestamp: nowIso(),
      count: 0,
      data: [],
      watchlist: [],
      dataQuality: createDataQuality([]),
    });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const symbol = normalizeSymbol(req.body?.symbol);
    if (!symbol) {
      return res.status(400).json({ success: false, message: 'symbol is required' });
    }

    const quote = await getPrice(symbol);
    if (isUnsupportedQuote(quote)) {
      return res.status(400).json({
        success: false,
        message: quote.error || `Symbol ${symbol} is not supported.`,
      });
    }

    const existing = await Watchlist.findOne({ userId: req.user.id, symbol });
    if (existing) {
      return res.json({
        success: true,
        duplicate: true,
        message: `${symbol} is already in your watchlist.`,
        item: serializeWatchlistItem(existing, quote),
        ...(await buildWatchlistResponse(req.user.id)),
      });
    }

    const item = await Watchlist.create({ userId: req.user.id, symbol });
    await logActivitySafe({
      user: req.user.id,
      type: 'watchlist:add',
      title: 'Watchlist symbol added',
      description: `${symbol} was added to the watchlist.`,
      metadata: { symbol },
    });

    return res.status(201).json({
      success: true,
      duplicate: false,
      message: `${symbol} added to watchlist.`,
      item: serializeWatchlistItem(item, quote),
      ...(await buildWatchlistResponse(req.user.id)),
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Symbol already exists in watchlist.',
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || 'Unable to add watchlist symbol.',
    });
  }
});

router.delete('/:symbol', auth, async (req, res) => {
  try {
    const symbol = normalizeSymbol(req.params.symbol);
    if (!symbol) {
      return res.status(400).json({ success: false, message: 'symbol is required' });
    }

    const result = await Watchlist.deleteOne({ userId: req.user.id, symbol });
    if (result.deletedCount > 0) {
      await logActivitySafe({
        user: req.user.id,
        type: 'watchlist:remove',
        title: 'Watchlist symbol removed',
        description: `${symbol} was removed from the watchlist.`,
        metadata: { symbol },
      });
    }

    return res.json({
      success: true,
      removed: result.deletedCount > 0,
      message: result.deletedCount > 0
        ? `${symbol} removed from watchlist.`
        : `${symbol} was not in your watchlist.`,
      ...(await buildWatchlistResponse(req.user.id)),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Unable to remove watchlist symbol.',
    });
  }
});

module.exports = router;
