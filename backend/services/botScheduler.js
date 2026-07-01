const BotInstance = require('../models/BotInstance');
const { runBotTick } = require('./botService');

const MIN_INTERVAL_SECONDS = 15;

// Map<string, NodeJS.Timeout>  botId → intervalId
const activeBots = new Map();

// Set<string> — bots dont un tick est en cours, pour éviter les chevauchements
const ticksInProgress = new Set();

async function runTick(botId) {
  if (ticksInProgress.has(botId)) {
    console.log(`[BotScheduler] tick ignoré pour bot ${botId} — tick précédent toujours en cours`);
    return;
  }

  ticksInProgress.add(botId);

  try {
    const bot = await BotInstance.findById(botId).select('user isRunning status').lean();

    if (!bot) {
      console.log(`[BotScheduler] bot ${botId} introuvable en base — désenregistrement`);
      unregisterBot(botId);
      return;
    }

    if (!bot.isRunning && bot.status !== 'running') {
      console.log(`[BotScheduler] bot ${botId} arrêté — désenregistrement automatique`);
      unregisterBot(botId);
      return;
    }

    console.log(`[BotScheduler] tick pour bot ${botId}`);
    await runBotTick(bot.user.toString());
  } catch (err) {
    console.error(`[BotScheduler] erreur tick bot ${botId}:`, err.message);
  } finally {
    ticksInProgress.delete(botId);
  }
}

function registerBot(botId, intervalSeconds) {
  const key = String(botId);

  if (activeBots.has(key)) {
    clearInterval(activeBots.get(key));
    activeBots.delete(key);
  }

  const raw = Number(intervalSeconds);
  const safeSeconds = Number.isFinite(raw) && raw > 0
    ? Math.max(MIN_INTERVAL_SECONDS, Math.trunc(raw))
    : 60;

  const intervalId = setInterval(() => runTick(key), safeSeconds * 1000);
  activeBots.set(key, intervalId);

  console.log(`[BotScheduler] bot ${key} enregistré — tick toutes les ${safeSeconds}s`);
}

function unregisterBot(botId) {
  const key = String(botId);

  if (!activeBots.has(key)) return;

  clearInterval(activeBots.get(key));
  activeBots.delete(key);

  console.log(`[BotScheduler] bot ${key} désenregistré`);
}

function refreshBot(botId, intervalSeconds) {
  unregisterBot(botId);
  registerBot(botId, intervalSeconds);
}

async function startBotScheduler() {
  try {
    const runningBots = await BotInstance.find({
      $or: [{ isRunning: true }, { status: 'running' }],
    }).select('_id intervalSeconds').lean();

    console.log(`[BotScheduler] démarrage — ${runningBots.length} bot(s) actif(s) chargé(s) depuis MongoDB`);

    for (const bot of runningBots) {
      registerBot(bot._id.toString(), bot.intervalSeconds);
    }
  } catch (err) {
    console.error('[BotScheduler] erreur au démarrage:', err.message);
  }
}

module.exports = {
  startBotScheduler,
  registerBot,
  unregisterBot,
  refreshBot,
};
