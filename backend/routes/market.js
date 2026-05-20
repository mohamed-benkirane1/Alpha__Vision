const router = require('express').Router();
const {
  getPrice,
  getAllPrices,
  getTopCryptos,
  getPricesForSymbols,
  computeDataQuality,
  normalizeSymbol
} = require('../services/marketService');

function marketTimestamp() {
  return new Date().toISOString();
}

function createListResponse(quotes) {
  const data = Array.isArray(quotes) ? quotes : [];
  return {
    success: true,
    count: data.length,
    timestamp: marketTimestamp(),
    dataQuality: computeDataQuality(data),
    data
  };
}

function createSingleResponse(quote) {
  return {
    success: true,
    timestamp: marketTimestamp(),
    data: quote
  };
}

function createErrorResponse(message, statusCode = 500) {
  return {
    statusCode,
    body: {
      success: false,
      timestamp: marketTimestamp(),
      error: message,
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
    const quotes = await getAllPrices();
    res.json(createListResponse(quotes));
  } catch (err) {
    const response = createErrorResponse(err.message);
    res.status(response.statusCode).json(response.body);
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
