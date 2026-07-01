import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, Bot, Send, Sparkles } from 'lucide-react'

import { Card, Badge, Button } from '../components/ui'
import ChatMessage from '../components/chatbot/ChatMessage'
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
    content: 'Bonjour ! Je suis Alpha AI, votre assistant de trading. Posez-moi vos questions sur les marchés, les indicateurs techniques ou vos stratégies.',
    timestamp: 'Maintenant',
    provider: 'Backend',
    source: 'api',
    fallback: false,
  },
]

const SUGGESTIONS = [
  'Analyse le marché BTC/USD',
  'Explique le signal RSI actuel',
  'Quelle est la tendance XAUUSD ?',
  'Compare ETH et BTC cette semaine',
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
  const answer = response.answer || response.message || response.error || 'Assistant temporairement indisponible.'
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
    .filter((m) => m?.content && (m.role === 'user' || m.role === 'assistant'))
    .map((m, i) => ({
      id: m._id || `history-${i}`,
      role: m.role === 'assistant' ? 'ai' : 'user',
      content: m.content,
      timestamp: formatProviderTime(m.ts) || 'Historique',
    }))
}

export default function Chatbot() {
  const [messages, setMessages] = useState(INITIAL_MESSAGES)
  const [thinking, setThinking] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(true)
  const [error, setError] = useState(null)
  const [inputText, setInputText] = useState('')
  const bottomRef = useRef(null)

  useEffect(() => {
    let isMounted = true
    const loadHistory = async () => {
      const response = await getChatHistory()
      if (!isMounted) return
      if (response.success && response.messages.length > 0) {
        setMessages(createStoredMessages(response.messages))
      } else if (!response.success) {
        setError(response.error || "Impossible de charger l'historique.")
      }
      setHistoryLoading(false)
    }
    loadHistory()
    return () => { isMounted = false }
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, thinking, historyLoading])

  const handleSend = async (text) => {
    const trimmed = typeof text === 'string' ? text.trim() : ''
    if (!trimmed || thinking) return
    setError(null)
    setMessages((prev) => [...prev, createUserMessage(trimmed)])
    setThinking(true)
    try {
      const response = await sendChatMessage(trimmed)
      setMessages((prev) => [...prev, createAssistantMessage(response)])
      if (!response.success) setError(response.error || 'Impossible de contacter le chatbot.')
    } catch (err) {
      const msg = err?.message || 'Impossible de contacter le chatbot.'
      setError(msg)
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-error-${Date.now()}`,
          role: 'ai',
          content: msg,
          timestamp: formatClock(),
          fallback: false,
          warnings: ['La requête backend a échoué.'],
        },
      ])
    } finally {
      setThinking(false)
    }
  }

  const handleSendInput = () => {
    const text = inputText.trim()
    if (!text || thinking) return
    setInputText('')
    handleSend(text)
  }

  const showSuggestions = messages.length <= 1 && !thinking && !historyLoading

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)]">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
        className="mb-6 shrink-0"
      >
        <p className="text-label uppercase tracking-wider text-white/40 mb-1">IA</p>
        <h1 className="text-display-sm font-black text-white">Assistant IA</h1>
        <p className="text-body text-white/40">Posez vos questions de trading à notre intelligence artificielle</p>
      </motion.div>

      {/* ── Error banner ────────────────────────────────────────────────────── */}
      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/8 px-4 py-3 text-body-sm font-semibold text-amber-300 mb-4 shrink-0">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Layout 2 colonnes ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">

        {/* Colonne chat */}
        <div className="lg:col-span-2 flex flex-col min-h-0">
          <Card padding="none" className="flex flex-col flex-1 overflow-hidden min-h-0">

            {/* Card header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-app-border shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-500/10 flex items-center justify-center">
                  <Bot size={16} className="text-rose-400" />
                </div>
                <div>
                  <p className="text-body font-semibold text-white">Alpha AI</p>
                  <p className="text-caption text-white/40">Propulsé par Groq / Llama 3.3</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {(thinking || historyLoading) && (
                  <span className="text-caption font-black uppercase tracking-wider text-rose-400">
                    {historyLoading ? 'Chargement...' : 'Réflexion...'}
                  </span>
                )}
                <Badge variant="success" dot size="sm">En ligne</Badge>
              </div>
            </div>

            {/* Zone messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 min-h-0">
              {messages.length === 0 && !historyLoading ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-4">
                    <Sparkles size={24} className="text-rose-400" />
                  </div>
                  <p className="text-body font-medium text-white mb-1">Bonjour, je suis Alpha AI</p>
                  <p className="text-body-sm text-white/40 max-w-xs">
                    Posez-moi vos questions sur les marchés, les signaux ou vos stratégies de trading.
                  </p>
                </div>
              ) : (
                messages.map((msg) => <ChatMessage key={msg.id} message={msg} />)
              )}
              {thinking && <ChatMessage message={{ id: 'thinking', role: 'ai', isThinking: true }} />}
              <div ref={bottomRef} />
            </div>

            {/* Suggestions rapides */}
            {showSuggestions && (
              <div className="px-5 pb-3 grid grid-cols-2 gap-2 shrink-0">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleSend(s)}
                    className="text-left px-3 py-2.5 rounded-xl border border-app-border bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/[0.15] text-body-sm text-white/50 hover:text-white transition-all duration-200"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Zone saisie */}
            <div className="px-4 pb-4 pt-2 border-t border-app-border shrink-0">
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <textarea
                    rows={1}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Posez votre question..."
                    disabled={thinking}
                    className="w-full resize-none rounded-xl px-4 py-3 bg-white/[0.04] border border-app-border text-body text-white placeholder:text-white/30 focus:outline-none focus:border-rose-500/50 focus:bg-white/[0.06] transition-all duration-200 max-h-32 overflow-y-auto disabled:opacity-40"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendInput() }
                    }}
                    onInput={(e) => {
                      e.target.style.height = 'auto'
                      e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px'
                    }}
                  />
                </div>
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleSendInput}
                  disabled={!inputText.trim()}
                  loading={thinking}
                >
                  <Send size={15} />
                </Button>
              </div>
              <p className="text-caption text-white/20 mt-2 text-center">
                Shift+Entrée pour un saut de ligne · Les réponses sont générées par IA
              </p>
            </div>
          </Card>
        </div>

        {/* Colonne contexte */}
        <div className="hidden lg:flex flex-col gap-4 overflow-y-auto min-h-0">
          <MarketContextPanel />
        </div>
      </div>
    </div>
  )
}
