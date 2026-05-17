import api from './api'

export const getNews = () =>
  api.get('/news')
