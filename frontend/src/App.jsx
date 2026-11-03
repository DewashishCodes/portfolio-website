import Lenis from 'lenis'
import { useEffect } from 'react'
import Controls from './hud/Controls'
import Loader from './hud/Loader'
import LapTimer from './hud/LapTimer'
import Minimap from './hud/Minimap'
import RadioPanel from './hud/RadioPanel'
import SectorLabel from './hud/SectorLabel'
import SpeedLines from './hud/SpeedLines'
import { checkpointProgress, checkpoints, SCROLL_UNITS } from './lib/scrollMap'
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

function Lap() {
  useEffect(() => {
    const lenis = new Lenis({ autoRaf: true, syncTouch: true })
    scroller.lenis = lenis
    if (import.meta.env.DEV) window.__lenis = lenis
    lenis.on('scroll', (e) =>
      useRace.setState({ progress: e.progress, dir: e.direction || useRace.getState().dir, scrolledAt: performance.now(), ...(e.progress > 0.002 && { lightsOut: true }) }),
    )
    const { goTo } = useRace.getState()
    if (goTo != null) requestAnimationFrame(() => lenis.scrollTo(checkpointProgress(goTo) * lenis.limit, { immediate: true }))
    window.addEventListener('keydown', jump)
    return () => {
      window.removeEventListener('keydown', jump)
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
      <div style={{ height: `${(SCROLL_UNITS + 1) * 100}vh` }} />
      <SectorLabel />
      <LapTimer />
      <Minimap />
      <Controls />
      <InfoPanel />
      <RadioPanel />
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
