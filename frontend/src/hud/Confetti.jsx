import { useEffect, useRef } from 'react'
import content from '../content/content.json'
import { useRace } from '../store/useRace'

const COLORS = [...Object.values(content.livery.colors ?? {}), '#F2E8D5', '#E86A1F', '#C4161C'].filter((c) => /^#/.test(c))
const COUNT = 140
const LIFE = 2200 // ms

// One-shot confetti bursts on a 2D canvas, fired by bumping `confetti` in the store. Off for reduced motion.
export default function Confetti() {
  const canvas = useRef()
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let raf = 0
    let parts = []
    let t0 = 0
    const frame = (now) => {
      const c = canvas.current
      const g = c.getContext('2d')
      const dt = 1 / 60
      g.clearRect(0, 0, c.width, c.height)
      const age = now - t0
      for (const p of parts) {
        p.vy += 900 * dt
        p.vx *= 0.985
        p.x += p.vx * dt
        p.y += p.vy * dt
        p.r += p.spin * dt
        g.save()
        g.globalAlpha = Math.max(0, 1 - age / LIFE)
        g.translate(p.x, p.y)
        g.rotate(p.r)
        g.scale(1, Math.cos(p.r * 1.7)) // flutter
        g.fillStyle = p.color
        g.fillRect(-p.w / 2, -p.h / 2, p.w, p.h)
        g.restore()
      }
      if (age < LIFE) raf = requestAnimationFrame(frame)
      else g.clearRect(0, 0, c.width, c.height)
    }
    const fire = () => {
      const c = canvas.current
      c.width = innerWidth
      c.height = innerHeight
      t0 = performance.now()
      parts = Array.from({ length: COUNT }, (_, i) => {
        const left = i % 2 === 0 // two cannons, bottom corners
        const a = 0.2 + Math.random() * 0.5 // radians off vertical, leaning in toward the centre
        const v = 700 + Math.random() * 600
        return {
          x: left ? 0 : c.width, y: c.height * 0.85,
          vx: (left ? 1 : -1) * Math.sin(a) * v, vy: -Math.cos(a) * v,
          r: Math.random() * 6, spin: (Math.random() - 0.5) * 14,
          w: 6 + Math.random() * 6, h: 3 + Math.random() * 4, color: COLORS[i % COLORS.length],
        }
      })
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(frame)
    }
    const unsub = useRace.subscribe((s, prev) => s.confetti !== prev.confetti && fire())
    return () => {
      unsub()
      cancelAnimationFrame(raf)
    }
  }, [])
  return <canvas ref={canvas} className="pointer-events-none fixed inset-0 z-30" aria-hidden="true" />
}
