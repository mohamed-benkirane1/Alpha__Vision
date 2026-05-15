import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Cpu } from 'lucide-react'
import BotControlPanel from '../components/bot/BotControlPanel'
import BotStatusCard   from '../components/bot/BotStatusCard'
import BotHistory      from '../components/bot/BotHistory'

const SIGNALS = ['BUY', 'SELL', 'HOLD']
const WEIGHTS = [0.4, 0.3, 0.3]

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

const fadeUp = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0.16, 1, 0.3, 1] } } }

export default function TradingBot() {
  const [bot, setBot]               = useState(DEFAULT_BOT)
  const [signalHistory, setHistory] = useState([])
  const intervalRef                 = useRef(null)

  useEffect(() => () => clearInterval(intervalRef.current), [])

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
    <div className="space-y-5">

      <motion.div initial="hidden" animate="visible" variants={fadeUp}>
        <div className="flex items-center gap-2 mb-0.5">
          <Cpu size={16} className="text-rose-400" />
          <h1 className="text-2xl font-black text-white">Trading Bot</h1>
        </div>
        <p className="text-xs text-slate-500 font-medium">Automated signal generation — a new signal fires every 4 seconds</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="space-y-3.5"
        >
          <BotControlPanel running={bot.running} onStart={handleStart} onStop={handleStop} />
          <BotStatusCard bot={bot} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2"
        >
          <BotHistory signals={signalHistory} />
        </motion.div>
      </div>
    </div>
  )
}
