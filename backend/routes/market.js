const router = require('express').Router();
const { getPrice, getAllPrices } = require('../services/marketService');

router.get('/price/:symbol', async (req, res) => {
  try {
    const result = await getPrice(req.params.symbol.toUpperCase());
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/prices', async (req, res) => {
  try {
    const result = await getAllPrices();
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;