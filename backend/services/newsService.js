const axios = require('axios');
const NodeCache = require('node-cache');

const cache = new NodeCache({ stdTTL: 300 });
const GNEWS_PROVIDER = 'GNews';
const GNEWS_SOURCE = 'gnews';
const FALLBACK_PROVIDER = 'static-fallback';

function nowIso() {
  return new Date().toISOString();
}

function analyzeFinancialSentiment(text = '') {
  const lowerText = String(text).toLowerCase();
  const bullish = [
    'surge', 'rally', 'gain', 'bullish', 'growth', 'up', 'high', 'record',
    'breakout', 'positive', 'profit', 'rise', 'increasing', 'green',
    'opportunity', 'strong', 'upgrade', 'beat', 'exceeds'
  ];
  const bearish = [
    'drop', 'fall', 'decline', 'bearish', 'loss', 'down', 'low', 'crash',
    'negative', 'risk', 'warning', 'sell', 'decreasing', 'red',
    'concern', 'weak', 'downgrade', 'miss', 'below'
  ];

  const bullishCount = bullish.filter((word) => lowerText.includes(word)).length;
  const bearishCount = bearish.filter((word) => lowerText.includes(word)).length;

  if (bullishCount > bearishCount) return 'bullish';
  if (bearishCount > bullishCount) return 'bearish';
  return 'neutral';
}

function normalizeSearchTerm(value, maxLength = 60) {
  return String(value || '')
    .trim()
    .replace(/[^\w\s.-]/g, '')
    .slice(0, maxLength);
}

function buildNewsQuery({ symbol, category } = {}) {
  const cleanSymbol = normalizeSearchTerm(symbol, 20).toUpperCase();
  const cleanCategory = normalizeSearchTerm(category, 40).toLowerCase();

  if (cleanSymbol) {
    return `${cleanSymbol} finance OR ${cleanSymbol} stock OR ${cleanSymbol} crypto OR ${cleanSymbol} trading`;
  }

  if (cleanCategory) {
    return `${cleanCategory} finance OR ${cleanCategory} markets OR ${cleanCategory} investing`;
  }

  return 'stock market OR finance OR trading OR cryptocurrency OR investing OR economy';
}

function getNewsCacheKey({ symbol, category } = {}) {
  const cleanSymbol = normalizeSearchTerm(symbol, 20).toUpperCase() || 'all';
  const cleanCategory = normalizeSearchTerm(category, 40).toLowerCase() || 'all';
  return `financial_news_response_${cleanSymbol}_${cleanCategory}`;
}

function normalizeArticle(article = {}, context = {}) {
  const sourceName = article.source?.name || 'Unknown source';
  const textForSentiment = `${article.title || ''} ${article.description || ''}`;
  const symbol = normalizeSearchTerm(context.symbol, 20).toUpperCase() || null;
  const category = normalizeSearchTerm(context.category, 40).toLowerCase() || 'financial-markets';

  return {
    title: article.title || 'Untitled market news',
    description: article.description || '',
    url: article.url || null,
    image: article.image || null,
    publishedAt: article.publishedAt || null,
    source: sourceName,
    provider: GNEWS_PROVIDER,
    fallback: false,
    symbol,
    category,
    sentiment: analyzeFinancialSentiment(textForSentiment)
  };
}

function createSuccessResponse(articles) {
  const data = Array.isArray(articles) ? articles : [];
  return {
    success: true,
    timestamp: nowIso(),
    provider: GNEWS_PROVIDER,
    source: GNEWS_SOURCE,
    fallback: false,
    count: data.length,
    data,
    warnings: []
  };
}

function createFallbackResponse(reason) {
  return {
    success: true,
    timestamp: nowIso(),
    provider: FALLBACK_PROVIDER,
    source: 'fallback',
    fallback: true,
    count: 0,
    data: [],
    warnings: [reason || 'News provider unavailable or API key missing.']
  };
}

function createErrorResponse(error) {
  return {
    success: false,
    timestamp: nowIso(),
    provider: GNEWS_PROVIDER,
    source: GNEWS_SOURCE,
    fallback: false,
    error: error?.message || 'Unable to load market news',
    data: [],
    warnings: []
  };
}

async function getNews(filters = {}) {
  const cacheKey = getNewsCacheKey(filters);
  const cached = cache.get(cacheKey);
  if (cached) return { ...cached, cached: true };

  const apiKey = process.env.GNEWS_API_KEY || '';
  if (!apiKey) {
    const response = createFallbackResponse('GNews API key is not configured. No demo news are shown as real news.');
    cache.set('financial_news_response', response);
    return response;
  }

  try {
    const response = await axios.get('https://gnews.io/api/v4/search', {
      params: {
        apikey: apiKey,
        q: buildNewsQuery(filters),
        lang: 'en',
        country: 'us',
        max: 10,
        sortby: 'publishedAt'
      },
      timeout: 8000
    });

    const articles = Array.isArray(response.data?.articles)
      ? response.data.articles.map((article) => normalizeArticle(article, filters))
      : [];
    const normalized = createSuccessResponse(articles);
    cache.set(cacheKey, normalized);
    return normalized;
  } catch (error) {
    return createErrorResponse(error);
  }
}

module.exports = { getNews };
