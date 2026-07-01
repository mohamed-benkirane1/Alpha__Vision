const router = require('express').Router();
const { ipKeyGenerator, rateLimit } = require('express-rate-limit');
const auth = require('../middleware/auth');
const { generateAiSignal } = require('../services/aiSignalService');

function getForwardedHeaderIp(value) {
  const firstForwardedValue = String(value || '').split(',')[0]?.trim();
  if (!firstForwardedValue) return null;

  const match = firstForwardedValue.match(/(?:^|;)\s*for=(?:"([^"]+)"|([^;,\s]+))/i);
  let candidate = String(match?.[1] || match?.[2] || '').trim();
  if (!candidate || candidate.toLowerCase() === 'unknown' || candidate.startsWith('_')) return null;

  const bracketedIpv6 = candidate.match(/^\[([^\]]+)\](?::\d+)?$/);
  if (bracketedIpv6) return bracketedIpv6[1];

  if (/^\d{1,3}(?:\.\d{1,3}){3}:\d+$/.test(candidate)) {
    candidate = candidate.split(':')[0];
  }

  return candidate;
}

const aiSignalLimiter = rateLimit({
  windowMs: 60_000,
  limit: 10,
  keyGenerator: (req) => ipKeyGenerator(getForwardedHeaderIp(req.headers.forwarded) || req.ip),
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many AI signal requests. Please wait before retrying.' },
});

router.get('/', auth, aiSignalLimiter, async (req, res) => {
  try {
    const symbol = typeof req.query.symbol === 'string' ? req.query.symbol : undefined;
    const response = await generateAiSignal({
      userId: req.user.id,
      symbol,
    });

    return res.status(200).json(response);
  } catch (err) {
    return res.status(500).json({
      success: false,
      mode: 'fallback',
      timestamp: new Date().toISOString(),
      symbol: typeof req.query.symbol === 'string' ? req.query.symbol.trim().toUpperCase() : null,
      source: 'backend',
      provider: 'rules-based',
      providerStatus: 'error',
      fallback: true,
      dataQuality: {
        marketDataAvailable: false,
        isLive: false,
        isStale: false,
        isCached: false,
        isFallback: false,
        usesLiveMarketData: false,
        usesNewsData: false,
        usesLLM: false,
        marketReliable: false,
        newsAvailable: false,
        isIndicative: false,
        warnings: ['AI signal service failed before a signal could be generated.'],
      },
      signal: null,
      label: null,
      confidence: null,
      analysis: null,
      reasons: [],
      warnings: ['Cannot generate a signal right now.'],
      error: err.message || 'Unable to generate AI signal.',
      notFinancialAdvice: true,
    });
  }
});

module.exports = router;
