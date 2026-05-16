import { useEffect, useRef } from 'react'

export default function ParticleBackground({ count = 55, opacity = 1, className = '' }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    // ── Detect capabilities ────────────────────────────────────────────────
    const vw             = window.innerWidth
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const isTouchOnly    = !window.matchMedia('(pointer: fine)').matches

    // ── Adaptive particle count & connection distance ──────────────────────
    const effectiveCount = Math.min(count, vw < 768 ? 22 : vw < 1024 ? 38 : count)
    const connectDist    = vw < 768 ? 70 : 105

    // ── Canvas sizing ─────────────────────────────────────────────────────
    const resize = () => {
      canvas.width  = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resize()

    // ── Particles (init after resize so canvas.width is set) ──────────────
    const particles = Array.from({ length: effectiveCount }, () => ({
      x:    Math.random() * canvas.width,
      y:    Math.random() * canvas.height,
      vx:   (Math.random() - 0.5) * 0.32,
      vy:   (Math.random() - 0.5) * 0.32,
      r:    Math.random() * 1.4 + 0.5,
      // subtle two-tone palette: rose vs crimson
      rose: Math.random() > 0.5,
    }))

    // ── prefers-reduced-motion: static snapshot, no RAF ───────────────────
    if (prefersReduced) {
      const drawStatic = () => {
        resize()
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        for (const p of particles) {
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
          ctx.fillStyle = p.rose ? 'rgba(225,29,72,0.22)' : 'rgba(220,38,38,0.18)'
          ctx.fill()
        }
      }
      drawStatic()
      const ro = new ResizeObserver(drawStatic)
      ro.observe(canvas)
      return () => ro.disconnect()
    }

    // ── ResizeObserver for animated path ──────────────────────────────────
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    // ── Mouse tracking — pointer devices only, no event on touch ──────────
    const mouse = { x: -9999, y: -9999 }
    let onMove = null
    if (!isTouchOnly) {
      onMove = (e) => {
        const r = canvas.getBoundingClientRect()
        mouse.x = e.clientX - r.left
        mouse.y = e.clientY - r.top
      }
      window.addEventListener('mousemove', onMove, { passive: true })
    }

    // ── Animation loop ────────────────────────────────────────────────────
    let rafId
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0) p.x = canvas.width
        if (p.x > canvas.width)  p.x = 0
        if (p.y < 0) p.y = canvas.height
        if (p.y > canvas.height) p.y = 0

        // mouse attraction — skipped entirely on touch devices
        if (!isTouchOnly) {
          const dx = mouse.x - p.x
          const dy = mouse.y - p.y
          const d  = Math.sqrt(dx * dx + dy * dy)
          if (d < 90) {
            p.x += dx * 0.007
            p.y += dy * 0.007
          }
        }

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = p.rose ? 'rgba(225,29,72,0.42)' : 'rgba(220,38,38,0.36)'
        ctx.fill()
      }

      // O(n²) connections — capped by effectiveCount, shorter threshold on mobile
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const d  = Math.sqrt(dx * dx + dy * dy)
          if (d < connectDist) {
            ctx.beginPath()
            ctx.strokeStyle = `rgba(225,29,72,${0.11 * (1 - d / connectDist)})`
            ctx.lineWidth   = 0.5
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.stroke()
          }
        }
      }

      rafId = requestAnimationFrame(draw)
    }
    draw()

    return () => {
      cancelAnimationFrame(rafId)
      ro.disconnect()
      if (onMove) window.removeEventListener('mousemove', onMove)
    }
  }, [count])

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
      style={{ opacity }}
    />
  )
}
