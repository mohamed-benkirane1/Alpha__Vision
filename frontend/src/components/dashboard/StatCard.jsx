import { memo } from 'react'
import { useReducedMotion } from 'framer-motion'
import Card  from '../ui/Card'
import Badge from '../ui/Badge'
import useCountUp from '../../hooks/useCountUp'

/**
 * StatCard — carte KPI secondaire.
 *
 * Props :
 *   icon        Component lucide-react
 *   label       string
 *   value       string | number
 *              → si number fini > 0 : count-up animation
 *              → sinon : affiché directement
 *   formatFn    (number) => string — formatteur pour count-up (optionnel)
 *   sub         ReactNode — info additionnelle (optionnel)
 *   subUp       boolean | null
 *   change      number | undefined — % variation → badge
 *   loading     boolean
 *   onClick     function
 *   accentColor ignoré (compat)
 */
function StatCard({
  icon: Icon,
  label,
  value,
  formatFn,
  sub,
  subUp,
  change,
  loading = false,
  onClick,
  accentColor, // eslint-disable-line no-unused-vars
}) {
  // shouldReduce peut être null dans framer-motion v12 → on normalise
  const reducedMotionRaw = useReducedMotion()
  const shouldReduce     = reducedMotionRaw === true

  // On n'anime que les nombres finis positifs
  const isNumeric       = typeof value === 'number' && Number.isFinite(value) && value > 0
  const animationTarget = isNumeric ? value : 0
  const animated        = useCountUp(
    animationTarget,
    900,
    isNumeric && !shouldReduce,
  )

  // Valeur affichée — jamais undefined, jamais null
  const displayValue = (() => {
    if (value === null || value === undefined) return '--'
    if (isNumeric) {
      try {
        return formatFn ? formatFn(animated) : animated.toLocaleString()
      } catch {
        return String(value)
      }
    }
    return String(value) || '--'
  })()

  // ── Skeleton ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <Card padding="md">
        <div className="flex justify-between items-start mb-3">
          <div className="w-9 h-9 rounded-xl bg-white/[0.06] animate-shimmer" />
          <div className="w-14 h-5 rounded-lg bg-white/[0.06] animate-shimmer" />
        </div>
        <div className="w-24 h-7 rounded-lg bg-white/[0.06] animate-shimmer mb-2" />
        <div className="w-16 h-4 rounded-md bg-white/[0.06] animate-shimmer" />
      </Card>
    )
  }

  // ── Badge de variation ──────────────────────────────────────────────────────
  const changeNum      = typeof change === 'number' && Number.isFinite(change) ? change : null
  const showChangeBadge   = changeNum !== null
  const showDirectionBadge = !showChangeBadge && typeof subUp === 'boolean'

  return (
    <Card padding="md" hover={!!onClick} onClick={onClick}>
      {/* Icon + badge */}
      <div className="flex items-start justify-between mb-3">
        <div className="w-9 h-9 rounded-xl bg-white/[0.05] flex items-center justify-center shrink-0">
          {Icon && <Icon size={18} className="text-white/55" />}
        </div>

        {showChangeBadge && (
          <Badge variant={changeNum >= 0 ? 'success' : 'danger'} size="sm">
            {changeNum >= 0 ? '↑' : '↓'} {Math.abs(changeNum).toFixed(1)}%
          </Badge>
        )}
        {showDirectionBadge && (
          <Badge variant={subUp ? 'success' : 'neutral'} size="sm">
            {subUp ? '↑' : '—'}
          </Badge>
        )}
      </div>

      {/* Valeur principale */}
      <p className="text-heading font-black text-white mb-0.5 tabular-nums font-mono leading-none">
        {displayValue}
      </p>

      {/* Label */}
      <p className="text-label uppercase tracking-wide text-white/40 font-medium">
        {label || ''}
      </p>

      {/* Sous-info */}
      {sub != null && (
        <p className={`text-body-sm mt-2 font-medium leading-snug ${
          subUp === true  ? 'text-emerald-400/70' :
          subUp === false ? 'text-red-400/70' :
          'text-white/30'
        }`}>
          {sub}
        </p>
      )}
    </Card>
  )
}

export default memo(StatCard)
