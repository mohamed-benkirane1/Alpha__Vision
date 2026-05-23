const router = require('express').Router();
const auth = require('../middleware/auth');
const {
  getBotStatus,
  startBot,
  stopBot,
  runBotTick,
  getBotActionsResponse,
  createErrorResponse,
} = require('../services/botService');

function sendBotError(res, err, fallbackMessage) {
  return res.status(err.statusCode || 500).json(
    createErrorResponse(err.message || fallbackMessage),
  );
}

router.get('/status', auth, async (req, res) => {
  try {
    return res.json(await getBotStatus(req.user.id));
  } catch (err) {
    return sendBotError(res, err, 'Unable to load bot status');
  }
});

router.post('/start', auth, async (req, res) => {
  try {
    const response = await startBot(req.user.id, req.body);
    return res.status(response.success ? 200 : 400).json(response);
  } catch (err) {
    return sendBotError(res, err, 'Unable to start bot');
  }
});

router.post('/stop', auth, async (req, res) => {
  try {
    return res.json(await stopBot(req.user.id));
  } catch (err) {
    return sendBotError(res, err, 'Unable to stop bot');
  }
});

router.post('/tick', auth, async (req, res) => {
  try {
    return res.json(await runBotTick(req.user.id));
  } catch (err) {
    return sendBotError(res, err, 'Unable to run bot tick');
  }
});

router.get('/actions', auth, async (req, res) => {
  try {
    return res.json(await getBotActionsResponse(req.user.id, req.query.limit));
  } catch (err) {
    return sendBotError(res, err, 'Unable to load bot actions');
  }
});

router.get('/history', auth, async (req, res) => {
  try {
    return res.json(await getBotActionsResponse(req.user.id, req.query.limit));
  } catch (err) {
    return sendBotError(res, err, 'Unable to load bot history');
  }
});

module.exports = router;
