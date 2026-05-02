import { TrendingUp, TrendingDown } from 'lucide-react'

function PriceCard({ symbol, name, price, change, selected, onSelect }) {
  const up = change >= 0
  return (
    <button
      onClick={() => onSelect(symbol)}
      className={`w-full text-left rounded-xl p-4 border transition-all duration-150 ${
        selected
          ? 'border-indigo-500/50 bg-indigo-500/8 shadow-sm shadow-indigo-500/10'
          : 'bg-gray-900/50 border-gray-800/60 hover:border-gray-700/60 backdrop-blur-sm'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-[11px] font-bold text-gray-300 shrink-0">
            {symbol.slice(0, 2)}
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{symbol}</p>
            <p className="text-[11px] text-gray-500">{name}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-white">${price.toLocaleString()}</p>
          <p className={`text-xs font-medium flex items-center justify-end gap-0.5 ${up ? 'text-emerald-400' : 'text-red-400'}`}>
            {up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {up ? '+' : ''}{change}%
          </p>
        </div>
      </div>
    </button>
  )
}

export default PriceCard
