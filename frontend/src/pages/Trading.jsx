import { useState } from 'react'
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

// OrderForm expects an object keyed by symbol
const PRICE_MAP = Object.fromEntries(MOCK_PRICES.map((p) => [p.symbol, p]))

function Trading() {
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
      <div>
        <h1 className="text-2xl font-bold text-white">Trading Simulation</h1>
        <p className="text-sm text-gray-400 mt-0.5">Practice trading with simulated real-time prices</p>
      </div>

      {/* Price ticker */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {MOCK_PRICES.map((asset) => (
          <PriceCard
            key={asset.symbol}
            {...asset}
            selected={selectedSymbol === asset.symbol}
            onSelect={setSelectedSymbol}
          />
        ))}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <TradingPanel
            symbol={currentAsset.symbol}
            price={currentAsset.price}
            type="BUY"
          />
          <TradeHistory trades={trades} />
        </div>
        <div>
          <OrderForm
            prices={PRICE_MAP}
            selectedSymbol={selectedSymbol}
            onTrade={handleTrade}
          />
        </div>
      </div>
    </div>
  )
}

export default Trading
