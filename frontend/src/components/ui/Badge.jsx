/**
 * Badge — pill/tag sémantique réutilisable.
 * Remplace les StatusBadge locaux dupliqués dans MarketOverview,
 * BotStatusCard, TradingChart, etc.
 *
 * Props :
 *   variant  'success' | 'danger' | 'warning' | 'info' | 'neutral' | 'accent'
 *   size     'sm' | 'md'  (default: 'md')
 *   dot      boolean — point coloré animé à gauche  (default: false)
 *   className string
 */

const VARIANTS = {
  success: 'bg-emerald-500/[0.12] text-emerald-400 border border-emerald-500/20',
  danger:  'bg-red-500/[0.12]     text-red-400     border border-red-500/20',
  warning: 'bg-amber-500/[0.12]   text-amber-400   border border-amber-500/20',
  info:    'bg-blue-500/[0.12]    text-blue-400    border border-blue-500/20',
  neutral: 'bg-white/[0.05]       text-white/60    border border-white/[0.08]',
  accent:  'bg-rose-500/[0.12]    text-rose-400    border border-rose-500/20',
}

const SIZES = {
  sm: 'text-[8px]  px-1.5 py-0.5 rounded-md  font-black uppercase tracking-[0.06em]',
  md: 'text-label  px-2   py-0.5 rounded-lg   font-medium uppercase tracking-[0.08em]',
}

const DOT_COLORS = {
  success: 'bg-emerald-400',
  danger:  'bg-red-400',
  warning: 'bg-amber-400',
  info:    'bg-blue-400',
  neutral: 'bg-white/60',
  accent:  'bg-rose-400',
}

export default function Badge({
  variant = 'neutral',
  size = 'md',
  dot = false,
  className = '',
  children,
}) {
  const classes = [
    'inline-flex items-center gap-1.5',
    VARIANTS[variant] ?? VARIANTS.neutral,
    SIZES[size] ?? SIZES.md,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <span className={classes}>
      {dot && (
        <span
          className={`w-[5px] h-[5px] rounded-full shrink-0 animate-pulse ${
            DOT_COLORS[variant] ?? 'bg-white/60'
          }`}
        />
      )}
      {children}
    </span>
  )
}
