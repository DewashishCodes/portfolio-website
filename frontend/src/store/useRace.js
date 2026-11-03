import { create } from 'zustand'

// progress: scroll 0..1. t: damped track position. speed: km/h. active: checkpoint index or -1.
export const useRace = create(() => ({
  progress: 0,
  t: 0,
  speed: 0,
  active: 0,
  lapMs: 0,
  quality: new URLSearchParams(location.search).get('q') ?? 'high', // high | medium | low; auto-selection comes in Phase 5
  soundOn: false,
  dir: 1, // last scroll direction: 1 forward, -1 reverse
  scrolledAt: 0, // performance.now() of the last scroll, for the idle line
}))

// Lenis instance, set once in App; minimap and keyboard use it to jump.
export const scroller = { lenis: null }
