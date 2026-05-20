import { useState, useEffect } from 'react'
import { ShoppingCart, ChevronDown, CheckCircle } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'

const fieldCls = 'w-full bg-[#060D1C]/80 border border-white/[0.09] text-white text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-rose-500/50 focus:shadow-[0_0_14px_rgba(225,29,72,0.12)] transition-all duration-200 placeholder-slate-700 appearance-none'

const getValidNumber = (value) => {
  if (value === null || value === undefined || value === '') return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

const formatCurrency = (value) => {
  const number = getValidNumber(value)
  if (number === null) return '--'
  return `$${number.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const formatDateTime = (value) => {
  if (!value) return '--'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '--'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export default function OrderForm({
  prices,
  symbols = [],
  selectedSymbol,
  selectedQuote,
  selectedType = 'BUY',
  onTypeChange,
  onTrade,
  loading = false,
  successMessage = '',
  errorMessage = '',
  blockingMessage = '',
  lastExecution = null,
  lastPriceStatus = null,
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

  const quote = selectedQuote?.symbol === symbol ? selectedQuote : prices[symbol]
  const price = getValidNumber(quote?.price)
  const hasPrice = price !== null && price > 0 && quote?.priceAvailable !== false
  const quoteBlocked = !hasPrice || quote?.fallback === true || quote?.stale === true
  const quoteBlockMessage = blockingMessage || (!hasPrice
    ? 'Selected price is unavailable. This symbol cannot be traded right now.'
    : quote?.fallback
      ? 'Selected quote is fallback. Backend will reject execution.'
      : quote?.stale
        ? 'Selected quote is stale. Backend will reject execution.'
        : '')
  const quantity  = Number(qty)
  const estimated = Number.isFinite(quantity) && quantity > 0 && hasPrice ? quantity * price : 0

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (loading) return
    if (!qty || !Number.isFinite(quantity) || quantity <= 0) {
      setQuantityError('Quantity must be a positive number.')
      return
    }
    if (quoteBlocked) {
      setQuantityError(quoteBlockMessage)
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
            <span className={`font-black tabular-nums ${hasPrice ? 'text-white' : 'text-amber-400/80'}`}>{hasPrice ? formatCurrency(price) : 'Unavailable'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600 font-medium">Estimated Value</span>
            <span className={`font-black tabular-nums ${estimated > 0 ? 'text-rose-400' : 'text-slate-700'}`}>
              {formatCurrency(estimated)}
            </span>
          </div>
          <p className="text-[10px] text-slate-700 font-medium">
            Estimated price. Final execution price is confirmed by backend.
          </p>
          <div className="text-[10px] text-slate-700 font-medium">
            Source <span className="text-slate-500">{quote?.source || '--'}</span> · Provider <span className="text-slate-500">{quote?.provider || '--'}</span>
          </div>
        </div>

        {quoteBlockMessage && (
          <p className="text-[11px] text-amber-400/85 font-semibold">{quoteBlockMessage}</p>
        )}

        {lastExecution && (
          <div className="bg-emerald-500/[0.06] border border-emerald-500/18 rounded-xl px-4 py-3 text-[11px] text-emerald-400/90 font-semibold space-y-1">
            <p className="font-black">Executed {lastExecution.action} {lastExecution.quantity} {lastExecution.symbol}</p>
            <p>Price {formatCurrency(lastExecution.executedPrice)} · Total {formatCurrency(lastExecution.total)}</p>
            <p className="text-slate-500">{lastExecution.priceProvider || lastExecution.priceSource || '--'} · {formatDateTime(lastExecution.priceTimestamp)}{lastExecution.priceCached ? ' · cached' : ''}</p>
          </div>
        )}

        {lastPriceStatus && (
          <div className="bg-amber-500/[0.06] border border-amber-500/18 rounded-xl px-4 py-3 text-[11px] text-amber-400/90 font-semibold space-y-1">
            <p className="font-black">Backend price check rejected {lastPriceStatus.symbol}</p>
            <p>{lastPriceStatus.provider || lastPriceStatus.source || '--'} · {formatDateTime(lastPriceStatus.timestamp)} · fallback {lastPriceStatus.fallback ? 'yes' : 'no'} · stale {lastPriceStatus.stale ? 'yes' : 'no'}</p>
            {lastPriceStatus.error && <p className="text-slate-500">{lastPriceStatus.error}</p>}
          </div>
        )}

        {(successMessage || errorMessage) && (
          <p className={`text-[11px] font-semibold ${errorMessage ? 'text-amber-400/85' : 'text-emerald-400/85'}`}>
            {errorMessage || successMessage}
          </p>
        )}

        <motion.button
          type="submit"
          disabled={loading || symbols.length === 0 || quoteBlocked}
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
