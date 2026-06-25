/**
 * Skeleton — placeholder shimmer pour les états de chargement.
 * Utilise animate-shimmer (défini dans index.css) pour un effet
 * de balayage lumineux plutôt qu'un simple pulse.
 */
export default function Skeleton({
  width    = 'w-full',
  height   = 'h-4',
  rounded  = 'rounded-md',
  className = '',
}) {
  return (
    <div
      className={`animate-shimmer ${width} ${height} ${rounded} ${className}`}
      aria-hidden="true"
    />
  )
}
