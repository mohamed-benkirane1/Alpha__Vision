import { motion } from 'framer-motion'
import { AlertTriangle, Bot, Clock, Server, User } from 'lucide-react'

function ThinkingDots() {
  return (
    <div className="flex items-end gap-2">
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shrink-0 shadow-[0_0_14px_rgba(99,102,241,0.35)]">
        <Bot size={13} className="text-white" />
      </div>
      <div className="bg-[#0a1628]/88 border border-white/[0.08] rounded-2xl rounded-bl-sm px-4 py-3.5 backdrop-blur-xl">
        <div className="flex items-center gap-1.5">
          {[0, 150, 300].map((delay) => (
            <span
              key={delay}
              className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"
              style={{ animationDelay: `${delay}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default function ChatMessage({ message }) {
  if (message.isThinking) return <ThinkingDots />

  const isUser = message.role === 'user'
  const hasMeta = !isUser && (
    message.provider
    || message.source
    || message.providerTimestamp
    || message.fallback
    || message.mode
    || message.providerStatus
  )
  const warnings = Array.isArray(message.warnings) ? message.warnings.filter(Boolean) : []

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      className={`flex items-end gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
        isUser
          ? 'bg-white/[0.06] border border-white/[0.10]'
          : 'bg-gradient-to-br from-indigo-600 to-violet-600 shadow-[0_0_14px_rgba(99,102,241,0.35)]'
      }`}>
        {isUser
          ? <User size={13} className="text-slate-300" />
          : <Bot  size={13} className="text-white" />
        }
      </div>

      <div className={`max-w-[78%] px-4 py-3.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
        isUser
          ? 'bg-gradient-to-br from-rose-600 to-red-700 text-white rounded-br-sm shadow-[0_4px_20px_rgba(225,29,72,0.22)]'
          : 'bg-[#0a1628]/88 border border-white/[0.08] text-slate-200 rounded-bl-sm backdrop-blur-xl shadow-[0_4px_20px_rgba(0,0,0,0.3)]'
      }`}>
        {message.content}
        {warnings.length > 0 && (
          <div className="mt-3 space-y-1">
            {warnings.map((warning) => (
              <div key={warning} className="flex items-start gap-1.5 rounded-lg border border-amber-500/20 bg-amber-500/8 px-2 py-1.5 text-[10px] font-semibold text-amber-300">
                <AlertTriangle size={10} className="mt-0.5 shrink-0" />
                <span>{warning}</span>
              </div>
            ))}
          </div>
        )}
        {hasMeta && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {message.fallback && (
              <span className="inline-flex items-center gap-1 rounded-md border border-amber-500/25 bg-amber-500/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-300">
                <AlertTriangle size={9} />
                Fallback
              </span>
            )}
            {(message.mode || message.providerStatus) && (
              <span className="inline-flex items-center gap-1 rounded-md border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 text-[10px] font-bold text-slate-500">
                <Server size={9} />
                {[message.mode, message.providerStatus].filter(Boolean).join(' / ')}
              </span>
            )}
            {(message.provider || message.source) && (
              <span className="inline-flex items-center gap-1 rounded-md border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 text-[10px] font-bold text-slate-500">
                <Server size={9} />
                {[message.provider, message.source].filter(Boolean).join(' / ')}
              </span>
            )}
            {message.providerTimestamp && (
              <span className="inline-flex items-center gap-1 rounded-md border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 text-[10px] font-bold text-slate-500">
                <Clock size={9} />
                {message.providerTimestamp}
              </span>
            )}
          </div>
        )}
        <p className={`text-[10px] mt-2 select-none ${isUser ? 'text-rose-200/70 text-right' : 'text-slate-700'}`}>
          {message.timestamp}
        </p>
      </div>
    </motion.div>
  )
}
