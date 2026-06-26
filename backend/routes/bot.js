const router = require('express').Router();
const auth = require('../middleware/auth');
const { checkPlan } = require('../middleware/CheckPlan');
const { validate } = require('../middleware/validate');
const botStartValidator = require('../validators/botValidator');
const BotInstance = require('../models/BotInstance');
const {
  getBotStatus,
  startBot,
  stopBot,
  runBotTick,
  getBotActionsResponse,
  createErrorResponse,
} = require('../services/botService');
const { registerBot, unregisterBot } = require('../services/botScheduler');
const { logActivitySafe } = require('../services/activityService');

function sendBotError(res, err, fallbackMessage) {
  return res.status(err.statusCode || 500).json(
    createErrorResponse(err.message || fallbackMessage),
  );
}

async function findRunningBotId(userId) {
  const bot = await BotInstance.findOne({
    user: userId,
    $or: [{ isRunning: true }, { status: 'running' }],
  }).select('_id intervalSeconds');
  return bot || null;
}

router.get('/status', auth, checkPlan('elite'), async (req, res) => {
  try {
    return res.json(await getBotStatus(req.user.id));
  } catch (err) {
    return sendBotError(res, err, 'Unable to load bot status');
  }
});

router.post('/start', auth, checkPlan('elite'), validate(botStartValidator), async (req, res) => {
  try {
    const response = await startBot(req.user.id, req.body);

    if (response.success) {
      const bot = await findRunningBotId(req.user.id);
      if (bot) registerBot(bot._id.toString(), bot.intervalSeconds);
      await logActivitySafe({
        user: req.user.id,
        type: 'bot:start',
        title: 'Paper bot started',
        description: `Paper bot started for ${response.status?.symbol || req.body.symbol || 'selected symbol'}.`,
        metadata: {
          symbol: response.status?.symbol || req.body.symbol || null,
          strategy: response.status?.strategy || req.body.strategy || null,
          mode: response.status?.mode || 'paper',
          executeTrades: response.status?.executeTrades === true,
        },
      });
    }

    return res.status(response.success ? 200 : 400).json(response);
  } catch (err) {
    return sendBotError(res, err, 'Unable to start bot');
  }
});

router.post('/stop', auth, checkPlan('elite'), async (req, res) => {
  try {
    const runningBot = await findRunningBotId(req.user.id);

    const response = await stopBot(req.user.id);

    if (runningBot) unregisterBot(runningBot._id.toString());
    if (response.success && runningBot) {
      await logActivitySafe({
        user: req.user.id,
        type: 'bot:stop',
        title: 'Paper bot stopped',
        description: 'The running paper bot was stopped.',
        metadata: { botId: runningBot._id, mode: 'paper' },
      });
    }

    return res.json(response);
  } catch (err) {
    return sendBotError(res, err, 'Unable to stop bot');
  }
});

router.post('/tick', auth, checkPlan('elite'), async (req, res) => {
  try {
    return res.json(await runBotTick(req.user.id));
  } catch (err) {
    return sendBotError(res, err, 'Unable to run bot tick');
  }
});

router.get('/actions', auth, checkPlan('elite'), async (req, res) => {
  try {
    return res.json(await getBotActionsResponse(req.user.id, req.query.limit));
  } catch (err) {
    return sendBotError(res, err, 'Unable to load bot actions');
  }
});

router.get('/history', auth, checkPlan('elite'), async (req, res) => {
  try {
    return res.json(await getBotActionsResponse(req.user.id, req.query.limit));
  } catch (err) {
    return sendBotError(res, err, 'Unable to load bot history');
  }
});

module.exports = router;
