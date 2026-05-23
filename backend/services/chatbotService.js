const BotInstance = require('../models/BotInstance');
const Portfolio = require('../models/portfolio');
const Trade = require('../models/trade');
const User = require('../models/user');
const Watchlist = require('../models/watchlist');
const {
  generateGeminiText,
  getGeminiErrorMessage,
  getGeminiModel,
  getGeminiProviderStatus,
  hasGeminiKey,
} = require('./geminiService');

const PROVIDER = 'gemini';
const RULES_PROVIDER = 'rules-based';
const DEFAULT_PROVIDER = String(process.env.AI_PROVIDER || 'gemini').trim().toLowerCase();
const DISCLAIMER = 'Educational information only, not financial advice.';
const MAX_CONTEXT_MESSAGES = 16;

const SYSTEM_PROMPT = [
  'You are Alpha Vision, an educational trading assistant.',
  'Only answer questions about trading, crypto markets, stock markets, technical analysis, risk management, paper trading, and portfolio analysis.',
  'Use only the provided user context. Do not invent private account data.',
  'Never promise profits, never give certainty, and never present analysis as personalized financial advice.',
  'If provider data is missing, say so clearly.',
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

function getProviderStatus(error = null) {
  if (DEFAULT_PROVIDER !== 'gemini') return 'fallback';
  return getGeminiProviderStatus(error);
}

function createResponse({
  success = true,
  mode = 'fallback',
  provider = RULES_PROVIDER,
  providerStatus = getProviderStatus(),
  answer = '',
  usage = null,
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
      model: mode === 'ai' ? getGeminiModel() : null,
      usage,
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
    providerStatus: getProviderStatus(error),
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
    holdings: holdings.map((holding) => ({
      symbol: holding.symbol,
      quantity: toFiniteNumber(holding.quantity, 0),
      avgPrice: toFiniteNumber(holding.avgPrice),
    })),
    recentTrades: trades.map((trade) => ({
      symbol: trade.symbol,
      side: trade.type,
      quantity: toFiniteNumber(trade.quantity),
      executedPrice: toFiniteNumber(trade.executedPrice ?? trade.price),
      mode: trade.mode || 'paper',
      createdAt: trade.createdAt,
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
  if (!context) {
    return {
      hasContext: false,
      holdingsCount: 0,
      recentTradesCount: 0,
      watchlistCount: 0,
      botStatus: null,
    };
  }

  return {
    hasContext: true,
    holdingsCount: context.holdings.length,
    recentTradesCount: context.recentTrades.length,
    watchlistCount: context.watchlist.length,
    botStatus: context.bot?.status || null,
  };
}

function buildGeminiContents({ message, history, context }) {
  const contextPayload = {
    disclaimer: DISCLAIMER,
    userContext: context,
    instruction: 'Answer concisely. Clearly label uncertainty and avoid financial-advice certainty.',
  };

  return [
    {
      role: 'user',
      parts: [{ text: `User context JSON: ${JSON.stringify(contextPayload)}` }],
    },
    ...normalizeHistory(history).map((item) => ({
      role: item.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: item.content }],
    })),
    {
      role: 'user',
      parts: [{ text: message }],
    },
  ];
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
    providerStatus: getProviderStatus(),
    answer: createRulesBasedAnswer(message, context),
    contextUsed: summarizeContext(context),
    warnings: [reason || 'Gemini unavailable. Rules-based fallback response was used.'],
    error: null,
  });
}

async function callGemini({ message, history, context }) {
  const response = await generateGeminiText({
    systemInstruction: SYSTEM_PROMPT,
    contents: buildGeminiContents({ message, history, context }),
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 700,
    },
  });

  const answer = cleanMessage(response.text, 4000);
  if (!answer) throw new Error('AI provider returned an empty response.');

  return createResponse({
    success: true,
    mode: 'ai',
    provider: PROVIDER,
    providerStatus: 'available',
    answer,
    usage: response.usage || null,
    contextUsed: summarizeContext(context),
    warnings: [],
    error: null,
  });
}

async function chat({ userId, message, history = [] }) {
  const userMessage = cleanMessage(message);
  if (!userMessage) {
    return createErrorResponse('Message required.');
  }

  const context = await buildUserContext(userId);

  if (DEFAULT_PROVIDER !== 'gemini') {
    return createFallbackResponse(
      userMessage,
      context,
      `AI_PROVIDER=${DEFAULT_PROVIDER} is not configured for this backend. The assistant used rules-based fallback.`,
    );
  }

  if (!hasGeminiKey()) {
    return createFallbackResponse(
      userMessage,
      context,
      'Gemini API key is missing. The assistant used rules-based fallback.',
    );
  }

  try {
    return await callGemini({ message: userMessage, history, context });
  } catch (error) {
    return createResponse({
      success: true,
      mode: 'fallback',
      provider: RULES_PROVIDER,
      providerStatus: getProviderStatus(error),
      answer: createRulesBasedAnswer(userMessage, context),
      contextUsed: summarizeContext(context),
      warnings: [`Gemini provider error. Rules-based fallback was used: ${getGeminiErrorMessage(error)}`],
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
