import api from './api'

export const sendMessage = (message) =>
  api.post('/chatbot/message', { message })
