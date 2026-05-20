import { useState, useEffect } from 'react'
import { ShoppingCart, ChevronDown, CheckCircle } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'

const fieldCls = 'w-full bg-[#060D1C]/80 border border-white/[0.09] text-white text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-rose-500/50 focus:shadow-[0_0_14px_rgba(225,29,72,0.12)] transition-all duration-200 placeholder-slate-700 appearance-none'

export default function OrderForm({
  prices,
  symbols = [],
  selectedSymbol,
  selectedType = 'BUY',
  onTypeChange,
  onTrade,
  loading = false,
  successMessage = '',
  errorMessage = '',
}) {
  const [symbol, setSymbol]       = useState(selectedSymbol || 'BTC')
  const [qty, setQty]             = useState('')
  const [quantityError, setQuantityError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const shouldReduce = useReducedMotion()
  const type = selectedType === 'SELL' ? 'SELL' : 'BUY'

  // Auto-clear submitted feedback with cleanup on unmount
  useEffect(() => {
    if (!submitted) return
    const t = setTimeout(() => setSubmitted(false), 1800)
    return () => clearTimeout(t)
  }, [submitted])

  const handleTypeChange = (nextType) => {
    onTypeChange?.(nextType)
  }

  const price     = Number(prices[symbol]?.price)
  const hasPrice  = Number.isFinite(price) && price > 0
  const quantity  = Number(qty)
  const estimated = Number.isFinite(quantity) && quantity > 0 && hasPrice ? quantity * price : 0

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (loading) return
    if (!qty || !Number.isFinite(quantity) || quantity <= 0) {
      setQuantityError('Quantity must be a positive number.')
      return
    }

    setQuantityError('')
    const ok = await onTrade({ symbol, type, qty: quantity })
    if (ok) {
      setQty('')
      setSubmitted(true)
    }
  }

  return (
    <motion.div
      whileHover={{ borderColor: 'rgba(225,29,72,0.12)' }}
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
              disabled={loading || symbols.length === 0}
            >
              {symbols.map((s) => <option key={s} value={s} className="bg-[#0a1628]">{s}</option>)}
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
                onClick={() => handleTypeChange(t)}
                disabled={loading}
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
            onChange={(e) => {
              setQty(e.target.value)
              if (quantityError) setQuantityError('')
            }}
            placeholder="0.00"
            disabled={loading}
            className={fieldCls}
          />
          {quantityError && (
            <p className="text-[11px] text-amber-400/85 font-semibold mt-1.5">{quantityError}</p>
          )}
        </div>

        {/* Summary */}
        <div className="bg-white/[0.025] border border-white/[0.06] rounded-xl px-4 py-3 space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-600 font-medium">Current Price</span>
            <span className="text-white font-black tabular-nums">{hasPrice ? `$${price.toLocaleString()}` : '--'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600 font-medium">Estimated Value</span>
            <span className={`font-black tabular-nums ${estimated > 0 ? 'text-rose-400' : 'text-slate-700'}`}>
              ${estimated.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {(successMessage || errorMessage) && (
          <p className={`text-[11px] font-semibold ${errorMessage ? 'text-amber-400/85' : 'text-emerald-400/85'}`}>
            {errorMessage || successMessage}
          </p>
        )}

        <motion.button
          type="submit"
          disabled={loading || symbols.length === 0}
          whileHover={submitted || loading ? {} : { scale: 1.01 }}
          whileTap={submitted || loading ? {} : { scale: 0.98 }}
          className={`ripple-btn w-full py-3 rounded-xl text-sm font-black flex items-center justify-center gap-2 transition-all duration-300 ${
            type === 'BUY'
              ? `bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white ${submitted ? 'shadow-[0_0_32px_rgba(16,185,129,0.55)]' : 'shadow-[0_0_18px_rgba(16,185,129,0.22)]'}`
              : `bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white ${submitted ? 'shadow-[0_0_32px_rgba(225,29,72,0.55)]' : 'shadow-[0_0_18px_rgba(244,63,94,0.22)]'}`
          } disabled:opacity-60 disabled:cursor-not-allowed`}
        >
          {loading ? (
            <>
              <ShoppingCart size={14} />
              Sending Order...
            </>
          ) : submitted ? (
            <motion.span
              initial={{ opacity: 0, scale: shouldReduce ? 1 : 0.82 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center gap-2"
            >
              <CheckCircle size={14} />
              Order Placed
            </motion.span>
          ) : (
            <>
              <ShoppingCart size={14} />
              Place {type} Order
            </>
          )}
        </motion.button>
      </form>
    </motion.div>
  )
}
