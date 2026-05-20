const axios = require('axios');
const NodeCache = require('node-cache');

const MARKET_CACHE_TTL_SECONDS = Number.parseInt(process.env.MARKET_CACHE_TTL_SECONDS, 10) || 10;
const cache = new NodeCache({ stdTTL: MARKET_CACHE_TTL_SECONDS });

const BINANCE_PROVIDER = 'Binance Public API';
const YAHOO_PROVIDER = 'Yahoo Finance unofficial chart API';
const FALLBACK_PROVIDER = 'static-fallback';

const ASSET_NAMES = {
  BTC: 'Bitcoin',
  ETH: 'Ethereum',
  SOL: 'Solana',
  BNB: 'BNB',
  XRP: 'XRP',
  DOGE: 'Dogecoin',
  ADA: 'Cardano',
  TRX: 'TRON',
  AVAX: 'Avalanche',
  LINK: 'Chainlink',
  XAU: 'Gold',
  GOLD: 'Gold',
  XAG: 'Silver',
  SILVER: 'Silver',
  AAPL: 'Apple Inc.',
  TSLA: 'Tesla Inc.',
  NVDA: 'NVIDIA Corporation',
  MSFT: 'Microsoft Corporation',
  GOOGL: 'Alphabet Inc.',
  AMZN: 'Amazon.com Inc.',
  META: 'Meta Platforms Inc.',
  NFLX: 'Netflix Inc.'
};

const STOCK_SYMBOLS = {
  AAPL: 'AAPL',
  TSLA: 'TSLA',
  NVDA: 'NVDA',
  MSFT: 'MSFT',
  GOOGL: 'GOOGL',
  AMZN: 'AMZN',
  META: 'META',
  NFLX: 'NFLX'
};

const INDICES = {
  IXIC: '^IXIC',
  SPX: '^GSPC',
  DJI: '^DJI',
  NDX: '^NDX',
  RUT: '^RUT',
  VIX: '^VIX'
};

function normalizeSymbol(symbol) {
  return String(symbol || '').trim().toUpperCase();
}

function nowIso() {
  return new Date().toISOString();
}

function parseFiniteNumber(value) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function getIndexName(symbol) {
  const names = {
    IXIC: 'NASDAQ Composite',
    SPX: 'S&P 500',
    DJI: 'Dow Jones Industrial Average',
    NDX: 'NASDAQ 100',
    RUT: 'Russell 2000',
    VIX: 'CBOE Volatility Index'
  };
  return names[symbol] || symbol;
}

function getAssetName(symbol, type) {
  if (type === 'index') return getIndexName(symbol);
  return ASSET_NAMES[symbol] || symbol;
}

function createQuote({
  symbol,
  name,
  type = 'unknown',
  price,
  change24h = 0,
  volume = null,
  marketCap = null,
  source,
  provider,
  timestamp = nowIso(),
  cached = false,
  stale = false,
  fallback = false,
  priceAvailable,
  error = null
}) {
  const normalizedSymbol = normalizeSymbol(symbol);
  const normalizedPrice = parseFiniteNumber(price);
  const normalizedChange = parseFiniteNumber(change24h) || 0;
  const normalizedVolume = parseFiniteNumber(volume);
  const normalizedMarketCap = parseFiniteNumber(marketCap);
  const available = typeof priceAvailable === 'boolean'
    ? priceAvailable
    : normalizedPrice !== null && normalizedPrice > 0;

  return {
    symbol: normalizedSymbol,
    name: name || getAssetName(normalizedSymbol, type),
    type,
    price: available ? normalizedPrice : null,
    change24h: normalizedChange,
    volume: normalizedVolume,
    marketCap: normalizedMarketCap,
    source,
    provider,
    timestamp,
    cached,
    stale,
    fallback,
    priceAvailable: available,
    error
  };
}

function createFallbackQuote({ symbol, type, price, change24h = 0, volume = null, name, error }) {
  return createQuote({
    symbol,
    name,
    type,
    price,
    change24h,
    volume,
    source: 'fallback',
    provider: FALLBACK_PROVIDER,
    stale: true,
    fallback: true,
    priceAvailable: parseFiniteNumber(price) !== null && parseFiniteNumber(price) > 0,
    error: error || `Using fallback price for ${normalizeSymbol(symbol)}`
  });
}

function createErrorQuote(symbol, message, type = 'unknown') {
  const normalizedSymbol = normalizeSymbol(symbol);
  return createQuote({
    symbol: normalizedSymbol,
    name: getAssetName(normalizedSymbol, type),
    type,
    price: null,
    source: 'error',
    provider: null,
    stale: true,
    fallback: false,
    priceAvailable: false,
    error: message || `Unable to fetch price for ${normalizedSymbol}`
  });
}

function markQuoteCached(quote) {
  return { ...quote, cached: true };
}

function markQuotesCached(quotes) {
  return quotes.map(markQuoteCached);
}

function computeDataQuality(quotes = []) {
  return {
    hasFallbacks: quotes.some((quote) => quote.fallback === true),
    hasStale: quotes.some((quote) => quote.stale === true),
    hasErrors: quotes.some((quote) => quote.priceAvailable === false || Boolean(quote.error))
  };
}

function getYahooPriceMeta(response) {
  return response.data?.chart?.result?.[0]?.meta || {};
}

function getFallbackCryptos(limit, error) {
  const fallback = [
    { symbol: 'BTC', name: 'Bitcoin', price: 43000, change24h: 2.5, volume: 15000000000 },
    { symbol: 'ETH', name: 'Ethereum', price: 2200, change24h: 1.8, volume: 8000000000 },
    { symbol: 'SOL', name: 'Solana', price: 95, change24h: 5.2, volume: 2000000000 }
  ];

  const message = error?.message || 'Binance unavailable, using fallback price';
  return fallback.slice(0, limit).map((item) => createFallbackQuote({
    ...item,
    type: 'crypto',
    error: message
  }));
}

async function getTopCryptos(limit = 50) {
  const safeLimit = Math.max(1, Number.parseInt(limit, 10) || 50);
  const cacheKey = `top_cryptos_${safeLimit}`;
  const cached = cache.get(cacheKey);
  if (cached) return markQuotesCached(cached);

  try {
    const response = await axios.get('https://api.binance.com/api/v3/ticker/24hr', {
      timeout: 10000
    });

    const cryptos = response.data
      .filter((item) => item.symbol.endsWith('USDT'))
      .sort((a, b) => parseFiniteNumber(b.quoteVolume) - parseFiniteNumber(a.quoteVolume))
      .slice(0, safeLimit)
      .map((item) => {
        const symbol = item.symbol.replace('USDT', '');
        return createQuote({
          symbol,
          name: getAssetName(symbol, 'crypto'),
          type: 'crypto',
          price: item.lastPrice,
          change24h: item.priceChangePercent,
          volume: item.quoteVolume,
          source: 'binance',
          provider: BINANCE_PROVIDER,
          fallback: false,
          stale: false,
          priceAvailable: parseFiniteNumber(item.lastPrice) !== null && parseFiniteNumber(item.lastPrice) > 0
        });
      });

    cache.set(cacheKey, cryptos);
    return cryptos;
  } catch (error) {
    return getFallbackCryptos(safeLimit, error);
  }
}

async function getSpecificCryptos(symbols = ['BTC', 'ETH', 'SOL']) {
  const normalizedSymbols = symbols.map(normalizeSymbol).filter(Boolean);

  return Promise.all(
    normalizedSymbols.map(async (symbol) => {
      const cacheKey = `crypto_${symbol}`;
      const cached = cache.get(cacheKey);
      if (cached) return markQuoteCached(cached);

      try {
        const response = await axios.get(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}USDT`, {
          timeout: 5000
        });

        const quote = createQuote({
          symbol,
          name: getAssetName(symbol, 'crypto'),
          type: 'crypto',
          price: response.data.price,
          change24h: 0,
          source: 'binance',
          provider: BINANCE_PROVIDER,
          fallback: false,
          stale: false,
          priceAvailable: parseFiniteNumber(response.data.price) !== null && parseFiniteNumber(response.data.price) > 0
        });

        cache.set(cacheKey, quote);
        return quote;
      } catch (error) {
        return createErrorQuote(symbol, `Unable to fetch Binance price for ${symbol}`, 'crypto');
      }
    })
  );
}

async function getMetalPrice(symbol) {
  const upperSymbol = normalizeSymbol(symbol);
  const cacheKey = `metal_${upperSymbol}`;
  const cached = cache.get(cacheKey);
  if (cached) return markQuoteCached(cached);

  const yahooSymbol = upperSymbol === 'XAU' || upperSymbol === 'GOLD'
    ? 'GC=F'
    : upperSymbol === 'XAG' || upperSymbol === 'SILVER'
      ? 'SI=F'
      : null;

  if (!yahooSymbol) {
    return createErrorQuote(upperSymbol, `Metal ${upperSymbol} is not supported`, 'metal');
  }

  try {
    const response = await axios.get(`https://query1.finance.yahoo.com/v8/finance/charts/${yahooSymbol}`, {
      timeout: 5000
    });
    const meta = getYahooPriceMeta(response);
    const price = parseFiniteNumber(meta.regularMarketPrice);

    if (!price || price <= 0) {
      return getFallbackMetalQuote(upperSymbol, 'Yahoo returned no usable metal price');
    }

    const quote = createQuote({
      symbol: upperSymbol,
      type: 'metal',
      price,
      change24h: meta.regularMarketChangePercent,
      source: 'yahoo',
      provider: YAHOO_PROVIDER,
      fallback: false,
      stale: false
    });

    cache.set(cacheKey, quote);
    return quote;
  } catch (error) {
    return getFallbackMetalQuote(upperSymbol, error.message);
  }
}

function getFallbackMetalQuote(symbol, message) {
  const prices = { XAU: 2320.50, GOLD: 2320.50, XAG: 27.35, SILVER: 27.35 };
  return createFallbackQuote({
    symbol,
    type: 'metal',
    price: prices[symbol],
    error: message ? `Yahoo unavailable, using fallback price: ${message}` : 'Yahoo unavailable, using fallback price'
  });
}

async function getStockPrice(symbol) {
  const upperSymbol = normalizeSymbol(symbol);
  const cacheKey = `stock_${upperSymbol}`;
  const cached = cache.get(cacheKey);
  if (cached) return markQuoteCached(cached);

  if (!STOCK_SYMBOLS[upperSymbol]) {
    return createErrorQuote(upperSymbol, `Stock ${upperSymbol} is not supported`, 'stock');
  }

  try {
    const response = await axios.get(`https://query1.finance.yahoo.com/v8/finance/charts/${upperSymbol}`, {
      timeout: 5000
    });
    const meta = getYahooPriceMeta(response);
    const price = parseFiniteNumber(meta.regularMarketPrice);

    if (!price || price <= 0) {
      return getFallbackStockQuote(upperSymbol, 'Yahoo returned no usable stock price');
    }

    const quote = createQuote({
      symbol: upperSymbol,
      type: 'stock',
      price,
      change24h: meta.regularMarketChangePercent,
      source: 'yahoo',
      provider: YAHOO_PROVIDER,
      fallback: false,
      stale: false
    });

    cache.set(cacheKey, quote);
    return quote;
  } catch (error) {
    return getFallbackStockQuote(upperSymbol, error.message);
  }
}

function getFallbackStockQuote(symbol, message) {
  const prices = { AAPL: 175, TSLA: 240, NVDA: 850, MSFT: 420, GOOGL: 155, AMZN: 185, META: 480, NFLX: 620 };
  const price = prices[symbol];

  if (!price) {
    return createErrorQuote(symbol, `Unable to fetch price for ${symbol}`, 'stock');
  }

  return createFallbackQuote({
    symbol,
    type: 'stock',
    price,
    error: message ? `Yahoo unavailable, using fallback price: ${message}` : 'Yahoo unavailable, using fallback price'
  });
}

async function getIndexPrice(symbol) {
  const upperSymbol = normalizeSymbol(symbol);
  const cacheKey = `index_${upperSymbol}`;
  const cached = cache.get(cacheKey);
  if (cached) return markQuoteCached(cached);

  const yahooSymbol = INDICES[upperSymbol];
  if (!yahooSymbol) {
    return createErrorQuote(upperSymbol, `Index ${upperSymbol} is not supported`, 'index');
  }

  try {
    const response = await axios.get(`https://query1.finance.yahoo.com/v8/finance/charts/${yahooSymbol}`, {
      timeout: 5000
    });
    const meta = getYahooPriceMeta(response);
    const price = parseFiniteNumber(meta.regularMarketPrice);

    if (!price || price <= 0) {
      return getFallbackIndexQuote(upperSymbol, 'Yahoo returned no usable index price');
    }

    const quote = createQuote({
      symbol: upperSymbol,
      name: getIndexName(upperSymbol),
      type: 'index',
      price,
      change24h: meta.regularMarketChangePercent,
      source: 'yahoo',
      provider: YAHOO_PROVIDER,
      fallback: false,
      stale: false
    });

    cache.set(cacheKey, quote);
    return quote;
  } catch (error) {
    return getFallbackIndexQuote(upperSymbol, error.message);
  }
}

function getFallbackIndexQuote(symbol, message) {
  const fallback = {
    IXIC: { price: 16500, name: 'NASDAQ Composite' },
    SPX: { price: 5200, name: 'S&P 500' },
    DJI: { price: 39000, name: 'Dow Jones Industrial Average' }
  };

  if (!fallback[symbol]) {
    return createErrorQuote(symbol, `Unable to fetch price for ${symbol}`, 'index');
  }

  return createFallbackQuote({
    symbol,
    name: fallback[symbol].name,
    type: 'index',
    price: fallback[symbol].price,
    error: message ? `Yahoo unavailable, using fallback price: ${message}` : 'Yahoo unavailable, using fallback price'
  });
}

async function getPrice(symbol) {
  const upperSymbol = normalizeSymbol(symbol);

  if (!upperSymbol) {
    return createErrorQuote(symbol, 'Symbol is required');
  }

  if (INDICES[upperSymbol]) {
    return getIndexPrice(upperSymbol);
  }

  if (STOCK_SYMBOLS[upperSymbol]) {
    return getStockPrice(upperSymbol);
  }

  if (upperSymbol === 'XAU' || upperSymbol === 'GOLD' || upperSymbol === 'XAG' || upperSymbol === 'SILVER') {
    return getMetalPrice(upperSymbol);
  }

  const cryptoQuotes = await getSpecificCryptos([upperSymbol]);
  const quote = cryptoQuotes[0];
  if (quote?.priceAvailable) return quote;

  return createErrorQuote(
    upperSymbol,
    `Symbol ${upperSymbol} not supported or price unavailable. Try: BTC, ETH, SOL, XAU, GOLD, AAPL, TSLA, IXIC, SPX, DJI`
  );
}

async function getAllPrices() {
  const results = [];
  const topCryptos = await getTopCryptos(10);
  results.push(...topCryptos);

  const metals = await Promise.all([getMetalPrice('XAU'), getMetalPrice('XAG')]);
  results.push(...metals);

  const stocks = await Promise.all(['AAPL', 'TSLA', 'NVDA', 'MSFT', 'GOOGL'].map(getStockPrice));
  results.push(...stocks);

  const indices = await Promise.all(['IXIC', 'SPX', 'DJI'].map(getIndexPrice));
  results.push(...indices);

  return results;
}

async function getPricesForSymbols(symbols = []) {
  const normalizedSymbols = symbols.map(normalizeSymbol).filter(Boolean);
  return Promise.all(normalizedSymbols.map((symbol) => getPrice(symbol)));
}

module.exports = {
  getPrice,
  getAllPrices,
  getTopCryptos,
  getSpecificCryptos,
  getPricesForSymbols,
  getMetalPrice,
  getStockPrice,
  getIndexPrice,
  createQuote,
  createErrorQuote,
  createFallbackQuote,
  computeDataQuality,
  normalizeSymbol
};
