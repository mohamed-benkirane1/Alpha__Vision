import api from './api'

export const createTrade = ({ symbol, type, quantity }) =>
  api.post('/trade', { symbol, type, quantity })

export const getTradeHistory = () =>
  api.get('/trade/history')
