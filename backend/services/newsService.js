const axios = require('axios');
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 300 });

async function getNews() {
  const cached = cache.get('news');
  if (cached) return cached;
  
  const API_KEY = process.env.NEWSDATA_API_KEY;
  if (!API_KEY || API_KEY === 'pub_placeholder') {
    return getSimulatedNews();
  }
  
  try {
    const response = await axios.get('https://newsdata.io/api/1/news', {
      params: { apikey: API_KEY, q: 'finance OR crypto', language: 'en', size: 8 }
    });
    const articles = response.data.results.map(a => ({
      title: a.title,
      source: a.source_id,
      publishedAt: a.pubDate
    }));
    cache.set('news', articles);
    return articles;
  } catch {
    return getSimulatedNews();
  }
}

function getSimulatedNews() {
  return [
    { title: 'Bitcoin approaches $45,000', source: 'CryptoDaily', publishedAt: new Date().toISOString() },
    { title: 'Ethereum upgrade coming soon', source: 'BlockNews', publishedAt: new Date().toISOString() },
    { title: 'Fed signals rate cuts', source: 'FinanceTimes', publishedAt: new Date().toISOString() }
  ];
}

module.exports = { getNews };