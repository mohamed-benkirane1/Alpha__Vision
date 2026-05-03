import { useState, useEffect } from 'react'
import { ShoppingCart } from 'lucide-react'

const SYMBOLS = ['BTC', 'ETH', 'SOL', 'XAU', 'AAPL']

const selectClass = 'w-full bg-slate-900/80 border border-slate-700/50 text-white text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500/60 focus:shadow-[0_0_10px_rgba(99,102,241,0.12)] transition-all duration-200'

function OrderForm({ prices, selectedSymbol, onTrade }) {
  const [symbol, setSymbol] = useState(selectedSymbol || 'BTC')
  const [type, setType]     = useState('BUY')
  const [qty, setQty]       = useState('')

  useEffect(() => { if (selectedSymbol) setSymbol(selectedSymbol) }, [selectedSymbol])

  const price     = prices[symbol]?.price || 0
  const estimated = qty && parseFloat(qty) > 0 ? parseFloat(qty) * price : 0

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!qty || parseFloat(qty) <= 0) return
    onTrade({ symbol, type, qty: parseFloat(qty), price, estimated })
    setQty('')
  }

  return (
    <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-5 backdrop-blur-xl">
      <h2 className="text-sm font-semibold text-white mb-5">Place Order</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs text-slate-400 mb-1.5 font-semibold uppercase tracking-wide">Symbol</label>
          <select value={symbol} onChange={(e) => setSymbol(e.target.value)} className={selectClass}>
            {SYMBOLS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1.5 font-semibold uppercase tracking-wide">Order Type</label>
          <div className="grid grid-cols-2 gap-2">
            {['BUY', 'SELL'].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`py-2.5 rounded-xl text-sm font-bold border transition-all duration-200 ${
                  type === t
                    ? t === 'BUY'
                      ? 'bg-emerald-600 border-emerald-500 text-white shadow-[0_0_14px_rgba(16,185,129,0.25)]'
                      : 'bg-red-600 border-red-500 text-white shadow-[0_0_14px_rgba(239,68,68,0.25)]'
                    : 'bg-slate-900/80 border-slate-700/50 text-slate-400 hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1.5 font-semibold uppercase tracking-wide">Quantity</label>
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

        <div className="bg-slate-900/80 border border-slate-700/40 rounded-xl px-4 py-3 space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-500">Current Price</span>
            <span className="text-white font-bold">${price.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Estimated Value</span>
            <span className={`font-bold ${estimated > 0 ? 'text-indigo-400' : 'text-slate-500'}`}>
              ${estimated.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <button
          type="submit"
          className={`w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all duration-200 ${
            type === 'BUY'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-[0_0_14px_rgba(16,185,129,0.2)]'
              : 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-[0_0_14px_rgba(239,68,68,0.2)]'
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
