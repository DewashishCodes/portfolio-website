import { useEffect, useMemo, useReducer, useRef, useState } from 'react'

const CELL = 10
const GAP = 3
const STEP = CELL + GAP
const AUTO_LEN = 6

// Cells keyed "x,y" (x = week column, y = weekday row) with a 0-4 level from quartiles of active days, like GitHub.
export function buildCells(weeks) {
  const active = weeks.flat().map((d) => d.count).filter(Boolean).sort((a, b) => a - b)
  const q = [0.25, 0.5, 0.75].map((f) => active[Math.floor(f * (active.length - 1))] ?? 0)
  const cells = new Map()
  weeks.forEach((w, x) =>
    w.forEach((d) => {
      const y = new Date(d.date + 'T00:00:00Z').getUTCDay()
      const level = d.count === 0 ? 0 : 1 + q.filter((t) => d.count > t).length
      cells.set(`${x},${y}`, { x, y, level, ...d })
    }),
  )
  return cells
}

const fresh = (len) => ({ body: [[2, 3], [1, 3], [0, 3]], len, dir: [1, 0], next: null, eaten: new Set(), score: 0 })

// Greedy step toward the nearest uneaten contribution; returns null once the board is clear.
export function autoDir(cells, eaten, [hx, hy]) {
  let best = null
  let bestD = Infinity
  for (const [k, c] of cells) {
    if (!c.level || eaten.has(k)) continue
    const d = Math.abs(c.x - hx) + Math.abs(c.y - hy)
    if (d < bestD) (best = c), (bestD = d)
  }
  if (!best) return null
  return best.x !== hx ? [Math.sign(best.x - hx), 0] : [0, Math.sign(best.y - hy)]
}

const KEYS = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0], w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0] }

export default function GitHubSnake({ data }) {
  const cells = useMemo(() => buildCells(data.weeks), [data])
  const cols = data.weeks.length
  const reduced = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches
  const [mode, setMode] = useState(reduced ? 'paused' : 'auto') // auto | paused | play | over
  const [, redraw] = useReducer((n) => n + 1, 0)
  const s = useRef(fresh(AUTO_LEN))

  useEffect(() => {
    if (mode !== 'auto' && mode !== 'play') return
    const tick = () => {
      const st = s.current
      const [hx, hy] = st.body[0]
      let d = st.dir
      if (mode === 'auto') {
        d = autoDir(cells, st.eaten, st.body[0])
        if (!d) return st.eaten.clear() // board cleared: let it regrow and go again
      } else if (st.next) d = st.next
      st.next = null
      const nx = hx + d[0]
      const ny = hy + d[1]
      if (mode === 'play' && (nx < 0 || ny < 0 || nx >= cols || ny > 6 || st.body.slice(0, -1).some(([x, y]) => x === nx && y === ny))) {
        setMode('over')
        return
      }
      st.dir = d
      st.body.unshift([nx, ny])
      const k = `${nx},${ny}`
      if (cells.get(k)?.level && !st.eaten.has(k)) {
        st.eaten.add(k)
        st.score++
        if (mode === 'play') st.len++
      }
      st.body.length = Math.min(st.body.length, st.len)
      redraw()
    }
    const id = setInterval(tick, mode === 'play' ? 120 : 110)
    return () => clearInterval(id)
  }, [mode, cells, cols])

  // Arrow keys / WASD steer during a round; blocks page scroll only while playing.
  useEffect(() => {
    if (mode !== 'play') return
    const onKey = (e) => {
      const d = KEYS[e.key]
      if (!d) return
      e.preventDefault()
      const cur = s.current.dir
      if (d[0] !== -cur[0] || d[1] !== -cur[1]) s.current.next = d
    }
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  }, [mode])

  const play = () => {
    s.current = fresh(3)
    setMode('play')
  }
  const watch = () => {
    s.current = fresh(AUTO_LEN)
    setMode('auto')
  }

  const st = s.current
  const last = data.weeks.at(-1)?.at(-1)?.date
  const btn = 'transition-colors hover:text-ink'

  return (
    <div className="mt-6">
      <svg viewBox={`0 0 ${cols * STEP - GAP} ${7 * STEP - GAP}`} className="block w-full" role="img" aria-label={`${data.total} GitHub contributions in the past year`}>
        {[...cells.values()].map((c) => (
          <rect key={`${c.x},${c.y}`} x={c.x * STEP} y={c.y * STEP} width={CELL} height={CELL} rx="2.5" fill={`var(--g${st.eaten.has(`${c.x},${c.y}`) ? 0 : c.level})`} style={{ transition: 'fill .4s' }}>
            <title>{`${c.count} contributions on ${c.date}`}</title>
          </rect>
        ))}
        {mode !== 'paused' || st.score > 0
          ? st.body.map(([x, y], i) => (
              <rect key={i} x={x * STEP - 0.5} y={y * STEP - 0.5} width={CELL + 1} height={CELL + 1} rx="3" fill="var(--snake)" opacity={1 - (i / st.body.length) * 0.55} />
            ))
          : null}
      </svg>

      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12.5px] text-muted">
        {mode === 'play' || mode === 'over' ? (
          <p aria-live="polite">
            <span className="font-medium text-ink">{mode === 'over' ? `Game over · ${st.score} eaten` : `Score ${st.score}`}</span>
            {mode === 'play' && ' · arrow keys or WASD to steer'}
          </p>
        ) : (
          <p>
            <span className="font-medium text-ink">{data.total.toLocaleString('en-IN')} contributions</span> in the past year
            {last && ` · Through ${new Date(last).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`}
          </p>
        )}
        <div className="ml-auto flex gap-4">
          {mode === 'auto' && <button className={btn} onClick={() => setMode('paused')}>Pause snake</button>}
          {mode === 'paused' && <button className={btn} onClick={() => setMode('auto')}>Resume snake</button>}
          {mode === 'play' ? (
            <button className={btn} onClick={watch}>Stop</button>
          ) : (
            // Keyboard-only game, so hide the button on touch screens.
            <button className={`${btn} [@media(pointer:coarse)]:hidden`} onClick={play}>{mode === 'over' ? 'Play again' : 'Play a round'}</button>
          )}
        </div>
      </div>
    </div>
  )
}
