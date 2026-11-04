import { useEffect, useState } from 'react'
import { COLOR, SECTORS as LINES } from '../lib/lap'
import { checkpoints, FINISH_T } from '../lib/scrollMap'
import { useRace } from '../store/useRace'

export const fmtLap = (ms) => {
  const m = Math.floor(ms / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  const c = Math.floor((ms % 1000) / 10)
  return `${m}:${String(s).padStart(2, '0')}.${String(c).padStart(2, '0')}`
}

const SECTORS = [...LINES, FINISH_T] // trackT where each sector ends
const FLASH_MS = 3000

// The last sector time, in its colour, for a few seconds after the car crosses the line.
function useFlash() {
  const flash = useRace((s) => s.sectorFlash)
  const [live, setLive] = useState(false)
  useEffect(() => {
    if (!flash) return
    setLive(true)
    const id = setTimeout(() => setLive(false), FLASH_MS)
    return () => clearTimeout(id)
  }, [flash])
  return live ? flash : null
}

// The primary HUD element: where you are, the lap clock, sector progress, speed.
// The clock runs from lights out to the finish line and pauses while the tab is hidden (see Car.jsx).
export default function LapTimer() {
  const lapMs = useRace((s) => Math.floor(s.lapMs / 10))
  const speed = useRace((s) => Math.round(s.speed))
  const t = useRace((s) => Math.round(s.t * 200) / 200)
  const active = useRace((s) => s.active)
  const finished = useRace((s) => s.finishedAt > 0)
  const jumpStart = useRace((s) => s.jumpStart)
  const reaction = useRace((s) => s.reaction)
  const sectors = useRace((s) => s.sectors)
  const invalid = useRace((s) => s.invalid)
  const flash = useFlash()
  const cp = checkpoints[active]
  return (
    <div className="hud-glass fixed top-4 right-4 w-[240px] overflow-hidden font-mono tabular-nums">
      <div aria-live="polite" className="flex h-7 items-center gap-2 bg-cream/5 px-3 text-[11px] tracking-[0.15em] text-cream">
        {cp ? <><span className="shrink-0 whitespace-nowrap text-saffron">{cp.label}</span><span className="truncate">{cp.title.toUpperCase()}</span></> : <span className="text-cream/50">ON TRACK</span>}
      </div>
      <div className="flex items-end justify-between px-3 pt-1.5" aria-hidden="true">
        <div>
          <div className="flex items-center gap-1.5 text-[10px] tracking-[0.2em] text-cream/60">
            {finished && <span className="chequer inline-block h-2.5 w-5" />}
            {finished ? 'FINISHED' : 'LAP 1/1'}
            {invalid && <span className="text-yellow-300">· INVALID</span>}
          </div>
          <div className={`text-[28px] font-bold leading-tight ${finished ? 'text-saffron' : 'text-cream'}`}>{fmtLap(lapMs * 10)}</div>
        </div>
        <div className="pb-1 text-right">
          <div className="text-xl font-bold leading-none text-saffron">{speed}</div>
          <div className="text-[9px] tracking-[0.2em] text-cream/60">KM/H</div>
        </div>
      </div>
      <div className="flex gap-1 px-3 pt-1.5 pb-2" aria-hidden="true">
        {SECTORS.map((end, i) => {
          const start = i ? SECTORS[i - 1] : 0
          const done = sectors[i]
          const fill = done ? 1 : Math.min(0.98, Math.max(0, (t - start) / (end - start)))
          return (
            <div key={i} className="flex-1">
              <div className="h-1 overflow-hidden rounded-full bg-cream/15">
                <div className="h-full bg-cream/70" style={{ width: `${fill * 100}%`, ...(done && { background: COLOR[done.color] }) }} />
              </div>
              <div className="mt-0.5 text-[9px] tracking-[0.2em] text-cream/50">S{i + 1}</div>
            </div>
          )
        })}
      </div>
      {flash && (
        <div className="flex items-center justify-between px-3 py-1 text-sm font-bold" style={{ background: `${COLOR[flash.color]}26`, color: COLOR[flash.color] }}>
          <span>SECTOR {flash.i + 1}</span>
          <span>{(flash.ms / 1000).toFixed(3)}</span>
        </div>
      )}
      {invalid && !finished && (
        <div className="bg-yellow-300/15 px-3 py-1 text-center text-[11px] font-bold tracking-[0.25em] text-yellow-300" role="status">LAP INVALID</div>
      )}
      {(jumpStart || reaction != null) && (
        <div className={`border-t border-cream/10 px-3 py-1 text-[10px] tracking-[0.15em] ${jumpStart ? 'text-yellow-300' : 'text-cream/60'}`} aria-hidden="true">
          {jumpStart ? '+5S JUMP START' : `REACTION ${(reaction / 1000).toFixed(3)}`}
        </div>
      )}
    </div>
  )
}
