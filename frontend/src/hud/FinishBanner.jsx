import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useRace } from '../store/useRace'
import { fmtLap } from './LapTimer'

const SHOW = 2800 // ms the lap time holds the screen before the post-race interview opens

// Chequered flag moment: the frozen lap time in large type, then hand over to the contact panel.
export default function FinishBanner() {
  const finishedAt = useRace((s) => s.finishedAt)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!finishedAt) return
    if (performance.now() - finishedAt > SHOW) return useRace.setState({ interview: true }) // shown before a Pit Lane visit
    setOpen(true)
    const id = setTimeout(() => {
      setOpen(false)
      useRace.setState({ interview: true })
    }, SHOW)
    return () => clearTimeout(id)
  }, [finishedAt])

  const { lapMs, lightsOutAt, reaction, jumpStart } = useRace.getState()
  const timed = lightsOutAt > 0
  return (
    <AnimatePresence>
      {open && (
        <motion.div role="status" aria-live="assertive"
          className="pointer-events-none fixed inset-x-0 top-[16vh] z-30 flex flex-col items-center text-center"
          initial={{ opacity: 0, scale: 1.15 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, y: -30 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}>
          <div className="chequer h-3 w-56 sm:w-72" aria-hidden="true" />
          <p className="mt-3 font-mono text-xs tracking-[0.4em] text-cream drop-shadow-[0_1px_6px_rgba(0,0,0,0.9)]">CHEQUERED FLAG</p>
          <p className="font-mono text-6xl font-bold tabular-nums text-cream drop-shadow-[0_2px_12px_rgba(0,0,0,0.85)] sm:text-8xl">
            {timed ? fmtLap(lapMs) : 'P1'}
          </p>
          <p className="mt-2 font-mono text-xs tracking-[0.25em] text-saffron drop-shadow-[0_1px_6px_rgba(0,0,0,0.9)]">
            {!timed ? 'LAP NOT TIMED · JOINED FROM THE PIT LANE'
              : jumpStart ? 'JUMP START · +5S PENALTY (WE WON\'T TELL)'
                : reaction != null ? `REACTION ${(reaction / 1000).toFixed(3)}S` : 'LAP COMPLETE'}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
