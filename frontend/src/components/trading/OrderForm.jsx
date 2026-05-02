import { useState, useEffect } from 'react'
import { ShoppingCart } from 'lucide-react'

const SYMBOLS = ['BTC', 'ETH', 'SOL', 'XAU', 'AAPL']

const selectClass =
  'w-full bg-gray-900 border border-gray-800 text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-indigo-500 transition-colors'

function OrderForm({ prices, selectedSymbol, onTrade }) {
  const [symbol, setSymbol]   = useState(selectedSymbol || 'BTC')
  const [type, setType]       = useState('BUY')
  const [qty, setQty]         = useState('')

  useEffect(() => { if (selectedSymbol) setSymbol(selectedSymbol) }, [selectedSymbol])

  const price     = prices[symbol]?.price || 0
  const estimated = qty && parseFloat(qty) > 0 ? (parseFloat(qty) * price) : 0

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!qty || parseFloat(qty) <= 0) return
    onTrade({ symbol, type, qty: parseFloat(qty), price, estimated })
    setQty('')
  }

  return (
    <div className="bg-gray-900/50 border border-gray-800/60 rounded-xl p-5 backdrop-blur-sm">
      <h2 className="text-sm font-semibold text-white mb-5">Place Order</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Symbol */}
        <div>
          <label className="block text-xs text-gray-400 mb-1.5 font-medium">Symbol</label>
          <select value={symbol} onChange={(e) => setSymbol(e.target.value)} className={selectClass}>
            {SYMBOLS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Type */}
        <div>
          <label className="block text-xs text-gray-400 mb-1.5 font-medium">Order Type</label>
          <div className="grid grid-cols-2 gap-2">
            {['BUY', 'SELL'].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`py-2 rounded-lg text-sm font-semibold border transition-all ${
                  type === t
                    ? t === 'BUY'
                      ? 'bg-emerald-600 border-emerald-600 text-white'
                      : 'bg-red-600 border-red-600 text-white'
                    : 'bg-gray-900 border-gray-700 text-gray-400 hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Quantity */}
        <div>
          <label className="block text-xs text-gray-400 mb-1.5 font-medium">Quantity</label>
          <input
            type="number"
            min="0"
            step="any"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            placeholder="0.00"
            className={selectClass}
          />
        </div>

        {/* Price + Estimated */}
        <div className="bg-gray-900/80 border border-gray-800/60 rounded-lg px-4 py-3 space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-500">Current Price</span>
            <span className="text-white font-semibold">${price.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Estimated Value</span>
            <span className={`font-semibold ${estimated > 0 ? 'text-indigo-400' : 'text-gray-500'}`}>
              ${estimated.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          className={`w-full py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
            type === 'BUY'
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
              : 'bg-red-600 hover:bg-red-500 text-white'
          }`}
        >
          <ShoppingCart size={14} />
          Place {type} Order
        </button>
      </form>
    </div>
  )
}

export default OrderForm
