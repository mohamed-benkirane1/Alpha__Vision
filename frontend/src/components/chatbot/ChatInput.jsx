import { useState } from 'react'
import { Send } from 'lucide-react'
import { motion } from 'framer-motion'

export default function ChatInput({ onSend, disabled }) {
  const [text, setText] = useState('')

  const submit = () => {
    if (!text.trim() || disabled) return
    onSend(text.trim())
    setText('')
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <div className="border-t border-white/[0.06] px-4 py-3.5 bg-[#070E20]/60 backdrop-blur-xl">
      <div className="flex items-end gap-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Ask Alpha Vision AI about BTC, ETH, portfolio risk…"
          disabled={disabled}
          rows={1}
          className="flex-1 bg-[#0a1628]/80 border border-white/[0.09] text-white text-body rounded-xl px-4 py-2.5 placeholder-slate-700 focus:outline-none focus:border-rose-500/50 focus:shadow-[0_0_14px_rgba(225,29,72,0.12)] resize-none transition-all duration-200 disabled:opacity-40 leading-relaxed"
          style={{ maxHeight: '120px' }}
          onInput={(e) => {
            e.target.style.height = 'auto'
            e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
          }}
        />
        <motion.button
          onClick={submit}
          disabled={disabled || !text.trim()}
          whileHover={{ scale: text.trim() ? 1.06 : 1 }}
          whileTap={{ scale: 0.95 }}
          className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 disabled:opacity-35 disabled:cursor-not-allowed flex items-center justify-center shrink-0 transition-all duration-200 shadow-[0_0_16px_rgba(225,29,72,0.28)]"
        >
          <Send size={14} className="text-white" />
        </motion.button>
      </div>
      <p className="text-caption text-slate-700 mt-1.5 text-center font-medium">
        Press Enter to send · Shift+Enter for new line
      </p>
    </div>
  )
}
