const axios = require('axios');
const { getPrice } = require('./marketService');
const { getNews } = require('./newsService');

const DEFAULT_SYMBOL = process.env.AI_SIGNAL_DEFAULT_SYMBOL || 'BTC';
const DEFAULT_PROVIDER = (process.env.AI_SIGNAL_PROVIDER || 'deepseek').trim().toLowerCase();
const DEEPSEEK_MODEL = 'deepseek-chat';
const DISCLAIMER = 'Educational signal, not financial advice.';
const VALID_LABELS = ['BUY', 'SELL', 'HOLD'];
const VALID_RISK_LEVELS = ['low', 'medium', 'high'];

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
  return {
    symbol: quote.symbol || null,
    name: quote.name || quote.symbol || null,
    type: quote.type || null,
    price: quote.price ?? null,
    change24h: toFiniteNumber(quote.change24h, 0),
    source: quote.source || null,
    provider: quote.provider || null,
    timestamp: quote.timestamp || null,
    cached: quote.cached === true,
    fallback: quote.fallback === true,
    stale: quote.stale === true,
    priceAvailable: quote.priceAvailable === true,
    error: quote.error || null,
  };
}

function createNewsSummary(articles = []) {
  const usableArticles = Array.isArray(articles) ? articles : [];
  const latest = usableArticles
    .map((article) => article.publishedAt)
    .filter(Boolean)
    .sort()
    .at(-1) || null;

  return {
    articlesUsed: usableArticles.length,
    latestPublishedAt: latest,
  };
}

function createDataQuality({
  marketReliable = false,
  usesNewsData = false,
  newsAvailable = false,
  usesLLM = false,
  indicative = false,
  warnings = [],
} = {}) {
  return {
    usesLiveMarketData: marketReliable,
    usesNewsData,
    usesLLM,
    marketReliable,
    newsAvailable,
    isIndicative: indicative,
    warnings: warnings.filter(Boolean),
  };
}

function buildResponse({
  success,
  symbol,
  provider = null,
  fallback = false,
  dataQuality,
  signal = null,
  warnings = [],
  error = null,
}) {
  return {
    success,
    timestamp: nowIso(),
    symbol,
    source: 'backend',
    provider,
    fallback,
    dataQuality,
    signal,
    warnings: warnings.filter(Boolean),
    error,
  };
}

function buildUnavailableResponse(reason, symbol, quote = null) {
  const warning = reason || 'Live market price unavailable.';
  const quoteWarning = quote?.fallback
    ? 'Reliable market quote required. Fallback quote rejected.'
    : quote?.stale
      ? 'Reliable market quote required. Stale quote rejected.'
      : warning;

  return buildResponse({
    success: false,
    symbol,
    dataQuality: createDataQuality({
      marketReliable: false,
      warnings: [quoteWarning],
    }),
    warnings: ['Cannot generate a real signal without reliable market data.'],
    error: warning,
  });
}

function isReliableQuote(quote) {
  const price = Number(quote?.price);
  return quote?.priceAvailable === true
    && quote?.price !== null
    && Number.isFinite(price)
    && price > 0
    && quote?.fallback !== true
    && quote?.stale !== true;
}

async function getMarketContext(symbol) {
  const quote = await getPrice(symbol);
  if (!isReliableQuote(quote)) {
    if (quote?.priceAvailable !== true || quote?.price === null) {
      return { error: 'Live market price unavailable.', quote };
    }
    if (quote?.fallback === true) {
      return { error: 'Fallback market price detected.', quote };
    }
    if (quote?.stale === true) {
      return { error: 'Stale market price detected.', quote };
    }
    return { error: 'Live market price unavailable.', quote };
  }

  return { quote };
}

function matchesSymbol(article, quote) {
  const text = `${article?.title || ''} ${article?.description || ''}`.toLowerCase();
  const tokens = [quote.symbol, quote.name]
    .map((token) => cleanText(token, 80).toLowerCase())
    .filter((token) => token.length >= 2);

  return tokens.some((token) => text.includes(token));
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
    const matched = data.filter((article) => matchesSymbol(article, quote));
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

function buildSignalShell(signalData, quote, newsArticles) {
  return {
    ...signalData,
    marketSnapshot: createMarketSnapshot(quote),
    newsContext: createNewsSummary(newsArticles),
    disclaimer: DISCLAIMER,
  };
}

function generateRulesBasedSignal(context, reason) {
  const change = toFiniteNumber(context.quote?.change24h, 0);
  const label = change > 3 ? 'BUY' : change < -3 ? 'SELL' : 'HOLD';
  const confidence = label === 'HOLD' ? 55 : 62;
  const riskLevel = Math.abs(change) >= 7 ? 'high' : 'medium';
  const directionReason = label === 'BUY'
    ? '24h price change is above the positive rules threshold.'
    : label === 'SELL'
      ? '24h price change is below the negative rules threshold.'
      : '24h change is moderate and remains inside the rules hold band.';
  const providerWarning = reason || 'DeepSeek is not configured. Signal generated by deterministic rules.';
  const warnings = [
    'This is not an AI signal. Configure DEEPSEEK_API_KEY for AI analysis.',
  ];

  return buildResponse({
    success: true,
    symbol: context.symbol,
    provider: 'rules-based',
    fallback: true,
    dataQuality: createDataQuality({
      marketReliable: true,
      usesNewsData: false,
      newsAvailable: false,
      usesLLM: false,
      indicative: true,
      warnings: [providerWarning],
    }),
    signal: buildSignalShell({
      label,
      confidence,
      riskLevel,
      timeHorizon: 'short-term',
      summary: 'Rules-based signal generated from reliable live price change only.',
      reasons: [
        directionReason,
        'No LLM or news analysis was used.',
      ],
    }, context.quote, []),
    warnings,
    error: null,
  });
}

function buildDeepSeekMessages(context) {
  const system = [
    'You are an educational trading analysis assistant.',
    'Produce one structured signal using only the provided market quote and news context.',
    'Do not invent prices, news, historical performance, certainty, or guaranteed returns.',
    'Do not promise gains or give guaranteed financial advice.',
    'Respond only in valid JSON using this exact shape:',
    '{"label":"BUY|SELL|HOLD","confidence":72,"riskLevel":"low|medium|high","timeHorizon":"short-term","summary":"string","reasons":["string"]}',
  ].join(' ');

  const prompt = {
    instruction: 'Return JSON only.',
    disclaimer: DISCLAIMER,
    marketQuote: createMarketSnapshot(context.quote),
    newsContext: context.news.articles,
    metadata: {
      newsAvailable: context.news.available,
      articlesUsed: context.news.articles.length,
    },
  };

  return [
    { role: 'system', content: system },
    { role: 'user', content: JSON.stringify(prompt) },
  ];
}

function parseAndValidateLLMResponse(rawResponse) {
  const content = cleanText(rawResponse, 4000);
  if (!content) throw new Error('DeepSeek returned an empty signal response.');

  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error('DeepSeek signal response was not valid JSON.');
  }

  const label = cleanText(parsed.label, 20).toUpperCase();
  const confidence = toFiniteNumber(parsed.confidence);
  const riskLevel = cleanText(parsed.riskLevel, 20).toLowerCase();
  const summary = cleanText(parsed.summary, 700);
  const reasons = Array.isArray(parsed.reasons)
    ? parsed.reasons.map((reason) => cleanText(reason, 320)).filter(Boolean).slice(0, 5)
    : [];

  if (!VALID_LABELS.includes(label)) throw new Error('DeepSeek signal label is invalid.');
  if (confidence === null || confidence < 0 || confidence > 100) throw new Error('DeepSeek confidence is invalid.');
  if (!VALID_RISK_LEVELS.includes(riskLevel)) throw new Error('DeepSeek risk level is invalid.');
  if (!summary) throw new Error('DeepSeek signal summary is missing.');
  if (reasons.length === 0) throw new Error('DeepSeek signal reasons are missing.');

  return {
    label,
    confidence: Number(confidence.toFixed(0)),
    riskLevel,
    timeHorizon: 'short-term',
    summary,
    reasons,
  };
}

async function generateDeepSeekSignal(context) {
  const response = await axios.post(
    'https://api.deepseek.com/v1/chat/completions',
    {
      model: DEEPSEEK_MODEL,
      messages: buildDeepSeekMessages(context),
      response_format: { type: 'json_object' },
      temperature: 0.2,
      max_tokens: 500,
    },
    {
      headers: { Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}` },
      timeout: 15000,
    },
  );

  return parseAndValidateLLMResponse(response.data?.choices?.[0]?.message?.content);
}

function getDeepSeekConfigured() {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  return DEFAULT_PROVIDER === 'deepseek' && Boolean(apiKey && apiKey !== 'sk_placeholder');
}

async function generateAiSignal({ symbol }) {
  const normalizedSymbol = normalizeSymbol(symbol);
  const market = await getMarketContext(normalizedSymbol);

  if (market.error) {
    return buildUnavailableResponse(market.error, normalizedSymbol, market.quote);
  }

  const news = await getNewsContext(market.quote);
  const context = {
    symbol: normalizedSymbol,
    quote: market.quote,
    news,
  };

  if (!getDeepSeekConfigured()) {
    const reason = DEFAULT_PROVIDER !== 'deepseek'
      ? `AI_SIGNAL_PROVIDER ${DEFAULT_PROVIDER} is not implemented. Signal generated by deterministic rules.`
      : 'DeepSeek is not configured. Signal generated by deterministic rules.';
    return generateRulesBasedSignal(context, reason);
  }

  try {
    const signalData = await generateDeepSeekSignal(context);
    const newsWarnings = news.warnings || [];

    return buildResponse({
      success: true,
      symbol: normalizedSymbol,
      provider: 'deepseek',
      fallback: false,
      dataQuality: createDataQuality({
        marketReliable: true,
        usesNewsData: news.available,
        newsAvailable: news.available,
        usesLLM: true,
        indicative: false,
        warnings: newsWarnings,
      }),
      signal: buildSignalShell(signalData, market.quote, news.articles),
      warnings: newsWarnings,
      error: null,
    });
  } catch (error) {
    if (String(error.message || '').includes('DeepSeek signal')) {
      return generateRulesBasedSignal(
        context,
        `${error.message} Deterministic rules were used instead of an unvalidated AI signal.`,
      );
    }

    return buildResponse({
      success: false,
      symbol: normalizedSymbol,
      provider: 'deepseek',
      fallback: false,
      dataQuality: createDataQuality({
        marketReliable: true,
        usesNewsData: news.available,
        newsAvailable: news.available,
        usesLLM: false,
        indicative: false,
        warnings: news.warnings || [],
      }),
      warnings: ['DeepSeek analysis is unavailable. No AI signal was returned.'],
      error: error?.response?.data?.error?.message || error.message || 'Unable to generate AI signal.',
    });
  }
}

module.exports = {
  buildDataQuality: createDataQuality,
  buildUnavailableResponse,
  generateAiSignal,
  generateDeepSeekSignal,
  generateRulesBasedSignal,
  getMarketContext,
  getNewsContext,
  parseAndValidateLLMResponse,
};
