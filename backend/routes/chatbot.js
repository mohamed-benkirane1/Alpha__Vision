const router = require('express').Router();
const auth = require('../middleware/auth');
const { checkPlan } = require('../middleware/CheckPlan');
const Conversation = require('../models/Conversation');
const { chat, createErrorResponse } = require('../services/chatbotService');

router.post('/message', auth, checkPlan('elite'), async (req, res) => {
  const input = typeof req.body?.message === 'string' ? req.body.message.trim() : '';

  if (!input) {
    return res.status(400).json({
      success: false,
      timestamp: new Date().toISOString(),
      provider: 'DeepSeek',
      source: 'deepseek',
      fallback: false,
      data: null,
      warnings: [],
      error: 'Message required.',
    });
  }

  try {
    let conversation = await Conversation.findOne({ userId: req.user.id });
    if (!conversation) {
      conversation = await Conversation.create({ userId: req.user.id, messages: [] });
    }

    const response = await chat(input, conversation.messages);

    if (response.success) {
      const answer = response.data?.answer || response.data?.message || '';

      conversation.messages.push(
        { role: 'user', content: input },
        { role: 'assistant', content: answer },
      );

      if (conversation.messages.length > 40) {
        conversation.messages = conversation.messages.slice(-40);
      }

      conversation.updatedAt = new Date();
      await conversation.save();
    }

    const statusCode = response.success ? 200 : 502;
    return res.status(statusCode).json(response);
  } catch (err) {
    const response = createErrorResponse(err.message || 'Unable to process chatbot message.');
    return res.status(500).json(response);
  }
});

module.exports = router;
