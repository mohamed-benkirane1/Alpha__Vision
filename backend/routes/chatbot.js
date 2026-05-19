const router = require('express').Router();
const auth = require('../middleware/auth');
const { checkPlan } = require('../middleware/CheckPlan');
const Conversation = require('../models/Conversation');
const { chat } = require('../services/chatbotService');

// Chatbot IA nécessite plan Elite
router.post('/message', auth, checkPlan('elite'), async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ message: 'Message required' });
    
    let convo = await Conversation.findOne({ userId: req.user.id });
    if (!convo) convo = await Conversation.create({ userId: req.user.id, messages: [] });
    
    const reply = await chat(message, convo.messages);
    convo.messages.push({ role: 'user', content: message }, { role: 'assistant', content: reply });
    if (convo.messages.length > 40) convo.messages = convo.messages.slice(-40);
    await convo.save();
    
    res.json({ reply });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
