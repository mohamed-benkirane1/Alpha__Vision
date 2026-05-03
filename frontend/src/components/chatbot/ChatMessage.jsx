import { motion } from 'framer-motion'
import { Bot, User } from 'lucide-react'

function ThinkingDots() {
  return (
    <div className="flex items-end gap-2">
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(99,102,241,0.3)]">
        <Bot size={14} className="text-white" />
      </div>
      <div className="bg-slate-900/80 border border-slate-700/50 rounded-2xl rounded-bl-sm px-4 py-3.5">
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

function ChatMessage({ message }) {
  if (message.isThinking) return <ThinkingDots />

  const isUser = message.role === 'user'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`flex items-end gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
        isUser
          ? 'bg-slate-700 border border-slate-600/50'
          : 'bg-gradient-to-br from-indigo-600 to-violet-600 shadow-[0_0_12px_rgba(99,102,241,0.3)]'
      }`}>
        {isUser ? <User size={14} className="text-slate-300" /> : <Bot size={14} className="text-white" />}
      </div>

      <div className={`max-w-[78%] px-4 py-3.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
        isUser
          ? 'bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-br-sm shadow-[0_4px_16px_rgba(99,102,241,0.2)]'
          : 'bg-slate-900/80 border border-slate-700/50 text-slate-200 rounded-bl-sm'
      }`}>
        {message.content}
        <p className={`text-[10px] mt-2 select-none ${isUser ? 'text-indigo-200 text-right' : 'text-slate-600'}`}>
          {message.timestamp}
        </p>
      </div>
    </motion.div>
  )
}

export default ChatMessage
