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

module.exports = router;
