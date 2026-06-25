import { useEffect, useState } from 'react'

/**
 * Anime un nombre de 0 vers target avec un easing ease-out cubic.
 * @param {number}  target   — valeur finale
 * @param {number}  duration — durée en ms (défaut 900)
 * @param {boolean} enabled  — désactive si false ou si prefers-reduced-motion
 * @returns {number} valeur courante animée
 */
export function useCountUp(target, duration = 900, enabled = true) {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    if (!enabled || typeof target !== 'number' || !Number.isFinite(target)) {
      setCurrent(target ?? 0)
      return
    }

    let rafId = null
    let start = null
    setCurrent(0)

    const step = (timestamp) => {
      if (!start) start = timestamp
      const progress = Math.min((timestamp - start) / duration, 1)
      const eased    = 1 - Math.pow(1 - progress, 3)
      setCurrent(Math.floor(eased * target))
      if (progress < 1) {
        rafId = requestAnimationFrame(step)
      } else {
        setCurrent(target)
      }
    }

    rafId = requestAnimationFrame(step)
    return () => { if (rafId) cancelAnimationFrame(rafId) }
  }, [target, duration, enabled])

  return current
}
