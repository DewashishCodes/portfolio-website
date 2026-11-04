import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { unlock } from '../lib/achievements'
import { COLOR, personalBest, saveInitials, savedInitials } from '../lib/lap'
import { useRace } from '../store/useRace'
import { fmtLap } from './LapTimer'
import { TYRES } from './Lights'

const DOT = Object.fromEntries(TYRES.map((t) => [t.key, t.dot]))

const SHOW = 10 // rows above the visitor's own

const gap = (ms, lead) => (ms === lead ? 'LEADER' : `+${((ms - lead) / 1000).toFixed(3)}`)

function Row({ pos, initials, ms, lead, me, ghost, tyre = 'medium' }) {
  return (
    <li className={`grid grid-cols-[2.2rem_0.75rem_3.2rem_1fr_auto] items-center gap-2 px-3 py-1 font-mono text-[13px] tabular-nums ${me ? 'bg-saffron text-carbon' : 'text-cream odd:bg-cream/[0.04]'}`}>
      <span className={me ? 'font-bold' : 'text-cream/60'}>{pos ?? '–'}</span>
      <span className="size-2.5 rounded-full ring-1 ring-black/50" style={{ background: DOT[tyre] }} title={`${tyre} tyres`} />
      <span className="font-bold tracking-wider">{initials}</span>
      <span className={me ? '' : 'text-cream/60'}>{lead != null ? gap(ms, lead) : ''}</span>
      <span className={ghost ? 'italic' : ''}>{fmtLap(ms)}</span>
    </li>
  )
}

// F1-style timing tower at the finish: the top ten, the visitor's own row, three-letter initials to go on the board.
export default function TimingTower() {
  const open = useRace((s) => s.tower && !s.interview)
  const [board, setBoard] = useState(null) // { laps, total, rank } | 'offline'
  const [mine, setMine] = useState(null) // { id, position, total } once submitted
  const [initials, setInitials] = useState(savedInitials)
  const [state, setState] = useState('idle') // idle | sending | error text
  const input = useRef()
  const { lapMs, invalid, jumpStart, reaction, sectors, tyre } = useRace.getState()
  const ms = Math.round(lapMs)

  useEffect(() => {
    if (!open) return
    let on = true
    fetch(`/api/laps?ms=${ms}`).then((r) => (r.ok ? r.json() : Promise.reject())).then((d) => on && setBoard(d)).catch(() => on && setBoard('offline'))
    setTimeout(() => input.current?.focus({ preventScroll: true }), 400)
    return () => { on = false }
  }, [open, ms])

  async function submit(e) {
    e.preventDefault()
    if (!/^[A-Za-z0-9]{3}$/.test(initials)) return setState('Three letters or digits.')
    setState('sending')
    const body = { initials, ms, sectors: sectors.length === 3 ? sectors.map((x) => x.ms) : null, reaction, jump: jumpStart, tyre }
    try {
      const r = await fetch('/api/lap', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!r.ok) throw r.status === 429 ? 'Too many laps from here, try again later.' : 'Lap rejected.'
      const res = await r.json()
      saveInitials(initials.toUpperCase())
      setMine(res)
      unlock('lap', { line: `Lap complete, P${res.position} overall.` })
      const fresh = await fetch(`/api/laps`).then((x) => x.json())
      setBoard({ ...fresh, rank: res.position })
      setState('idle')
    } catch (err) {
      setState(typeof err === 'string' ? err : 'Timing is offline, lap not saved.')
    }
  }

  const done = () => useRace.setState({ interview: true })
  const offline = board === 'offline'
  const laps = offline || !board ? [] : board.laps
  const lead = Math.min(laps[0]?.ms ?? Infinity, invalid || mine ? Infinity : ms) // an unsubmitted P1 leads its own ghost row
  const rank = mine?.position ?? board?.rank
  const myRowInTop = mine && laps.slice(0, SHOW).some((l) => l.id === mine.id)
  // Not submitted yet: slot a ghost row in where the time would place.
  let rows = laps.slice(0, SHOW).map((l) => ({ ...l, me: mine?.id === l.id }))
  if (!mine && !invalid && rank && rank <= SHOW) rows.splice(rank - 1, 0, { id: 'you', initials: 'YOU', ms, me: true, ghost: true, tyre })
  rows = rows.slice(0, SHOW).map((r, i) => ({ ...r, pos: i + 1 })) // everyone behind the ghost drops a place
  const tail = (!mine && !invalid && rank > SHOW) || (mine && !myRowInTop)
  const pb = personalBest()

  return (
    <AnimatePresence>
      {open && (
        <motion.section aria-label="Timing tower" data-lenis-prevent
          className="panel-glass fixed inset-x-0 bottom-[96px] z-20 max-h-[70vh] overflow-y-auto rounded-t-2xl sm:inset-x-auto sm:top-[76px] sm:bottom-auto sm:left-4 sm:w-[360px] sm:rounded-xl"
          initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.3 }}>
          <header className="flex items-center justify-between border-b border-cream/10 px-3 py-2">
            <span className="font-mono text-[11px] tracking-[0.2em] text-saffron">TIMING · DL GRAND PRIX</span>
            {!offline && board && <span className="font-mono text-[10px] text-cream/50">{board.total} LAPS</span>}
          </header>

          {offline ? (
            <p className="px-3 py-3 text-sm text-cream/75">Timing is offline right now, so the board can't load. Your lap still counts here.</p>
          ) : !board ? (
            <p className="px-3 py-3 font-mono text-xs text-cream/60">LOADING TIMES…</p>
          ) : (
            <ol aria-label="Fastest laps">
              {rows.length === 0 && <li className="px-3 py-2 text-sm text-cream/70">No laps yet. Set the first one.</li>}
              {rows.map((r) => <Row key={r.id} {...r} lead={lead} />)}
              {tail && (
                <>
                  <li aria-hidden="true" className="px-3 text-center font-mono text-xs text-cream/40">⋮</li>
                  <Row pos={rank} initials={mine ? initials.toUpperCase() : 'YOU'} ms={ms} lead={lead} me ghost={!mine} tyre={tyre} />
                </>
              )}
            </ol>
          )}

          <div className="border-t border-cream/10 px-3 py-2">
            <div className="flex gap-3 font-mono text-[11px] tabular-nums">
              {sectors.map((x, i) => (
                <span key={i} style={{ color: COLOR[x.color] }}>S{i + 1} {(x.ms / 1000).toFixed(2)}</span>
              ))}
            </div>
            {pb != null && <p className="mt-0.5 font-mono text-[10px] text-cream/50">PERSONAL BEST {fmtLap(pb)}</p>}
          </div>

          <div className="border-t border-cream/10 p-3">
            {invalid ? (
              <p className="font-mono text-xs tracking-wider text-yellow-300">LAP INVALID · A CHECKPOINT WAS SKIPPED, SO IT ISN'T CLASSIFIED. RACE THE FULL LAP TO GET ON THE BOARD.</p>
            ) : mine ? (
              <p role="status" className="font-mono text-xs tracking-wider text-cream">ON THE BOARD · P{mine.position} OF {mine.total}</p>
            ) : !offline && (
              <form onSubmit={submit} className="flex items-center gap-2">
                <label className="font-mono text-[11px] tracking-[0.15em] text-cream/70" htmlFor="initials">INITIALS</label>
                <input ref={input} id="initials" value={initials} maxLength={3} autoComplete="off" spellCheck={false}
                  onChange={(e) => setInitials(e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase())}
                  className="w-20 rounded-md border border-cream/25 bg-carbon/60 px-2 py-1.5 text-center font-mono text-lg font-bold tracking-[0.3em] text-cream uppercase focus:border-saffron focus:outline-none" />
                <button disabled={state === 'sending'} className="rounded-md bg-saffron px-3 py-1.5 font-mono text-xs tracking-wider text-carbon hover:bg-cream disabled:opacity-60">
                  {state === 'sending' ? '…' : 'SUBMIT ↵'}
                </button>
              </form>
            )}
            {state !== 'idle' && state !== 'sending' && <p role="alert" className="mt-1.5 text-xs text-saffron">{state}</p>}
            <button type="button" onClick={done} className="mt-3 w-full rounded-md border border-cream/25 py-2 font-mono text-xs tracking-[0.2em] text-cream hover:border-saffron hover:text-saffron">
              POST-RACE INTERVIEW ›
            </button>
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  )
}
