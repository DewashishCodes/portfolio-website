import Lenis from 'lenis'
import { useEffect } from 'react'
import Controls from './hud/Controls'
import LapTimer from './hud/LapTimer'
import Minimap from './hud/Minimap'
import SectorLabel from './hud/SectorLabel'
import { SCROLL_UNITS } from './lib/scrollMap'
import Experience from './scene/Experience'
import { scroller, useRace } from './store/useRace'

export default function App() {
  useEffect(() => {
    const lenis = new Lenis({ autoRaf: true, syncTouch: true })
    scroller.lenis = lenis
    lenis.on('scroll', (e) => useRace.setState({ progress: e.progress }))
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
    </>
  )
}
