const router = require('express').Router();
const auth = require('../middleware/auth');
const { checkPlan } = require('../middleware/CheckPlan');
const {
  getBotStatus,
  startBot,
  stopBot,
  createErrorResponse,
} = require('../services/botService');

router.get('/status', auth, (req, res) => {
  try {
    return res.json(getBotStatus(req.user.id));
  } catch (err) {
    return res.status(500).json(createErrorResponse(err.message || 'Unable to load bot status'));
  }
});

router.post('/start', auth, checkPlan('elite'), (req, res) => {
  try {
    const response = startBot(req.user.id, req.body);
    return res.status(response.success ? 200 : 400).json(response);
  } catch (err) {
    return res.status(500).json(createErrorResponse(err.message || 'Unable to start bot'));
  }
});

router.post('/stop', auth, checkPlan('elite'), (req, res) => {
  try {
    return res.json(stopBot(req.user.id));
  } catch (err) {
    return res.status(500).json(createErrorResponse(err.message || 'Unable to stop bot'));
  }
});

module.exports = router;
