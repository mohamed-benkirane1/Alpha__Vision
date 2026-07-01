import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { RefreshCw, Wallet } from 'lucide-react'

import PriceCard    from '../components/trading/PriceCard'
import OrderForm    from '../components/trading/OrderForm'
import TradingChart from '../components/trading/TradingChart'
import TradingPanel from '../components/trading/TradingPanel'
import TradeHistory from '../components/trading/TradeHistory'

import { Card, Badge } from '../components/ui'
import { getAllPrices }              from '../services/marketService'
import { addDemoFunds, getPaymentStatus } from '../services/paymentService'
import { getPortfolio }              from '../services/portfolioService'
import { createTrade, getTradeHistory } from '../services/tradingService'
import { useAuth }                   from '../context/useAuth'
import { getValidNumber, formatCurrency } from '../utils/formatters'
import { getErrorMessage } from '../utils/errorMessage'

const fadeUp  = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0.16, 1, 0.3, 1] } } }
const stagger = { visible: { transition: { staggerChildren: 0.08 } } }
const MOBILE_TABS = [
  { id: 'chart', label: 'Graphique' },
  { id: 'order', label: 'Passer un ordre' },
]
const AUTO_REFRESH_MS         = 15000
const PAPER_DEMO_FUNDING_AMOUNT = 10000
const assetNames = {
  BTC:'Bitcoin', ETH:'Ethereum', SOL:'Solana', XAU:'Gold', XAG:'Silver',
  AAPL:'Apple', TSLA:'Tesla', NVDA:'Nvidia', MSFT:'Microsoft', GOOGL:'Alphabet',
  IXIC:'NASDAQ', SPX:'S&P 500', DJI:'Dow Jones',
}

const getResponseData    = (r) => r?.data ?? r
const normalizeAsset     = (asset) => ({
  symbol: asset.symbol,
  name: asset.name || assetNames[asset.symbol] || asset.symbol,
  type: asset.type || 'unknown',
  price: getValidNumber(asset.price),
  change: getValidNumber(asset.change24h ?? asset.changePercent) ?? 0,
  source: asset.source || null, provider: asset.provider || null,
  providerSymbol: asset.providerSymbol || null,
  timestamp: asset.timestamp || null, fetchedAt: asset.fetchedAt || asset.timestamp || null,
  cached: asset.cached === true, fallback: asset.fallback === true,
  stale: asset.stale === true,
  isStale: asset.isStale === true || asset.stale === true || asset.fallback === true || asset.priceAvailable !== true,
  isLive: asset.isLive === true,
  priceAvailable: asset.priceAvailable === true && getValidNumber(asset.price) !== null,
  error: getErrorMessage(asset.error) || null,
})
const getTradeErrorMessage = (error) => {
  if (error?.status === 401) return 'Session expirée. Reconnectez-vous.'
  const message = getErrorMessage(error)
  if (message.toLowerCase().includes('insufficient balance'))
    return 'Solde virtuel insuffisant. Ajoutez des fonds démo.'
  return message || 'Impossible de placer l\'ordre.'
}

export default function Trading() {
  const { refreshUser } = useAuth()
  const [selectedSymbol,    setSelectedSymbol]    = useState('BTC')
  const [orderType,         setOrderType]         = useState('BUY')
  const [assets,            setAssets]            = useState([])
  const [trades,            setTrades]            = useState([])
  const [balance,           setBalance]           = useState(null)
  const [pricesLoading,     setPricesLoading]     = useState(true)
  const [historyLoading,    setHistoryLoading]    = useState(true)
  const [balanceLoading,    setBalanceLoading]    = useState(true)
  const [refreshing,        setRefreshing]        = useState(false)
  const [marketError,       setMarketError]       = useState('')
  const [historyError,      setHistoryError]      = useState('')
  const [submitting,        setSubmitting]        = useState(false)
  const [tradeMessage,      setTradeMessage]      = useState('')
  const [tradeError,        setTradeError]        = useState('')
  const [lastExecution,     setLastExecution]     = useState(null)
  const [lastPriceStatus,   setLastPriceStatus]   = useState(null)
  const [demoFundingEnabled, setDemoFundingEnabled] = useState(false)
  const [fundingLoading,    setFundingLoading]    = useState(false)
  const [fundingMessage,    setFundingMessage]    = useState('')
  const pricesLoadingRef  = useRef(false)
  const priceErrorCountRef = useRef(0)

  const loadPrices = useCallback(async () => {
    if (pricesLoadingRef.current) return
    pricesLoadingRef.current = true
    setPricesLoading(true)
    try {
      const response = await getAllPrices()
      const data  = getResponseData(response)
      const quotes = Array.isArray(data?.quotes) ? data.quotes : data
      const nextAssets = Array.isArray(quotes) ? quotes.map(normalizeAsset).filter((a) => a.symbol) : []
      setAssets(nextAssets)
      priceErrorCountRef.current = 0
      setMarketError('')
      if (nextAssets.length > 0)
        setSelectedSymbol((cur) => nextAssets.some((a) => a.symbol === cur) ? cur : nextAssets[0].symbol)
    } catch {
      priceErrorCountRef.current += 1
      setMarketError('Impossible de charger les prix.')
    } finally { pricesLoadingRef.current = false; setPricesLoading(false) }
  }, [])

  const loadTradeHistory = useCallback(async () => {
    setHistoryLoading(true)
    try {
      const response = await getTradeHistory()
      const data = getResponseData(response)
      setTrades(Array.isArray(data) ? data : [])
      setHistoryError('')
    } catch { setHistoryError('Impossible de charger l\'historique.') }
    finally { setHistoryLoading(false) }
  }, [])

  const loadBalance = useCallback(async () => {
    setBalanceLoading(true)
    try {
      const [portfolioResult, paymentStatusResult] = await Promise.allSettled([getPortfolio(), getPaymentStatus()])
      const portfolioData  = portfolioResult.status === 'fulfilled' ? getResponseData(portfolioResult.value) : null
      const paymentStatus  = paymentStatusResult.status === 'fulfilled' ? paymentStatusResult.value : null
      setBalance(getValidNumber(portfolioData?.balance) ?? getValidNumber(paymentStatus?.balance))
      setDemoFundingEnabled(paymentStatus?.demoFundingEnabled === true)
    } catch { setBalance(null) }
    finally { setBalanceLoading(false) }
  }, [])

  const handleDemoFunding = useCallback(async () => {
    if (fundingLoading) return
    setFundingLoading(true); setFundingMessage(''); setTradeError('')
    try {
      const response = await addDemoFunds(PAPER_DEMO_FUNDING_AMOUNT)
      if (!response.success) { setTradeError(getErrorMessage(response.error || response.message || 'Erreur.')); return }
      const nextBalance = getValidNumber(response.balance)
      if (nextBalance !== null) setBalance(nextBalance)
      const msg = `${response.message || 'Fonds démo ajoutés'}. Solde : ${formatCurrency(nextBalance)}.`
      setFundingMessage(msg); setTradeMessage(msg)
      await Promise.all([loadBalance(), refreshUser?.()])
    } catch (err) { setTradeError(getErrorMessage(err) || 'Impossible d\'ajouter des fonds.') }
    finally { setFundingLoading(false) }
  }, [fundingLoading, loadBalance, refreshUser])

  const refreshTrading = useCallback(async () => {
    setRefreshing(true); setTradeMessage(''); setTradeError(''); setLastExecution(null); setLastPriceStatus(null)
    try { await Promise.all([loadPrices(), loadTradeHistory(), loadBalance()]) }
    finally { setRefreshing(false) }
  }, [loadBalance, loadPrices, loadTradeHistory])

  useEffect(() => {
    const timer = window.setTimeout(() => refreshTrading(), 0)
    return () => window.clearTimeout(timer)
  }, [refreshTrading])

  const handleTrade = useCallback(async ({ type, symbol, qty }) => {
    const quantity = Number(qty)
    const normalizedType   = typeof type === 'string' ? type.trim().toUpperCase() : ''
    const normalizedSymbol = typeof symbol === 'string' ? symbol.trim().toUpperCase() : ''
    setTradeMessage(''); setTradeError('')
    if (!normalizedSymbol) { setTradeError('Symbole requis.'); return false }
    if (!Number.isFinite(quantity) || quantity <= 0) { setTradeError('Quantité invalide.'); return false }
    setSubmitting(true)
    try {
      const response = await createTrade({ symbol: normalizedSymbol, type: normalizedType, quantity, orderType: 'market' })
      const data = getResponseData(response)
      if (!data?.success) throw new Error(data?.message || 'Ordre rejeté.')
      const nextBalance = getValidNumber(data.balance)
      if (nextBalance !== null) setBalance(nextBalance)
      setLastExecution(data.execution || null)
      const warnings = Array.isArray(data.warnings) && data.warnings.length > 0 ? ` ${data.warnings.join(' ')}` : ''
      setTradeMessage(`${data.message || `Ordre ${normalizedType} exécuté.`}${warnings}`)
      await Promise.all([loadTradeHistory(), loadPrices(), loadBalance()])
      return true
    } catch (err) {
      const normalized = err?.normalized
      setLastPriceStatus(normalized?.priceStatus || err?.priceStatus || null)
      setTradeError(getErrorMessage(normalized?.message) || getTradeErrorMessage(err))
      return false
    } finally { setSubmitting(false) }
  }, [loadBalance, loadPrices, loadTradeHistory])

  useEffect(() => {
    let intervalId
    const scheduleNext = () => {
      const backoffMs = priceErrorCountRef.current === 0
        ? AUTO_REFRESH_MS
        : priceErrorCountRef.current === 1
          ? AUTO_REFRESH_MS * 2
          : Math.min(AUTO_REFRESH_MS * 4, 120_000)
      intervalId = window.setTimeout(async () => {
        await loadPrices()
        scheduleNext()
      }, backoffMs)
    }
    scheduleNext()
    return () => window.clearTimeout(intervalId)
  }, [loadPrices])

  const [mobileTab, setMobileTab] = useState('chart')

  const priceMap   = useMemo(() => Object.fromEntries(assets.map((a) => [a.symbol, a])), [assets])
  const symbols    = useMemo(() => assets.map((a) => a.symbol), [assets])
  const currentAsset = assets.find((p) => p.symbol === selectedSymbol) || assets[0] || {
    symbol: selectedSymbol, name: selectedSymbol, price: null, change: 0, priceAvailable: false,
  }
  const selectedQuoteBlocked = currentAsset.priceAvailable !== true || currentAsset.price === null || currentAsset.fallback || currentAsset.stale || currentAsset.isStale
  const selectedQuoteWarning = currentAsset.priceAvailable !== true || currentAsset.price === null
    ? currentAsset.error || 'Quote indisponible.'
    : currentAsset.fallback ? 'Quote fallback — exécution bloquée.'
    : currentAsset.stale || currentAsset.isStale ? 'Quote obsolète — exécution bloquée.' : ''
  const balanceLabel = balanceLoading ? 'Chargement...' : formatCurrency(balance)
  const busy         = pricesLoading || historyLoading || balanceLoading || refreshing
  const zeroBalance  = !balanceLoading && getValidNumber(balance) === 0

  return (
    <div className="space-y-6">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <motion.div initial="hidden" animate="visible" variants={fadeUp}
        className="flex items-center justify-between">
        <div>
          <p className="text-label uppercase tracking-wider text-white/40 mb-1">Trading</p>
          <h1 className="text-display-sm font-black text-white">Marché en Direct</h1>
          <p className="text-body text-white/40">Analysez le marché et placez des ordres virtuels de paper trading</p>
          <p className="text-label text-white/30 mt-1 font-mono tabular-nums">
            Solde virtuel : <span className="text-white/55">{balanceLabel}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="success" size="sm" dot>PAPER</Badge>
          <button
            type="button" onClick={refreshTrading} disabled={busy || submitting}
            className="w-8 h-8 rounded-xl border border-white/[0.07] bg-white/[0.03] text-white/40 hover:text-white hover:border-rose-500/20 disabled:opacity-50 transition-all flex items-center justify-center"
            title="Actualiser"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin text-rose-400' : ''} />
          </button>
        </div>
      </motion.div>

      {/* ── Balance zéro ────────────────────────────────────────────────── */}
      {zeroBalance && (
        <motion.div initial="hidden" animate="visible" variants={fadeUp}>
          <div className="flex flex-col gap-3 rounded-card border border-amber-500/18 bg-amber-500/[0.06] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-2">
              <Wallet size={15} className="mt-0.5 shrink-0 text-amber-300" />
              <div>
                <p className="text-body-sm font-black text-amber-300">Solde de trading à 0.</p>
                <p className="text-label text-white/35">Les fonds démo sont virtuels — aucun vrai paiement.</p>
                {fundingMessage && <p className="mt-1 text-label text-emerald-300 font-semibold">{fundingMessage}</p>}
              </div>
            </div>
            {demoFundingEnabled ? (
              <button
                type="button" onClick={handleDemoFunding} disabled={fundingLoading || busy || submitting}
                className="shrink-0 rounded-xl border border-amber-500/24 bg-amber-500/12 px-3 py-2 text-label font-black text-amber-300 transition hover:bg-amber-500/18 disabled:opacity-50"
              >
                {fundingLoading ? 'Ajout...' : `Ajouter ${formatCurrency(PAPER_DEMO_FUNDING_AMOUNT)}`}
              </button>
            ) : (
              <p className="text-label text-white/25 font-semibold">Fonds démo désactivés.</p>
            )}
          </div>
        </motion.div>
      )}

      {/* ── Asset cards ─────────────────────────────────────────────────── */}
      <motion.div initial="hidden" animate="visible" variants={stagger}
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        {assets.map((asset) => (
          <motion.div key={asset.symbol} variants={fadeUp}>
            <PriceCard {...asset} selected={selectedSymbol === asset.symbol} onSelect={setSelectedSymbol} />
          </motion.div>
        ))}
        {!pricesLoading && assets.length === 0 && (
          <motion.div variants={fadeUp}>
            <Card padding="md" className="col-span-full">
              <div className="flex items-center justify-between gap-3">
                <span className="text-body-sm text-white/40 font-semibold">{marketError || 'Prix indisponibles.'}</span>
                {marketError && (
                  <button type="button" onClick={loadPrices} className="text-caption text-rose-400 font-black hover:text-rose-300">Réessayer</button>
                )}
              </div>
            </Card>
          </motion.div>
        )}
        {marketError && assets.length > 0 && (
          <motion.div variants={fadeUp} className="col-span-full">
            <div className="flex items-center justify-between gap-3 text-label text-amber-400/70 font-semibold">
              <span>{marketError}</span>
              <button type="button" onClick={loadPrices} className="text-caption text-rose-400 font-black hover:text-rose-300">Réessayer</button>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* ── Mobile tabs (lg:hidden) ──────────────────────────────────────── */}
      <div className="flex lg:hidden border-b border-white/[0.07]">
        {MOBILE_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setMobileTab(tab.id)}
            className={`flex-1 py-3 text-body-sm font-medium transition-colors ${
              mobileTab === tab.id
                ? 'text-white border-b-2 border-rose-500'
                : 'text-white/40 hover:text-white/70'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Main grid ────────────────────────────────────────────────────── */}
      <motion.div initial="hidden" animate="visible" variants={stagger}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Chart + Panel + History — masqué sur mobile si tab 'order' */}
        <motion.div
          variants={fadeUp}
          className={`lg:col-span-2 space-y-4 ${mobileTab === 'order' ? 'hidden lg:block' : ''}`}
        >
          <Card padding="none" className="overflow-hidden">
            <TradingChart symbol={currentAsset.symbol} quote={currentAsset} />
          </Card>
          <TradingPanel symbol={currentAsset.symbol} price={currentAsset.price} type={orderType} quote={currentAsset} />
          <TradeHistory trades={trades} loading={historyLoading} error={historyError} onRetry={loadTradeHistory} />
        </motion.div>

        {/* OrderForm — masqué sur mobile si tab 'chart' */}
        <motion.div
          variants={fadeUp}
          className={mobileTab === 'chart' ? 'hidden lg:block' : ''}
        >
          <Card padding="none">
            <OrderForm
              key={selectedSymbol}
              prices={priceMap} symbols={symbols}
              selectedSymbol={selectedSymbol} onSymbolChange={setSelectedSymbol}
              selectedQuote={currentAsset}
              selectedType={orderType} onTypeChange={setOrderType}
              onTrade={handleTrade} loading={submitting}
              successMessage={tradeMessage} errorMessage={tradeError}
              blockingMessage={selectedQuoteBlocked ? selectedQuoteWarning : ''}
              lastExecution={lastExecution} lastPriceStatus={lastPriceStatus}
            />
          </Card>
        </motion.div>
      </motion.div>
    </div>
  )
}
