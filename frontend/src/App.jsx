import Lenis from 'lenis'
import { useEffect } from 'react'
import Controls from './hud/Controls'
import LapTimer from './hud/LapTimer'
import Minimap from './hud/Minimap'
import RadioPanel from './hud/RadioPanel'
import SectorLabel from './hud/SectorLabel'
import { SCROLL_UNITS } from './lib/scrollMap'
import InfoPanel from './panels/InfoPanel'
import Experience from './scene/Experience'
import { scroller, useRace } from './store/useRace'

export default function App() {
  useEffect(() => {
    const lenis = new Lenis({ autoRaf: true, syncTouch: true })
    scroller.lenis = lenis
    if (import.meta.env.DEV) window.__lenis = lenis
    lenis.on('scroll', (e) =>
      useRace.setState({ progress: e.progress, dir: e.direction || useRace.getState().dir, scrolledAt: performance.now() }),
    )
    return () => lenis.destroy()
  }, [])

  return (
    <>
      <Experience />
      {/* Tall spacer: native scroll is the throttle. */}
      <div style={{ height: `${(SCROLL_UNITS + 1) * 100}vh` }} />
      <SectorLabel />
      <LapTimer />
      <Minimap />
      <Controls />
      <InfoPanel />
      <RadioPanel />
    </>
  )
}
