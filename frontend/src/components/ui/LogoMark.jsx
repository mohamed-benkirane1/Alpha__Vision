/**
 * Shared LogoMark — source unique du logo SVG Alpha Vision.
 * Gradient ID fixe 'lgAlphaVision' — plus de conflits entre instances.
 */
export default function LogoMark({ size = 32, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 34 34"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <defs>
        <linearGradient id="lgAlphaVision" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#e11d48" />
          <stop offset="100%" stopColor="#dc2626" />
        </linearGradient>
      </defs>
      <polygon points="17,2 32,31 2,31" fill="url(#lgAlphaVision)" />
      <polygon points="17,10 26,29 8,29" fill="#06020c" />
      <rect x="10" y="21" width="14" height="2.5" fill="url(#lgAlphaVision)" />
    </svg>
  )
}
