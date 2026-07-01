export const TRADING_ASSETS = [
  // ── CRYPTO (Binance) ─────────────────────────────────────
  { value: 'BTC',      label: 'BTC/USDT — Bitcoin',             type: 'crypto', provider: 'binance' },
  { value: 'ETH',      label: 'ETH/USDT — Ethereum',            type: 'crypto', provider: 'binance' },
  { value: 'BNB',      label: 'BNB/USDT — BNB',                 type: 'crypto', provider: 'binance' },
  { value: 'SOL',      label: 'SOL/USDT — Solana',              type: 'crypto', provider: 'binance' },
  { value: 'XRP',      label: 'XRP/USDT — Ripple',              type: 'crypto', provider: 'binance' },
  { value: 'ADA',      label: 'ADA/USDT — Cardano',             type: 'crypto', provider: 'binance' },
  { value: 'DOGE',     label: 'DOGE/USDT — Dogecoin',           type: 'crypto', provider: 'binance' },
  { value: 'DOT',      label: 'DOT/USDT — Polkadot',            type: 'crypto', provider: 'binance' },
  { value: 'MATIC',    label: 'MATIC/USDT — Polygon',           type: 'crypto', provider: 'binance' },
  { value: 'LINK',     label: 'LINK/USDT — Chainlink',          type: 'crypto', provider: 'binance' },
  { value: 'AVAX',     label: 'AVAX/USDT — Avalanche',          type: 'crypto', provider: 'binance' },
  { value: 'LTC',      label: 'LTC/USDT — Litecoin',            type: 'crypto', provider: 'binance' },
  { value: 'UNI',      label: 'UNI/USDT — Uniswap',             type: 'crypto', provider: 'binance' },
  { value: 'ATOM',     label: 'ATOM/USDT — Cosmos',             type: 'crypto', provider: 'binance' },
  { value: 'XLM',      label: 'XLM/USDT — Stellar',             type: 'crypto', provider: 'binance' },
  { value: 'TRX',      label: 'TRX/USDT — TRON',                type: 'crypto', provider: 'binance' },
  { value: 'ETC',      label: 'ETC/USDT — Ethereum Classic',    type: 'crypto', provider: 'binance' },
  { value: 'FIL',      label: 'FIL/USDT — Filecoin',            type: 'crypto', provider: 'binance' },
  { value: 'NEAR',     label: 'NEAR/USDT — NEAR Protocol',      type: 'crypto', provider: 'binance' },
  { value: 'APT',      label: 'APT/USDT — Aptos',               type: 'crypto', provider: 'binance' },
  { value: 'ARB',      label: 'ARB/USDT — Arbitrum',            type: 'crypto', provider: 'binance' },
  { value: 'OP',       label: 'OP/USDT — Optimism',             type: 'crypto', provider: 'binance' },
  { value: 'INJ',      label: 'INJ/USDT — Injective',           type: 'crypto', provider: 'binance' },
  { value: 'SUI',      label: 'SUI/USDT — Sui',                 type: 'crypto', provider: 'binance' },
  { value: 'SEI',      label: 'SEI/USDT — Sei',                 type: 'crypto', provider: 'binance' },

  // ── ACTIONS US (Yahoo Finance) ───────────────────────────
  { value: 'AAPL',  label: 'AAPL — Apple Inc.',                 type: 'stock', provider: 'yahoo' },
  { value: 'MSFT',  label: 'MSFT — Microsoft',                  type: 'stock', provider: 'yahoo' },
  { value: 'GOOGL', label: 'GOOGL — Alphabet (Google)',          type: 'stock', provider: 'yahoo' },
  { value: 'AMZN',  label: 'AMZN — Amazon',                     type: 'stock', provider: 'yahoo' },
  { value: 'NVDA',  label: 'NVDA — NVIDIA',                     type: 'stock', provider: 'yahoo' },
  { value: 'META',  label: 'META — Meta Platforms',             type: 'stock', provider: 'yahoo' },
  { value: 'TSLA',  label: 'TSLA — Tesla',                      type: 'stock', provider: 'yahoo' },
  { value: 'NFLX',  label: 'NFLX — Netflix',                    type: 'stock', provider: 'yahoo' },

  // ── INDICES (Yahoo Finance) ──────────────────────────────
  { value: 'SPX',   label: 'S&P 500 — US Large Cap Index',      type: 'index', provider: 'yahoo' },
  { value: 'DJI',   label: 'Dow Jones — Industrial Average',    type: 'index', provider: 'yahoo' },
  { value: 'IXIC',  label: 'NASDAQ — Composite Index',          type: 'index', provider: 'yahoo' },

  // ── MATIÈRES PREMIÈRES (Yahoo Finance) ───────────────────
  { value: 'XAU',  label: 'XAU/USD — Gold',                     type: 'commodity', provider: 'yahoo' },
  { value: 'XAG',  label: 'XAG/USD — Silver',                   type: 'commodity', provider: 'yahoo' },
]

export const ASSET_GROUPS = [
  { label: '🔶 Crypto — Binance',          type: 'crypto' },
  { label: '📈 Actions US — Yahoo Finance', type: 'stock' },
  { label: '📊 Indices — Yahoo Finance',    type: 'index' },
  { label: '🥇 Matières premières',         type: 'commodity' },
]

export const getAssetsByType = (type) =>
  TRADING_ASSETS.filter((a) => a.type === type)

export const getAssetLabel = (value) =>
  TRADING_ASSETS.find((a) => a.value === value)?.label || value

export const getAssetProvider = (value) =>
  TRADING_ASSETS.find((a) => a.value === value)?.provider || null
