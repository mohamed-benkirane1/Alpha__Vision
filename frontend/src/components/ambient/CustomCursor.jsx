import { useEffect, useRef, useState } from 'react'

export default function CustomCursor() {
  const dotRef  = useRef(null)
  const ringRef = useRef(null)
  const pos     = useRef({ x: -200, y: -200 })
  const ring    = useRef({ x: -200, y: -200 })
  const rafRef  = useRef(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Skip custom cursor entirely when user prefers reduced motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const checkPointer = (e) => {
      if (e.pointerType === 'mouse') {
        setReady(true)
        window.removeEventListener('pointermove', checkPointer)
      }
    }
    window.addEventListener('pointermove', checkPointer)
    return () => window.removeEventListener('pointermove', checkPointer)
  }, [])

  useEffect(() => {
    if (!ready) return

    const lerp = (a, b, t) => a + (b - a) * t

    const onMove = (e) => {
      pos.current = { x: e.clientX, y: e.clientY }
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${e.clientX - 4}px, ${e.clientY - 4}px)`
      }
    }

    const animate = () => {
      ring.current.x = lerp(ring.current.x, pos.current.x, 0.11)
      ring.current.y = lerp(ring.current.y, pos.current.y, 0.11)
      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${ring.current.x - 18}px, ${ring.current.y - 18}px)`
      }
      rafRef.current = requestAnimationFrame(animate)
    }

    const onOver = (e) => {
      const el = e.target.closest('a, button, [role="button"], input, select, textarea, label')
      if (el && ringRef.current) {
        ringRef.current.style.width       = '42px'
        ringRef.current.style.height      = '42px'
        ringRef.current.style.borderColor = 'rgba(225,29,72,0.65)'
        ringRef.current.style.background  = 'rgba(225,29,72,0.06)'
        ringRef.current.style.marginLeft  = '-3px'
        ringRef.current.style.marginTop   = '-3px'
      }
    }
    const onOut = () => {
      if (ringRef.current) {
        ringRef.current.style.width       = '36px'
        ringRef.current.style.height      = '36px'
        ringRef.current.style.borderColor = 'rgba(225,29,72,0.28)'
        ringRef.current.style.background  = 'transparent'
        ringRef.current.style.marginLeft  = '0'
        ringRef.current.style.marginTop   = '0'
      }
    }

    window.addEventListener('mousemove', onMove, { passive: true })
    document.addEventListener('mouseover', onOver)
    document.addEventListener('mouseout', onOut)
    rafRef.current = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseover', onOver)
      document.removeEventListener('mouseout', onOut)
      cancelAnimationFrame(rafRef.current)
    }
  }, [ready])

  if (!ready) return null

  return (
    <>
      <style>{`* { cursor: none !important; }`}</style>
      <div
        ref={dotRef}
        style={{
          position: 'fixed', top: 0, left: 0, zIndex: 99999,
          width: '8px', height: '8px', borderRadius: '50%',
          background: 'rgba(225,29,72,0.95)',
          pointerEvents: 'none', willChange: 'transform',
          boxShadow: '0 0 8px rgba(225,29,72,0.9), 0 0 20px rgba(225,29,72,0.4)',
        }}
      />
      <div
        ref={ringRef}
        style={{
          position: 'fixed', top: 0, left: 0, zIndex: 99998,
          width: '36px', height: '36px', borderRadius: '50%',
          border: '1.5px solid rgba(225,29,72,0.28)',
          background: 'transparent',
          pointerEvents: 'none', willChange: 'transform',
          transition: 'width 0.22s ease, height 0.22s ease, border-color 0.22s ease, background 0.22s ease, margin 0.22s ease',
        }}
      />
    </>
  )
}
