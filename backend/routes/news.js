const router = require('express').Router();
const { getNews } = require('../services/newsService');

router.get('/', async (req, res) => {
  try {
    const news = await getNews();
    if (news.success === false) {
      return res.status(503).json(news);
    }
    res.json(news);
  } catch (err) {
    res.status(500).json({
      success: false,
      timestamp: new Date().toISOString(),
      provider: 'GNews',
      source: 'gnews',
      fallback: false,
      error: err.message || 'Unable to load market news',
      data: [],
      warnings: []
    });
  }
});

module.exports = router;
