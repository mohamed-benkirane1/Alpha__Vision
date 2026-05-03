import api from './api'

export const startBot = ({ symbol, strategy }) =>
  api.post('/bot/start', { symbol, strategy })

export const stopBot = () =>
  api.post('/bot/stop')

export const getBotStatus = () =>
  api.get('/bot/status')
