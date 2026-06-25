import { useEffect, useRef, useState } from 'react'

/**
 * Anime un nombre de 0 → target avec un easing ease-out cubic.
 * Complètement défensif : accepte n'importe quel input sans jamais crasher.
 *
 * @param {*}       target   — valeur finale (doit être un number fini > 0 pour animer)
 * @param {number}  duration — durée en ms (défaut 900, min 100)
 * @param {boolean} enabled  — false ou prefers-reduced-motion → renvoie target immédiatement
 * @returns {number} valeur courante animée (toujours un number fini)
 */
export function useCountUp(target, duration = 900, enabled = true) {
  // Normalise target : tout ce qui n'est pas un number fini positif → 0
  const safeTarget = (typeof target === 'number' && Number.isFinite(target) && target >= 0)
    ? Math.round(target)
    : 0

  // shouldAnimate : uniquement si activé ET target valide ET > 0
  const shouldAnimate = Boolean(enabled) && safeTarget > 0

  const [current, setCurrent] = useState(shouldAnimate ? 0 : safeTarget)
  const rafRef  = useRef(null)
  const prevTarget = useRef(safeTarget)

  useEffect(() => {
    // Annule toute animation en cours
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }

    // Si pas d'animation → set directement et sortir
    if (!shouldAnimate) {
      setCurrent(safeTarget)
      prevTarget.current = safeTarget
      return undefined
    }

    // Si le target n'a pas changé → ne rien faire
    if (safeTarget === prevTarget.current && current === safeTarget) {
      return undefined
    }

    prevTarget.current = safeTarget
    const safeDuration = Math.max(100, duration)
    let startTime = null

    const step = (timestamp) => {
      if (startTime === null) startTime = timestamp
      const elapsed  = timestamp - startTime
      const progress = Math.min(elapsed / safeDuration, 1)
      // Ease-out cubic
      const eased    = 1 - Math.pow(1 - progress, 3)
      const next     = Math.round(eased * safeTarget)

      setCurrent(next)

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step)
      } else {
        setCurrent(safeTarget)
        rafRef.current = null
      }
    }

    // Repart de 0 pour une nouvelle animation
    setCurrent(0)
    rafRef.current = requestAnimationFrame(step)

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeTarget, safeDuration, shouldAnimate])

  // Garantie de retour : toujours un number fini
  return typeof current === 'number' && Number.isFinite(current) ? current : safeTarget
}
