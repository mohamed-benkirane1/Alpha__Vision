import { useState } from 'react'
import BacktestForm from '../components/backtest/BacktestForm'
import BacktestResults from '../components/backtest/BacktestResults'
import BacktestChart from '../components/backtest/BacktestChart'

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

function Backtesting() {
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
        wins:  base.wins,
        losses: base.losses,
      })
      setEquityCurve(generateEquityCurve(capital, base.returnPct))
      setLastConfig({ symbol, strategy, capital })
      setLoading(false)
    }, 1500)
  }

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-7xl mx-auto">
      <div>
        <h1 className="text-lg font-bold text-white">Backtesting</h1>
        <p className="text-xs text-gray-500 mt-0.5">Simulate your strategy on 30 days of historical data</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div>
          <BacktestForm onRun={handleRun} loading={loading} />
        </div>

        <div className="lg:col-span-2 space-y-5">
          {results && lastConfig ? (
            <>
              <BacktestResults
                results={results}
                symbol={lastConfig.symbol}
                strategy={lastConfig.strategy}
              />
              <BacktestChart data={equityCurve} initialCapital={lastConfig.capital} />
            </>
          ) : (
            <div className="bg-gray-900/50 border border-gray-800/60 rounded-xl p-10 backdrop-blur-sm flex flex-col items-center justify-center text-center h-full min-h-[260px]">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.5l5-5 4 4 5-7 4 4" />
                </svg>
              </div>
              <p className="text-sm text-gray-400 font-medium">No backtest run yet</p>
              <p className="text-xs text-gray-600 mt-1">Configure and run a strategy to see results.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Backtesting
