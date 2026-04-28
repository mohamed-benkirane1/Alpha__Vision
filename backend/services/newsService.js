const axios = require('axios');
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 300 }); // Cache 5 minutes

// ============================================================
// API GNews - NEWS UNIQUEMENT FINANCIÈRES
// ============================================================
// Pour obtenir une clé gratuite : https://gnews.io/
// 100 requêtes/jour gratuit
// ============================================================

const GNEWS_API_KEY = process.env.GNEWS_API_KEY || '';

async function getFinancialNews() {
  const cached = cache.get('financial_news');
  if (cached) return cached;
  
  // Si pas de clé GNews, utiliser les news simulées
  if (!GNEWS_API_KEY || GNEWS_API_KEY === '') {
    console.log('⚠️ GNews API key not configured, using simulated financial news');
    return getSimulatedFinancialNews();
  }
  
  try {
    console.log('📰 Fetching REAL financial news from GNews...');
    
    const response = await axios.get('https://gnews.io/api/v4/search', {
      params: {
        apikey: GNEWS_API_KEY,
        q: 'stock market OR finance OR trading OR cryptocurrency OR investing OR economy',
        lang: 'en',
        country: 'us',
        max: 10,
        sortby: 'publishedAt'
      },
      timeout: 8000
    });
    
    const articles = response.data.articles.map(article => ({
      title: article.title,
      description: article.description,
      source: article.source.name,
      url: article.url,
      image: article.image,
      publishedAt: article.publishedAt,
      sentiment: analyzeFinancialSentiment(article.title + ' ' + (article.description || ''))
    }));
    
    cache.set('financial_news', articles);
    return articles;
    
  } catch (error) {
    console.log('❌ GNews API error:', error.message);
    return getSimulatedFinancialNews();
  }
}

// ============================================================
// ANALYSE DE SENTIMENT POUR NEWS FINANCIÈRES
// ============================================================

function analyzeFinancialSentiment(text) {
  const lowerText = text.toLowerCase();
  
  const bullish = [
    'surge', 'rally', 'gain', 'bullish', 'growth', 'up', 'high', 'record',
    'breakout', 'positive', 'profit', 'rise', 'increasing', 'green',
    'opportunity', 'strong', 'upgrade', 'beat', 'exceeds'
  ];
  
  const bearish = [
    'drop', 'fall', 'decline', 'bearish', 'loss', 'down', 'low', 'crash',
    'negative', 'risk', 'warning', 'sell', 'decreasing', 'red',
    'concern', 'weak', 'downgrade', 'miss', 'below'
  ];
  
  let bullishCount = bullish.filter(word => lowerText.includes(word)).length;
  let bearishCount = bearish.filter(word => lowerText.includes(word)).length;
  
  if (bullishCount > bearishCount) return 'bullish';
  if (bearishCount > bullishCount) return 'bearish';
  return 'neutral';
}

// ============================================================
// SIMULATION DE NEWS FINANCIÈRES (FALLBACK)
// ============================================================

function getSimulatedFinancialNews() {
  return [
    {
      title: 'Bitcoin Surges Past $75,000 as Institutional Inflows Continue',
      description: 'Bitcoin reaches new all-time high amid growing institutional adoption and ETF inflows.',
      source: 'CryptoDaily',
      sentiment: 'bullish',
      publishedAt: new Date().toISOString()
    },
    {
      title: 'Federal Reserve Signals Potential Rate Cuts in Second Half of 2025',
      description: 'Fed officials indicate possible monetary policy easing as inflation cools.',
      source: 'Financial Times',
      sentiment: 'bullish',
      publishedAt: new Date(Date.now() - 3600000).toISOString()
    },
    {
      title: 'Tesla Reports Record Deliveries, Stock Jumps 8%',
      description: 'EV manufacturer exceeds analyst expectations with strong Q2 delivery numbers.',
      source: 'MarketWatch',
      sentiment: 'bullish',
      publishedAt: new Date(Date.now() - 7200000).toISOString()
    },
    {
      title: 'Ethereum Upgrade Set to Reduce Gas Fees by 40%',
      description: 'The upcoming network upgrade promises significant improvements in transaction costs.',
      source: 'BlockchainNews',
      sentiment: 'bullish',
      publishedAt: new Date(Date.now() - 10800000).toISOString()
    },
    {
      title: 'Gold Hits New High as Dollar Weakens',
      description: 'Precious metal reaches record levels amid currency market volatility.',
      source: 'Reuters',
      sentiment: 'bullish',
      publishedAt: new Date(Date.now() - 14400000).toISOString()
    },
    {
      title: 'Apple Unveils New AI Features at WWDC',
      description: 'Tech giant announces major AI integration across its product lineup.',
      source: 'TechCrunch',
      sentiment: 'bullish',
      publishedAt: new Date(Date.now() - 18000000).toISOString()
    },
    {
      title: 'Inflation Data Coming in Higher Than Expected',
      description: 'CPI figures exceed forecasts, raising concerns about future rate hikes.',
      source: 'Bloomberg',
      sentiment: 'bearish',
      publishedAt: new Date(Date.now() - 21600000).toISOString()
    },
    {
      title: 'Solana Overtakes Ethereum in Daily Active Users',
      description: 'High-performance blockchain sees surge in adoption and DeFi activity.',
      source: 'CoinDesk',
      sentiment: 'bullish',
      publishedAt: new Date(Date.now() - 25200000).toISOString()
    }
  ];
}

// ============================================================
// FONCTION PRINCIPALE EXPORTÉE
// ============================================================

async function getNews() {
  return await getFinancialNews();
}

module.exports = { getNews };