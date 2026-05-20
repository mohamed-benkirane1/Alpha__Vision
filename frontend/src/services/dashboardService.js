import { getMarketPrices } from './marketService'
import { getPortfolio } from './portfolioService'
import { getTradeHistory } from './tradingService'
import { getBotStatus } from './botService'

export const getDashboardLiveData = async () => {
  const [portfolioResult, tradesResult, marketsResult, botResult] = await Promise.allSettled([
    getPortfolio(),
    getTradeHistory(),
    getMarketPrices(),
    getBotStatus(),
  ])

  return {
    success: [portfolioResult, tradesResult, marketsResult, botResult].every((result) => result.status === 'fulfilled'),
    portfolio: portfolioResult.status === 'fulfilled' ? portfolioResult.value : null,
    trades: tradesResult.status === 'fulfilled' ? tradesResult.value : [],
    markets: marketsResult.status === 'fulfilled' ? marketsResult.value.quotes : [],
    marketDataQuality: marketsResult.status === 'fulfilled' ? marketsResult.value.dataQuality : null,
    bot: botResult.status === 'fulfilled' ? botResult.value : null,
    dataQuality: {
      portfolio: portfolioResult.status,
      trades: tradesResult.status,
      markets: marketsResult.status,
      bot: botResult.status,
    },
    notes: [
      'Performance chart needs historical portfolio snapshots.',
      'AI signal needs a dedicated backend signal endpoint.',
    ],
  }
}
