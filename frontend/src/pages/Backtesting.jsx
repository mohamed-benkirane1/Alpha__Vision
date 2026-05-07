import { useState } from 'react'
import { motion } from 'framer-motion'
import { FlaskConical } from 'lucide-react'
import BacktestForm    from '../components/backtest/BacktestForm'
import BacktestResults from '../components/backtest/BacktestResults'
import BacktestChart   from '../components/backtest/BacktestChart'

const STRATEGY_RESULTS = {
  rsi:       { returnPct: 18.2, winRate: 72, totalTrades: 48, wins: 35, losses: 13 },
  macd:      { returnPct: 14.3, winRate: 65, totalTrades: 61, wins: 40, losses: 21 },
  bollinger: { returnPct:  9.7, winRate: 58, totalTrades: 84, wins: 49, losses: 35 },
  multi:     { returnPct: 23.4, winRate: 76, totalTrades: 52, wins: 40, losses: 12 },
}

function generateEquityCurve(initialCapital, returnPct, days = 30) {
  const curve = []
  let value = initialCapital
  const dailyReturn = returnPct / 100 / days
  for (let i = 0; i <= days; i++) {
    const noise = (Math.sin(i * 0.8) * 0.012 + Math.sin(i * 1.7) * 0.007) * value
    value += value * dailyReturn + noise
    curve.push({ day: `D${i + 1}`, value: Math.round(value) })
  }
  return curve
}

const fadeUp = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0.16, 1, 0.3, 1] } } }

export default function Backtesting() {
  const [results, setResults]         = useState(null)
  const [equityCurve, setEquityCurve] = useState([])
  const [loading, setLoading]         = useState(false)
  const [lastConfig, setLastConfig]   = useState(null)

  function handleRun({ symbol, strategy, capital }) {
    setLoading(true)
    setResults(null)
    setEquityCurve([])

    setTimeout(() => {
      const base = STRATEGY_RESULTS[strategy] || STRATEGY_RESULTS.rsi
      const profit = capital * (base.returnPct / 100)
      const finalCapital = capital + profit

      setResults({
        finalCapital,
        profit,
        returnPct: base.returnPct,
        winRate:   base.winRate,
        totalTrades: base.totalTrades,
        wins:   base.wins,
        losses: base.losses,
      })
      setEquityCurve(generateEquityCurve(capital, base.returnPct))
      setLastConfig({ symbol, strategy, capital })
      setLoading(false)
    }, 1500)
  }

  return (
    <div className="space-y-5">

      <motion.div initial="hidden" animate="visible" variants={fadeUp}>
        <div className="flex items-center gap-2 mb-0.5">
          <FlaskConical size={16} className="text-indigo-400" />
          <h1 className="text-2xl font-black text-white">Backtesting</h1>
        </div>
        <p className="text-xs text-slate-500 font-medium">Simulate your strategy on 30 days of historical data</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <BacktestForm onRun={handleRun} loading={loading} />
        </motion.div>

        <div className="lg:col-span-2 space-y-3.5">
          {results && lastConfig ? (
            <>
              <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
                <BacktestResults
                  results={results}
                  symbol={lastConfig.symbol}
                  strategy={lastConfig.strategy}
                />
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <BacktestChart data={equityCurve} initialCapital={lastConfig.capital} />
              </motion.div>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-[#0a1628]/88 border border-white/[0.07] rounded-2xl p-10 backdrop-blur-2xl shadow-[0_4px_28px_rgba(0,0,0,0.28)] flex flex-col items-center justify-center text-center h-full min-h-[260px]"
            >
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.5l5-5 4 4 5-7 4 4" />
                </svg>
              </div>
              <p className="text-sm text-slate-500 font-bold">No backtest run yet</p>
              <p className="text-xs text-slate-700 mt-1 font-medium">Configure and run a strategy to see results.</p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
