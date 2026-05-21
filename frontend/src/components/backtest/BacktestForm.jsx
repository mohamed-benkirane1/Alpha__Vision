import { useMemo, useState } from 'react'
import { Play, FlaskConical, ChevronDown } from 'lucide-react'
import { motion } from 'framer-motion'

const STRATEGIES = [
  { value: 'rsi', label: 'RSI Strategy', desc: 'Buys on RSI < 30, sells on RSI > 70. Simple momentum oscillator.' },
  { value: 'macd', label: 'MACD Crossover', desc: 'Signal line crossover using 12/26/9 EMA configuration.' },
  { value: 'bollinger', label: 'Bollinger Bands', desc: 'Mean-reversion strategy trading band breakouts and squeezes.' },
  { value: 'multi', label: 'Multi-Indicator', desc: 'Combines RSI + Bollinger Bands for higher-confidence signals.' },
]

const fieldCls = 'w-full bg-[#060D1C]/80 border border-white/[0.09] text-white text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-rose-500/50 focus:shadow-[0_0_14px_rgba(225,29,72,0.12)] transition-all duration-200 appearance-none'

export default function BacktestForm({
  onRun,
  loading,
  error,
  supportedSymbols = [],
  supportedStrategies = [],
  historicalProvider = null,
}) {
  const symbols = useMemo(
    () => (Array.isArray(supportedSymbols) ? supportedSymbols.filter(Boolean) : []),
    [supportedSymbols],
  )
  const strategies = useMemo(() => {
    if (!Array.isArray(supportedStrategies) || supportedStrategies.length === 0) return STRATEGIES
    return STRATEGIES.filter((strategyOption) => supportedStrategies.includes(strategyOption.value))
  }, [supportedStrategies])
  const [symbol, setSymbol] = useState('')
  const [strategy, setStrategy] = useState('rsi')
  const [capital, setCapital] = useState('10000')
  const [localError, setLocalError] = useState(null)
  const selectedSymbol = symbols.includes(symbol) ? symbol : symbols[0] || ''
  const selectedStrategy = strategies.some((strategyOption) => strategyOption.value === strategy)
    ? strategy
    : strategies[0]?.value || ''

  const handleSubmit = (e) => {
    e.preventDefault()
    const cap = Number(capital)

    if (!selectedSymbol || !symbols.includes(selectedSymbol)) {
      setLocalError('Choose a backend-supported historical symbol before running a backtest.')
      return
    }

    if (!Number.isFinite(cap) || cap <= 0) {
      setLocalError('Initial capital must be positive.')
      return
    }

    setLocalError(null)
    onRun({ symbol: selectedSymbol, strategy: selectedStrategy, capital: cap })
  }

  return (
    <motion.div
      whileHover={{ borderColor: 'rgba(225,29,72,0.12)' }}
      className="bg-[#0a1628]/88 border border-white/[0.07] rounded-2xl p-5 backdrop-blur-2xl shadow-[0_4px_28px_rgba(0,0,0,0.32)] transition-all duration-300"
    >
      <div className="flex items-center gap-2 mb-5">
        <FlaskConical size={13} className="text-rose-400" />
        <h2 className="text-sm font-bold text-white">Strategy Configuration</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[10px] font-black text-slate-600 mb-1.5 tracking-[0.1em] uppercase">Asset</label>
          <div className="relative">
            <select value={selectedSymbol} onChange={(e) => setSymbol(e.target.value)} className={`${fieldCls} pr-9 cursor-pointer`} style={{ backgroundImage: 'none' }}>
              {symbols.length === 0 && <option value="" className="bg-[#0a1628]">Loading supported symbols...</option>}
              {symbols.map((s) => <option key={s} value={s} className="bg-[#0a1628]">{s}</option>)}
            </select>
            <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-black text-slate-600 mb-1.5 tracking-[0.1em] uppercase">Strategy</label>
          <div className="relative">
            <select value={selectedStrategy} onChange={(e) => setStrategy(e.target.value)} className={`${fieldCls} pr-9 cursor-pointer`} style={{ backgroundImage: 'none' }}>
              {strategies.map((s) => <option key={s.value} value={s.value} className="bg-[#0a1628]">{s.label}</option>)}
            </select>
            <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" />
          </div>
          <p className="text-[11px] text-slate-600 mt-1.5 leading-relaxed font-medium">
            {strategies.find((s) => s.value === selectedStrategy)?.desc}
            {historicalProvider && ` Historical data provider: ${historicalProvider}.`}
          </p>
        </div>

        <div>
          <label className="block text-[10px] font-black text-slate-600 mb-1.5 tracking-[0.1em] uppercase">Initial Capital ($)</label>
          <input
            type="number"
            min="1"
            value={capital}
            onChange={(e) => setCapital(e.target.value)}
            placeholder="10000"
            className={fieldCls}
          />
        </div>

        {(localError || error) && (
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/8 px-3 py-2 text-xs font-semibold text-amber-300">
            {localError || error}
          </div>
        )}

        <motion.button
          type="submit"
          disabled={loading || symbols.length === 0}
          whileHover={{ scale: loading || symbols.length === 0 ? 1 : 1.01 }}
          whileTap={{ scale: loading || symbols.length === 0 ? 1 : 0.98 }}
          className="ripple-btn w-full py-3 bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 disabled:opacity-55 text-white text-sm font-black rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-[0_0_18px_rgba(225,29,72,0.28)]"
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Running...
            </>
          ) : symbols.length === 0 ? (
            <>Loading symbols...</>
          ) : (
            <><Play size={13} /> Run Backtest</>
          )}
        </motion.button>
      </form>
    </motion.div>
  )
}
