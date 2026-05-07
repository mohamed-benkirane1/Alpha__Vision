const ITEMS = [
  { symbol: 'BTC',  price: '$67,432',  change: '+2.34%', up: true  },
  { symbol: 'ETH',  price: '$3,847',   change: '+1.82%', up: true  },
  { symbol: 'SOL',  price: '$178.32',  change: '+5.67%', up: true  },
  { symbol: 'XAU',  price: '$2,345',   change: '+0.43%', up: true  },
  { symbol: 'AAPL', price: '$189.45',  change: '-0.88%', up: false },
  { symbol: 'NDX',  price: '18,234',   change: '+0.76%', up: true  },
  { symbol: 'BNB',  price: '$612.40',  change: '+3.21%', up: true  },
  { symbol: 'XRP',  price: '$0.6142',  change: '-1.05%', up: false },
  { symbol: 'ADA',  price: '$0.4820',  change: '+2.18%', up: true  },
  { symbol: 'DOGE', price: '$0.1634',  change: '+4.72%', up: true  },
  { symbol: 'AVAX', price: '$36.84',   change: '+1.93%', up: true  },
  { symbol: 'MATIC',price: '$0.7230',  change: '-0.62%', up: false },
]

function TickerItem({ symbol, price, change, up }) {
  return (
    <span className="inline-flex items-center gap-2.5 px-5 select-none">
      <span className="text-[11px] font-bold text-slate-400 tracking-wider">{symbol}</span>
      <span className="text-[11px] font-semibold text-white tabular-nums">{price}</span>
      <span className={`text-[10px] font-bold px-1.5 py-px rounded ${
        up ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'
      }`}>
        {change}
      </span>
      <span className="text-slate-800 text-[10px] select-none">|</span>
    </span>
  )
}

export default function PriceTicker() {
  const doubled = [...ITEMS, ...ITEMS]
  return (
    <div className="overflow-hidden border-t border-white/[0.05] bg-[#060b18]/95 backdrop-blur-sm h-8 flex items-center shrink-0">
      <div className="flex animate-ticker whitespace-nowrap">
        {doubled.map((item, i) => (
          <TickerItem key={i} {...item} />
        ))}
      </div>
    </div>
  )
}
