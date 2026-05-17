import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Bot, Zap } from 'lucide-react'

import ChatMessage        from '../components/chatbot/ChatMessage'
import ChatInput          from '../components/chatbot/ChatInput'
import SuggestionCard     from '../components/chatbot/SuggestionCard'
import MarketContextPanel from '../components/chatbot/MarketContextPanel'

const RESPONSES = {
  btc:
`Bitcoin (BTC) is currently trading at $67,432 with strong bullish momentum.

Technical indicators:
• RSI: 62 — not yet overbought, room to grow
• MACD: Bullish crossover confirmed
• Volume: Surge above 30-day average

Key levels:
• Support: $65,800
• Resistance: $69,000

Signal: STRONG BUY — Confidence 87%`,

  eth:
`Ethereum (ETH) is holding at $3,847 with moderate bullish sentiment. ETF inflows hit a record high this week.

Technical indicators:
• RSI: 58 — neutral-bullish
• On-chain activity: Increasing
• Staking yield: ~4.2% APY

Key levels:
• Support: $3,600
• Resistance: $4,100

Signal: BUY — Confidence 74%`,

  sol:
`Solana (SOL) shows the strongest momentum in the portfolio at +15% unrealized gain.

Technical indicators:
• RSI: 71 — slightly overbought, monitor closely
• Network activity: High despite congestion concerns
• Developer activity: Increasing

Key levels:
• Support: $165
• Resistance: $195

Signal: HOLD — Confidence 68%`,

  rsi:
`RSI (Relative Strength Index) measures momentum on a 0–100 scale.

Interpretation:
• Below 30 → Oversold → Potential BUY signal
• 30–70 → Neutral zone, trend-following
• Above 70 → Overbought → Potential SELL signal

Current values:
• BTC RSI: 62 → Bullish, room to grow
• ETH RSI: 58 → Neutral-Bullish
• SOL RSI: 71 → Slightly overbought

RSI works best combined with MACD and volume analysis for confirmation.`,

  portfolio:
`Your portfolio risk profile is Moderate-High based on current allocation.

Summary:
• BTC: 61.7% — High concentration risk
• Total unrealized P&L: +$2,455 (+10.8%)
• Win rate: 72.4% across 48 trades

Risk factors:
• Single-asset concentration (BTC) amplifies drawdowns
• Crypto-heavy → correlated during market downturns
• AAPL slightly underperforming (-2.8%)

Recommendation: Reduce BTC below 50% and add 1–2 uncorrelated assets (XAU, dividend stocks) to reduce max drawdown exposure.`,

  buy_eth:
`Based on current indicators, ETH presents a favorable entry opportunity.

Reasons to BUY:
✓ RSI at 58 — room to grow before overbought
✓ ETF inflows at record highs this week
✓ On-chain activity increasing steadily
✓ Support held firmly at $3,600

Risks to consider:
✗ Broader market correction could pull ETH down 10–15%
✗ SEC regulatory uncertainty remains

Verdict: Cautious BUY
Suggested approach: DCA (Dollar Cost Averaging) over 2–3 entries rather than a single position. Set stop-loss at $3,500.`,

  default:
`I'm Alpha Vision AI, your intelligent market assistant. I can help you with:

• Asset analysis (BTC, ETH, SOL, stocks, gold)
• Technical indicators (RSI, MACD, Bollinger Bands)
• Portfolio risk assessment
• Trading signals and recommendations
• Market trend interpretation

Try asking something like "Analyze BTC" or "What is my portfolio risk?" — I'll give you a detailed breakdown.`,
}

const getMockResponse = (text) => {
  const t = text.toLowerCase()
  if (t.includes('btc') || t.includes('bitcoin'))
    return t.includes('buy') ? RESPONSES.buy_eth.replace(/ETH/g, 'BTC') : RESPONSES.btc
  if (t.includes('eth') || t.includes('ethereum'))
    return t.includes('buy') ? RESPONSES.buy_eth : RESPONSES.eth
  if (t.includes('sol') || t.includes('solana'))     return RESPONSES.sol
  if (t.includes('rsi'))                             return RESPONSES.rsi
  if (t.includes('risk') || t.includes('portfolio')) return RESPONSES.portfolio
  return RESPONSES.default
}

const now = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

const INITIAL_MESSAGES = [
  {
    id: 1,
    role: 'ai',
    content: `Hello! I'm Alpha Vision AI, your intelligent trading assistant.\n\nI can analyze markets, explain technical indicators, assess portfolio risk, and provide real-time trading signals.\n\nHow can I help you today?`,
    timestamp: 'Just now',
  },
]

const SUGGESTIONS = [
  { label: 'Analyze BTC',       text: 'Analyze BTC'              },
  { label: 'Explain RSI',       text: 'Explain RSI signal'       },
  { label: 'Portfolio risk?',   text: 'What is my portfolio risk?' },
  { label: 'Should I buy ETH?', text: 'Should I buy ETH?'        },
]

export default function Chatbot() {
  const [messages, setMessages] = useState(INITIAL_MESSAGES)
  const [thinking, setThinking] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, thinking])

  const handleSend = (text) => {
    if (!text.trim() || thinking) return
    const userMsg = { id: Date.now(), role: 'user', content: text.trim(), timestamp: now() }
    setMessages((prev) => [...prev, userMsg])
    setThinking(true)
    const delay = 1100 + Math.random() * 700
    setTimeout(() => {
      const aiMsg = { id: Date.now() + 1, role: 'ai', content: getMockResponse(text), timestamp: now() }
      setMessages((prev) => [...prev, aiMsg])
      setThinking(false)
    }, delay)
  }

  return (
    <div className="flex flex-col gap-5 h-[calc(100vh-7rem)]">

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
        className="flex items-center justify-between shrink-0"
      >
        <div>
          <div className="flex items-center gap-2.5 mb-0.5">
            <Bot size={16} className="text-rose-400" />
            <h1 className="text-2xl font-black text-white">AI Trading Assistant</h1>
          </div>
          <p className="text-xs text-slate-500 font-medium">Ask questions, analyze markets and receive trading insights</p>
        </div>
        <span className="hidden sm:inline-flex items-center gap-1.5 bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 text-[10px] font-black px-3 py-1.5 rounded-full shrink-0 shadow-[0_0_12px_rgba(99,102,241,0.10)] tracking-wider">
          <Zap size={10} />
          AI ASSISTANT
        </span>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 flex-1 min-h-0">

        {/* Chat window */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.38, delay: 0.05 }}
          className="lg:col-span-2 flex flex-col bg-[#0a1628]/88 border border-white/[0.07] rounded-2xl overflow-hidden backdrop-blur-2xl shadow-[0_4px_28px_rgba(0,0,0,0.32)] min-h-0"
        >
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4 sidebar-scroll">
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            {thinking && (
              <ChatMessage message={{ id: 'thinking', role: 'ai', isThinking: true }} />
            )}
            <div ref={bottomRef} />
          </div>
          <SuggestionCard suggestions={SUGGESTIONS} onSelect={handleSend} />
          <ChatInput onSend={handleSend} disabled={thinking} />
        </motion.div>

        {/* Context panel */}
        <motion.div
          initial={{ opacity: 0, x: 14 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.38, delay: 0.1 }}
          className="hidden lg:flex flex-col gap-3.5 overflow-y-auto min-h-0 sidebar-scroll"
        >
          <MarketContextPanel />
        </motion.div>
      </div>
    </div>
  )
}
