import { getMarketPrices } from './marketService'
import { getPortfolio } from './portfolioService'
import { getTradeHistory } from './tradingService'

export const getDashboardLiveData = async () => {
  const [portfolioResult, tradesResult, marketsResult] = await Promise.allSettled([
    getPortfolio(),
    getTradeHistory(),
    getMarketPrices(),
  ])

  return {
    success: [portfolioResult, tradesResult, marketsResult].every((result) => result.status === 'fulfilled'),
    portfolio: portfolioResult.status === 'fulfilled' ? portfolioResult.value : null,
    trades: tradesResult.status === 'fulfilled' ? tradesResult.value : [],
    markets: marketsResult.status === 'fulfilled' ? marketsResult.value.quotes : [],
    dataQuality: {
      portfolio: portfolioResult.status,
      trades: tradesResult.status,
      markets: marketsResult.status,
    },
    notes: [
      'Dashboard UI still contains mock performance, win-rate and AI signal sections until Live T8.',
    ],
  }
}
