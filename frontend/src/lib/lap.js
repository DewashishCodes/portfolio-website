// Lap bookkeeping: sector times with F1 colours, personal bests in localStorage, and lap validity.
import { useRace } from '../store/useRace'
import { checkpoints } from './scrollMap'

export const SECTORS = [0.33, 0.66] // trackT of the S1/S2 and S2/S3 lines; S3 ends at the finish line
const HOLD = 250 // ms the car must hold in a dwell for it to count as visited (a minimap jump only flies through)
const KEY = 'dl-gp-bests'
const INITIALS = 'dl-gp-initials'

export const COLOR = { purple: '#b36bff', green: '#3ad16b', yellow: '#f5d90a', invalid: '#8a8a8a' }

function read(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback
  } catch {
    return fallback
  }
}
function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // private mode or blocked storage: bests just don't persist
  }
}

// { best: [s1, s2, s3], last: [s1, s2, s3], lap: ms } from earlier valid laps on this browser.
const bests = read(KEY, {})

export const savedInitials = () => read(INITIALS, '')
export const saveInitials = (v) => write(INITIALS, v)

// Called by the car when it crosses a sector line (or the finish line for S3), with the lap clock at that moment.
// Purple: fastest this visitor has ever done. Green: faster than their previous lap. Yellow: neither.
export function completeSector(lapMs) {
  const s = useRace.getState()
  const i = s.sectors.length
  if (i > 2) return
  const ms = Math.round(lapMs - s.sectors.reduce((a, x) => a + x.ms, 0))
  let color = 'invalid'
  if (!s.invalid) {
    const best = bests.best?.[i]
    const last = bests.last?.[i]
    color = best == null || ms < best ? 'purple' : last != null && ms < last ? 'green' : 'yellow'
  }
  const sectors = [...s.sectors, { ms, color }]
  useRace.setState({ sectors, sectorFlash: { i, ms, color, at: performance.now() } })
  if (s.invalid || sectors.length < 3) return
  // Lap complete and valid: fold it into the personal bests.
  const times = sectors.map((x) => x.ms)
  bests.best = times.map((t, k) => Math.min(t, bests.best?.[k] ?? Infinity))
  bests.last = times
  bests.lap = Math.min(Math.round(lapMs), bests.lap ?? Infinity)
  write(KEY, bests)
}

export const personalBest = () => bests.lap ?? null

// Validity: every dwell must be held, in order, before the finish. Skipping ahead (End, the minimap,
// a flick that flies through a checkpoint) marks the lap invalid straight away, like track limits.
export function trackValidity() {
  const visited = new Set()
  let enteredAt = performance.now()
  return useRace.subscribe((s, p) => {
    if (s.active === p.active) return
    const now = performance.now()
    if (p.active >= 0 && s.lightsOut && now - enteredAt >= HOLD) visited.add(p.active)
    if (s.active < 0) return
    enteredAt = now
    if (!s.lightsOutAt || s.finishedAt || s.invalid) return
    for (let j = 0; j < s.active; j++) {
      if (!visited.has(j)) {
        useRace.setState({ invalid: true })
        return
      }
    }
  })
}

export const LAST = checkpoints.length - 1
