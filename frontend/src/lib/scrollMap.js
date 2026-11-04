import content from '../content/content.json'
import { TRACK_LENGTH } from './trackSpline'

// Scroll layout in viewport units: each checkpoint holds for DWELL, straights take TRAVEL.
const DWELL = 1
const TRAVEL = 0.5
const CREEP = 0.0015 // track t the car still creeps during a dwell, so it never looks frozen

export const checkpoints = content.checkpoints
const last = checkpoints.length - 1

// Start and finish lines (the gantries in SetPieces sit here). The last dwell runs past the finish line,
// so the car crosses it slowly while the visitor scrolls the final viewport: the slow-motion finish.
export const START_T = checkpoints[0].trackT + 55 / TRACK_LENGTH
export const FINISH_T = checkpoints[last].trackT + 25 / TRACK_LENGTH
const RUN_OUT = 20 / TRACK_LENGTH
const FINISH_AT = 0.9 // where in the finish dwell a jump lands: past the line, so jumping there still finishes

const segs = []
let u = 0
const creep = (cp) => (cp.stop ? 0 : CREEP) // a "stop" checkpoint (the pit box) holds the car dead still
checkpoints.forEach((cp, i) => {
  if (i > 0) {
    segs.push({ type: 'travel', u0: u, u1: u + TRAVEL, t0: checkpoints[i - 1].trackT + creep(checkpoints[i - 1]), t1: cp.trackT - creep(cp) })
    u += TRAVEL
  }
  segs.push({ type: 'dwell', i, u0: u, u1: u + DWELL, t0: cp.trackT - creep(cp), t1: i === last ? FINISH_T + RUN_OUT : cp.trackT + creep(cp) })
  u += DWELL
})

// Total scrollable distance in viewports; page height = this + 1 viewport.
export const SCROLL_UNITS = u

const smooth = (x) => x * x * (3 - 2 * x)

// progress 0..1 -> { t, active } where active = checkpoint index or -1 on a straight.
export function mapProgress(p) {
  const pu = Math.min(Math.max(p, 0), 1) * SCROLL_UNITS
  const s = segs.find((g) => pu <= g.u1) ?? segs[segs.length - 1]
  const x = (pu - s.u0) / (s.u1 - s.u0)
  const t = s.t0 + (s.t1 - s.t0) * (s.type === 'travel' ? smooth(x) : x)
  return { t, active: s.type === 'dwell' ? s.i : -1 }
}

// Progress value that lands a little inside checkpoint i's dwell zone.
export function checkpointProgress(i) {
  const s = segs.find((g) => g.type === 'dwell' && g.i === i)
  return (s.u0 + (i === last ? FINISH_AT : 0.25) * DWELL) / SCROLL_UNITS
}

// Self-check: t never decreases with progress and every checkpoint resolves to itself.
if (import.meta.env.DEV) {
  let prev = -1
  for (let k = 0; k <= 1000; k++) {
    const { t } = mapProgress(k / 1000)
    console.assert(t >= prev - 1e-9, 'scrollMap: t went backwards at', k)
    prev = t
  }
  checkpoints.forEach((_, i) => console.assert(mapProgress(checkpointProgress(i)).active === i, 'scrollMap: cp', i))
  console.assert(mapProgress(checkpointProgress(last)).t > FINISH_T, 'scrollMap: finish jump lands short of the line')
}
