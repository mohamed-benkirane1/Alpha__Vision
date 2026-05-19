import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Activity } from 'lucide-react'

const defaultAssets = [
  { symbol: 'BTC',  name: 'Bitcoin',  price: '$67,432.00', change: '+2.4%', up: true,  color: '#f97316' },
  { symbol: 'ETH',  name: 'Ethereum', price: '$3,847.20',  change: '+1.8%', up: true,  color: '#6366f1' },
  { symbol: 'SOL',  name: 'Solana',   price: '$178.32',    change: '+4.1%', up: true,  color: '#8b5cf6' },
  { symbol: 'XAU',  name: 'Gold',     price: '$2,345.80',  change: '+0.3%', up: true,  color: '#eab308' },
  { symbol: 'AAPL', name: 'Apple',    price: '$189.45',    change: '-0.3%', up: false, color: '#64748b' },
  { symbol: 'NDX',  name: 'NASDAQ',   price: '18,234.10',  change: '+0.8%', up: true,  color: '#06b6d4' },
]

const assetNames = {
  BTC: 'Bitcoin',
  ETH: 'Ethereum',
  SOL: 'Solana',
  XAU: 'Gold',
  XAG: 'Silver',
  AAPL: 'Apple',
  TSLA: 'Tesla',
  NVDA: 'NVIDIA',
  MSFT: 'Microsoft',
  GOOGL: 'Alphabet',
  IXIC: 'NASDAQ Composite',
  SPX: 'S&P 500',
  DJI: 'Dow Jones',
}

const assetColors = ['#f97316', '#6366f1', '#8b5cf6', '#eab308', '#64748b', '#06b6d4']

const formatPrice = (price) => {
  const number = Number(price)
  if (!Number.isFinite(number)) return '$0.00'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: number >= 1000 ? 0 : 2,
  }).format(number)
}

const formatChange = (change) => {
  const number = Number(change)
  if (!Number.isFinite(number)) return '+0.0%'
  return `${number >= 0 ? '+' : ''}${number.toFixed(1)}%`
}

const normalizeMarkets = (markets) => {
  if (!Array.isArray(markets) || markets.length === 0) return defaultAssets

  return markets.slice(0, 6).map((market, index) => {
    const change = market.change24h ?? market.changePercent ?? 0
    const symbol = market.symbol || 'N/A'

    return {
      symbol,
      name: market.name || assetNames[symbol] || market.type || 'Market asset',
      price: formatPrice(market.price),
      change: formatChange(change),
      up: Number(change) >= 0,
      color: assetColors[index % assetColors.length],
    }
  })
}

export default function MarketOverview({ markets = [], loading = false }) {
  const assets = normalizeMarkets(markets)

  return (
    <motion.div
      whileHover={{ borderColor: 'rgba(225,29,72,0.12)' }}
      className="bg-[#0a1628]/88 border border-white/[0.07] rounded-2xl p-5 backdrop-blur-2xl shadow-[0_4px_28px_rgba(0,0,0,0.32)] transition-all duration-300"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity size={13} className="text-rose-400" />
          <h2 className="text-sm font-bold text-white">Market Overview</h2>
        </div>
        <span className="text-[10px] text-slate-700 bg-white/[0.03] border border-white/[0.06] px-2 py-0.5 rounded-full font-bold">{loading ? 'Loading' : 'Live'}</span>
      </div>

      <div className="space-y-1.5">
        {assets.map((a, i) => (
          <motion.div
            key={a.symbol}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05, duration: 0.3 }}
            whileHover={{ x: 2, backgroundColor: 'rgba(225,29,72,0.03)' }}
            className="flex items-center justify-between px-3 py-2.5 bg-white/[0.02] border border-white/[0.045] rounded-xl transition-all duration-200 cursor-default"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black shrink-0"
                style={{
                  background: `${a.color}16`,
                  border: `1px solid ${a.color}28`,
                  color: a.color,
                }}
              >
                {a.symbol.slice(0, 2)}
              </div>
              <div>
                <p className="text-sm font-bold text-white">{a.symbol}</p>
                <p className="text-[10px] text-slate-700">{a.name}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-white tabular-nums">{a.price}</p>
              <p className={`text-xs font-bold flex items-center justify-end gap-0.5 ${a.up ? 'text-emerald-400' : 'text-red-400'}`}>
                {a.up ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                {a.change}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
