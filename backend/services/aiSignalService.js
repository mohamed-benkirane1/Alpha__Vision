const { getMarketHistory, getPrice } = require('./marketService');
const { getNews } = require('./newsService');
const groqService = require('./groqService');

const DEFAULT_SYMBOL = process.env.AI_SIGNAL_DEFAULT_SYMBOL || 'BTC';
const DISCLAIMER = 'Educational analysis only, not financial advice.';
const VALID_LABELS = ['BUY', 'SELL', 'HOLD', 'NEUTRAL'];
const VALID_RISK_LEVELS = ['low', 'medium', 'high'];

const SIGNAL_SYSTEM_PROMPT = [
  'You are a professional financial analyst providing educational trading signals.',
  'Analyze the provided market data and news context.',
  'Respond ONLY with a valid JSON object matching this exact schema:',
  '{"label":"BUY|SELL|HOLD|NEUTRAL","confidence":0-100,"riskLevel":"low|medium|high",',
  '"timeHorizon":"short-term|medium-term|long-term","summary":"concise analysis string",',
  '"reasons":["reason 1","reason 2","reason 3"]}',
  'Do not invent data. Do not promise returns. This is educational analysis only.',
].join(' ');

function nowIso() {
  return new Date().toISOString();
}

function cleanText(value, maxLength = 500) {
  if (typeof value !== 'string') return '';
  return value.trim().replace(/\s+/g, ' ').slice(0, maxLength);
}

function normalizeSymbol(symbol) {
  return String(symbol || DEFAULT_SYMBOL).trim().toUpperCase();
}

function toFiniteNumber(value, fallback = null) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function createMarketSnapshot(quote = {}) {
  const isStale = quote.stale === true || quote.isStale === true;
  return {
    symbol: quote.symbol || null,
    name: quote.name || quote.symbol || null,
    type: quote.type || null,
    price: quote.price ?? null,
    change24h: toFiniteNumber(quote.change24h, 0),
    source: quote.source || null,
    provider: quote.provider || null,
    providerSymbol: quote.providerSymbol || null,
    timestamp: quote.timestamp || null,
    fetchedAt: quote.fetchedAt || quote.timestamp || null,
    cached: quote.cached === true,
    fallback: quote.fallback === true,
    stale: isStale,
    isLive: quote.isLive === true,
    isStale,
    priceAvailable: quote.priceAvailable === true,
    error: quote.error || null,
  };
}

function createNewsSummary(articles = []) {
  const usableArticles = Array.isArray(articles) ? articles : [];
  const latest = usableArticles
    .map((a) => a.publishedAt)
    .filter(Boolean)
    .sort()
    .at(-1) || null;
  return { articlesUsed: usableArticles.length, latestPublishedAt: latest };
}

function createDataQuality({
  quote = null,
  marketReliable = false,
  usesNewsData = false,
  newsAvailable = false,
  usesLLM = false,
  indicative = false,
  warnings = [],
} = {}) {
  const isStale = quote?.stale === true || quote?.isStale === true;
  return {
    marketDataAvailable: quote?.priceAvailable === true,
    isLive: quote?.isLive === true,
    isStale,
    isCached: quote?.cached === true,
    isFallback: quote?.fallback === true,
    usesLiveMarketData: quote?.isLive === true,
    usesNewsData,
    usesLLM,
    marketReliable,
    newsAvailable,
    isIndicative: indicative,
    warnings: warnings.filter(Boolean),
  };
}

function createSignalDetails(signalData, quote, newsArticles) {
  return {
    label: signalData.label,
    confidence: signalData.confidence,
    riskLevel: signalData.riskLevel,
    timeHorizon: signalData.timeHorizon || 'short-term',
    summary: signalData.summary,
    analysis: signalData.summary,
    reasons: Array.isArray(signalData.reasons) ? signalData.reasons : [],
    marketSnapshot: createMarketSnapshot(quote),
    newsContext: createNewsSummary(newsArticles),
    disclaimer: DISCLAIMER,
    notFinancialAdvice: true,
  };
}

function buildResponse({
  success = true,
  mode,
  provider,
  providerStatus,
  symbol,
  quote = null,
  signalData = null,
  newsArticles = [],
  dataQuality,
  warnings = [],
  error = null,
}) {
  const details = signalData ? createSignalDetails(signalData, quote, newsArticles) : null;
  return {
    success,
    mode,
    provider,
    providerStatus,
    timestamp: nowIso(),
    symbol,
    source: 'backend',
    fallback: mode !== 'ai',
    signal: details,
    label: details?.label || null,
    confidence: details ? Number((details.confidence / 100).toFixed(2)) : null,
    analysis: details?.analysis || null,
    reasons: details?.reasons || [],
    dataQuality,
    warnings: [...new Set(warnings.filter(Boolean))],
    error,
    notFinancialAdvice: true,
  };
}

function isReliableQuote(quote) {
  const price = Number(quote?.price);
  const isStale = quote?.stale === true || quote?.isStale === true;
  return (
    quote?.priceAvailable === true
    && quote?.price !== null
    && Number.isFinite(price)
    && price > 0
    && quote?.fallback !== true
    && !isStale
  );
}

function buildUnavailableResponse(reason, symbol, quote = null) {
  const warning = reason || 'Market price unavailable.';
  return buildResponse({
    success: false,
    mode: 'fallback',
    provider: 'rules-based',
    providerStatus: groqService.getProviderStatus(),
    symbol,
    quote,
    signalData: null,
    dataQuality: createDataQuality({ quote, marketReliable: false, warnings: [warning] }),
    warnings: ['Cannot generate a signal without reliable market data.'],
    error: warning,
  });
}

async function getMarketContext(symbol) {
  const quote = await getPrice(symbol);
  if (!isReliableQuote(quote)) {
    if (quote?.priceAvailable !== true || quote?.price === null) return { error: 'Market price unavailable.', quote };
    if (quote?.fallback === true) return { error: 'Fallback market price detected.', quote };
    if (quote?.stale === true || quote?.isStale === true) return { error: 'Stale market price detected.', quote };
    return { error: 'Market price unavailable.', quote };
  }
  return { quote };
}

function matchesSymbol(article, quote) {
  const text = `${article?.title || ''} ${article?.description || ''}`.toLowerCase();
  const tokens = [quote.symbol, quote.name]
    .map((t) => cleanText(t, 80).toLowerCase())
    .filter((t) => t.length >= 2);
  return tokens.some((t) => text.includes(t));
}

function normalizeNewsForPrompt(article = {}) {
  return {
    title: cleanText(article.title, 220),
    description: cleanText(article.description, 320),
    source: cleanText(article.source, 120),
    publishedAt: article.publishedAt || null,
    sentiment: article.sentiment || null,
  };
}

async function getNewsContext(quote) {
  try {
    const response = await getNews();
    const data = response?.success === true && response?.fallback !== true && Array.isArray(response.data)
      ? response.data.filter(Boolean)
      : [];
    const matched = data.filter((a) => matchesSymbol(a, quote));
    const selected = (matched.length > 0 ? matched : data).slice(0, 3);
    const warnings = [
      ...(Array.isArray(response?.warnings) ? response.warnings : []),
      ...(selected.length > 0 && matched.length === 0
        ? ['No symbol-specific news found. Latest market news context was used.']
        : []),
    ];
    return {
      available: selected.length > 0,
      articles: selected.map(normalizeNewsForPrompt),
      warnings,
      error: response?.success === false ? response.error || 'News unavailable.' : null,
    };
  } catch (error) {
    return {
      available: false,
      articles: [],
      warnings: ['News context unavailable. Signal used market data only.'],
      error: error.message || 'News unavailable.',
    };
  }
}

function movingAverage(candles, period) {
  if (!Array.isArray(candles) || candles.length < period) return null;
  const slice = candles.slice(-period);
  const total = slice.reduce((sum, c) => sum + toFiniteNumber(c.close, 0), 0);
  return total / period;
}

async function generateRulesBasedSignal(context, reason, providerStatus = 'fallback') {
  const warnings = [reason || 'AI provider unavailable. Deterministic rules were used.'];
  let history = null;

  try {
    history = await getMarketHistory(context.symbol, '1h', '30d');
  } catch (err) {
    warnings.push(err.message || 'OHLC history unavailable for rules-based signal.');
  }

  const candles = Array.isArray(history?.data) ? history.data : [];
  const ma20 = movingAverage(candles, 20);
  const ma50 = movingAverage(candles, 50);
  const change = toFiniteNumber(context.quote?.change24h, 0);
  let label = 'NEUTRAL';
  let summary = 'Rules-based signal generated from market data only.';
  const reasons = [];

  if (ma20 !== null && ma50 !== null) {
    if (ma20 > ma50 && change >= -1) {
      label = 'BUY';
      reasons.push(`MA20 (${ma20.toFixed(2)}) is above MA50 (${ma50.toFixed(2)}).`);
    } else if (ma20 < ma50 && change <= 1) {
      label = 'SELL';
      reasons.push(`MA20 (${ma20.toFixed(2)}) is below MA50 (${ma50.toFixed(2)}).`);
    } else {
      label = 'HOLD';
      reasons.push(`MA20 (${ma20.toFixed(2)}) and MA50 (${ma50.toFixed(2)}) do not confirm a clear directional signal.`);
    }
    summary = 'Rules-based MA20/MA50 signal generated without an AI provider.';
  } else {
    label = change > 3 ? 'BUY' : change < -3 ? 'SELL' : 'HOLD';
    reasons.push('Not enough OHLC history for MA rules; 24h change fallback was used.');
  }

  reasons.push(`24h change is ${change.toFixed(2)}%.`);
  reasons.push('No LLM analysis was used.');

  const riskLevel = Math.abs(change) >= 7 ? 'high' : Math.abs(change) >= 3 ? 'medium' : 'low';
  const confidence = label === 'HOLD' || label === 'NEUTRAL' ? 55 : 62;

  return buildResponse({
    success: true,
    mode: 'fallback',
    provider: 'rules-based',
    providerStatus,
    symbol: context.symbol,
    quote: context.quote,
    signalData: { label, confidence, riskLevel, timeHorizon: 'short-term', summary, reasons },
    newsArticles: [],
    dataQuality: createDataQuality({
      quote: context.quote,
      marketReliable: true,
      usesNewsData: false,
      newsAvailable: false,
      usesLLM: false,
      indicative: true,
      warnings,
    }),
    warnings: ['This signal is rules-based fallback analysis, not an AI provider response.', ...warnings],
    error: null,
  });
}

function validateGroqSignal(parsed) {
  const label = cleanText(String(parsed.label || ''), 20).toUpperCase();
  const confidence = toFiniteNumber(parsed.confidence);
  const riskLevel = cleanText(String(parsed.riskLevel || ''), 20).toLowerCase();
  const summary = cleanText(String(parsed.summary || ''), 700);
  const reasons = Array.isArray(parsed.reasons)
    ? parsed.reasons.map((r) => cleanText(String(r), 320)).filter(Boolean).slice(0, 5)
    : [];

  if (!VALID_LABELS.includes(label)) throw new Error(`Invalid signal label: "${label}"`);
  if (confidence === null || confidence < 0 || confidence > 100) throw new Error('Invalid confidence value.');
  if (!VALID_RISK_LEVELS.includes(riskLevel)) throw new Error(`Invalid risk level: "${riskLevel}"`);
  if (!summary) throw new Error('Signal summary is missing.');
  if (reasons.length === 0) throw new Error('Signal reasons are missing.');

  return {
    label,
    confidence: Number(confidence.toFixed(0)),
    riskLevel,
    timeHorizon: cleanText(String(parsed.timeHorizon || 'short-term'), 80) || 'short-term',
    summary,
    reasons,
  };
}

async function generateGroqSignal(context) {
  const prompt = JSON.stringify({
    instruction: 'Analyze this market data and return a trading signal as JSON.',
    disclaimer: DISCLAIMER,
    marketQuote: createMarketSnapshot(context.quote),
    newsContext: context.news.articles,
    metadata: {
      newsAvailable: context.news.available,
      articlesUsed: context.news.articles.length,
    },
  });

  // generateJSON returns a guaranteed parsed object — no regex fallback needed
  const parsed = await groqService.generateJSON(prompt, SIGNAL_SYSTEM_PROMPT);
  return validateGroqSignal(parsed);
}

async function generateAiSignal({ symbol }) {
  const normalizedSymbol = normalizeSymbol(symbol);
  const market = await getMarketContext(normalizedSymbol);

  if (market.error) {
    return buildUnavailableResponse(market.error, normalizedSymbol, market.quote);
  }

  const news = await getNewsContext(market.quote);
  const context = { symbol: normalizedSymbol, quote: market.quote, news };
  const qualityWarnings = [
    ...(news.warnings || []),
    ...(market.quote?.isLive !== true ? ['Market data may be delayed or cached depending on the provider.'] : []),
  ];

  if (!groqService.isAvailable()) {
    return generateRulesBasedSignal(
      context,
      'Groq API key is missing. Rules-based fallback was used.',
      'missing_key',
    );
  }

  try {
    const signalData = await generateGroqSignal(context);

    return buildResponse({
      success: true,
      mode: 'ai',
      provider: 'groq',
      providerStatus: 'available',
      symbol: normalizedSymbol,
      quote: market.quote,
      signalData,
      newsArticles: news.articles,
      dataQuality: createDataQuality({
        quote: market.quote,
        marketReliable: true,
        usesNewsData: news.available,
        newsAvailable: news.available,
        usesLLM: true,
        indicative: false,
        warnings: qualityWarnings,
      }),
      warnings: qualityWarnings,
      error: null,
    });
  } catch (error) {
    return generateRulesBasedSignal(
      context,
      `Groq provider error. Rules-based fallback was used: ${groqService.getErrorMessage(error)}`,
      groqService.getProviderStatus(error),
    );
  }
}

module.exports = {
  buildDataQuality: createDataQuality,
  buildUnavailableResponse,
  generateAiSignal,
  generateGroqSignal,
  generateRulesBasedSignal,
  getMarketContext,
  getNewsContext,
  validateGroqSignal,
};
