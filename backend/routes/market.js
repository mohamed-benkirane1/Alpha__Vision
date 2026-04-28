const router = require('express').Router();
const { 
  getPrice, 
  getAllPrices, 
  getTopCryptos, 
  getSpecificCryptos 
} = require('../services/marketService');

// ============================================================
// ROUTES EXISTANTES
// ============================================================

// Récupérer le prix d'un seul actif (ex: /api/market/price/BTC)
router.get('/price/:symbol', async (req, res) => {
  try {
    const result = await getPrice(req.params.symbol.toUpperCase());
    res.json(result);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
});

// Récupérer tous les prix (BTC, ETH, SOL, BNB, XRP)
router.get('/prices', async (req, res) => {
  try {
    const result = await getAllPrices();
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ============================================================
// NOUVELLES ROUTES
// ============================================================

// Récupérer le TOP X cryptos (ex: /api/market/top?limit=100)
router.get('/top', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const maxLimit = Math.min(limit, 200); // Maximum 200 cryptos
    const cryptos = await getTopCryptos(maxLimit);
    res.json({
      total: cryptos.length,
      limit: maxLimit,
      cryptos: cryptos,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Récupérer des cryptos spécifiques (POST avec body)
router.post('/specific', async (req, res) => {
  try {
    const { symbols } = req.body;
    
    if (!symbols || !Array.isArray(symbols)) {
      return res.status(400).json({ 
        message: 'symbols array required. Example: {"symbols": ["BTC", "ETH", "SOL"]}' 
      });
    }
    
    if (symbols.length === 0) {
      return res.status(400).json({ message: 'symbols array cannot be empty' });
    }
    
    const cryptos = await getSpecificCryptos(symbols);
    res.json({
      total: cryptos.length,
      cryptos: cryptos,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Route pour récupérer le prix de plusieurs cryptos en GET (ex: /api/market/multi?symbols=BTC,ETH,SOL)
router.get('/multi', async (req, res) => {
  try {
    const symbolsParam = req.query.symbols;
    if (!symbolsParam) {
      return res.status(400).json({ message: 'symbols parameter required. Example: ?symbols=BTC,ETH,SOL' });
    }
    
    const symbols = symbolsParam.split(',').map(s => s.toUpperCase());
    const cryptos = await getSpecificCryptos(symbols);
    res.json({
      total: cryptos.length,
      cryptos: cryptos,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;