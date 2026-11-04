import { useRace } from '../store/useRace'

export const fmtLap = (ms) => {
  const m = Math.floor(ms / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  const c = Math.floor((ms % 1000) / 10)
  return `${m}:${String(s).padStart(2, '0')}.${String(c).padStart(2, '0')}`
}

// The lap clock runs from lights out to the finish line and pauses while the tab is hidden (see Car.jsx).
export default function LapTimer() {
  const lapMs = useRace((s) => Math.floor(s.lapMs / 10))
  const speed = useRace((s) => Math.round(s.speed))
  const finished = useRace((s) => s.finishedAt > 0)
  const jumpStart = useRace((s) => s.jumpStart)
  const reaction = useRace((s) => s.reaction)
  return (
    <div className="hud-glass fixed top-4 right-4 px-4 py-2 text-right font-mono tabular-nums" aria-hidden="true">
      <div className="flex items-center justify-end gap-2 text-[10px] tracking-[0.2em] text-cream/60">
        {finished && <span className="chequer inline-block h-2.5 w-5" />}
        {finished ? 'FINISHED' : 'LAP 1/1'}
      </div>
      <div className={`text-xl ${finished ? 'text-saffron' : 'text-cream'}`}>{fmtLap(lapMs * 10)}</div>
      {(jumpStart || reaction != null) && (
        <div className={`text-[10px] tracking-[0.15em] ${jumpStart ? 'text-yellow-300' : 'text-cream/60'}`}>
          {jumpStart ? '+5S JUMP START' : `REACT ${(reaction / 1000).toFixed(3)}`}
        </div>
      )}
      <div className="text-3xl font-bold leading-none text-saffron">
        {speed}
        <span className="ml-1 text-xs text-cream/60">KM/H</span>
      </div>
    </div>
  )
}
