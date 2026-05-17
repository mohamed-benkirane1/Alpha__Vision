import api from './api'

export const getPortfolio = () =>
  api.get('/portfolio')
