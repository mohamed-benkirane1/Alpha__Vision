const router = require('express').Router();
const { getNews } = require('../services/newsService');

router.get('/', async (req, res) => {
  try {
    const news = await getNews();
    res.json(news);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;