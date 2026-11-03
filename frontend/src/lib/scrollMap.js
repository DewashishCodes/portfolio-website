import content from '../content/content.json'

// Scroll layout in viewport units: each checkpoint holds for DWELL, straights take TRAVEL.
const DWELL = 1
const TRAVEL = 0.5
const CREEP = 0.0015 // track t the car still creeps during a dwell, so it never looks frozen

export const checkpoints = content.checkpoints

const segs = []
let u = 0
checkpoints.forEach((cp, i) => {
  if (i > 0) {
    segs.push({ type: 'travel', u0: u, u1: u + TRAVEL, t0: checkpoints[i - 1].trackT + CREEP, t1: cp.trackT - CREEP })
    u += TRAVEL
  }
  segs.push({ type: 'dwell', i, u0: u, u1: u + DWELL, t0: cp.trackT - CREEP, t1: cp.trackT + CREEP })
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
  return (s.u0 + 0.25 * DWELL) / SCROLL_UNITS
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
}
