const axios = require('axios');
const NodeCache = require('node-cache');

const MARKET_CACHE_TTL_SECONDS = Number.parseInt(process.env.MARKET_CACHE_TTL_SECONDS, 10) || 10;
const cache = new NodeCache({ stdTTL: MARKET_CACHE_TTL_SECONDS });

const BINANCE_PROVIDER = 'Binance Public API';
const YAHOO_PROVIDER = 'Yahoo Finance unofficial chart API';
const FALLBACK_PROVIDER = 'static-fallback';
const CRYPTO_QUOTE_SUFFIXES = ['USDT'];

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
  NFLX: 'Netflix Inc.',
  SP500: 'S&P 500'
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
  SP500: '^GSPC',
  DJI: '^DJI',
  NDX: '^NDX',
  RUT: '^RUT',
  VIX: '^VIX'
};

const HISTORY_INTERVALS = {
  '1m': { binance: '1m', yahoo: '1m', seconds: 60 },
  '5m': { binance: '5m', yahoo: '5m', seconds: 300 },
  '15m': { binance: '15m', yahoo: '15m', seconds: 900 },
  '1h': { binance: '1h', yahoo: '60m', seconds: 3600 },
  '1d': { binance: '1d', yahoo: '1d', seconds: 86400 }
};

const HISTORY_RANGES = {
  '1d': 1,
  '7d': 7,
  '30d': 30,
  '90d': 90,
  '1y': 365
};

function normalizeSymbol(symbol) {
  const value = String(symbol || '').trim().toUpperCase();
  const quoteSuffix = CRYPTO_QUOTE_SUFFIXES.find((suffix) => (
    value.endsWith(suffix) && value.length > suffix.length
  ));

  return quoteSuffix ? value.slice(0, -quoteSuffix.length) : value;
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
    SP500: 'S&P 500',
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
  providerSymbol = null,
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
  const isStale = stale === true || fallback === true || available !== true;
  const isLive = available === true && fallback !== true && stale !== true;

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
    providerSymbol,
    timestamp,
    fetchedAt: timestamp,
    cacheTtlSeconds: MARKET_CACHE_TTL_SECONDS,
    cached,
    stale,
    isStale,
    isLive,
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
  return {
    ...quote,
    cached: true,
    cacheTtlSeconds: quote.cacheTtlSeconds || MARKET_CACHE_TTL_SECONDS
  };
}

function markQuotesCached(quotes) {
  return quotes.map(markQuoteCached);
}

function computeDataQuality(quotes = []) {
  const data = Array.isArray(quotes) ? quotes : [];

  return {
    hasFallbacks: data.some((quote) => quote.fallback === true),
    hasStale: data.some((quote) => quote.stale === true || quote.isStale === true),
    hasErrors: data.some((quote) => quote.priceAvailable === false || Boolean(quote.error)),
    hasUnavailable: data.some((quote) => quote.priceAvailable === false),
    allLive: data.length > 0 && data.every((quote) => quote.isLive === true),
    liveCount: data.filter((quote) => quote.isLive === true).length,
    staleCount: data.filter((quote) => quote.stale === true || quote.isStale === true).length,
    fallbackCount: data.filter((quote) => quote.fallback === true).length,
    unavailableCount: data.filter((quote) => quote.priceAvailable === false).length,
    cachedCount: data.filter((quote) => quote.cached === true).length
  };
}

function getMarketCacheTtlSeconds() {
  return MARKET_CACHE_TTL_SECONDS;
}

function getYahooMetalSymbol(symbol) {
  if (symbol === 'XAU' || symbol === 'GOLD') return 'GC=F';
  if (symbol === 'XAG' || symbol === 'SILVER') return 'SI=F';
  return null;
}

function normalizeHistoryInterval(interval, warnings) {
  const value = String(interval || '1h').trim().toLowerCase();
  if (HISTORY_INTERVALS[value]) return value;

  warnings.push(`Unsupported interval "${interval}", using 1h.`);
  return '1h';
}

function normalizeHistoryRange(range, warnings) {
  const value = String(range || '30d').trim().toLowerCase();
  if (HISTORY_RANGES[value]) return value;

  warnings.push(`Unsupported range "${range}", using 30d.`);
  return '30d';
}

function getBinanceHistoryLimit(interval, range) {
  const seconds = HISTORY_INTERVALS[interval].seconds;
  const days = HISTORY_RANGES[range];
  const estimatedCandles = Math.ceil((days * 24 * 60 * 60) / seconds);
  return Math.min(Math.max(estimatedCandles, 1), 1000);
}

function getYahooHistoryRange(interval, range, warnings) {
  if (interval === '1m' && !['1d', '7d'].includes(range)) {
    warnings.push(`Yahoo does not reliably support ${interval} candles for ${range}; using 7d.`);
    return '7d';
  }

  if (interval !== '1d' && range === '1y') {
    warnings.push(`Yahoo intraday candles for ${range} are limited; using 30d.`);
    return '30d';
  }

  return range;
}

function resolveHistoryMarket(symbol) {
  const normalizedSymbol = normalizeSymbol(symbol);

  if (!normalizedSymbol) {
    return {
      symbol: '',
      type: 'unknown',
      provider: null,
      providerSymbol: null,
      error: 'Symbol is required'
    };
  }

  if (INDICES[normalizedSymbol]) {
    return {
      symbol: normalizedSymbol,
      type: 'index',
      provider: YAHOO_PROVIDER,
      providerSymbol: INDICES[normalizedSymbol]
    };
  }

  if (STOCK_SYMBOLS[normalizedSymbol]) {
    return {
      symbol: normalizedSymbol,
      type: 'stock',
      provider: YAHOO_PROVIDER,
      providerSymbol: STOCK_SYMBOLS[normalizedSymbol]
    };
  }

  const metalSymbol = getYahooMetalSymbol(normalizedSymbol);
  if (metalSymbol) {
    return {
      symbol: normalizedSymbol,
      type: 'metal',
      provider: YAHOO_PROVIDER,
      providerSymbol: metalSymbol
    };
  }

  return {
    symbol: normalizedSymbol,
    type: 'crypto',
    provider: BINANCE_PROVIDER,
    providerSymbol: `${normalizedSymbol}USDT`
  };
}

function createHistoryResponse({
  success,
  symbol,
  interval,
  range,
  data = [],
  provider = null,
  providerSymbol = null,
  fetchedAt = nowIso(),
  isLive = false,
  isStale = true,
  cached = false,
  warnings = [],
  message = null
}) {
  return {
    success,
    symbol,
    interval,
    range,
    count: data.length,
    data,
    message,
    meta: {
      provider,
      providerSymbol,
      isLive,
      isStale,
      fetchedAt,
      cacheTtlSeconds: MARKET_CACHE_TTL_SECONDS,
      cached,
      warnings
    }
  };
}

function markHistoryCached(history) {
  return {
    ...history,
    meta: {
      ...history.meta,
      cached: true,
      cacheTtlSeconds: history.meta?.cacheTtlSeconds || MARKET_CACHE_TTL_SECONDS
    }
  };
}

function normalizeHistoryCandles(candles) {
  return candles
    .map((candle) => {
      const time = Number.parseInt(candle.time, 10);
      const open = parseFiniteNumber(candle.open);
      const high = parseFiniteNumber(candle.high);
      const low = parseFiniteNumber(candle.low);
      const close = parseFiniteNumber(candle.close);
      const volume = parseFiniteNumber(candle.volume);

      if (!Number.isFinite(time) || open === null || high === null || low === null || close === null) {
        return null;
      }

      return {
        time,
        open,
        high,
        low,
        close,
        volume
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.time - b.time);
}

function getYahooPriceMeta(response) {
  return response.data?.chart?.result?.[0]?.meta || {};
}

async function getBinanceHistory({ symbol, providerSymbol, interval, range, warnings }) {
  const response = await axios.get('https://api.binance.com/api/v3/klines', {
    params: {
      symbol: providerSymbol,
      interval: HISTORY_INTERVALS[interval].binance,
      limit: getBinanceHistoryLimit(interval, range)
    },
    timeout: 10000
  });

  const candles = Array.isArray(response.data)
    ? normalizeHistoryCandles(response.data.map((item) => ({
      time: Math.floor(Number(item[0]) / 1000),
      open: item[1],
      high: item[2],
      low: item[3],
      close: item[4],
      volume: item[5]
    })))
    : [];

  if (candles.length === 0) {
    return createHistoryResponse({
      success: false,
      symbol,
      interval,
      range,
      provider: BINANCE_PROVIDER,
      providerSymbol,
      warnings,
      message: `No Binance candle data available for ${symbol}`
    });
  }

  return createHistoryResponse({
    success: true,
    symbol,
    interval,
    range,
    data: candles,
    provider: BINANCE_PROVIDER,
    providerSymbol,
    isLive: true,
    isStale: false,
    warnings
  });
}

async function getYahooHistory({ symbol, providerSymbol, interval, range, warnings }) {
  const yahooRange = getYahooHistoryRange(interval, range, warnings);
  const response = await axios.get(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(providerSymbol)}`,
    {
      params: {
        interval: HISTORY_INTERVALS[interval].yahoo,
        range: yahooRange,
        includePrePost: false
      },
      timeout: 10000
    }
  );

  const result = response.data?.chart?.result?.[0];
  const timestamps = Array.isArray(result?.timestamp) ? result.timestamp : [];
  const quote = result?.indicators?.quote?.[0] || {};

  const candles = normalizeHistoryCandles(timestamps.map((time, index) => ({
    time,
    open: quote.open?.[index],
    high: quote.high?.[index],
    low: quote.low?.[index],
    close: quote.close?.[index],
    volume: quote.volume?.[index]
  })));

  if (candles.length === 0) {
    return createHistoryResponse({
      success: false,
      symbol,
      interval,
      range,
      provider: YAHOO_PROVIDER,
      providerSymbol,
      warnings,
      message: `No Yahoo candle data available for ${symbol}`
    });
  }

  return createHistoryResponse({
    success: true,
    symbol,
    interval,
    range,
    data: candles,
    provider: YAHOO_PROVIDER,
    providerSymbol,
    isLive: false,
    isStale: false,
    warnings
  });
}

async function getMarketHistory(symbol, interval = '1h', range = '30d') {
  const warnings = [];
  const normalizedInterval = normalizeHistoryInterval(interval, warnings);
  const normalizedRange = normalizeHistoryRange(range, warnings);
  const market = resolveHistoryMarket(symbol);

  if (market.error) {
    return createHistoryResponse({
      success: false,
      symbol: market.symbol,
      interval: normalizedInterval,
      range: normalizedRange,
      warnings,
      message: market.error
    });
  }

  const cacheKey = `history_${market.symbol}_${normalizedInterval}_${normalizedRange}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    const cachedHistory = markHistoryCached(cached);
    if (warnings.length === 0) return cachedHistory;

    return {
      ...cachedHistory,
      meta: {
        ...cachedHistory.meta,
        warnings: [...(cachedHistory.meta?.warnings || []), ...warnings]
      }
    };
  }

  try {
    const history = market.provider === BINANCE_PROVIDER
      ? await getBinanceHistory({
        symbol: market.symbol,
        providerSymbol: market.providerSymbol,
        interval: normalizedInterval,
        range: normalizedRange,
        warnings
      })
      : await getYahooHistory({
        symbol: market.symbol,
        providerSymbol: market.providerSymbol,
        interval: normalizedInterval,
        range: normalizedRange,
        warnings
      });

    if (history.success) cache.set(cacheKey, history);
    return history;
  } catch (error) {
    return createHistoryResponse({
      success: false,
      symbol: market.symbol,
      interval: normalizedInterval,
      range: normalizedRange,
      provider: market.provider,
      providerSymbol: market.providerSymbol,
      warnings,
      message: `Unable to fetch candle data for ${market.symbol}: ${error.message}`
    });
  }
}

function getFallbackCryptos(limit, error) {
  // Fallback prices — update manually when significantly off from market
  const fallback = [
    { symbol: 'BTC', name: 'Bitcoin', price: 105000, change24h: 0, volume: 15000000000 },
    { symbol: 'ETH', name: 'Ethereum', price: 3800, change24h: 0, volume: 8000000000 },
    { symbol: 'SOL', name: 'Solana', price: 170, change24h: 0, volume: 2000000000 }
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
        const symbol = normalizeSymbol(item.symbol);
        return createQuote({
          symbol,
          name: getAssetName(symbol, 'crypto'),
          type: 'crypto',
          price: item.lastPrice,
          change24h: item.priceChangePercent,
          volume: item.quoteVolume,
          source: 'binance',
          provider: BINANCE_PROVIDER,
          providerSymbol: item.symbol,
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
      const providerSymbol = `${symbol}USDT`;
      const cacheKey = `crypto_${providerSymbol}`;
      const cached = cache.get(cacheKey);
      if (cached) return markQuoteCached(cached);

      try {
        const response = await axios.get(`https://api.binance.com/api/v3/ticker/24hr?symbol=${providerSymbol}`, {
          timeout: 5000
        });

        const quote = createQuote({
          symbol,
          name: getAssetName(symbol, 'crypto'),
          type: 'crypto',
          price: response.data.lastPrice,
          change24h: response.data.priceChangePercent,
          volume: response.data.quoteVolume,
          source: 'binance',
          provider: BINANCE_PROVIDER,
          providerSymbol,
          fallback: false,
          stale: false,
          priceAvailable: parseFiniteNumber(response.data.lastPrice) !== null && parseFiniteNumber(response.data.lastPrice) > 0
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
    const response = await axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}`, {
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
      providerSymbol: yahooSymbol,
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
  // Fallback prices — update manually when significantly off from market
  const prices = { XAU: 3300, GOLD: 3300, XAG: 33, SILVER: 33 };
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
    const response = await axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${upperSymbol}`, {
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
      providerSymbol: upperSymbol,
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
  // Fallback prices — update manually when significantly off from market
  const prices = { AAPL: 220, TSLA: 310, NVDA: 130, MSFT: 450, GOOGL: 190, AMZN: 220, META: 590, NFLX: 1100 };
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
    const response = await axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}`, {
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
      providerSymbol: yahooSymbol,
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
  // Fallback prices — update manually when significantly off from market
  const fallback = {
    IXIC: { price: 19500, name: 'NASDAQ Composite' },
    SPX: { price: 5900, name: 'S&P 500' },
    DJI: { price: 43000, name: 'Dow Jones Industrial Average' },
    NDX: { price: 21500, name: 'NASDAQ 100' },
    RUT: { price: 2200, name: 'Russell 2000' },
    VIX: { price: 16, name: 'CBOE Volatility Index' }
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
    `Symbol ${upperSymbol} not supported or price unavailable. Try: BTC, BTCUSDT, ETH, SOL, XAU, GOLD, AAPL, TSLA, IXIC, SPX, NDX, DJI`
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

/**
 * Batch-fetch prices for a list of symbols with a single Binance call for all
 * crypto symbols, while stocks/metals/indices are fetched in parallel.
 * Significantly reduces the number of outbound HTTP requests compared to N
 * individual getPrice() calls.
 */
async function getPricesBatch(symbols = []) {
  const normalizedSymbols = [...new Set(symbols.map(normalizeSymbol).filter(Boolean))];
  if (normalizedSymbols.length === 0) return [];

  const cryptoSymbols = [];
  const otherSymbols = [];

  for (const symbol of normalizedSymbols) {
    if (INDICES[symbol] || STOCK_SYMBOLS[symbol] || getYahooMetalSymbol(symbol)) {
      otherSymbols.push(symbol);
    } else {
      cryptoSymbols.push(symbol);
    }
  }

  // Batch Binance: single ticker/24hr call for all crypto symbols at once
  const cryptoResultsMap = new Map();
  if (cryptoSymbols.length > 0) {
    try {
      const providerSymbols = cryptoSymbols.map((s) => `${s}USDT`);
      const symbolsParam = JSON.stringify(providerSymbols);
      const response = await axios.get('https://api.binance.com/api/v3/ticker/24hr', {
        params: { symbols: symbolsParam },
        timeout: 10000,
      });

      const data = Array.isArray(response.data) ? response.data : [];
      for (const item of data) {
        const symbol = normalizeSymbol(item.symbol);
        const cacheKey = `crypto_${item.symbol}`;
        const quote = createQuote({
          symbol,
          name: getAssetName(symbol, 'crypto'),
          type: 'crypto',
          price: item.lastPrice,
          change24h: item.priceChangePercent,
          volume: item.quoteVolume,
          source: 'binance',
          provider: BINANCE_PROVIDER,
          providerSymbol: item.symbol,
          fallback: false,
          stale: false,
          priceAvailable: parseFiniteNumber(item.lastPrice) !== null && parseFiniteNumber(item.lastPrice) > 0,
        });
        cache.set(cacheKey, quote);
        cryptoResultsMap.set(symbol, quote);
      }
    } catch {
      // On batch failure, fall back to individual calls per symbol
    }

    for (const symbol of cryptoSymbols) {
      if (!cryptoResultsMap.has(symbol)) {
        const [quote] = await getSpecificCryptos([symbol]);
        cryptoResultsMap.set(symbol, quote);
      }
    }
  }

  // Non-crypto: parallel individual calls (Yahoo doesn't have a free batch endpoint)
  const otherResults = await Promise.all(otherSymbols.map((symbol) => getPrice(symbol)));

  // Rebuild in original order
  return normalizedSymbols.map((symbol) => {
    if (cryptoResultsMap.has(symbol)) return cryptoResultsMap.get(symbol);
    const idx = otherSymbols.indexOf(symbol);
    return idx !== -1 ? otherResults[idx] : createErrorQuote(symbol, 'Price unavailable');
  });
}

module.exports = {
  getPrice,
  getAllPrices,
  getTopCryptos,
  getSpecificCryptos,
  getPricesForSymbols,
  getPricesBatch,
  getMarketHistory,
  getMetalPrice,
  getStockPrice,
  getIndexPrice,
  createQuote,
  createErrorQuote,
  createFallbackQuote,
  computeDataQuality,
  normalizeSymbol,
  getMarketCacheTtlSeconds
};
