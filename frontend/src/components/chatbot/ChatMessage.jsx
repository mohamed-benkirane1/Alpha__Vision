import { motion } from 'framer-motion'
import { Bot, User } from 'lucide-react'

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
        <p className={`text-[10px] mt-2 select-none ${isUser ? 'text-rose-200/70 text-right' : 'text-slate-700'}`}>
          {message.timestamp}
        </p>
      </div>
    </motion.div>
  )
}
