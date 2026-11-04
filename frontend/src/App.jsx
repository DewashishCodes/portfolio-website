import Lenis from 'lenis'
import { useEffect } from 'react'
import Confetti from './hud/Confetti'
import Controls from './hud/Controls'
import FinishBanner from './hud/FinishBanner'
import Lights, { skipStart } from './hud/Lights'
import TimingTower from './hud/TimingTower'
import { watchAchievements } from './lib/achievements'
import { drsDelta, listenDrs } from './lib/drs'
import { trackValidity } from './lib/lap'
import Loader from './hud/Loader'
import LapTimer from './hud/LapTimer'
import Minimap from './hud/Minimap'
import RadioPanel from './hud/RadioPanel'
import SpeedLines from './hud/SpeedLines'
import { checkpointProgress, checkpoints, scrollUnits } from './lib/scrollMap'
import { forcePit } from './lib/quality'
import InfoPanel from './panels/InfoPanel'
import PitLane from './pitlane/PitLane'
import Experience from './scene/Experience'
import { closePitLane, openPitLane, scroller, useRace } from './store/useRace'

const typing = (el) => el.closest?.('input, textarea, select, [contenteditable="true"]')

// Arrow keys / PageUp / PageDown hop checkpoint to checkpoint; Home / End jump to the ends.
function jump(e) {
  const { lenis } = scroller
  if (!lenis || typing(e.target) || e.target.closest?.('[data-lenis-prevent]')) return
  const p = useRace.getState().progress
  const stops = checkpoints.map((_, i) => checkpointProgress(i))
  const eps = 0.002
  const next = { ArrowDown: 1, ArrowRight: 1, PageDown: 1, ArrowUp: -1, ArrowLeft: -1, PageUp: -1 }[e.key]
  let i
  if (next === 1) i = stops.findIndex((s) => s > p + eps)
  else if (next === -1) i = stops.findLastIndex((s) => s < p - eps)
  else if (e.key === 'Home') i = 0
  else if (e.key === 'End') i = stops.length - 1
  else return
  e.preventDefault()
  if (i >= 0) lenis.scrollTo(stops[i] * lenis.limit)
}

const LERP = 0.1
const FINISH_LERP = 0.035 // heavier scroll smoothing in the finish dwell: the car crosses the line in slow motion

function Lap() {
  const started = useRace((s) => s.start === 'go')
  useRace((s) => s.tyre) // the spacer height depends on the tyre's dwell length

  useEffect(() => {
    history.scrollRestoration = 'manual' // a restored scroll would skip the grid and the start lights
    const { goTo, start } = useRace.getState()
    if (!goTo && start !== 'go') window.scrollTo(0, 0)
    const lenis = new Lenis({ autoRaf: true, syncTouch: true, lerp: LERP, virtualScroll: drsDelta })
    scroller.lenis = lenis
    if (import.meta.env.DEV) window.__lenis = lenis
    lenis.on('scroll', (e) =>
      useRace.setState({ progress: e.progress, dir: e.direction || useRace.getState().dir, scrolledAt: performance.now() }),
    )
    if (goTo || (goTo === 0 && start === 'go')) {
      skipStart() // back from the Pit Lane mid-lap: drop straight in, no second start
      requestAnimationFrame(() => lenis.scrollTo(checkpointProgress(goTo) * lenis.limit, { immediate: true }))
    } else if (useRace.getState().start !== 'go') lenis.stop() // Lights.jsx starts it at lights out
    const last = checkpoints.length - 1
    const unsubValid = trackValidity()
    const stopDrs = listenDrs()
    const stopAch = watchAchievements()
    const unsub = useRace.subscribe((s, prev) => {
      if (s.active !== prev.active) lenis.options.lerp = s.active === last ? FINISH_LERP : LERP
    })
    window.addEventListener('keydown', jump)
    return () => {
      window.removeEventListener('keydown', jump)
      unsub()
      unsubValid()
      stopDrs()
      stopAch()
      lenis.destroy()
      scroller.lenis = null
    }
  }, [])

  return (
    <>
      <a href="#pitlane" onClick={(e) => { e.preventDefault(); openPitLane() }}
        className="sr-only z-50 focus:not-sr-only focus:fixed focus:top-4 focus:left-1/2 focus:-translate-x-1/2 focus:rounded-md focus:bg-saffron focus:px-4 focus:py-2 focus:font-mono focus:text-xs focus:text-carbon">
        Skip to content (Pit Lane)
      </a>
      <Experience />
      <div id="cut" className="pointer-events-none fixed inset-0" aria-hidden="true" />
      <SpeedLines />
      {/* Tall spacer: native scroll is the throttle. */}
      <div style={{ height: `${(scrollUnits() + 1) * 100}vh` }} />
      {/* Before lights out only the minimap and the nav show; the HUD arrives with the start. */}
      {started && <LapTimer />}
      <Minimap />
      <Controls />
      {started && <InfoPanel />}
      {started && <RadioPanel />}
      <Lights />
      <FinishBanner />
      <TimingTower />
      <Confetti />
      <Loader />
    </>
  )
}

export default function App() {
  const pitLane = useRace((s) => s.pitLane)

  useEffect(() => {
    document.documentElement.classList.remove('lap') // React owns the page from here
    const onKey = (e) => {
      if (typing(e.target) || e.ctrlKey || e.metaKey || e.altKey) return
      if (e.key === 'p' || e.key === 'P') useRace.getState().pitLane ? closePitLane() : openPitLane()
      else if (e.key === 'Escape' && useRace.getState().pitLane) closePitLane()
    }
    const onHash = () => location.hash === '#pitlane' && openPitLane()
    window.addEventListener('keydown', onKey)
    window.addEventListener('hashchange', onHash)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('hashchange', onHash)
    }
  }, [])

  return pitLane ? <PitLane onExit={forcePit ? undefined : closePitLane} onTrack={forcePit ? undefined : closePitLane} /> : <Lap />
}
