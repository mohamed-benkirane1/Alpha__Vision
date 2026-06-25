import { useState, useEffect, useRef } from 'react'

const useCountUp = (target, duration = 1000, enabled = true) => {
  const [current, setCurrent] = useState(0)
  const rafRef = useRef(null)

  useEffect(() => {
    const safeTarget = typeof target === 'number' && !isNaN(target) && target > 0 ? target : 0
    const safeDuration = typeof duration === 'number' && duration > 0 ? duration : 1000

    if (!enabled || safeTarget === 0) {
      setCurrent(safeTarget)
      return
    }

    let start = null

    const step = (timestamp) => {
      if (!start) start = timestamp
      const progress = Math.min((timestamp - start) / safeDuration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCurrent(Math.floor(eased * safeTarget))
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step)
      } else {
        setCurrent(safeTarget)
      }
    }

    rafRef.current = requestAnimationFrame(step)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [target, duration, enabled])

  return current
}

export default useCountUp
