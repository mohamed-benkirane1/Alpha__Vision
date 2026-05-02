import { Shield, Target, AlertTriangle } from 'lucide-react'

const fmt = (n) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

function TradingPanel({ symbol, price, type }) {
  const isLong   = type === 'BUY'
  const stopLoss    = isLong ? price * 0.97 : price * 1.03
  const takeProfit  = isLong ? price * 1.06 : price * 0.94
  const riskPct     = 3
  const rewardPct   = 6

  const rows = [
    { label: 'Entry Price',  value: fmt(price),       icon: null,          color: 'text-white'       },
    { label: 'Stop Loss',    value: fmt(stopLoss),     icon: AlertTriangle, color: 'text-red-400'     },
    { label: 'Take Profit',  value: fmt(takeProfit),   icon: Target,        color: 'text-emerald-400' },
    { label: 'Risk',         value: `-${riskPct}%`,   icon: null,          color: 'text-red-400'     },
    { label: 'Reward',       value: `+${rewardPct}%`, icon: null,          color: 'text-emerald-400' },
  ]

  return (
    <div className="bg-gray-900/50 border border-gray-800/60 rounded-xl p-5 backdrop-blur-sm">
      <div className="flex items-center gap-2 mb-4">
        <Shield size={13} className="text-indigo-400" />
        <h3 className="text-sm font-semibold text-white">Risk Preview</h3>
        <span className={`ml-auto text-[11px] px-2 py-0.5 rounded font-semibold ${
          isLong ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
        }`}>
          {type} — {symbol}
        </span>
      </div>

      <div className="space-y-2.5">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-gray-500">
              {r.icon && <r.icon size={11} />}
              {r.label}
            </div>
            <span className={`font-semibold ${r.color}`}>{r.value}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-3.5 border-t border-gray-800/60">
        <div className="flex justify-between text-xs mb-1.5">
          <span className="text-gray-500">Risk / Reward</span>
          <span className="text-white font-bold">1 : 2</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden bg-gray-800 flex">
          <div className="bg-red-500 h-full rounded-l-full" style={{ width: '33%' }} />
          <div className="bg-emerald-500 h-full rounded-r-full" style={{ width: '67%' }} />
        </div>
      </div>
    </div>
  )
}

export default TradingPanel
