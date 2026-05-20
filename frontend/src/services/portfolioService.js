import api from './api'

export const getPortfolio = () =>
  api.get('/portfolio')

export const demoDeposit = (amount) =>
  api.post('/payment/demo-deposit', { amount })
