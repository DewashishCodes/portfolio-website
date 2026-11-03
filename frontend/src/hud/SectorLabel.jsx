import { checkpoints } from '../lib/scrollMap'
import { useRace } from '../store/useRace'

export default function SectorLabel() {
  const active = useRace((s) => s.active)
  const cp = checkpoints[active]
  return (
    <div aria-live="polite" className="fixed top-4 left-1/2 -translate-x-1/2 text-center">
      {cp && (
        <div className="hud-glass px-5 py-1.5 font-mono text-sm tracking-[0.2em] text-cream">
          <span className="text-saffron">{cp.label}</span>
          {cp.label !== cp.title.toUpperCase() && <> · {cp.title.toUpperCase()}</>}
        </div>
      )}
    </div>
  )
}
