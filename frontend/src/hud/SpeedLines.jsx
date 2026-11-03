import { useEffect, useRef } from 'react'
import { useRace } from '../store/useRace'

// Radial streaks at the edges of the frame, opacity tied to speed. Pure CSS, no WebGL pass.
// Written straight to the DOM from a store subscription so it never re-renders React.
export default function SpeedLines() {
  const el = useRef()
  useEffect(() => useRace.subscribe((s) => {
    const k = Math.max(0, (s.speed - 120) / 200)
    if (el.current) el.current.style.opacity = String(Math.min(0.85, k * k * 1.2).toFixed(3))
  }), [])
  return <div ref={el} className="speed-lines pointer-events-none fixed inset-0" style={{ opacity: 0 }} aria-hidden="true" />
}
