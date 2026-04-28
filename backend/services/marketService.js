const axios = require('axios');
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 10 });

// ============================================================
// CRYPTO (Binance API - GRATUIT, SANS CLÉ)
// ============================================================

async function getTopCryptos(limit = 50) {
  const cached = cache.get(`top_cryptos_${limit}`);
  if (cached) return cached;
  
  try {
    const response = await axios.get('https://api.binance.com/api/v3/ticker/24hr', {
      timeout: 10000
    });
    
    const cryptos = response.data
      .filter(item => item.symbol.endsWith('USDT'))
      .sort((a, b) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume))
      .slice(0, limit)
      .map(item => ({
        symbol: item.symbol.replace('USDT', ''),
        price: parseFloat(item.lastPrice),
        change24h: parseFloat(item.priceChangePercent),
        volume: parseFloat(item.quoteVolume),
        source: 'binance',
        type: 'crypto'
      }));
    
    cache.set(`top_cryptos_${limit}`, cryptos);
    return cryptos;
  } catch (error) {
    return getFallbackCryptos(limit);
  }
}

async function getSpecificCryptos(symbols = ['BTC', 'ETH', 'SOL']) {
  const prices = await Promise.all(
    symbols.map(async (symbol) => {
      try {
        const response = await axios.get(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}USDT`, {
          timeout: 5000
        });
        return {
          symbol: symbol,
          price: parseFloat(response.data.price),
          change24h: 0,
          source: 'binance',
          type: 'crypto'
        };
      } catch {
        return { symbol: symbol, price: 0, source: 'error', type: 'crypto' };
      }
    })
  );
  return prices;
}

function getFallbackCryptos(limit) {
  const fallback = [
    { symbol: 'BTC', price: 43000, change24h: 2.5, volume: 15000000000 },
    { symbol: 'ETH', price: 2200, change24h: 1.8, volume: 8000000000 },
    { symbol: 'SOL', price: 95, change24h: 5.2, volume: 2000000000 }
  ];
  return fallback.slice(0, limit);
}

// ============================================================
// OR & ARGENT (Yahoo Finance - GRATUIT, SANS CLÉ)
// ============================================================

async function getMetalPrice(symbol) {
  const cached = cache.get(`metal_${symbol}`);
  if (cached) return cached;
  
  try {
    let price = 0;
    let change24h = 0;
    
    if (symbol === 'XAU' || symbol === 'GOLD') {
      // Or - GC=F
      const response = await axios.get('https://query1.finance.yahoo.com/v8/finance/charts/GC=F', {
        timeout: 5000
      });
      price = response.data.chart.result[0]?.meta?.regularMarketPrice || 2320;
      change24h = response.data.chart.result[0]?.meta?.regularMarketChangePercent || 0;
    } 
    else if (symbol === 'XAG' || symbol === 'SILVER') {
      // Argent - SI=F
      const response = await axios.get('https://query1.finance.yahoo.com/v8/finance/charts/SI=F', {
        timeout: 5000
      });
      price = response.data.chart.result[0]?.meta?.regularMarketPrice || 27.5;
      change24h = response.data.chart.result[0]?.meta?.regularMarketChangePercent || 0;
    }
    
    const result = {
      symbol: symbol === 'XAU' ? 'XAU' : (symbol === 'GOLD' ? 'GOLD' : (symbol === 'XAG' ? 'XAG' : 'SILVER')),
      price: price,
      change24h: change24h,
      source: 'yahoo-finance',
      type: 'metal'
    };
    cache.set(`metal_${symbol}`, result);
    return result;
  } catch (error) {
    // Fallback si erreur
    const prices = { XAU: 2320.50, GOLD: 2320.50, XAG: 27.35, SILVER: 27.35 };
    return {
      symbol: symbol,
      price: prices[symbol] || 2320,
      change24h: 0,
      source: 'fallback',
      type: 'metal'
    };
  }
}

// ============================================================
// ACTIONS (Yahoo Finance - GRATUIT, SANS CLÉ)
// ============================================================

const STOCK_SYMBOLS = {
  'AAPL': 'AAPL',
  'TSLA': 'TSLA',
  'NVDA': 'NVDA',
  'MSFT': 'MSFT',
  'GOOGL': 'GOOGL',
  'AMZN': 'AMZN',
  'META': 'META',
  'NFLX': 'NFLX'
};

async function getStockPrice(symbol) {
  const cached = cache.get(`stock_${symbol}`);
  if (cached) return cached;
  
  try {
    const response = await axios.get(`https://query1.finance.yahoo.com/v8/finance/charts/${symbol}`, {
      timeout: 5000
    });
    
    const price = response.data.chart.result[0]?.meta?.regularMarketPrice || 0;
    const change24h = response.data.chart.result[0]?.meta?.regularMarketChangePercent || 0;
    
    const result = {
      symbol: symbol,
      price: price,
      change24h: change24h,
      source: 'yahoo-finance',
      type: 'stock'
    };
    cache.set(`stock_${symbol}`, result);
    return result;
  } catch (error) {
    // Fallback
    const prices = { AAPL: 175, TSLA: 240, NVDA: 850, MSFT: 420, GOOGL: 155, AMZN: 185, META: 480, NFLX: 620 };
    return {
      symbol: symbol,
      price: prices[symbol] || 0,
      change24h: 0,
      source: 'fallback',
      type: 'stock'
    };
  }
}

// ============================================================
// INDICES (NASDAQ, S&P 500, Dow Jones - Yahoo Finance)
// ============================================================

const INDICES = {
  'IXIC': '^IXIC',    // NASDAQ Composite
  'SPX': '^GSPC',     // S&P 500
  'DJI': '^DJI',      // Dow Jones
  'NDX': '^NDX',      // NASDAQ 100
  'RUT': '^RUT',      // Russell 2000
  'VIX': '^VIX'       // Volatility Index
};

async function getIndexPrice(symbol) {
  const cached = cache.get(`index_${symbol}`);
  if (cached) return cached;
  
  const yahooSymbol = INDICES[symbol];
  if (!yahooSymbol) return null;
  
  try {
    const response = await axios.get(`https://query1.finance.yahoo.com/v8/finance/charts/${yahooSymbol}`, {
      timeout: 5000
    });
    
    const price = response.data.chart.result[0]?.meta?.regularMarketPrice || 0;
    const changePercent = response.data.chart.result[0]?.meta?.regularMarketChangePercent || 0;
    
    const result = {
      symbol: symbol,
      name: getIndexName(symbol),
      price: price,
      changePercent: changePercent,
      source: 'yahoo-finance',
      type: 'index'
    };
    cache.set(`index_${symbol}`, result);
    return result;
  } catch (error) {
    // Fallback
    const fallback = {
      'IXIC': { price: 16500, name: 'NASDAQ Composite' },
      'SPX': { price: 5200, name: 'S&P 500' },
      'DJI': { price: 39000, name: 'Dow Jones' }
    };
    return {
      symbol: symbol,
      name: fallback[symbol]?.name || symbol,
      price: fallback[symbol]?.price || 0,
      changePercent: 0,
      source: 'fallback',
      type: 'index'
    };
  }
}

function getIndexName(symbol) {
  const names = {
    'IXIC': 'NASDAQ Composite',
    'SPX': 'S&P 500',
    'DJI': 'Dow Jones Industrial Average',
    'NDX': 'NASDAQ 100',
    'RUT': 'Russell 2000',
    'VIX': 'CBOE Volatility Index'
  };
  return names[symbol] || symbol;
}

// ============================================================
// FONCTION PRINCIPALE getPrice (TRÈS IMPORTANT)
// ============================================================

async function getPrice(symbol) {
  const upperSymbol = symbol.toUpperCase();
  
  // 1. Vérifier si c'est un indice
  if (INDICES[upperSymbol]) {
    return await getIndexPrice(upperSymbol);
  }
  
  // 2. Vérifier si c'est une action
  if (STOCK_SYMBOLS[upperSymbol]) {
    return await getStockPrice(upperSymbol);
  }
  
  // 3. Vérifier si c'est Or ou Argent
  if (upperSymbol === 'XAU' || upperSymbol === 'GOLD' || upperSymbol === 'XAG' || upperSymbol === 'SILVER') {
    return await getMetalPrice(upperSymbol);
  }
  
  // 4. Vérifier si c'est une crypto (parmi le top 100)
  const topCryptos = await getTopCryptos(100);
  const crypto = topCryptos.find(c => c.symbol === upperSymbol);
  if (crypto) {
    return crypto;
  }
  
  throw new Error(`Symbol ${symbol} not supported. Try: BTC, ETH, SOL, XAU, GOLD, AAPL, TSLA, IXIC, SPX, DJI`);
}

// ============================================================
// FONCTION getAllPrices
// ============================================================

async function getAllPrices() {
  const results = [];
  
  // Top 10 cryptos
  const topCryptos = await getTopCryptos(10);
  results.push(...topCryptos);
  
  // Or et Argent
  results.push(await getMetalPrice('XAU'));
  results.push(await getMetalPrice('XAG'));
  
  // Actions principales
  const stocks = ['AAPL', 'TSLA', 'NVDA', 'MSFT', 'GOOGL'];
  for (const stock of stocks) {
    results.push(await getStockPrice(stock));
  }
  
  // Indices
  const indices = ['IXIC', 'SPX', 'DJI'];
  for (const index of indices) {
    results.push(await getIndexPrice(index));
  }
  
  return results;
}

// ============================================================
// EXPORTS
// ============================================================

module.exports = { 
  getPrice, 
  getAllPrices,
  getTopCryptos,
  getSpecificCryptos,
  getMetalPrice,
  getStockPrice,
  getIndexPrice
};