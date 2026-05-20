const router = require('express').Router();
const auth = require('../middleware/auth');
const Portfolio = require('../models/portfolio');
const { getPrice } = require('../services/marketService');

function roundMoney(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Number(number.toFixed(2)) : 0;
}

function formatMoney(value) {
  return roundMoney(value).toFixed(2);
}

function formatPercent(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number.toFixed(2) : null;
}

function buildWarning(symbol, reason) {
  return `Price unavailable for ${symbol || 'unknown symbol'}: ${reason}`;
}

async function enrichHolding(holding) {
  const baseHolding = holding.toObject();
  const symbol = typeof baseHolding.symbol === 'string' ? baseHolding.symbol.trim().toUpperCase() : '';
  const quantity = Number(baseHolding.quantity);
  const avgPrice = Number(baseHolding.avgPrice);
  const costBasis = Number.isFinite(quantity) && Number.isFinite(avgPrice) ? quantity * avgPrice : 0;

  const unavailable = (reason) => ({
    ...baseHolding,
    symbol: symbol || baseHolding.symbol,
    currentPrice: null,
    currentValue: null,
    costBasis: formatMoney(costBasis),
    profit: null,
    profitPercent: null,
    allocation: 0,
    priceAvailable: false,
    warning: buildWarning(symbol || baseHolding.symbol, reason)
  });

  if (!symbol) {
    return unavailable('missing symbol');
  }

  if (!Number.isFinite(quantity) || quantity < 0) {
    return unavailable('invalid quantity');
  }

  try {
    const quote = await getPrice(symbol);
    const price = Number(quote?.price);

    if (!Number.isFinite(price) || price <= 0) {
      return unavailable('invalid market price');
    }

    const currentValue = quantity * price;
    const profit = currentValue - costBasis;
    const profitPercent = costBasis > 0 ? (profit / costBasis) * 100 : 0;

    return {
      ...baseHolding,
      symbol,
      currentPrice: price,
      currentValue: formatMoney(currentValue),
      costBasis: formatMoney(costBasis),
      profit: formatMoney(profit),
      profitPercent: formatPercent(profitPercent),
      allocation: 0,
      priceAvailable: true
    };
  } catch (err) {
    return unavailable(err.message || 'market service error');
  }
}

router.get('/', auth, async (req, res) => {
  try {
    const holdings = await Portfolio.find({ userId: req.user.id });

    const enriched = await Promise.all(holdings.map(enrichHolding));
    const warnings = enriched.flatMap((holding) => holding.warning ? [holding.warning] : []);

    const totalValue = enriched.reduce((sum, holding) => {
      if (!holding.priceAvailable) return sum;
      const value = Number(holding.currentValue);
      return Number.isFinite(value) ? sum + value : sum;
    }, 0);

    const totalProfit = enriched.reduce((sum, holding) => {
      if (!holding.priceAvailable) return sum;
      const profit = Number(holding.profit);
      return Number.isFinite(profit) ? sum + profit : sum;
    }, 0);

    const totalCostBasis = enriched.reduce((sum, holding) => {
      if (!holding.priceAvailable) return sum;
      const costBasis = Number(holding.costBasis);
      return Number.isFinite(costBasis) ? sum + costBasis : sum;
    }, 0);

    const holdingsWithAllocation = enriched.map((holding) => {
      const currentValue = Number(holding.currentValue);
      const allocation = totalValue > 0 && Number.isFinite(currentValue)
        ? (currentValue / totalValue) * 100
        : 0;

      return {
        ...holding,
        allocation: Number(allocation.toFixed(2))
      };
    });

    res.json({
      success: true,
      holdings: holdingsWithAllocation,
      totalValue: formatMoney(totalValue),
      totalProfit: formatMoney(totalProfit),
      totalProfitPercent: totalCostBasis > 0 ? formatPercent((totalProfit / totalCostBasis) * 100) : 0,
      warnings
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      holdings: [],
      totalValue: 0,
      totalProfit: 0,
      totalProfitPercent: 0,
      warnings: [err.message || 'Portfolio could not be loaded']
    });
  }
});

module.exports = router;
