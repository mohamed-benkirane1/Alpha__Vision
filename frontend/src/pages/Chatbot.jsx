import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, Bot, Server, Shield, Zap } from 'lucide-react'

import ChatMessage from '../components/chatbot/ChatMessage'
import ChatInput from '../components/chatbot/ChatInput'
import SuggestionCard from '../components/chatbot/SuggestionCard'
import MarketContextPanel from '../components/chatbot/MarketContextPanel'
import { getChatHistory, sendChatMessage } from '../services/chatbotService'

const formatClock = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

const formatProviderTime = (value) => {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleString([], {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const INITIAL_MESSAGES = [
  {
    id: 'welcome',
    role: 'ai',
    content: 'Hello. I can answer trading, crypto, stock market, technical analysis, risk management, and portfolio questions. Gemini is used only when configured on the backend; otherwise fallback responses are clearly labelled.',
    timestamp: 'Just now',
    provider: 'Backend',
    source: 'api',
    fallback: false,
  },
]

const SUGGESTIONS = [
  { label: 'Analyze BTC', text: 'Analyze BTC' },
  { label: 'Explain RSI', text: 'Explain RSI signal' },
  { label: 'Risk management', text: 'Explain position sizing risk management' },
  { label: 'Portfolio risk?', text: 'How should I think about portfolio concentration risk?' },
]

function createUserMessage(text) {
  return {
    id: `user-${Date.now()}`,
    role: 'user',
    content: text,
    timestamp: formatClock(),
  }
}

function createAssistantMessage(response) {
  const answer = response.answer || response.message || response.error || 'Assistant temporarily unavailable.'

  return {
    id: `ai-${Date.now() + 1}`,
    role: 'ai',
    content: answer,
    timestamp: formatClock(),
    provider: response.provider || null,
    providerStatus: response.providerStatus || null,
    mode: response.mode || null,
    source: response.source || null,
    providerTimestamp: formatProviderTime(response.timestamp),
    fallback: Boolean(response.fallback),
    warnings: response.warnings || [],
    contextUsed: response.contextUsed || null,
    notFinancialAdvice: response.notFinancialAdvice !== false,
  }
}

function createStoredMessages(storedMessages = []) {
  return storedMessages
    .filter((message) => message?.content && (message.role === 'user' || message.role === 'assistant'))
    .map((message, index) => ({
      id: message._id || `history-${index}`,
      role: message.role === 'assistant' ? 'ai' : 'user',
      content: message.content,
      timestamp: formatProviderTime(message.ts) || 'History',
    }))
}

export default function Chatbot() {
  const [messages, setMessages] = useState(INITIAL_MESSAGES)
  const [thinking, setThinking] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(true)
  const [error, setError] = useState(null)
  const bottomRef = useRef(null)

  useEffect(() => {
    let isMounted = true

    const loadHistory = async () => {
      const response = await getChatHistory()
      if (!isMounted) return

      if (response.success && response.messages.length > 0) {
        setMessages(createStoredMessages(response.messages))
      } else if (!response.success) {
        setError(response.error || 'Unable to load chatbot history.')
      }

      setHistoryLoading(false)
    }

    loadHistory()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, thinking, error, historyLoading])

  const handleSend = async (text) => {
    const trimmed = typeof text === 'string' ? text.trim() : ''
    if (!trimmed || thinking) return

    setError(null)
    setMessages((prev) => [...prev, createUserMessage(trimmed)])
    setThinking(true)

    try {
      const response = await sendChatMessage(trimmed)
      setMessages((prev) => [...prev, createAssistantMessage(response)])

      if (!response.success) {
        setError(response.error || 'Unable to contact chatbot.')
      }
    } catch (err) {
      const message = err?.message || 'Unable to contact chatbot.'
      setError(message)
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-error-${Date.now()}`,
          role: 'ai',
          content: message,
          timestamp: formatClock(),
          fallback: false,
          warnings: ['Backend chatbot request failed.'],
        },
      ])
    } finally {
      setThinking(false)
    }
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
          <p className="text-xs text-slate-500 font-medium">Backend-powered assistant for trading and market questions</p>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[10px] font-black px-3 py-1.5 rounded-full shrink-0 shadow-[0_0_12px_rgba(16,185,129,0.10)] tracking-wider">
            <Server size={10} />
            BACKEND API
          </span>
          <span className="inline-flex items-center gap-1.5 bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 text-[10px] font-black px-3 py-1.5 rounded-full shrink-0 shadow-[0_0_12px_rgba(99,102,241,0.10)] tracking-wider">
            <Zap size={10} />
            PROVIDER-AWARE
          </span>
        </div>
      </motion.div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/8 px-4 py-3 text-xs font-semibold text-amber-300">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 flex-1 min-h-0">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.38, delay: 0.05 }}
          className="lg:col-span-2 flex flex-col bg-[#0a1628]/88 border border-white/[0.07] rounded-2xl overflow-hidden backdrop-blur-2xl shadow-[0_4px_28px_rgba(0,0,0,0.32)] min-h-0"
        >
          <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3">
            <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500">
              <Shield size={12} className="text-emerald-400" />
              No frontend AI keys. Responses are served by backend only.
            </div>
            {(thinking || historyLoading) && (
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400">
                {historyLoading ? 'Loading history...' : 'Thinking...'}
              </span>
            )}
          </div>

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
