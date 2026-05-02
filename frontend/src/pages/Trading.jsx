import { useState } from 'react'
import PriceCard from '../components/trading/PriceCard'
import OrderForm from '../components/trading/OrderForm'
import TradingPanel from '../components/trading/TradingPanel'
import TradeHistory from '../components/trading/TradeHistory'

const MOCK_PRICES = [
  { symbol: 'BTC',  name: 'Bitcoin',  price: 67432.00, change:  2.34 },
  { symbol: 'ETH',  name: 'Ethereum', price:  3847.20, change: -1.12 },
  { symbol: 'SOL',  name: 'Solana',   price:   178.32, change:  5.67 },
  { symbol: 'XAU',  name: 'Gold',     price:  2345.80, change:  0.43 },
  { symbol: 'AAPL', name: 'Apple',    price:   189.45, change: -0.88 },
]

function Trading() {
  const [selectedSymbol, setSelectedSymbol] = useState('BTC')
  const [trades, setTrades] = useState([])

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
    <div className="p-4 sm:p-6 space-y-5 max-w-7xl mx-auto">
      <div>
        <h1 className="text-lg font-bold text-white">Trading Simulation</h1>
        <p className="text-xs text-gray-500 mt-0.5">Practice trading with simulated real-time prices</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {MOCK_PRICES.map((asset) => (
          <PriceCard
            key={asset.symbol}
            asset={asset}
            selected={selectedSymbol === asset.symbol}
            onClick={() => setSelectedSymbol(asset.symbol)}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <TradingPanel asset={currentAsset} />
          <TradeHistory trades={trades} />
        </div>
        <div>
          <OrderForm
            prices={MOCK_PRICES}
            selectedSymbol={selectedSymbol}
            onTrade={handleTrade}
          />
        </div>
      </div>
    </div>
  )
}

export default Trading
