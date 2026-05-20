import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { LineChart, Zap } from 'lucide-react'
import PriceCard    from '../components/trading/PriceCard'
import OrderForm    from '../components/trading/OrderForm'
import TradingPanel from '../components/trading/TradingPanel'
import TradeHistory from '../components/trading/TradeHistory'
import { getAllPrices } from '../services/marketService'
import { createTrade, getTradeHistory } from '../services/tradingService'

const fadeUp  = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0.16, 1, 0.3, 1] } } }
const stagger = { visible: { transition: { staggerChildren: 0.08 } } }
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
  price: Number(asset.price),
  change: Number(asset.change24h ?? asset.changePercent ?? 0),
})

const getTradeErrorMessage = (error) => {
  if (error?.status === 401) return 'Your session has expired. Please log in again.'
  if (error?.message) return error.message
  return 'Unable to place order right now.'
}

export default function Trading() {
  const [selectedSymbol, setSelectedSymbol] = useState('BTC')
  const [assets, setAssets] = useState([])
  const [trades, setTrades] = useState([])
  const [pricesLoading, setPricesLoading] = useState(true)
  const [historyLoading, setHistoryLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [tradeMessage, setTradeMessage] = useState('')
  const [tradeError, setTradeError] = useState('')

  const loadPrices = useCallback(async () => {
    setPricesLoading(true)

    try {
      const response = await getAllPrices()
      const data = getResponseData(response)
      const nextAssets = Array.isArray(data)
        ? data.map(normalizeAsset).filter((asset) => asset.symbol && Number.isFinite(asset.price) && asset.price > 0)
        : []

      setAssets(nextAssets)
      if (nextAssets.length > 0) {
        setSelectedSymbol((current) => (
          nextAssets.some((asset) => asset.symbol === current) ? current : nextAssets[0].symbol
        ))
      }
    } catch (err) {
      console.error('Trading prices load failed:', err)
    } finally {
      setPricesLoading(false)
    }
  }, [])

  const loadTradeHistory = useCallback(async () => {
    setHistoryLoading(true)

    try {
      const response = await getTradeHistory()
      const data = getResponseData(response)
      setTrades(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Trade history load failed:', err)
      setTrades([])
    } finally {
      setHistoryLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadPrices()
      loadTradeHistory()
    }, 0)

    return () => window.clearTimeout(timer)
  }, [loadPrices, loadTradeHistory])

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

      setTradeMessage(data.message || `${normalizedType} order placed.`)
      await loadTradeHistory()
      await loadPrices()
      return true
    } catch (err) {
      setTradeError(getTradeErrorMessage(err))
      return false
    } finally {
      setSubmitting(false)
    }
  }, [loadPrices, loadTradeHistory])

  const priceMap = useMemo(() => Object.fromEntries(assets.map((asset) => [asset.symbol, asset])), [assets])
  const symbols = useMemo(() => assets.map((asset) => asset.symbol), [assets])

  const currentAsset = assets.find((p) => p.symbol === selectedSymbol) || assets[0] || {
    symbol: selectedSymbol,
    name: selectedSymbol,
    price: 0,
    change: 0,
  }

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
        </div>
        <span className="hidden sm:inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/22 text-emerald-400 text-[10px] font-black px-3 py-1.5 rounded-full shadow-[0_0_12px_rgba(16,185,129,0.10)] tracking-wider">
          <Zap size={10} />
          BACKEND
        </span>
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
          <motion.div variants={fadeUp} className="col-span-full bg-[#0a1628]/88 border border-white/[0.07] rounded-2xl p-5 text-xs text-slate-600 font-semibold">
            Market prices are unavailable right now.
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
            type="BUY"
          />
          <TradeHistory trades={trades} loading={historyLoading} />
        </motion.div>
        <motion.div variants={fadeUp}>
          <OrderForm
            key={selectedSymbol}
            prices={priceMap}
            symbols={symbols}
            selectedSymbol={selectedSymbol}
            onTrade={handleTrade}
            loading={submitting}
            successMessage={tradeMessage}
            errorMessage={tradeError}
          />
        </motion.div>
      </motion.div>
    </div>
  )
}
