import api from './api'

export const runBacktest = ({ symbol, strategy, initialCapital }) =>
  api.post('/backtest', { symbol, strategy, initialCapital })
