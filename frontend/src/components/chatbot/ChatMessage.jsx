import { motion } from 'framer-motion'
import { Bot, User } from 'lucide-react'

function ThinkingDots() {
  return (
    <div className="flex items-end gap-2">
      <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center shrink-0">
        <Bot size={13} className="text-white" />
      </div>
      <div className="bg-gray-900 border border-gray-800/80 rounded-2xl rounded-bl-sm px-4 py-3.5">
        <div className="flex items-center gap-1">
          {[0, 150, 300].map((delay) => (
            <span
              key={delay}
              className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"
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
      className={`flex items-end gap-2 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      {/* Avatar */}
      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
        isUser ? 'bg-gray-700' : 'bg-indigo-600'
      }`}>
        {isUser
          ? <User size={13} className="text-gray-300" />
          : <Bot size={13} className="text-white" />
        }
      </div>

      {/* Bubble */}
      <div className={`max-w-[78%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
        isUser
          ? 'bg-indigo-600 text-white rounded-br-sm'
          : 'bg-gray-900 border border-gray-800/80 text-gray-200 rounded-bl-sm'
      }`}>
        {message.content}
        <p className={`text-[10px] mt-2 select-none ${isUser ? 'text-indigo-300 text-right' : 'text-gray-600'}`}>
          {message.timestamp}
        </p>
      </div>
    </motion.div>
  )
}

export default ChatMessage
