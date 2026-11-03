import { create } from 'zustand'

// progress: scroll 0..1. t: damped track position. speed: km/h. active: checkpoint index or -1.
export const useRace = create(() => ({
  progress: 0,
  t: 0,
  speed: 0,
  active: 0,
  lapMs: 0,
  quality: 'high',
  soundOn: false,
}))

// Lenis instance, set once in App; minimap and keyboard use it to jump.
export const scroller = { lenis: null }
