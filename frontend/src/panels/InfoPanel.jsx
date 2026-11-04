import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { checkpoints } from '../lib/scrollMap'
import { useRace } from '../store/useRace'
import { frameFor } from './layouts'
import { Label, SECTIONS } from './sections'

// Wide-screen placement per side. Left panels clear the nav and the minimap + radio corner;
// right panels clear the lap timer; the bottom strip sits right of the radio.
const PLACE = {
  left: 'sm:top-[76px] sm:bottom-auto sm:left-4 sm:max-h-[calc(100vh-242px)]', // above the minimap and the radio
  right: 'sm:top-[150px] sm:bottom-auto sm:right-4 sm:max-h-[calc(100vh-166px)]', // below the lap timer, down to the edge
  bottom: 'sm:bottom-4 sm:right-4 sm:max-h-[48vh]', // lower third, right of the radio
}
const ENTER = { left: { x: -40 }, right: { x: 40 }, bottom: { y: 40 } }

function useWidth() {
  const [w, setW] = useState(innerWidth)
  useEffect(() => {
    const on = () => setW(innerWidth)
    addEventListener('resize', on)
    return () => removeEventListener('resize', on)
  }, [])
  return w
}

// The readable layer: one DOM panel per checkpoint, open only while the car holds there.
// Each layout has its own edge and width, so consecutive checkpoints never look alike.
export default function InfoPanel() {
  const active = useRace((s) => s.active)
  const interview = useRace((s) => s.interview)
  const width = useWidth()
  const cp = checkpoints[active]
  // The finish panel waits for the car to cross the line and the lap time to hold the screen.
  const Section = cp && (cp.type !== 'contact' || interview) && SECTIONS[cp.type]
  const { side, w } = frameFor(cp, width)
  const from = width >= 640 ? ENTER[side] : { y: 40 }
  return (
    <AnimatePresence mode="wait">
      {Section && (
        <motion.article
          key={cp.id}
          aria-label={`${cp.label}: ${cp.title}`}
          data-lenis-prevent // safety net: let the panel scroll on its own rather than drive the car
          className={`panel-glass fixed inset-x-0 bottom-[96px] max-h-[55vh] overflow-y-auto rounded-t-2xl p-5 sm:inset-x-auto sm:rounded-xl ${PLACE[side]}`}
          style={width >= 640 ? { width: w } : undefined}
          initial={{ opacity: 0, ...from }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, ...from }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          <Label>{cp.panelLabel ?? cp.label}</Label>
          <div className="mt-1">
            <Section cp={cp} />
          </div>
        </motion.article>
      )}
    </AnimatePresence>
  )
}
