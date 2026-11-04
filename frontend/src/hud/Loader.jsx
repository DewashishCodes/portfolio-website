import { useProgress } from '@react-three/drei'
import { useEffect, useState } from 'react'
import content from '../content/content.json'
import { useRace } from '../store/useRace'

const HOLD = 400 // a beat at 100% before the fade
const FADE = 900
const GIVE_UP = 20000 // a failed asset must never trap the visitor behind the loader

// Tyre-warmer screen while assets load. The start lights belong to the grid (hud/Lights.jsx), not here.
export default function Loader() {
  const { progress, active } = useProgress()
  const [phase, setPhase] = useState('loading') // loading | out | gone
  const done = phase === 'loading' && !active && progress >= 100

  useEffect(() => {
    const id = setTimeout(() => setPhase((p) => (p === 'loading' ? 'out' : p)), GIVE_UP)
    return () => clearTimeout(id)
  }, [])
  useEffect(() => {
    if (!done) return
    const id = setTimeout(() => setPhase('out'), HOLD)
    return () => clearTimeout(id)
  }, [done])
  useEffect(() => {
    if (phase !== 'out') return
    useRace.setState({ ready: true })
    const id = setTimeout(() => setPhase('gone'), FADE)
    return () => clearTimeout(id)
  }, [phase])

  if (phase === 'gone') return null
  const { image, line } = content.ambientLines.loading
  const pct = Math.round(progress)
  return (
    <div role="status" aria-live="polite"
      className={`fixed inset-0 z-40 flex flex-col items-center justify-center bg-carbon transition-opacity duration-[600ms] ${phase === 'out' ? 'pointer-events-none opacity-0 delay-200' : ''}`}>
      <img src={image} alt="" aria-hidden="true" className="h-36 w-auto sm:h-44" />
      <p className="mt-4 text-sm text-cream/85">{line}</p>
      <div className="mt-4 h-1.5 w-56 overflow-hidden rounded-full bg-cream/10" aria-hidden="true">
        <div className="h-full rounded-full bg-saffron transition-[width] duration-200" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-3 font-mono text-[11px] tracking-[0.3em] text-cream/60">{phase === 'out' ? 'TYRES READY' : `LOADING ${pct}%`}</p>
    </div>
  )
}
