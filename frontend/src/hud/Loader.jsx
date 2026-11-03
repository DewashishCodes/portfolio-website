import { useProgress } from '@react-three/drei'
import { useEffect, useState } from 'react'

const HOLD = 700 // all five lit, then lights out
const FADE = 900
const GIVE_UP = 20000 // a failed asset must never trap the visitor behind the loader

// "Lights out": five start lights fill with load progress and go out at 100%.
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
    const id = setTimeout(() => setPhase('gone'), FADE)
    return () => clearTimeout(id)
  }, [phase])

  if (phase === 'gone') return null
  const lit = phase === 'out' ? 0 : Math.min(5, Math.floor(progress / 20))
  return (
    <div role="status" aria-live="polite"
      className={`fixed inset-0 z-40 flex flex-col items-center justify-center bg-carbon transition-opacity duration-[600ms] ${phase === 'out' ? 'pointer-events-none opacity-0 delay-300' : ''}`}>
      <div className="flex gap-2.5 rounded-xl bg-[#0b0b0c] p-3.5 ring-1 ring-cream/10 sm:gap-4 sm:p-5" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((i) => (
          <span key={i} className={`size-10 rounded-full transition-[background-color,box-shadow] duration-150 sm:size-14 ${i < lit ? 'bg-[#ff1a1a] shadow-[0_0_28px_6px_rgba(255,26,26,0.55)]' : 'bg-[#2a0707]'}`} />
        ))}
      </div>
      <p className="mt-6 font-mono text-xs tracking-[0.3em] text-cream/70">
        {phase === 'out' ? 'LIGHTS OUT · SCROLL TO LAUNCH' : `LOADING ${Math.round(progress)}%`}
      </p>
    </div>
  )
}
