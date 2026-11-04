// DRS: two zones on the longest straights. Inside a zone, holding Shift (or a long press on touch)
// doubles every scroll delta and opens the rear-wing flap. Teaches fast navigation as a race mechanic.
import { useRace } from '../store/useRace'
import { checkpoints, FINISH_T, START_T } from './scrollMap'
import { TRACK_LENGTH, turnAt } from './trackSpline'

const STEP = 2 / TRACK_LENGTH // scan resolution: 2 m
const CLEAR = 35 / TRACK_LENGTH // keep zones this far from any checkpoint, so DRS never fires while reading
const MIN = 140 / TRACK_LENGTH // shortest run that counts as a straight
const BOOST = 2
const LONG_PRESS = 350 // ms of still finger before a touch counts as holding DRS

function findZones() {
  for (const straight of [1 / 900, 1 / 500, 1 / 300]) { // loosen the "straight" test until two runs qualify
    const runs = []
    let a = null
    for (let t = START_T; t <= FINISH_T; t += STEP) {
      const ok = Math.abs(turnAt(t)) < straight && !checkpoints.some((c) => Math.abs(c.trackT - t) < CLEAR)
      if (ok && a == null) a = t
      if (!ok && a != null) {
        if (t - a >= MIN) runs.push([a, t])
        a = null
      }
    }
    if (runs.length >= 2) {
      return runs.sort((x, y) => (y[1] - y[0]) - (x[1] - x[0])).slice(0, 2)
        .map(([s, e]) => [s + 15 / TRACK_LENGTH, e]) // the zone opens a little after the detection board
        .sort((x, y) => x[0] - y[0])
    }
  }
  return []
}

export const ZONES = findZones()
if (import.meta.env.DEV) console.assert(ZONES.length === 2, 'drs: expected two zones, found', ZONES.length)

let held = false
export const drsHeld = () => held

// Called from Car's frame loop with the car's track position.
export function updateDrs(t) {
  const s = useRace.getState()
  const zone = s.lightsOut && !s.finishedAt && ZONES.some(([a, b]) => t >= a && t <= b)
  const open = zone && held
  if (zone !== s.drsZone || open !== s.drs) useRace.setState({ drsZone: zone, drs: open })
}

// Lenis virtualScroll hook: runs on every wheel / touch delta before Lenis uses it. Mutating data is supported.
export function drsDelta(data) {
  const e = data.event
  // Windows turns Shift+wheel into a horizontal scroll; read it back as vertical so Shift can be the DRS button.
  if (e.shiftKey && e.type === 'wheel' && data.deltaY === 0 && data.deltaX !== 0) {
    data.deltaY = data.deltaX
    data.deltaX = 0
  }
  if (useRace.getState().drs) {
    data.deltaX *= BOOST
    data.deltaY *= BOOST
  }
}

const typing = (el) => el?.closest?.('input, textarea, select, [contenteditable="true"]')

// Shift on desktop, long press on touch. Returns a cleanup.
export function listenDrs() {
  let timer = 0
  let x0 = 0
  let y0 = 0
  const key = (e) => {
    if (e.key === 'Shift' && !typing(e.target)) held = e.type === 'keydown'
  }
  const release = () => {
    clearTimeout(timer)
    held = false
  }
  const down = (e) => {
    const p = e.touches[0]
    x0 = p.clientX
    y0 = p.clientY
    clearTimeout(timer)
    timer = setTimeout(() => (held = true), LONG_PRESS)
  }
  const move = (e) => {
    const p = e.touches[0]
    if (!held && Math.hypot(p.clientX - x0, p.clientY - y0) > 12) clearTimeout(timer) // a swipe, not a press
  }
  addEventListener('keydown', key)
  addEventListener('keyup', key)
  addEventListener('blur', release)
  addEventListener('touchstart', down, { passive: true })
  addEventListener('touchmove', move, { passive: true })
  addEventListener('touchend', release)
  addEventListener('touchcancel', release)
  return () => {
    release()
    removeEventListener('keydown', key)
    removeEventListener('keyup', key)
    removeEventListener('blur', release)
    removeEventListener('touchstart', down)
    removeEventListener('touchmove', move)
    removeEventListener('touchend', release)
    removeEventListener('touchcancel', release)
  }
}
