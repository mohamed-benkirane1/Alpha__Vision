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

function normalizeArticle(article = {}) {
  const sourceName = article.source?.name || 'Unknown source';
  const textForSentiment = `${article.title || ''} ${article.description || ''}`;

  return {
    title: article.title || 'Untitled market news',
    description: article.description || '',
    url: article.url || null,
    image: article.image || null,
    publishedAt: article.publishedAt || null,
    source: sourceName,
    provider: GNEWS_PROVIDER,
    fallback: false,
    symbol: null,
    category: 'financial-markets',
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

async function getNews() {
  const cached = cache.get('financial_news_response');
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
        q: 'stock market OR finance OR trading OR cryptocurrency OR investing OR economy',
        lang: 'en',
        country: 'us',
        max: 10,
        sortby: 'publishedAt'
      },
      timeout: 8000
    });

    const articles = Array.isArray(response.data?.articles)
      ? response.data.articles.map(normalizeArticle)
      : [];
    const normalized = createSuccessResponse(articles);
    cache.set('financial_news_response', normalized);
    return normalized;
  } catch (error) {
    return createErrorResponse(error);
  }
}

module.exports = { getNews };
