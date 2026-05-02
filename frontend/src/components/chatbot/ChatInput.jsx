import { useState } from 'react'
import { Send } from 'lucide-react'

function ChatInput({ onSend, disabled }) {
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
    <div className="border-t border-gray-800/60 px-4 py-3">
      <div className="flex items-end gap-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Ask Alpha Vision AI about BTC, ETH, portfolio risk…"
          disabled={disabled}
          rows={1}
          className="flex-1 bg-gray-900/80 border border-gray-800 text-white text-sm rounded-xl px-4 py-2.5 placeholder-gray-600 focus:outline-none focus:border-indigo-500 resize-none transition-colors disabled:opacity-50 leading-relaxed"
          style={{ maxHeight: '120px' }}
          onInput={(e) => {
            e.target.style.height = 'auto'
            e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
          }}
        />
        <button
          onClick={submit}
          disabled={disabled || !text.trim()}
          className="w-10 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center shrink-0 transition-colors"
        >
          <Send size={15} className="text-white" />
        </button>
      </div>
      <p className="text-[10px] text-gray-700 mt-1.5 text-center">
        Press Enter to send · Shift+Enter for new line
      </p>
    </div>
  )
}

export default ChatInput
