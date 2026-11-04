import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import content from '../content/content.json'
import { checkpoints } from '../lib/scrollMap'
import { headSrc } from '../lib/mascot'
import { useRace } from '../store/useRace'

const IDLE_MS = 8000
const CUE_MS = 4500 // how long a race event (start, finish) holds the radio
const { idle, reverse } = content.ambientLines

// Which radio message plays right now: race event > reverse > idle > the last checkpoint reached.
function useMessage() {
  const active = useRace((s) => s.active)
  const cue = useRace((s) => s.cue)
  const [cueLive, setCueLive] = useState(false)
  const dir = useRace((s) => s.dir)
  const scrolledAt = useRace((s) => s.scrolledAt)
  const [last, setLast] = useState(0)
  const [isIdle, setIdle] = useState(false)
  const [reversing, setReversing] = useState(false)

  useEffect(() => {
    if (active >= 0) setLast(active)
  }, [active])

  useEffect(() => {
    setIdle(false)
    const id = setTimeout(() => setIdle(true), IDLE_MS)
    return () => clearTimeout(id)
  }, [scrolledAt])

  useEffect(() => {
    if (dir > 0) return setReversing(false)
    setReversing(true)
    const id = setTimeout(() => setReversing(false), 3500)
    return () => clearTimeout(id)
  }, [dir])

  useEffect(() => {
    const left = cue ? CUE_MS - (performance.now() - cue.at) : 0 // a remount (back from the Pit Lane) must not replay an old cue
    if (left <= 0) return
    setCueLive(true)
    const id = setTimeout(() => setCueLive(false), left)
    return () => clearTimeout(id)
  }, [cue])

  if (cueLive) return { key: `cue${cue.at}`, ...cue }
  if (reversing) return { key: 'reverse', ...reverse }
  if (isIdle) return { key: 'idle', ...idle, fullBody: idle.image }
  const cp = checkpoints[last]
  return { key: cp.id, ...cp.mascot }
}

function useTypewriter(text) {
  const [n, setN] = useState(0)
  useEffect(() => {
    setN(0)
    const id = setInterval(() => setN((k) => (k >= text.length ? (clearInterval(id), k) : k + 1)), 25)
    return () => clearInterval(id)
  }, [text])
  return [text.slice(0, n), n < text.length]
}

function Waveform({ live }) {
  return (
    <span className="flex h-3 items-end gap-[2px]" aria-hidden="true">
      {[0, 1, 2, 3, 4].map((i) => (
        <span key={i} className={`w-[3px] rounded-sm bg-saffron ${live ? 'radio-bar' : ''}`}
          style={{ height: live ? undefined : 3, animationDelay: `${i * 90}ms` }} />
      ))}
    </span>
  )
}

export default function RadioPanel() {
  const msg = useMessage()
  const line = msg.line.slice(0, 140)
  const [shown, typing] = useTypewriter(line)
  const head = headSrc(msg.outfit, msg.expression)

  // The mascot lives here and only here: the full-body pose when the checkpoint has one, else the head.
  const avatar = msg.fullBody ?? head
  return (
    <section aria-label="Team radio"
      className="hud-glass fixed right-0 bottom-0 left-0 flex h-[96px] overflow-hidden rounded-none sm:right-auto sm:bottom-4 sm:left-[212px] sm:h-[132px] sm:w-[340px] sm:rounded-[10px]">
      <div className="w-1 shrink-0 bg-saffron" />
      <div className="relative w-[84px] shrink-0 bg-gradient-to-t from-saffron/15 to-transparent sm:w-[124px]">
        <AnimatePresence initial={false}>
          <motion.img key={avatar} src={avatar} alt="" className="absolute inset-x-0 bottom-0 m-auto max-h-[94%] max-w-[94%] object-contain object-bottom"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} />
        </AnimatePresence>
      </div>
      <div className="min-w-0 flex-1 py-2 pr-3 pl-1">
        <div className="mb-1 flex items-center gap-2 font-mono text-[10px] tracking-[0.2em] text-cream/70">
          RADIO · DL ENGINEER <Waveform live={typing} />
        </div>
        <p className="text-[13px] leading-snug text-cream sm:text-sm" aria-live="polite">
          <span className="sr-only">{line}</span>
          <span aria-hidden="true">{shown}</span>
        </p>
      </div>
    </section>
  )
}
