const BotInstance = require('../models/BotInstance');
const Portfolio = require('../models/portfolio');
const Trade = require('../models/trade');
const User = require('../models/user');
const Watchlist = require('../models/watchlist');
const groqService = require('./groqService');

const PROVIDER = 'groq';
const RULES_PROVIDER = 'rules-based';
const DISCLAIMER = 'Educational information only, not financial advice.';
const MAX_CONTEXT_MESSAGES = 16;

const SYSTEM_PROMPT = [
  'You are Alpha Vision, an educational trading assistant.',
  'Only answer questions about trading, crypto markets, stock markets, technical analysis, risk management, paper trading, and portfolio analysis.',
  'Use only the provided user context. Do not invent private account data.',
  'Never promise profits, never give certainty, and never present analysis as personalized financial advice.',
  'If provider data is missing, say so clearly.',
  'Be concise and educational.',
].join(' ');

function nowIso() {
  return new Date().toISOString();
}

function cleanMessage(message, maxLength = 4000) {
  return typeof message === 'string' ? message.trim().replace(/\s+/g, ' ').slice(0, maxLength) : '';
}

function toFiniteNumber(value, fallback = null) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function createResponse({
  success = true,
  mode = 'fallback',
  provider = RULES_PROVIDER,
  providerStatus = 'fallback',
  answer = '',
  contextUsed = null,
  warnings = [],
  error = null,
}) {
  return {
    success,
    mode,
    provider,
    providerStatus,
    timestamp: nowIso(),
    source: 'backend',
    fallback: mode !== 'ai',
    message: answer || error || null,
    response: answer || null,
    data: {
      answer,
      message: answer,
      model: mode === 'ai' ? groqService.MODEL : null,
      contextUsed,
      notFinancialAdvice: true,
      disclaimer: DISCLAIMER,
    },
    warnings: warnings.filter(Boolean),
    error,
    notFinancialAdvice: true,
  };
}

function createErrorResponse(error) {
  return createResponse({
    success: false,
    mode: 'fallback',
    provider: RULES_PROVIDER,
    providerStatus: groqService.getProviderStatus(),
    answer: '',
    warnings: [],
    error: error || 'Unable to process chatbot message.',
  });
}

function normalizeHistory(history = []) {
  if (!Array.isArray(history)) return [];
  return history
    .slice(-MAX_CONTEXT_MESSAGES)
    .map((item) => {
      const role = item?.role === 'assistant' ? 'assistant' : 'user';
      const content = cleanMessage(item?.content, 1200);
      return content ? { role, content } : null;
    })
    .filter(Boolean);
}

async function buildUserContext(userId) {
  if (!userId) return null;

  const [user, holdings, trades, watchlist, bot] = await Promise.all([
    User.findById(userId).select('balance plan planExpiresAt'),
    Portfolio.find({ userId }).sort({ symbol: 1 }).limit(20),
    Trade.find({ userId }).sort({ createdAt: -1 }).limit(10),
    Watchlist.find({ userId }).sort({ createdAt: 1 }).limit(20),
    BotInstance.findOne({ user: userId }).sort({ updatedAt: -1 }),
  ]);

  return {
    user: user ? {
      virtualBalance: toFiniteNumber(user.balance, 0),
      plan: user.plan || 'free',
    } : null,
    holdings: holdings.map((h) => ({
      symbol: h.symbol,
      quantity: toFiniteNumber(h.quantity, 0),
      avgPrice: toFiniteNumber(h.avgPrice),
    })),
    recentTrades: trades.map((t) => ({
      symbol: t.symbol,
      side: t.type,
      quantity: toFiniteNumber(t.quantity),
      executedPrice: toFiniteNumber(t.executedPrice ?? t.price),
      mode: t.mode || 'paper',
      createdAt: t.createdAt,
    })),
    watchlist: watchlist.map((item) => item.symbol),
    bot: bot ? {
      status: bot.status || (bot.isRunning ? 'running' : 'stopped'),
      mode: bot.mode || 'paper',
      symbol: bot.symbol,
      strategy: bot.strategy,
      executeTrades: bot.executeTrades === true,
      lastRunAt: bot.lastRunAt || bot.lastTickAt || null,
      lastDecision: bot.lastDecision || null,
    } : null,
  };
}

function summarizeContext(context) {
  if (!context) return { hasContext: false, holdingsCount: 0, recentTradesCount: 0, watchlistCount: 0, botStatus: null };
  return {
    hasContext: true,
    holdingsCount: context.holdings.length,
    recentTradesCount: context.recentTrades.length,
    watchlistCount: context.watchlist.length,
    botStatus: context.bot?.status || null,
  };
}

function buildGroqPrompt({ message, history, context }) {
  const contextPayload = {
    disclaimer: DISCLAIMER,
    userContext: context,
    instruction: 'Answer concisely in plain text. Clearly label uncertainty. No financial advice.',
  };

  const historyMessages = normalizeHistory(history).map((item) => ({
    role: item.role,
    content: item.content,
  }));

  return {
    systemPrompt: SYSTEM_PROMPT,
    messages: [
      { role: 'user', content: `User context: ${JSON.stringify(contextPayload)}` },
      ...historyMessages,
      { role: 'user', content: message },
    ],
  };
}

function createRulesBasedAnswer(message, context) {
  const lower = message.toLowerCase();
  const parts = [];

  if (lower.includes('portfolio') || lower.includes('risk')) {
    const holdingsCount = context?.holdings?.length || 0;
    const watchlistCount = context?.watchlist?.length || 0;
    parts.push(`I can review high-level paper portfolio risk from available backend context: ${holdingsCount} holdings and ${watchlistCount} watchlist symbols are available.`);
    parts.push('Key checks: concentration by symbol, whether cash balance is too low for new paper trades, and whether recent BUY/SELL decisions match your intended risk.');
  } else if (lower.includes('bot')) {
    const status = context?.bot?.status || 'not configured';
    parts.push(`Your paper bot context shows status: ${status}.`);
    parts.push('For safety, keep executeTrades disabled until you verify signals and portfolio impact with manual ticks.');
  } else if (lower.includes('rsi')) {
    parts.push('RSI is a momentum oscillator. Values above 70 are often treated as overbought and below 30 as oversold, but it should not be used alone.');
  } else if (lower.includes('btc') || lower.includes('eth') || lower.includes('market')) {
    parts.push('I can discuss market analysis concepts, but fallback mode does not fetch a fresh AI interpretation. Check the Market and AI Signal panels for current backend data quality.');
  } else {
    parts.push('I can help with trading, technical analysis, paper trading, portfolio risk, watchlist interpretation, and bot behavior.');
  }

  parts.push('This is rules-based fallback information only, not financial advice.');
  return parts.join('\n\n');
}

function createFallbackResponse(message, context, reason) {
  return createResponse({
    success: true,
    mode: 'fallback',
    provider: RULES_PROVIDER,
    providerStatus: groqService.getProviderStatus(),
    answer: createRulesBasedAnswer(message, context),
    contextUsed: summarizeContext(context),
    warnings: [reason || 'Groq unavailable. Rules-based fallback response was used.'],
    error: null,
  });
}

async function callGroq({ message, history, context }) {
  const { systemPrompt, messages } = buildGroqPrompt({ message, history, context });

  // Build a multi-turn conversation string for Groq
  const fullPrompt = messages.map((m) => m.content).join('\n\n---\n\n');
  const answer = cleanMessage(
    await groqService.generateContent(fullPrompt, systemPrompt),
    4000,
  );

  if (!answer) throw new Error('Groq returned an empty response.');

  return createResponse({
    success: true,
    mode: 'ai',
    provider: PROVIDER,
    providerStatus: 'available',
    answer,
    contextUsed: summarizeContext(context),
    warnings: [],
    error: null,
  });
}

async function chat({ userId, message, history = [] }) {
  const userMessage = cleanMessage(message);
  if (!userMessage) return createErrorResponse('Message required.');

  const context = await buildUserContext(userId);

  if (!groqService.isAvailable()) {
    return createFallbackResponse(
      userMessage,
      context,
      'Groq API key is missing. The assistant used rules-based fallback.',
    );
  }

  try {
    return await callGroq({ message: userMessage, history, context });
  } catch (error) {
    return createResponse({
      success: true,
      mode: 'fallback',
      provider: RULES_PROVIDER,
      providerStatus: groqService.getProviderStatus(error),
      answer: createRulesBasedAnswer(userMessage, context),
      contextUsed: summarizeContext(context),
      warnings: [`Groq provider error. Rules-based fallback was used: ${groqService.getErrorMessage(error)}`],
      error: null,
    });
  }
}

module.exports = {
  buildUserContext,
  chat,
  createErrorResponse,
  createFallbackResponse,
};
