import api, { extractApiError } from './api'
import { getErrorMessage } from '../utils/errorMessage'

const normalizeArticle = (article = {}, index = 0) => ({
  id: article.url || `${article.title || 'news'}-${index}`,
  title: article.title || 'Untitled market news',
  description: article.description || '',
  url: article.url || null,
  image: article.image || null,
  publishedAt: article.publishedAt || null,
  source: article.source || 'Unknown source',
  provider: article.provider || null,
  fallback: article.fallback === true,
  symbol: article.symbol || null,
  category: article.category || 'financial-markets',
  sentiment: ['bullish', 'bearish', 'neutral'].includes(article.sentiment) ? article.sentiment : 'neutral',
})

export const normalizeNewsResponse = (payload = {}) => {
  const articles = Array.isArray(payload.data)
    ? payload.data.map(normalizeArticle)
    : []

  return {
    success: payload.success !== false,
    timestamp: payload.timestamp || null,
    provider: payload.provider || null,
    source: payload.source || null,
    fallback: payload.fallback === true,
    cached: payload.cached === true,
    count: Number.isFinite(Number(payload.count)) ? Number(payload.count) : articles.length,
    articles,
    data: articles,
    warnings: Array.isArray(payload.warnings) ? payload.warnings.map(getErrorMessage).filter(Boolean) : [],
    error: getErrorMessage(payload.error) || null,
    raw: payload,
  }
}

export const getMarketNews = async ({ symbol, category } = {}) => {
  try {
    const params = {
      ...(symbol ? { symbol } : {}),
      ...(category ? { category } : {}),
    }
    const response = await api.get('/news', {
      params: Object.keys(params).length > 0 ? params : undefined,
    })
    return normalizeNewsResponse(response.data)
  } catch (error) {
    const apiError = extractApiError(error)
    return {
      success: false,
      timestamp: apiError.data?.timestamp || null,
      provider: apiError.data?.provider || 'GNews',
      source: apiError.data?.source || 'gnews',
      fallback: apiError.data?.fallback === true,
      cached: false,
      count: 0,
      articles: [],
      data: [],
      warnings: Array.isArray(apiError.data?.warnings) ? apiError.data.warnings.map(getErrorMessage).filter(Boolean) : [],
      error: getErrorMessage(apiError.data?.error || apiError.message),
      status: apiError.status,
      raw: apiError.data,
    }
  }
}

export const getNews = getMarketNews
export const getNewsBySymbol = (symbol) => getMarketNews({ symbol })
export const getNewsByCategory = (category) => getMarketNews({ category })
