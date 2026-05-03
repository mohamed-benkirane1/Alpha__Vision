import api from './api'

export const getAllPrices = () =>
  api.get('/market/prices')

export const getPrice = (symbol) =>
  api.get(`/market/price/${symbol}`)

export const getTopCryptos = (limit = 100) =>
  api.get('/market/top', { params: { limit } })

export const getSpecificCryptos = (symbols) =>
  api.post('/market/specific', { symbols })

export const getMultiAssets = (symbols) =>
  api.get('/market/multi', { params: { symbols: symbols.join(',') } })
