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
    <div className="border-t border-slate-700/40 px-4 py-3">
      <div className="flex items-end gap-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Ask Alpha Vision AI about BTC, ETH, portfolio risk…"
          disabled={disabled}
          rows={1}
          className="flex-1 bg-slate-900/80 border border-slate-700/50 text-white text-sm rounded-xl px-4 py-2.5 placeholder-slate-600 focus:outline-none focus:border-indigo-500/60 focus:shadow-[0_0_12px_rgba(99,102,241,0.12)] resize-none transition-all duration-200 disabled:opacity-50 leading-relaxed"
          style={{ maxHeight: '120px' }}
          onInput={(e) => {
            e.target.style.height = 'auto'
            e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
          }}
        />
        <button
          onClick={submit}
          disabled={disabled || !text.trim()}
          className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center shrink-0 transition-all duration-200 shadow-[0_0_14px_rgba(99,102,241,0.25)]"
        >
          <Send size={15} className="text-white" />
        </button>
      </div>
      <p className="text-[10px] text-slate-700 mt-1.5 text-center">
        Press Enter to send · Shift+Enter for new line
      </p>
    </div>
  )
}

export default ChatInput
