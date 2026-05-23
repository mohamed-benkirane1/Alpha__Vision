const router = require('express').Router();
const auth = require('../middleware/auth');
const Conversation = require('../models/Conversation');
const { buildUserContext, chat, createErrorResponse } = require('../services/chatbotService');

router.post('/message', auth, async (req, res) => {
  const input = typeof req.body?.message === 'string' ? req.body.message.trim() : '';

  if (!input) {
    return res.status(400).json(createErrorResponse('Message required.'));
  }

  try {
    let conversation = await Conversation.findOne({ userId: req.user.id });
    if (!conversation) {
      conversation = await Conversation.create({ userId: req.user.id, messages: [] });
    }

    const response = await chat({
      userId: req.user.id,
      message: input,
      history: conversation.messages,
    });

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

router.get('/history', auth, async (req, res) => {
  try {
    const conversation = await Conversation.findOne({ userId: req.user.id });

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      mode: 'history',
      provider: 'conversation-store',
      providerStatus: 'available',
      source: 'backend',
      fallback: false,
      data: {
        messages: conversation?.messages || [],
      },
      warnings: [],
      error: null,
      notFinancialAdvice: true,
    });
  } catch (err) {
    const response = createErrorResponse(err.message || 'Unable to load chatbot history.');
    return res.status(500).json(response);
  }
});

router.get('/context', auth, async (req, res) => {
  try {
    const context = await buildUserContext(req.user.id);

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      mode: 'context',
      provider: 'backend-context',
      providerStatus: 'available',
      source: 'backend',
      fallback: false,
      data: {
        context,
      },
      warnings: [],
      error: null,
      notFinancialAdvice: true,
    });
  } catch (err) {
    const response = createErrorResponse(err.message || 'Unable to load chatbot context.');
    return res.status(500).json(response);
  }
});

module.exports = router;
