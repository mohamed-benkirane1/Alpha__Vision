const router = require('express').Router();
const auth = require('../middleware/auth');
const { chat } = require('../services/chatbotService');

router.post('/message', auth, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ message: 'Message required' });
    const reply = await chat(message);
    res.json({ reply });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;