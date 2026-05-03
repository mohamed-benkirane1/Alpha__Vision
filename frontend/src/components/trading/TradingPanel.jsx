import { Shield, Target, AlertTriangle, TrendingUp } from 'lucide-react'

const fmt = (n) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

function TradingPanel({ symbol, price, type }) {
  const isLong   = type !== 'SELL'
  const stopLoss    = isLong ? price * 0.97 : price * 1.03
  const takeProfit  = isLong ? price * 1.06 : price * 0.94

  const rows = [
    { label: 'Entry Price',  value: fmt(price),       icon: TrendingUp,    color: 'text-white'       },
    { label: 'Stop Loss',    value: fmt(stopLoss),     icon: AlertTriangle, color: 'text-red-400'     },
    { label: 'Take Profit',  value: fmt(takeProfit),   icon: Target,        color: 'text-emerald-400' },
    { label: 'Risk',         value: '-3.0%',           icon: null,          color: 'text-red-400'     },
    { label: 'Reward',       value: '+6.0%',           icon: null,          color: 'text-emerald-400' },
  ]

  return (
    <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-5 backdrop-blur-xl">
      <div className="flex items-center gap-2 mb-4">
        <Shield size={13} className="text-indigo-400" />
        <h3 className="text-sm font-semibold text-white">Risk Preview</h3>
        <span className={`ml-auto text-[11px] px-2.5 py-0.5 rounded-lg font-bold ${
          isLong ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25' : 'bg-red-500/15 text-red-400 border border-red-500/25'
        }`}>
          {type} — {symbol}
        </span>
      </div>

      <div className="space-y-3">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-slate-500">
              {r.icon && <r.icon size={11} />}
              {r.label}
            </div>
            <span className={`font-bold ${r.color}`}>{r.value}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-slate-700/40">
        <div className="flex justify-between text-xs mb-2">
          <span className="text-slate-500">Risk / Reward</span>
          <span className="text-white font-bold">1 : 2</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden bg-slate-800 flex">
          <div className="bg-red-500/80 h-full rounded-l-full" style={{ width: '33%' }} />
          <div className="bg-emerald-500/80 h-full rounded-r-full" style={{ width: '67%' }} />
        </div>
      </div>
    </div>
  )
}

export default TradingPanel
