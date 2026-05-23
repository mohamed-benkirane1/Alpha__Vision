import { getMarketPrices } from './marketService'
import { getPortfolio, getPortfolioHistory } from './portfolioService'
import { getTradeHistory } from './tradingService'
import { getBotStatus } from './botService'
import { getAiSignal } from './aiSignalService'

const DASHBOARD_SIGNAL_SYMBOL = 'BTC'

const isObject = (value) => value !== null && typeof value === 'object'

const getSettledValue = (result, fallback = null) =>
  result.status === 'fulfilled' ? result.value : fallback

const getWidgetStatus = (result) => {
  if (result.status === 'rejected') {
    return {
      status: 'rejected',
      success: false,
      error: result.reason?.normalized?.error || result.reason?.message || 'Request failed.',
    }
  }

  const value = result.value
  const success = !isObject(value) || value.success !== false

  return {
    status: 'fulfilled',
    success,
    error: isObject(value) ? value.error || value.message || null : null,
  }
}

const normalizeMarkets = (marketResponse) =>
  Array.isArray(marketResponse?.quotes) ? marketResponse.quotes : []

const normalizeTrades = (trades) =>
  Array.isArray(trades) ? trades : []

export const getDashboardLiveData = async () => {
  const [portfolioResult, tradesResult, marketsResult, botResult, aiSignalResult] = await Promise.allSettled([
    getPortfolio(),
    getTradeHistory(),
    getMarketPrices(),
    getBotStatus(),
    getAiSignal(DASHBOARD_SIGNAL_SYMBOL),
  ])
  const [historyResult] = await Promise.allSettled([getPortfolioHistory('30d')])
  const widgetStatus = {
    portfolio: getWidgetStatus(portfolioResult),
    history: getWidgetStatus(historyResult),
    trades: getWidgetStatus(tradesResult),
    markets: getWidgetStatus(marketsResult),
    bot: getWidgetStatus(botResult),
    aiSignal: getWidgetStatus(aiSignalResult),
  }
  const portfolio = getSettledValue(portfolioResult)
  const portfolioHistory = getSettledValue(historyResult)
  const marketsResponse = getSettledValue(marketsResult)
  const aiSignal = aiSignalResult.status === 'fulfilled'
    ? aiSignalResult.value
    : aiSignalResult.reason?.normalized || null

  return {
    success: Object.values(widgetStatus).every((widget) => widget.status === 'fulfilled'),
    portfolio,
    portfolioHistory,
    trades: normalizeTrades(getSettledValue(tradesResult, [])),
    markets: normalizeMarkets(marketsResponse),
    marketDataQuality: marketsResponse?.dataQuality || null,
    bot: getSettledValue(botResult),
    aiSignal,
    widgets: widgetStatus,
    dataQuality: Object.fromEntries(
      Object.entries(widgetStatus).map(([key, value]) => [key, value.status]),
    ),
    notes: Object.entries(widgetStatus)
      .filter(([, value]) => value.status === 'rejected')
      .map(([key, value]) => `${key}: ${value.error}`),
  }
}
