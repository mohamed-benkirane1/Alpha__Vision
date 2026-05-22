import { getMarketPrices } from './marketService'
import { getPortfolio, getPortfolioHistory } from './portfolioService'
import { getTradeHistory } from './tradingService'
import { getBotStatus } from './botService'
import { getAiSignal } from './aiSignalService'

const DASHBOARD_SIGNAL_SYMBOL = 'BTC'

export const getDashboardLiveData = async () => {
  const [portfolioResult, tradesResult, marketsResult, botResult, aiSignalResult] = await Promise.allSettled([
    getPortfolio(),
    getTradeHistory(),
    getMarketPrices(),
    getBotStatus(),
    getAiSignal(DASHBOARD_SIGNAL_SYMBOL),
  ])
  const [historyResult] = await Promise.allSettled([getPortfolioHistory('30d')])

  return {
    success: [portfolioResult, historyResult, tradesResult, marketsResult, botResult, aiSignalResult].every((result) => result.status === 'fulfilled'),
    portfolio: portfolioResult.status === 'fulfilled' ? portfolioResult.value : null,
    portfolioHistory: historyResult.status === 'fulfilled' ? historyResult.value : null,
    trades: tradesResult.status === 'fulfilled' ? tradesResult.value : [],
    markets: marketsResult.status === 'fulfilled' ? marketsResult.value.quotes : [],
    marketDataQuality: marketsResult.status === 'fulfilled' ? marketsResult.value.dataQuality : null,
    bot: botResult.status === 'fulfilled' ? botResult.value : null,
    aiSignal: aiSignalResult.status === 'fulfilled'
      ? aiSignalResult.value
      : aiSignalResult.reason?.normalized || null,
    dataQuality: {
      portfolio: portfolioResult.status,
      history: historyResult.status,
      trades: tradesResult.status,
      markets: marketsResult.status,
      bot: botResult.status,
      aiSignal: aiSignalResult.status,
    },
    notes: [],
  }
}
