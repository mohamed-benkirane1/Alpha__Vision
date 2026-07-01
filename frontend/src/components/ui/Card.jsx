import { forwardRef } from 'react'

/**
 * Card — surface de base de l'app Alpha Vision.
 *
 * Remplace la chaîne répétée :
 *   bg-[#0a1628]/88 border border-white/[0.07] rounded-2xl p-5
 *   backdrop-blur-2xl shadow-[0_4px_28px_rgba(0,0,0,0.32)]
 *
 * Props :
 *   padding  'none' | 'sm' | 'md' | 'lg'  (default: 'md')
 *   hover    boolean  — lift + border brighten on hover  (default: false)
 *   glow     boolean  — rose glow on hover (nécessite hover=true)  (default: false)
 *   as       string | Component — élément HTML rendu  (default: 'div')
 *   className, onClick, ...rest  — spread sur l'élément
 */
const PADDING = {
  none: '',
  sm:   'p-3 sm:p-4',
  md:   'p-4 sm:p-5',
  lg:   'p-5 sm:p-6 lg:p-7',
}

const Card = forwardRef(function Card(
  {
    as: Tag = 'div',
    padding = 'md',
    hover = false,
    glow = false,
    className = '',
    children,
    onClick,
    ...rest
  },
  ref,
) {
  const classes = [
    // Base — équivalent direct du pattern répété
    'bg-app-surface',
    'border border-white/[0.07]',
    'rounded-card',           // via @theme --radius-card: 14px
    'backdrop-blur-card',     // via @theme --blur-card: 24px
    'shadow-card',            // via @theme --shadow-card
    'transition-all duration-200',
    // Padding
    PADDING[padding] ?? PADDING.md,
    // Hover lift
    hover || onClick
      ? 'cursor-pointer hover:shadow-card-hover hover:-translate-y-0.5 hover:border-white/[0.12]'
      : '',
    // Glow rose (uniquement si hover activé)
    glow && (hover || onClick)
      ? 'hover:shadow-glow-rose hover:border-app-accent/20'
      : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <Tag ref={ref} className={classes} onClick={onClick} {...rest}>
      {children}
    </Tag>
  )
})

Card.displayName = 'Card'

export default Card
