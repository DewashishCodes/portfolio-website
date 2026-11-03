import { AnimatePresence, motion } from 'framer-motion'
import { checkpoints } from '../lib/scrollMap'
import { useRace } from '../store/useRace'
import { Label, SECTIONS } from './sections'

// The readable layer: one DOM panel per checkpoint, open only while the car holds there.
export default function InfoPanel() {
  const active = useRace((s) => s.active)
  const cp = checkpoints[active]
  const Section = cp && SECTIONS[cp.type]
  return (
    <AnimatePresence mode="wait">
      {Section && (
        <motion.article
          key={cp.id}
          aria-label={`${cp.label}: ${cp.title}`}
          data-lenis-prevent // let the panel scroll on its own instead of driving the car
          className="panel-glass fixed inset-x-0 bottom-[84px] max-h-[55vh] overflow-y-auto rounded-t-2xl p-5 sm:inset-x-auto sm:top-[124px] sm:right-4 sm:bottom-[148px] sm:max-h-none sm:w-[420px] sm:rounded-xl"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 40 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          <Label>{cp.label}</Label>
          <div className="mt-1">
            <Section cp={cp} />
          </div>
        </motion.article>
      )}
    </AnimatePresence>
  )
}
