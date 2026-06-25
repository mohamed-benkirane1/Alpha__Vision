/**
 * Skeleton — placeholder shimmer pour les états de chargement.
 * Remplace les divs ad-hoc `animate-pulse bg-white/[0.06]`.
 */
export default function Skeleton({
  width    = 'w-full',
  height   = 'h-4',
  rounded  = 'rounded-md',
  className = '',
}) {
  return (
    <div
      className={`animate-pulse bg-white/[0.06] ${width} ${height} ${rounded} ${className}`}
      aria-hidden="true"
    />
  )
}
