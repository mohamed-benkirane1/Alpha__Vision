import { forwardRef } from 'react'
import { Loader2 } from 'lucide-react'

/**
 * Button — composant bouton unifié Alpha Vision.
 *
 * Props :
 *   variant    'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
 *   size       'sm' | 'md' | 'lg'
 *   loading    boolean — spinner + disabled auto
 *   disabled   boolean
 *   leftIcon   ReactNode
 *   rightIcon  ReactNode
 *   as         string | Component — élément rendu (default: 'button')
 *              → permet d'utiliser <Button as={Link} to="/path">
 *   className  string
 *   ...rest    spread (onClick, type, href, to, etc.)
 */

const VARIANTS = {
  primary: [
    'bg-gradient-to-r from-rose-600 to-red-700 text-white',
    'hover:from-rose-500 hover:to-red-600',
    'shadow-glow-rose disabled:shadow-none',
  ].join(' '),

  secondary: [
    'bg-white/[0.04] border border-white/[0.09] text-white',
    'hover:bg-white/[0.08] hover:border-white/[0.15]',
  ].join(' '),

  ghost: [
    'text-white/60',
    'hover:text-white hover:bg-white/[0.05]',
  ].join(' '),

  danger: [
    'bg-red-500/10 border border-red-500/30 text-red-400',
    'hover:bg-red-500/20 hover:border-red-500/50',
  ].join(' '),

  success: [
    'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400',
    'hover:bg-emerald-500/20 hover:border-emerald-500/50',
  ].join(' '),
}

const SIZES = {
  sm: 'h-8  px-3 text-body-sm rounded-lg  gap-1.5',
  md: 'h-10 px-4 text-body   rounded-xl gap-2',
  lg: 'h-12 px-6 text-ui     rounded-xl gap-2.5',
}

const Button = forwardRef(function Button(
  {
    as: Tag = 'button',
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    leftIcon,
    rightIcon,
    className = '',
    children,
    ...rest
  },
  ref,
) {
  const isDisabled = disabled || loading

  const classes = [
    // Base always applied
    'ripple-btn inline-flex items-center justify-center font-medium',
    'transition-all duration-200 select-none',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-accent/50',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
    // Variant
    VARIANTS[variant] ?? VARIANTS.primary,
    // Size
    SIZES[size] ?? SIZES.md,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  // disabled prop only for native button; use aria-disabled for other elements
  const disabledProps = Tag === 'button'
    ? { disabled: isDisabled }
    : { 'aria-disabled': isDisabled || undefined }

  return (
    <Tag ref={ref} className={classes} {...disabledProps} {...rest}>
      {loading ? (
        <Loader2 size={14} className="animate-spin shrink-0" />
      ) : leftIcon ? (
        <span className="shrink-0">{leftIcon}</span>
      ) : null}

      {children}

      {!loading && rightIcon && (
        <span className="shrink-0">{rightIcon}</span>
      )}
    </Tag>
  )
})

Button.displayName = 'Button'

export default Button
