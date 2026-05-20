import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { LineChart, RefreshCw, Zap } from 'lucide-react'
import PriceCard    from '../components/trading/PriceCard'
import OrderForm    from '../components/trading/OrderForm'
import TradingPanel from '../components/trading/TradingPanel'
import TradeHistory from '../components/trading/TradeHistory'
import { getAllPrices } from '../services/marketService'
import { getPortfolio } from '../services/portfolioService'
import { createTrade, getTradeHistory } from '../services/tradingService'

const fadeUp  = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0.16, 1, 0.3, 1] } } }
const stagger = { visible: { transition: { staggerChildren: 0.08 } } }
const AUTO_REFRESH_MS = 15000
const assetNames = {
  BTC: 'Bitcoin',
  ETH: 'Ethereum',
  SOL: 'Solana',
  XAU: 'Gold',
  XAG: 'Silver',
  AAPL: 'Apple',
  TSLA: 'Tesla',
  NVDA: 'Nvidia',
  MSFT: 'Microsoft',
  GOOGL: 'Alphabet',
  IXIC: 'NASDAQ',
  SPX: 'S&P 500',
  DJI: 'Dow Jones',
}

const getResponseData = (response) => response?.data ?? response

const normalizeAsset = (asset) => ({
  symbol: asset.symbol,
  name: asset.name || assetNames[asset.symbol] || asset.symbol,
  type: asset.type || 'unknown',
  price: getValidNumber(asset.price),
  change: getValidNumber(asset.change24h ?? asset.changePercent) ?? 0,
  source: asset.source || null,
  provider: asset.provider || null,
  timestamp: asset.timestamp || null,
  cached: asset.cached === true,
  fallback: asset.fallback === true,
  stale: asset.stale === true,
  priceAvailable: asset.priceAvailable === true && getValidNumber(asset.price) !== null,
  error: asset.error || null,
})

const getTradeErrorMessage = (error) => {
  if (error?.status === 401) return 'Your session has expired. Please log in again.'
  if (error?.message?.toLowerCase().includes('insufficient balance')) {
    return 'Insufficient balance. Add demo funds from Portfolio or deposit funds.'
  }
  if (error?.message) return error.message
  return 'Unable to place order right now.'
}

const getValidNumber = (value) => {
  if (value === null || value === undefined || value === '') return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

const formatCurrency = (value) => {
  const number = getValidNumber(value)
  if (number === null) return '--'

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(number)
}

export default function Trading() {
  const [selectedSymbol, setSelectedSymbol] = useState('BTC')
  const [orderType, setOrderType] = useState('BUY')
  const [assets, setAssets] = useState([])
  const [trades, setTrades] = useState([])
  const [balance, setBalance] = useState(null)
  const [pricesLoading, setPricesLoading] = useState(true)
  const [historyLoading, setHistoryLoading] = useState(true)
  const [balanceLoading, setBalanceLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [marketError, setMarketError] = useState('')
  const [historyError, setHistoryError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [tradeMessage, setTradeMessage] = useState('')
  const [tradeError, setTradeError] = useState('')
  const [lastExecution, setLastExecution] = useState(null)
  const [lastPriceStatus, setLastPriceStatus] = useState(null)
  const pricesLoadingRef = useRef(false)

  const loadPrices = useCallback(async () => {
    if (pricesLoadingRef.current) return
    pricesLoadingRef.current = true
    setPricesLoading(true)

    try {
      const response = await getAllPrices()
      const data = getResponseData(response)
      const quotes = Array.isArray(data?.quotes) ? data.quotes : data
      const nextAssets = Array.isArray(quotes)
        ? quotes.map(normalizeAsset).filter((asset) => asset.symbol)
        : []

      setAssets(nextAssets)
      setMarketError('')
      if (nextAssets.length > 0) {
        setSelectedSymbol((current) => (
          nextAssets.some((asset) => asset.symbol === current) ? current : nextAssets[0].symbol
        ))
      }
    } catch (err) {
      console.error('Trading prices load failed:', err)
      setMarketError('Unable to load market prices.')
    } finally {
      pricesLoadingRef.current = false
      setPricesLoading(false)
    }
  }, [])

  const loadTradeHistory = useCallback(async () => {
    setHistoryLoading(true)

    try {
      const response = await getTradeHistory()
      const data = getResponseData(response)
      setTrades(Array.isArray(data) ? data : [])
      setHistoryError('')
    } catch (err) {
      console.error('Trade history load failed:', err)
      setHistoryError('Unable to load trade history.')
    } finally {
      setHistoryLoading(false)
    }
  }, [])

  const loadBalance = useCallback(async () => {
    setBalanceLoading(true)

    try {
      const response = await getPortfolio()
      const data = getResponseData(response)
      const nextBalance = getValidNumber(data?.balance)
      setBalance(nextBalance)
    } catch (err) {
      console.error('Trading balance load failed:', err)
      setBalance(null)
    } finally {
      setBalanceLoading(false)
    }
  }, [])

  const refreshTrading = useCallback(async () => {
    setRefreshing(true)
    setTradeMessage('')
    setTradeError('')
    setLastExecution(null)
    setLastPriceStatus(null)

    try {
      await Promise.all([
        loadPrices(),
        loadTradeHistory(),
        loadBalance(),
      ])
    } finally {
      setRefreshing(false)
    }
  }, [loadBalance, loadPrices, loadTradeHistory])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      refreshTrading()
    }, 0)

    return () => window.clearTimeout(timer)
  }, [refreshTrading])

  const handleTrade = useCallback(async ({ type, symbol, qty }) => {
    const quantity = Number(qty)
    const normalizedType = typeof type === 'string' ? type.trim().toUpperCase() : ''
    const normalizedSymbol = typeof symbol === 'string' ? symbol.trim().toUpperCase() : ''

    setTradeMessage('')
    setTradeError('')

    if (!normalizedSymbol) {
      setTradeError('Symbol is required.')
      return false
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      setTradeError('Quantity must be a positive number.')
      return false
    }

    setSubmitting(true)

    try {
      const response = await createTrade({
        symbol: normalizedSymbol,
        type: normalizedType,
        quantity,
      })
      const data = getResponseData(response)

      if (!data?.success) {
        throw new Error(data?.message || 'Order rejected.')
      }

      const nextBalance = getValidNumber(data.balance)
      if (nextBalance !== null) setBalance(nextBalance)
      setLastExecution(data.execution || null)
      setTradeMessage(data.message || `${normalizedType} order placed.`)
      await Promise.all([
        loadTradeHistory(),
        loadPrices(),
        loadBalance(),
      ])
      return true
    } catch (err) {
      const normalized = err?.normalized
      setLastPriceStatus(normalized?.priceStatus || err?.priceStatus || null)
      setTradeError(normalized?.message || getTradeErrorMessage(err))
      return false
    } finally {
      setSubmitting(false)
    }
  }, [loadBalance, loadPrices, loadTradeHistory])

  const priceMap = useMemo(() => Object.fromEntries(assets.map((asset) => [asset.symbol, asset])), [assets])
  const symbols = useMemo(() => assets.map((asset) => asset.symbol), [assets])

  useEffect(() => {
    const interval = window.setInterval(() => {
      loadPrices()
    }, AUTO_REFRESH_MS)

    return () => window.clearInterval(interval)
  }, [loadPrices])

  const currentAsset = assets.find((p) => p.symbol === selectedSymbol) || assets[0] || {
    symbol: selectedSymbol,
    name: selectedSymbol,
    price: null,
    change: 0,
    priceAvailable: false,
  }
  const selectedQuoteBlocked = currentAsset.priceAvailable !== true || currentAsset.price === null || currentAsset.fallback || currentAsset.stale
  const selectedQuoteWarning = currentAsset.priceAvailable !== true || currentAsset.price === null
    ? currentAsset.error || 'Selected quote is unavailable.'
    : currentAsset.fallback
      ? 'Selected quote is fallback. Backend execution is blocked.'
      : currentAsset.stale
        ? 'Selected quote is stale. Backend execution is blocked.'
        : ''
  const balanceLabel = balanceLoading ? 'Loading...' : formatCurrency(balance)
  const busy = pricesLoading || historyLoading || balanceLoading || refreshing

  return (
    <div className="space-y-5">

      <motion.div initial="hidden" animate="visible" variants={fadeUp}
        className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <LineChart size={16} className="text-rose-400" />
            <h1 className="text-2xl font-black text-white">Trading</h1>
          </div>
          <p className="text-xs text-slate-500 font-medium">Place real demo orders backed by your account balance</p>
          <p className="text-[11px] text-slate-600 mt-1 font-bold tabular-nums">
            Cash balance <span className="text-slate-300">{balanceLabel}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/22 text-emerald-400 text-[10px] font-black px-3 py-1.5 rounded-full shadow-[0_0_12px_rgba(16,185,129,0.10)] tracking-wider">
            <Zap size={10} />
            BACKEND
          </span>
          <button
            type="button"
            onClick={refreshTrading}
            disabled={busy || submitting}
            className="h-9 w-9 rounded-xl border border-white/[0.07] bg-[#0a1628]/88 text-slate-500 hover:text-white hover:border-rose-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
            title="Refresh trading data"
            aria-label="Refresh trading data"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin text-rose-400' : ''} />
          </button>
        </div>
      </motion.div>

      {/* Asset cards */}
      <motion.div initial="hidden" animate="visible" variants={stagger}
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        {assets.map((asset) => (
          <motion.div key={asset.symbol} variants={fadeUp}>
            <PriceCard
              {...asset}
              selected={selectedSymbol === asset.symbol}
              onSelect={setSelectedSymbol}
            />
          </motion.div>
        ))}
        {!pricesLoading && assets.length === 0 && (
          <motion.div variants={fadeUp} className="col-span-full bg-[#0a1628]/88 border border-white/[0.07] rounded-2xl p-5 text-xs text-slate-600 font-semibold flex items-center justify-between gap-3">
            <span>{marketError || 'Market prices are unavailable right now.'}</span>
            {marketError && (
              <button
                type="button"
                onClick={loadPrices}
                className="shrink-0 text-[10px] text-rose-400 font-black hover:text-rose-300"
              >
                Retry
              </button>
            )}
          </motion.div>
        )}
        {marketError && assets.length > 0 && (
          <motion.div variants={fadeUp} className="col-span-full text-[11px] text-amber-400/80 font-semibold flex items-center justify-between gap-3">
            <span>{marketError}</span>
            <button type="button" onClick={loadPrices} className="text-[10px] text-rose-400 font-black hover:text-rose-300">Retry</button>
          </motion.div>
        )}
      </motion.div>

      {/* Main grid */}
      <motion.div initial="hidden" animate="visible" variants={stagger}
        className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
        <motion.div variants={fadeUp} className="lg:col-span-2 space-y-3.5">
          <TradingPanel
            symbol={currentAsset.symbol}
            price={currentAsset.price}
            type={orderType}
            quote={currentAsset}
          />
          <TradeHistory
            trades={trades}
            loading={historyLoading}
            error={historyError}
            onRetry={loadTradeHistory}
          />
        </motion.div>
        <motion.div variants={fadeUp}>
          <OrderForm
            key={selectedSymbol}
            prices={priceMap}
            symbols={symbols}
            selectedSymbol={selectedSymbol}
            selectedQuote={currentAsset}
            selectedType={orderType}
            onTypeChange={setOrderType}
            onTrade={handleTrade}
            loading={submitting}
            successMessage={tradeMessage}
            errorMessage={tradeError}
            blockingMessage={selectedQuoteBlocked ? selectedQuoteWarning : ''}
            lastExecution={lastExecution}
            lastPriceStatus={lastPriceStatus}
          />
        </motion.div>
      </motion.div>
    </div>
  )
}
