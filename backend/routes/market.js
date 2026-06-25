const router = require('express').Router();
const {
  getPrice,
  getAllPrices,
  getTopCryptos,
  getPricesForSymbols,
  getMarketHistory,
  computeDataQuality,
  normalizeSymbol,
  getMarketCacheTtlSeconds
} = require('../services/marketService');

// Market routes serve public data (Binance/Yahoo) and are used on the public Home page.
// They are protected by a dedicated rate limiter in server.js, not by auth.

function marketTimestamp() {
  return new Date().toISOString();
}

function createMarketMeta(quotes, fetchedAt) {
  const data = Array.isArray(quotes) ? quotes.filter(Boolean) : [];
  const providers = [...new Set(data.map((quote) => quote.provider || quote.source).filter(Boolean))];
  const hasFallbacks = data.some((quote) => quote.fallback === true);
  const hasUnavailable = data.some((quote) => quote.priceAvailable === false);
  const isStale = data.some((quote) => (
    quote.stale === true ||
    quote.isStale === true ||
    quote.fallback === true ||
    quote.priceAvailable === false
  ));

  return {
    provider: providers.length === 1 ? providers[0] : providers.length > 1 ? 'mixed' : null,
    providers,
    isLive: data.length > 0 && data.every((quote) => quote.isLive === true),
    isStale,
    hasFallbacks,
    hasUnavailable,
    fetchedAt,
    cacheTtlSeconds: getMarketCacheTtlSeconds()
  };
}

function createListResponse(quotes) {
  const data = Array.isArray(quotes) ? quotes : [];
  const timestamp = marketTimestamp();
  return {
    success: true,
    count: data.length,
    timestamp,
    dataQuality: computeDataQuality(data),
    meta: createMarketMeta(data, timestamp),
    data
  };
}

function createSingleResponse(quote) {
  const timestamp = marketTimestamp();
  return {
    success: true,
    timestamp,
    meta: createMarketMeta(quote ? [quote] : [], timestamp),
    data: quote
  };
}

function createErrorResponse(message, statusCode = 500) {
  const timestamp = marketTimestamp();
  return {
    statusCode,
    body: {
      success: false,
      timestamp,
      error: message,
      meta: {
        provider: null,
        providers: [],
        isLive: false,
        isStale: true,
        hasFallbacks: false,
        hasUnavailable: true,
        fetchedAt: timestamp,
        cacheTtlSeconds: getMarketCacheTtlSeconds()
      },
      data: []
    }
  };
}

router.get('/price/:symbol', async (req, res) => {
  try {
    const quote = await getPrice(req.params.symbol);
    res.json(createSingleResponse(quote));
  } catch (err) {
    const response = createErrorResponse(err.message);
    res.status(response.statusCode).json(response.body);
  }
});

router.get('/prices', async (req, res) => {
  try {
    const symbolsParam = req.query.symbols;
    const symbols = typeof symbolsParam === 'string'
      ? symbolsParam.split(',').map(normalizeSymbol).filter(Boolean)
      : [];
    const quotes = symbols.length > 0 ? await getPricesForSymbols(symbols) : await getAllPrices();
    res.json(createListResponse(quotes));
  } catch (err) {
    const response = createErrorResponse(err.message);
    res.status(response.statusCode).json(response.body);
  }
});

router.get('/history', async (req, res) => {
  try {
    const result = await getMarketHistory(req.query.symbol, req.query.interval, req.query.range);
    const statusCode = result.message === 'Symbol is required' ? 400 : 200;
    return res.status(statusCode).json(result);
  } catch (err) {
    const response = createErrorResponse(err.message);
    return res.status(response.statusCode).json(response.body);
  }
});

router.get('/top', async (req, res) => {
  try {
    const limit = Number.parseInt(req.query.limit, 10) || 50;
    const maxLimit = Math.min(Math.max(limit, 1), 200);
    const quotes = await getTopCryptos(maxLimit);
    res.json({
      ...createListResponse(quotes),
      limit: maxLimit
    });
  } catch (err) {
    const response = createErrorResponse(err.message);
    res.status(response.statusCode).json(response.body);
  }
});

router.post('/specific', async (req, res) => {
  try {
    const { symbols } = req.body;

    if (!symbols || !Array.isArray(symbols)) {
      const response = createErrorResponse('symbols array required. Example: {"symbols": ["BTC", "ETH", "SOL"]}', 400);
      return res.status(response.statusCode).json(response.body);
    }

    const normalizedSymbols = symbols.map(normalizeSymbol).filter(Boolean);
    if (normalizedSymbols.length === 0) {
      const response = createErrorResponse('symbols array cannot be empty', 400);
      return res.status(response.statusCode).json(response.body);
    }

    const quotes = await getPricesForSymbols(normalizedSymbols);
    return res.json(createListResponse(quotes));
  } catch (err) {
    const response = createErrorResponse(err.message);
    return res.status(response.statusCode).json(response.body);
  }
});

router.get('/multi', async (req, res) => {
  try {
    const symbolsParam = req.query.symbols;
    if (!symbolsParam) {
      const response = createErrorResponse('symbols parameter required. Example: ?symbols=BTC,ETH,SOL', 400);
      return res.status(response.statusCode).json(response.body);
    }

    const symbols = symbolsParam.split(',').map(normalizeSymbol).filter(Boolean);
    if (symbols.length === 0) {
      const response = createErrorResponse('symbols parameter cannot be empty', 400);
      return res.status(response.statusCode).json(response.body);
    }

    const quotes = await getPricesForSymbols(symbols);
    return res.json(createListResponse(quotes));
  } catch (err) {
    const response = createErrorResponse(err.message);
    return res.status(response.statusCode).json(response.body);
  }
});

// Binance OHLCV candles — direct endpoint for TradingChart
router.get('/candles/:symbol', async (req, res) => {
  try {
    const symbol = String(req.params.symbol || '').trim().toUpperCase();
    const interval = String(req.query.interval || '1h').trim();
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 500, 1), 1000);

    const validIntervals = ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w'];
    if (!validIntervals.includes(interval)) {
      return res.status(400).json({ success: false, error: `Invalid interval. Valid: ${validIntervals.join(', ')}` });
    }
    if (!symbol) {
      return res.status(400).json({ success: false, error: 'Symbol is required.' });
    }

    const axios = require('axios');
    const response = await axios.get('https://api.binance.com/api/v3/klines', {
      params: { symbol: symbol.endsWith('USDT') ? symbol : `${symbol}USDT`, interval, limit },
      timeout: 10000,
    });

    if (!Array.isArray(response.data)) {
      return res.status(400).json({ success: false, error: 'Invalid symbol or Binance error.' });
    }

    const candles = response.data.map((k) => ({
      time:   Math.floor(Number(k[0]) / 1000),
      open:   parseFloat(k[1]),
      high:   parseFloat(k[2]),
      low:    parseFloat(k[3]),
      close:  parseFloat(k[4]),
      volume: parseFloat(k[5]),
    }));

    return res.json({ success: true, symbol, interval, candles, count: candles.length });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
