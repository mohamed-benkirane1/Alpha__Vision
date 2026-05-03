import { TrendingUp, TrendingDown } from 'lucide-react'

function PriceCard({ symbol, name, price, change, selected, onSelect }) {
  const up = change >= 0
  return (
    <button
      onClick={() => onSelect(symbol)}
      className={`w-full text-left rounded-xl p-4 border transition-all duration-200 ${
        selected
          ? 'border-indigo-500/50 bg-indigo-500/10 shadow-[0_0_20px_rgba(99,102,241,0.18)]'
          : 'bg-slate-900/60 border-slate-700/50 hover:border-indigo-500/25 hover:bg-slate-900/80 backdrop-blur-xl'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-xl border flex items-center justify-center text-[11px] font-bold shrink-0 ${
            selected ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-300' : 'bg-slate-800 border-slate-700/40 text-slate-300'
          }`}>
            {symbol.slice(0, 2)}
          </div>
          <div>
            <p className="text-sm font-bold text-white">{symbol}</p>
            <p className="text-[11px] text-slate-500">{name}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-white">${price.toLocaleString()}</p>
          <p className={`text-xs font-semibold flex items-center justify-end gap-0.5 ${up ? 'text-emerald-400' : 'text-red-400'}`}>
            {up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {up ? '+' : ''}{change}%
          </p>
        </div>
      </div>
    </button>
  )
}

export default PriceCard
