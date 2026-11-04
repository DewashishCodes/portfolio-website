import { create } from 'zustand'
import { forcePit, manualTier, maxTier } from '../lib/quality'

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
  interview: false, // finish banner done, the contact panel may open
  cue: null, // transient radio line { line, outfit, expression, at }, wins over the checkpoint line
  confetti: 0, // bump to fire a confetti burst
  goTo: null, // checkpoint to jump to when the lap view mounts
}))

export function radio(line, outfit = 'casual', expression = 'happy') {
  useRace.setState({ cue: { line, outfit, expression, at: performance.now() } })
}

// Lenis instance, set once in App; minimap and keyboard use it to jump.
export const scroller = { lenis: null }

export function openPitLane() {
  if (useRace.getState().pitLane) return
  useRace.setState({ pitLane: true, goTo: useRace.getState().active })
  history.replaceState(null, '', '#pitlane')
  window.scrollTo(0, 0)
}

// i: checkpoint to land on; defaults to where the visitor left the lap.
export function closePitLane(i = useRace.getState().goTo) {
  if (forcePit) return
  useRace.setState({ pitLane: false, goTo: i ?? 0 })
  history.replaceState(null, '', location.pathname + location.search)
}
