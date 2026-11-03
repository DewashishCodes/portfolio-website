import { useRace } from '../store/useRace'

const fmt = (ms) => {
  const m = Math.floor(ms / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  const c = Math.floor((ms % 1000) / 10)
  return `${m}:${String(s).padStart(2, '0')}.${String(c).padStart(2, '0')}`
}

export default function LapTimer() {
  const lapMs = useRace((s) => Math.floor(s.lapMs / 10))
  const speed = useRace((s) => Math.round(s.speed))
  return (
    <div className="hud-glass fixed top-4 right-4 px-4 py-2 text-right font-mono tabular-nums" aria-hidden="true">
      <div className="text-[10px] tracking-[0.2em] text-cream/60">LAP 1/1</div>
      <div className="text-xl text-cream">{fmt(lapMs * 10)}</div>
      <div className="text-3xl font-bold leading-none text-saffron">
        {speed}
        <span className="ml-1 text-xs text-cream/60">KM/H</span>
      </div>
    </div>
  )
}
