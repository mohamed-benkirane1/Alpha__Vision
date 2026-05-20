import { Bot, Info, Server, Shield, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'

const assistantScope = [
  'Market and asset analysis',
  'Technical indicators',
  'Risk management',
  'Portfolio allocation concepts',
]

const dataRules = [
  'Answers are generated through the backend chatbot route.',
  'No AI provider key is exposed in the browser.',
  'Fallback responses are labelled when provider access is unavailable.',
]

export default function MarketContextPanel() {
  return (
    <>
      <motion.div
        whileHover={{ borderColor: 'rgba(225,29,72,0.12)' }}
        className="bg-[#0a1628]/88 border border-white/[0.07] rounded-2xl p-5 backdrop-blur-2xl shadow-[0_4px_28px_rgba(0,0,0,0.32)] transition-all duration-300"
      >
        <div className="flex items-center gap-2 mb-4">
          <Bot size={13} className="text-rose-400" />
          <h3 className="text-sm font-bold text-white">Assistant Scope</h3>
        </div>

        <div className="space-y-2">
          {assistantScope.map((item) => (
            <div key={item} className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5 text-xs font-semibold text-slate-300">
              <Sparkles size={11} className="shrink-0 text-rose-400" />
              {item}
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div
        whileHover={{ borderColor: 'rgba(225,29,72,0.12)' }}
        className="bg-[#0a1628]/88 border border-white/[0.07] rounded-2xl p-5 backdrop-blur-2xl shadow-[0_4px_28px_rgba(0,0,0,0.32)] transition-all duration-300"
      >
        <div className="flex items-center gap-2 mb-4">
          <Server size={13} className="text-indigo-400" />
          <h3 className="text-sm font-bold text-white">Data Policy</h3>
        </div>

        <div className="space-y-2.5">
          {dataRules.map((item) => (
            <div key={item} className="flex items-start gap-2 text-xs text-slate-500 font-medium leading-relaxed">
              <Shield size={11} className="mt-0.5 shrink-0 text-emerald-400" />
              <span>{item}</span>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/8 px-3 py-3">
          <div className="flex items-start gap-2 text-xs text-amber-300 font-semibold leading-relaxed">
            <Info size={12} className="mt-0.5 shrink-0" />
            <span>The assistant does not execute trades and does not replace financial advice.</span>
          </div>
        </div>
      </motion.div>
    </>
  )
}
