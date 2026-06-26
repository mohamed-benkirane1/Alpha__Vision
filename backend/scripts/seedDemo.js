const mongoose = require('mongoose');
const { loadEnvConfig, logFeatureWarnings } = require('../config/env');

const User = require('../models/user');
const Portfolio = require('../models/portfolio');
const Watchlist = require('../models/watchlist');
const Trade = require('../models/trade');
const Transaction = require('../models/Transaction');
const ActivityLog = require('../models/ActivityLog');
const BotInstance = require('../models/BotInstance');

const DEMO_EMAIL = 'demo@alphavision.local';
const DEMO_PASSWORD = 'Demo123456!';
const DEMO_NAME = 'Alpha Vision Demo';
const DEMO_PLAN = 'elite';
const DEMO_BALANCE = 10185;
const DEMO_DEPOSIT_AMOUNT = 25000;
const DAY_MS = 24 * 60 * 60 * 1000;
const ACTIVITY_RETENTION_MS = 180 * DAY_MS;

const DEMO_PORTFOLIO = [
  { symbol: 'BTC', quantity: 0.25, avgPrice: 40000 },
  { symbol: 'ETH', quantity: 1, avgPrice: 2500 },
  { symbol: 'SOL', quantity: 20, avgPrice: 100 },
  { symbol: 'BNB', quantity: 1, avgPrice: 375 },
];

const DEMO_WATCHLIST = ['BTC', 'ETH', 'SOL', 'BNB', 'ADA'];

function minutesAgo(minutes) {
  return new Date(Date.now() - minutes * 60 * 1000);
}

function daysFromNow(days) {
  return new Date(Date.now() + days * DAY_MS);
}

function roundMoney(value) {
  return Number(Number(value).toFixed(2));
}

function roundQuantity(value) {
  return Number(Number(value).toFixed(8));
}

function assertNotProduction() {
  const nodeEnv = String(process.env.NODE_ENV || 'development').trim().toLowerCase();
  if (nodeEnv === 'production') {
    throw new Error('Refusing to seed demo data when NODE_ENV=production.');
  }
}

function createSummary() {
  return {
    user: 'unchanged',
    portfolio: { created: 0, updated: 0 },
    watchlist: { created: 0, updated: 0 },
    trades: { created: 0, updated: 0 },
    transactions: { created: 0, updated: 0 },
    activities: { created: 0, updated: 0 },
    bot: { created: 0, updated: 0 },
  };
}

async function upsertWithCounts(Model, filter, update, options, counter) {
  const existing = await Model.findOne(filter).select('_id');
  const document = await Model.findOneAndUpdate(filter, update, {
    upsert: true,
    new: true,
    setDefaultsOnInsert: true,
    ...options,
  });

  if (existing) counter.updated += 1;
  else counter.created += 1;

  return document;
}

async function upsertDemoUser(summary) {
  let user = await User.findOne({ email: DEMO_EMAIL }).select('+password');
  const planExpiresAt = daysFromNow(365);

  if (!user) {
    user = new User({
      name: DEMO_NAME,
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      role: 'user',
    });
    summary.user = 'created';
  } else {
    summary.user = 'updated';
    const passwordMatches = await user.comparePassword(DEMO_PASSWORD);
    if (!passwordMatches) {
      user.password = DEMO_PASSWORD;
    }
  }

  user.name = DEMO_NAME;
  user.role = 'user';
  user.balance = DEMO_BALANCE;
  user.plan = DEMO_PLAN;
  user.planExpiresAt = planExpiresAt;
  user.stripeCustomerId = null;
  user.stripeSubscriptionId = null;
  user.stripeSubscriptionStatus = null;

  await user.save();
  return user;
}

async function seedPortfolio(userId, summary) {
  for (const holding of DEMO_PORTFOLIO) {
    await upsertWithCounts(
      Portfolio,
      { userId, symbol: holding.symbol },
      {
        $set: {
          userId,
          symbol: holding.symbol,
          quantity: holding.quantity,
          avgPrice: holding.avgPrice,
        },
      },
      {},
      summary.portfolio,
    );
  }
}

async function seedWatchlist(userId, summary) {
  for (const symbol of DEMO_WATCHLIST) {
    await upsertWithCounts(
      Watchlist,
      { userId, symbol },
      { $set: { userId, symbol } },
      {},
      summary.watchlist,
    );
  }
}

function buildDemoTrades(userId) {
  const trades = [
    {
      symbol: 'BTC',
      type: 'BUY',
      quantity: 0.25,
      price: 40000,
      balanceBefore: 25000,
      balanceAfter: 15000,
      holdingQuantityBefore: 0,
      holdingQuantityAfter: 0.25,
      avgPriceBefore: null,
      avgPriceAfter: 40000,
      realizedPnl: null,
      createdAt: minutesAgo(80),
    },
    {
      symbol: 'ETH',
      type: 'BUY',
      quantity: 1.2,
      price: 2500,
      balanceBefore: 15000,
      balanceAfter: 12000,
      holdingQuantityBefore: 0,
      holdingQuantityAfter: 1.2,
      avgPriceBefore: null,
      avgPriceAfter: 2500,
      realizedPnl: null,
      createdAt: minutesAgo(70),
    },
    {
      symbol: 'SOL',
      type: 'BUY',
      quantity: 20,
      price: 100,
      balanceBefore: 12000,
      balanceAfter: 10000,
      holdingQuantityBefore: 0,
      holdingQuantityAfter: 20,
      avgPriceBefore: null,
      avgPriceAfter: 100,
      realizedPnl: null,
      createdAt: minutesAgo(60),
    },
    {
      symbol: 'BNB',
      type: 'BUY',
      quantity: 1,
      price: 375,
      balanceBefore: 10000,
      balanceAfter: 9625,
      holdingQuantityBefore: 0,
      holdingQuantityAfter: 1,
      avgPriceBefore: null,
      avgPriceAfter: 375,
      realizedPnl: null,
      createdAt: minutesAgo(55),
    },
    {
      symbol: 'ETH',
      type: 'SELL',
      quantity: 0.2,
      price: 2800,
      balanceBefore: 9625,
      balanceAfter: DEMO_BALANCE,
      holdingQuantityBefore: 1.2,
      holdingQuantityAfter: 1,
      avgPriceBefore: 2500,
      avgPriceAfter: 2500,
      realizedPnl: 60,
      createdAt: minutesAgo(50),
    },
  ];

  return trades.map((trade) => ({
    ...trade,
    userId,
    orderType: 'market',
    mode: 'paper',
    status: 'executed',
    executedPrice: trade.price,
    fees: 0,
    total: roundMoney(trade.price * trade.quantity),
    priceSource: 'demo-seed',
    priceProvider: 'internal-demo',
    priceProviderSymbol: trade.symbol,
    priceTimestamp: trade.createdAt,
    priceFetchedAt: trade.createdAt,
    priceCached: false,
    priceFallback: false,
    priceStale: false,
    priceIsLive: false,
    priceIsStale: false,
    priceError: null,
    quantity: roundQuantity(trade.quantity),
    holdingQuantityBefore: roundQuantity(trade.holdingQuantityBefore),
    holdingQuantityAfter: roundQuantity(trade.holdingQuantityAfter),
    balanceBefore: roundMoney(trade.balanceBefore),
    balanceAfter: roundMoney(trade.balanceAfter),
  }));
}

async function seedTrades(userId, summary) {
  const trades = buildDemoTrades(userId);

  for (const trade of trades) {
    await upsertWithCounts(
      Trade,
      {
        userId,
        symbol: trade.symbol,
        type: trade.type,
        quantity: trade.quantity,
        price: trade.price,
        priceSource: 'demo-seed',
        priceProvider: 'internal-demo',
      },
      { $set: trade },
      {},
      summary.trades,
    );
  }
}

async function seedDemoDeposit(userId, summary) {
  const transactionId = `demo_seed_${userId}`;

  await upsertWithCounts(
    Transaction,
    { transactionId },
    {
      $set: {
        userId,
        type: 'demo_deposit',
        amount: DEMO_DEPOSIT_AMOUNT,
        currency: 'usd',
        provider: 'internal-demo-funding',
        mode: 'demo',
        paymentMethod: 'demo',
        transactionId,
        status: 'completed',
        description: 'Demo seed funding added to virtual paper trading balance',
        metadata: {
          demo: true,
          notRealPayment: true,
          source: 'demo-seed',
        },
        createdAt: minutesAgo(95),
      },
    },
    {},
    summary.transactions,
  );
}

function buildActivityLogItems(userId) {
  const expiresAt = new Date(Date.now() + ACTIVITY_RETENTION_MS);

  return [
    {
      seedKey: 'auth-signup',
      type: 'auth:signup',
      title: 'Account created',
      description: 'The local demo account was prepared for Alpha Vision.',
      metadata: { provider: 'local', status: 'created' },
      createdAt: minutesAgo(120),
    },
    {
      seedKey: 'auth-login',
      type: 'auth:login',
      title: 'Signed in',
      description: 'Demo user signed in with email and password.',
      metadata: { provider: 'local', status: 'success' },
      createdAt: minutesAgo(110),
    },
    {
      seedKey: 'demo-funding',
      type: 'payment:demo_deposit',
      title: 'Demo funds added',
      description: `${DEMO_DEPOSIT_AMOUNT} demo funds were added to the virtual paper trading balance.`,
      metadata: {
        amount: DEMO_DEPOSIT_AMOUNT,
        currency: 'usd',
        provider: 'internal-demo-funding',
        demo: true,
        status: 'completed',
      },
      createdAt: minutesAgo(95),
    },
    {
      seedKey: 'watchlist-add',
      type: 'watchlist:add',
      title: 'Watchlist symbol added',
      description: 'BTC was added to the watchlist.',
      metadata: { symbol: 'BTC', action: 'add', status: 'completed' },
      createdAt: minutesAgo(90),
    },
    {
      seedKey: 'paper-trade',
      type: 'trade:executed',
      title: 'BUY paper trade executed',
      description: '0.25 BTC was executed in paper trading mode.',
      metadata: {
        symbol: 'BTC',
        action: 'BUY',
        quantity: 0.25,
        orderType: 'market',
        mode: 'paper',
        status: 'executed',
      },
      createdAt: minutesAgo(80),
    },
    {
      seedKey: 'backtest-run',
      type: 'backtest:run',
      title: 'Backtest executed',
      description: 'RSI backtest executed for BTC.',
      metadata: { symbol: 'BTC', strategy: 'rsi', status: 'success', fallback: false },
      createdAt: minutesAgo(40),
    },
    {
      seedKey: 'backtest-compare',
      type: 'backtest:compare',
      title: 'Backtest comparison executed',
      description: '3 strategies compared for BTC.',
      metadata: {
        symbol: 'BTC',
        strategies: ['rsi', 'macd', 'ema_cross'],
        bestStrategy: 'rsi',
        status: 'completed',
      },
      createdAt: minutesAgo(35),
    },
    {
      seedKey: 'portfolio-risk-score',
      type: 'portfolio:risk_score',
      title: 'Portfolio risk score reviewed',
      description: 'Educational portfolio risk score calculated as 68/100 (Medium).',
      metadata: { score: 68, level: 'Medium', holdingsCount: DEMO_PORTFOLIO.length, status: 'completed' },
      createdAt: minutesAgo(30),
    },
    {
      seedKey: 'portfolio-analysis',
      type: 'portfolio:analysis',
      title: 'Portfolio AI analysis generated',
      description: 'A demo portfolio analysis was generated for the prepared holdings.',
      metadata: { provider: 'demo-seed', fallback: true, holdingsCount: DEMO_PORTFOLIO.length, status: 'completed' },
      createdAt: minutesAgo(25),
    },
    {
      seedKey: 'backtest-export',
      type: 'backtest:export',
      title: 'Backtest CSV exported',
      description: '3 backtest comparison rows exported as CSV.',
      metadata: {
        symbol: 'BTC',
        strategies: ['rsi', 'macd', 'ema_cross'],
        format: 'csv',
        action: 'export',
        rowCount: 3,
        status: 'completed',
      },
      createdAt: minutesAgo(20),
    },
    {
      seedKey: 'bot-start',
      type: 'bot:start',
      title: 'Paper bot started',
      description: 'Paper bot started for BTC.',
      metadata: { symbol: 'BTC', strategy: 'rsi', mode: 'paper', action: 'start', status: 'running' },
      createdAt: minutesAgo(15),
    },
    {
      seedKey: 'bot-stop',
      type: 'bot:stop',
      title: 'Paper bot stopped',
      description: 'The running paper bot was stopped.',
      metadata: { symbol: 'BTC', strategy: 'rsi', mode: 'paper', action: 'stop', status: 'stopped' },
      createdAt: minutesAgo(10),
    },
  ].map((item) => ({
    ...item,
    user: userId,
    metadata: {
      ...item.metadata,
      demo: true,
      seedKey: item.seedKey,
    },
    expiresAt,
  }));
}

async function seedActivityLogs(userId, summary) {
  const items = buildActivityLogItems(userId);

  for (const item of items) {
    await upsertWithCounts(
      ActivityLog,
      { user: userId, type: item.type, 'metadata.seedKey': item.seedKey },
      {
        $set: {
          user: userId,
          type: item.type,
          title: item.title,
          description: item.description,
          metadata: item.metadata,
          createdAt: item.createdAt,
          expiresAt: item.expiresAt,
        },
      },
      {},
      summary.activities,
    );
  }
}

async function seedStoppedBot(userId, summary) {
  await upsertWithCounts(
    BotInstance,
    { user: userId, symbol: 'BTC', strategy: 'rsi', mode: 'paper' },
    {
      $set: {
        user: userId,
        symbol: 'BTC',
        strategy: 'rsi',
        mode: 'paper',
        isRunning: false,
        status: 'stopped',
        positionSize: 250,
        maxPositionSize: 1000,
        riskLevel: 'medium',
        intervalSeconds: 60,
        executeTrades: false,
        quantity: null,
        rsiPeriod: 14,
        rsiOverbought: 70,
        rsiOversold: 30,
        startedAt: null,
        stoppedAt: minutesAgo(10),
        lastTickAt: null,
        lastRunAt: null,
        lastDecision: {
          action: 'HOLD',
          reason: 'Demo bot is prepared but stopped. No scheduler was started by the seed script.',
          source: 'demo-seed',
        },
        lastError: null,
      },
    },
    {},
    summary.bot,
  );
}

function printSummary(user, summary) {
  console.log('[seed:demo] Demo data prepared successfully.');
  console.log(`[seed:demo] Account: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
  console.log(`[seed:demo] User id: ${user._id}`);
  console.log(`[seed:demo] Plan: ${DEMO_PLAN}`);
  console.log(`[seed:demo] Virtual balance: ${DEMO_BALANCE}`);
  console.log(`[seed:demo] User: ${summary.user}`);
  console.log(`[seed:demo] Portfolio: ${summary.portfolio.created} created, ${summary.portfolio.updated} updated`);
  console.log(`[seed:demo] Watchlist: ${summary.watchlist.created} created, ${summary.watchlist.updated} updated`);
  console.log(`[seed:demo] Paper trades: ${summary.trades.created} created, ${summary.trades.updated} updated`);
  console.log(`[seed:demo] Demo transactions: ${summary.transactions.created} created, ${summary.transactions.updated} updated`);
  console.log(`[seed:demo] Activity logs: ${summary.activities.created} created, ${summary.activities.updated} updated`);
  console.log(`[seed:demo] Stopped bot instance: ${summary.bot.created} created, ${summary.bot.updated} updated`);
  console.log('[seed:demo] Backtest results are not stored. Run BTC RSI/MACD from the Backtesting page during the demo.');
}

async function main() {
  assertNotProduction();

  const env = loadEnvConfig();
  if (env.nodeEnv === 'production') {
    throw new Error('Refusing to seed demo data when NODE_ENV=production.');
  }
  logFeatureWarnings(env.warnings);

  const summary = createSummary();

  await mongoose.connect(env.mongoUri);

  try {
    const user = await upsertDemoUser(summary);
    await seedPortfolio(user._id, summary);
    await seedWatchlist(user._id, summary);
    await seedTrades(user._id, summary);
    await seedDemoDeposit(user._id, summary);
    await seedActivityLogs(user._id, summary);
    await seedStoppedBot(user._id, summary);
    printSummary(user, summary);
  } finally {
    await mongoose.connection.close();
  }
}

main().catch(async (error) => {
  console.error(`[seed:demo] ${error.message || error}`);
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
  process.exitCode = 1;
});
