import { useState, useEffect } from 'react'
import { ShoppingCart, ChevronDown } from 'lucide-react'
import { motion } from 'framer-motion'

const SYMBOLS = ['BTC', 'ETH', 'SOL', 'XAU', 'AAPL']

const fieldCls = 'w-full bg-[#060D1C]/80 border border-white/[0.09] text-white text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-indigo-500/60 focus:shadow-[0_0_14px_rgba(99,102,241,0.14)] transition-all duration-200 placeholder-slate-700 appearance-none'

export default function OrderForm({ prices, selectedSymbol, onTrade }) {
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
    <motion.div
      whileHover={{ borderColor: 'rgba(99,102,241,0.14)' }}
      className="bg-[#0a1628]/88 border border-white/[0.07] rounded-2xl p-5 backdrop-blur-2xl shadow-[0_4px_28px_rgba(0,0,0,0.32)] transition-all duration-300"
    >
      <h2 className="text-sm font-bold text-white mb-5">Place Order</h2>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Symbol */}
        <div>
          <label className="block text-[10px] font-black text-slate-600 mb-1.5 tracking-[0.1em] uppercase">Symbol</label>
          <div className="relative">
            <select
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              className={fieldCls + ' pr-9 cursor-pointer'}
              style={{ backgroundImage: 'none' }}
            >
              {SYMBOLS.map((s) => <option key={s} value={s} className="bg-[#0a1628]">{s}</option>)}
            </select>
            <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" />
          </div>
        </div>

        {/* Buy / Sell toggle */}
        <div>
          <label className="block text-[10px] font-black text-slate-600 mb-1.5 tracking-[0.1em] uppercase">Order Type</label>
          <div className="grid grid-cols-2 gap-2 bg-white/[0.03] border border-white/[0.06] rounded-xl p-1">
            {['BUY', 'SELL'].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`py-2 rounded-lg text-sm font-black border transition-all duration-200 ${
                  type === t
                    ? t === 'BUY'
                      ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-400 shadow-[0_0_14px_rgba(16,185,129,0.2)]'
                      : 'bg-rose-500/15 border-rose-500/35 text-rose-400 shadow-[0_0_14px_rgba(244,63,94,0.2)]'
                    : 'border-transparent text-slate-600 hover:text-slate-400'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Quantity */}
        <div>
          <label className="block text-[10px] font-black text-slate-600 mb-1.5 tracking-[0.1em] uppercase">Quantity</label>
          <input
            type="number"
            min="0"
            step="any"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            placeholder="0.00"
            className={fieldCls}
          />
        </div>

        {/* Summary */}
        <div className="bg-white/[0.025] border border-white/[0.06] rounded-xl px-4 py-3 space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-600 font-medium">Current Price</span>
            <span className="text-white font-black tabular-nums">${price.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600 font-medium">Estimated Value</span>
            <span className={`font-black tabular-nums ${estimated > 0 ? 'text-indigo-400' : 'text-slate-700'}`}>
              ${estimated.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <motion.button
          type="submit"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          className={`ripple-btn w-full py-3 rounded-xl text-sm font-black flex items-center justify-center gap-2 transition-all duration-200 ${
            type === 'BUY'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-[0_0_18px_rgba(16,185,129,0.22)]'
              : 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-[0_0_18px_rgba(244,63,94,0.22)]'
          }`}
        >
          <ShoppingCart size={14} />
          Place {type} Order
        </motion.button>
      </form>
    </motion.div>
  )
}
