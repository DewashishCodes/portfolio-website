import { create } from 'zustand'
import { forcePit, manualTier, maxTier } from '../lib/quality'
import { DWELLS, setDwell } from '../lib/scrollMap'

// 19:00 to 06:00 local time races under floodlights.
function isNight() {
  const q = new URLSearchParams(location.search).get('time')
  if (q === 'night' || q === 'day') return q === 'night'
  const h = new Date().getHours()
  return h >= 19 || h < 6
}

const TYRE_KEY = 'dl-gp-tyre'
const savedTyre = (() => {
  try {
    const t = localStorage.getItem(TYRE_KEY)
    return DWELLS[t] ? t : 'medium'
  } catch {
    return 'medium'
  }
})()
setDwell(DWELLS[savedTyre])

// progress: scroll 0..1. t: damped track position. speed: km/h. active: checkpoint index or -1.
export const useRace = create(() => ({
  progress: 0,
  t: 0,
  speed: 0,
  active: 0,
  lapMs: 0,
  quality: manualTier ?? maxTier, // high | medium | low
  qualityAuto: !manualTier, // PerformanceMonitor may step tiers only while on Auto
  soundOn: false,
  dir: 1, // last scroll direction: 1 forward, -1 reverse
  scrolledAt: 0, // performance.now() of the last scroll, for the idle line
  pitLane: forcePit || location.hash === '#pitlane',
  ready: false, // loader gone, the grid accepts a start
  start: 'grid', // grid -> lights (five reds, input locked) -> go
  lights: 0, // red lights lit, 0..5
  lightsOut: false, // true once start === 'go'
  lightsOutAt: 0, // performance.now() at lights out; the lap clock runs from here
  reaction: null, // ms from lights out to the visitor's first scroll
  jumpStart: false, // scrolled while the lights were on (cosmetic penalty)
  finishedAt: 0, // performance.now() the car crossed the finish line
  tower: false, // finish banner done, the timing tower is up
  interview: false, // timing tower dismissed, the contact panel may open
  sectors: [], // completed sectors this lap: { ms, color }
  sectorFlash: null, // last sector crossed, for the HUD flash: { i, ms, color, at }
  invalid: false, // skipped a checkpoint: the lap cannot go on the leaderboard
  cue: null, // transient radio line { line, outfit, expression, at }, wins over the checkpoint line
  confetti: 0, // bump to fire a confetti burst
  tyre: savedTyre, // soft | medium | hard: dwell length per checkpoint, picked on the grid
  drsZone: false, // car is inside a DRS zone
  drs: false, // DRS open: scroll counts double
  boards: 0, // hidden pit boards found (seeded from localStorage by lib/achievements)
  achievements: 0,
  night: isNight(), // floodlit night race: the visitor's local evening and night, or ?time=night / ?time=day
  goTo: null, // checkpoint to jump to when the lap view mounts
}))

export function radio(line, outfit = 'casual', expression = 'happy') {
  useRace.setState({ cue: { line, outfit, expression, at: performance.now() } })
}

// Tyre choice: a reading-speed selector dressed as race strategy. Grid only, before lights out.
export function chooseTyre(tyre) {
  if (!DWELLS[tyre] || useRace.getState().start !== 'grid') return
  setDwell(DWELLS[tyre])
  useRace.setState({ tyre })
  try {
    localStorage.setItem(TYRE_KEY, tyre)
  } catch {
    // not remembered; fine
  }
  requestAnimationFrame(() => scroller.lenis?.resize()) // after React has resized the scroll spacer
}

// Lenis instance, set once in App; minimap and keyboard use it to jump.
export const scroller = { lenis: null }

export function openPitLane() {
  if (useRace.getState().pitLane) return
  const s = useRace.getState()
  // Leaving the track mid-lap is a shortcut: the lap can no longer be classified.
  useRace.setState({ pitLane: true, goTo: s.active, ...(s.lightsOutAt && !s.finishedAt && { invalid: true }) })
  history.replaceState(null, '', '#pitlane')
  window.scrollTo(0, 0)
}

// i: checkpoint to land on; defaults to where the visitor left the lap.
export function closePitLane(i = useRace.getState().goTo) {
  if (forcePit) return
  useRace.setState({ pitLane: false, goTo: i ?? 0 })
  history.replaceState(null, '', location.pathname + location.search)
}
