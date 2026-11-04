import { useEffect, useState } from 'react'
import content from '../content/content.json'
import { unlock } from '../lib/achievements'
import { rig } from '../scene/rig'
import { chooseTyre, radio, scroller, useRace } from '../store/useRace'

const STEP = 400 // ms between red lights
const HOLD = 600 // minimum hold with all five lit; a random extra stops visitors timing it
const HOLD_JITTER = 600
const BURST_GAP = 250 // ms of quiet that separates one scroll gesture from the next (trackpad momentum is one gesture)
const PERFECT = 200
const SCROLL_KEYS = new Set(['ArrowDown', 'ArrowRight', 'PageDown', ' ', 'End', 'Enter'])

let lastIntent = -1e9
let timers = []

function begin() {
  const s = useRace.getState()
  if (!s.ready || s.start !== 'grid') return
  useRace.setState({ start: 'lights', lights: 1 })
  rig.rev = 70
  for (let i = 2; i <= 5; i++) timers.push(setTimeout(() => { useRace.setState({ lights: i }); rig.rev = 70 + i * 30 }, (i - 1) * STEP))
  timers.push(setTimeout(go, 4 * STEP + HOLD + Math.random() * HOLD_JITTER))
}

function go() {
  timers = []
  rig.rev = 0
  rig.launchAt = performance.now()
  scroller.lenis?.start()
  useRace.setState({ start: 'go', lights: 0, lightsOut: true, lightsOutAt: performance.now(), scrolledAt: performance.now() }) // idle line counts from here
  if (useRace.getState().jumpStart) radio('Jump start. Five second penalty. Kidding, mostly.', 'casual', 'smirk')
}

function react(now) {
  const s = useRace.getState()
  const ms = Math.round(now - s.lightsOutAt)
  useRace.setState({ reaction: ms })
  if (s.jumpStart) return
  if (ms < PERFECT) {
    unlock('perfect', { silent: true }) // the line below already says it
    radio(`Perfect start. ${(ms / 1000).toFixed(3)} reaction.`, 'casual', 'laugh')
    useRace.setState((x) => ({ confetti: x.confetti + 1 }))
  } else if (ms < 600) radio(`Good launch. ${(ms / 1000).toFixed(3)} off the line.`, 'casual', 'happy')
  else radio(`${(ms / 1000).toFixed(2)} seconds. Reading first? Fair.`, 'casual', 'smirk')
}

// One scroll intent: wheel tick, touch drag, scroll key or the START button.
function intent(e) {
  const now = performance.now()
  const fresh = now - lastIntent > BURST_GAP
  lastIntent = now
  const s = useRace.getState()
  if (s.start === 'grid') return begin()
  if (!fresh) return // the tail of a gesture that is already counted
  if (s.start === 'lights') return !s.jumpStart && useRace.setState({ jumpStart: true })
  if (s.reaction == null && s.lightsOutAt && e) react(now)
}

// Strategy call on the grid: how long each checkpoint holds. Same compound colours as the pit stop tabs.
export const TYRES = [
  { key: 'soft', label: 'SOFT', dot: '#e8322b', hint: 'Quick skim' },
  { key: 'medium', label: 'MEDIUM', dot: '#f5c518', hint: 'Balanced' },
  { key: 'hard', label: 'HARD', dot: '#f2f2f2', hint: 'Full read' },
]

function TyrePicker() {
  const tyre = useRace((s) => s.tyre)
  return (
    <div role="radiogroup" aria-label="Tyre strategy: how long each stop holds" className="flex gap-2 rounded-xl bg-[#0b0b0c]/85 p-2 ring-1 ring-cream/10">
      {TYRES.map((t) => (
        <button key={t.key} type="button" role="radio" aria-checked={tyre === t.key} onClick={() => chooseTyre(t.key)}
          className={`flex w-[92px] flex-col items-center rounded-lg px-2 py-1.5 font-mono transition-colors ${tyre === t.key ? 'bg-cream/15 ring-1 ring-cream/60' : 'hover:bg-cream/5'}`}>
          <span className="flex items-center gap-1.5 text-[11px] tracking-[0.15em] text-cream">
            <span className="size-3 rounded-full ring-2 ring-black/50" style={{ background: t.dot }} aria-hidden="true" />
            {t.label}
          </span>
          <span className="text-[10px] text-cream/60">{t.hint}</span>
        </button>
      ))}
    </div>
  )
}

// Skip the ceremony (back from the Pit Lane, or the page loaded part-way down).
export function skipStart() {
  timers.forEach(clearTimeout)
  timers = []
  useRace.setState({ start: 'go', lights: 0, lightsOut: true })
}

export default function Lights() {
  const start = useRace((s) => s.start)
  const lights = useRace((s) => s.lights)
  const ready = useRace((s) => s.ready)
  const [shown, setShown] = useState(() => useRace.getState().start !== 'go') // fades out a moment after lights out

  useEffect(() => {
    const key = (e) => SCROLL_KEYS.has(e.key) && !e.target.closest?.('input, textarea, select, button, a, [role="button"]') && intent(e)
    window.addEventListener('wheel', intent, { passive: true })
    window.addEventListener('touchmove', intent, { passive: true })
    window.addEventListener('keydown', key)
    return () => {
      window.removeEventListener('wheel', intent)
      window.removeEventListener('touchmove', intent)
      window.removeEventListener('keydown', key)
    }
  }, [])

  useEffect(() => {
    if (start !== 'go') return
    const id = setTimeout(() => setShown(false), 1600)
    return () => clearTimeout(id)
  }, [start])

  if (!shown) return null
  const out = start === 'go'
  return (
    <div className={`pointer-events-none fixed inset-x-0 top-[14vh] z-30 flex flex-col items-center transition-opacity duration-500 ${out ? 'opacity-0 delay-700' : ''}`}>
      <div className="flex gap-2 rounded-xl bg-[#0b0b0c]/90 p-3 ring-1 ring-cream/10 sm:gap-3 sm:p-4" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((i) => (
          <span key={i} className="flex flex-col gap-1.5">
            {[0, 1].map((r) => (
              <span key={r} className={`size-7 rounded-full transition-[background-color,box-shadow] duration-75 sm:size-10 ${i <= lights ? 'bg-[#ff1a1a] shadow-[0_0_24px_5px_rgba(255,26,26,0.55)]' : 'bg-[#2a0707]'}`} />
            ))}
          </span>
        ))}
      </div>
      <p className="mt-4 font-mono text-xs tracking-[0.3em] text-cream drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]" role="status" aria-live="polite">
        {out ? 'LIGHTS OUT AND AWAY WE GO' : start === 'lights' ? 'HOLD IT…' : ready ? 'SCROLL TO START' : ''}
      </p>
      {start === 'grid' && ready && (
        <div className="pointer-events-auto mt-5 flex flex-col items-center gap-2">
          <TyrePicker />
          <button type="button" onClick={() => intent()}
            className="rounded-md bg-saffron px-5 py-2 font-mono text-xs tracking-[0.25em] text-carbon hover:bg-cream focus-visible:outline-2 focus-visible:outline-cream">
            START THE LAP
          </button>
          <p className="font-mono text-[11px] tracking-[0.15em] text-cream/80 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
            {content.profile.name} · or press P for the Pit Lane
          </p>
        </div>
      )}
    </div>
  )
}
