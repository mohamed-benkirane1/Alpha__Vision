import { useState } from 'react'
import { motion } from 'framer-motion'
import { LineChart, Zap } from 'lucide-react'
import PriceCard    from '../components/trading/PriceCard'
import OrderForm    from '../components/trading/OrderForm'
import TradingPanel from '../components/trading/TradingPanel'
import TradeHistory from '../components/trading/TradeHistory'

const MOCK_PRICES = [
  { symbol: 'BTC',  name: 'Bitcoin',  price: 67432.00, change:  2.34 },
  { symbol: 'ETH',  name: 'Ethereum', price:  3847.20, change: -1.12 },
  { symbol: 'SOL',  name: 'Solana',   price:   178.32, change:  5.67 },
  { symbol: 'XAU',  name: 'Gold',     price:  2345.80, change:  0.43 },
  { symbol: 'AAPL', name: 'Apple',    price:   189.45, change: -0.88 },
]

const PRICE_MAP = Object.fromEntries(MOCK_PRICES.map((p) => [p.symbol, p]))

const fadeUp  = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0.16, 1, 0.3, 1] } } }
const stagger = { visible: { transition: { staggerChildren: 0.08 } } }

export default function Trading() {
  const [selectedSymbol, setSelectedSymbol] = useState('BTC')
  const [trades, setTrades]                 = useState([])

  function handleTrade({ type, symbol, qty, price }) {
    const time = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    })
    setTrades((prev) => [
      { id: Date.now(), time, type, symbol, qty, price, total: qty * price },
      ...prev,
    ])
  }

  const currentAsset = MOCK_PRICES.find((p) => p.symbol === selectedSymbol) || MOCK_PRICES[0]

  return (
    <div className="space-y-5">

      <motion.div initial="hidden" animate="visible" variants={fadeUp}
        className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <LineChart size={16} className="text-rose-400" />
            <h1 className="text-2xl font-black text-white">Trading Simulation</h1>
          </div>
          <p className="text-xs text-slate-500 font-medium">Practice trading with simulated real-time prices</p>
        </div>
        <span className="hidden sm:inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/22 text-emerald-400 text-[10px] font-black px-3 py-1.5 rounded-full shadow-[0_0_12px_rgba(16,185,129,0.10)] tracking-wider">
          <Zap size={10} />
          SIMULATED
        </span>
      </motion.div>

      {/* Asset cards */}
      <motion.div initial="hidden" animate="visible" variants={stagger}
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        {MOCK_PRICES.map((asset) => (
          <motion.div key={asset.symbol} variants={fadeUp}>
            <PriceCard
              {...asset}
              selected={selectedSymbol === asset.symbol}
              onSelect={setSelectedSymbol}
            />
          </motion.div>
        ))}
      </motion.div>

      {/* Main grid */}
      <motion.div initial="hidden" animate="visible" variants={stagger}
        className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
        <motion.div variants={fadeUp} className="lg:col-span-2 space-y-3.5">
          <TradingPanel
            symbol={currentAsset.symbol}
            price={currentAsset.price}
            type="BUY"
          />
          <TradeHistory trades={trades} />
        </motion.div>
        <motion.div variants={fadeUp}>
          <OrderForm
            key={selectedSymbol}
            prices={PRICE_MAP}
            selectedSymbol={selectedSymbol}
            onTrade={handleTrade}
          />
        </motion.div>
      </motion.div>
    </div>
  )
}
