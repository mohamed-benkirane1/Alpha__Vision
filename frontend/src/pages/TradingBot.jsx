import { useState, useRef } from 'react'
import BotControlPanel from '../components/bot/BotControlPanel'
import BotStatusCard from '../components/bot/BotStatusCard'
import BotHistory from '../components/bot/BotHistory'

const SIGNALS   = ['BUY', 'SELL', 'HOLD']
const WEIGHTS   = [0.4, 0.3, 0.3]

function pickSignal() {
  const r = Math.random()
  let acc = 0
  for (let i = 0; i < SIGNALS.length; i++) {
    acc += WEIGHTS[i]
    if (r < acc) return SIGNALS[i]
  }
  return 'HOLD'
}

const DEFAULT_BOT = {
  running: false, symbol: null, strategy: null,
  trades: 0, profit: 0, lastSignal: null, confidence: null,
}

function TradingBot() {
  const [bot, setBot]               = useState(DEFAULT_BOT)
  const [signalHistory, setHistory] = useState([])
  const intervalRef                 = useRef(null)

  function handleStart(symbol, strategy) {
    setBot((prev) => ({ ...prev, running: true, symbol, strategy }))

    intervalRef.current = setInterval(() => {
      const signal     = pickSignal()
      const confidence = Math.floor(Math.random() * 30) + 60
      const time       = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      const profitDelta = signal === 'BUY' ? +(Math.random() * 12).toFixed(2)
                       : signal === 'SELL' ? -(Math.random() * 8).toFixed(2)
                       : 0

      setBot((prev) => ({
        ...prev,
        lastSignal: signal,
        confidence,
        trades:  prev.trades + (signal !== 'HOLD' ? 1 : 0),
        profit:  +((prev.profit || 0) + profitDelta).toFixed(2),
      }))

      setHistory((prev) => [
        { time, symbol, strategy, signal, confidence },
        ...prev.slice(0, 49),
      ])
    }, 4000)
  }

  function handleStop() {
    clearInterval(intervalRef.current)
    setBot((prev) => ({ ...prev, running: false }))
  }

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-7xl mx-auto">
      <div>
        <h1 className="text-lg font-bold text-white">Trading Bot</h1>
        <p className="text-xs text-gray-500 mt-0.5">Automated signal generation — a new signal fires every 4 seconds</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="space-y-5">
          <BotControlPanel
            running={bot.running}
            onStart={handleStart}
            onStop={handleStop}
          />
          <BotStatusCard bot={bot} />
        </div>

        <div className="lg:col-span-2">
          <BotHistory signals={signalHistory} />
        </div>
      </div>
    </div>
  )
}

export default TradingBot
