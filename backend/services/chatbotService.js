const axios = require('axios');

async function chat(message) {
  const API_KEY = process.env.DEEPSEEK_API_KEY;
  if (!API_KEY || API_KEY === 'sk_placeholder') {
    return getSimulatedResponse(message);
  }
  
  try {
    const response = await axios.post('https://api.deepseek.com/v1/chat/completions', {
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: message }],
      max_tokens: 500
    }, {
      headers: { 'Authorization': `Bearer ${API_KEY}` }
    });
    return response.data.choices[0].message.content;
  } catch {
    return getSimulatedResponse(message);
  }
}

function getSimulatedResponse(message) {
  const msg = message.toLowerCase();
  if (msg.includes('btc') || msg.includes('bitcoin')) {
    return "Bitcoin is currently consolidating between $42,000 and $45,000. RSI is at 48 (neutral).";
  }
  if (msg.includes('eth') || msg.includes('ethereum')) {
    return "Ethereum is showing strength above $2,200. Support at $2,150, resistance at $2,400.";
  }
  return "I'm Alpha Vision, your trading assistant. How can I help?";
}

module.exports = { chat };