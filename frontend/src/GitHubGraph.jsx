import { useMemo } from 'react'

const CELL = 10
const GAP = 3
const STEP = CELL + GAP
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// Cells with a 0-4 level from quartiles of active days, like GitHub's own graph.
function buildCells(weeks) {
  const active = weeks.flat().map((d) => d.count).filter(Boolean).sort((a, b) => a - b)
  const q = [0.25, 0.5, 0.75].map((f) => active[Math.floor(f * (active.length - 1))] ?? 0)
  return weeks.flatMap((w, x) =>
    w.map((d) => ({ x, y: new Date(d.date + 'T00:00:00Z').getUTCDay(), level: d.count === 0 ? 0 : 1 + q.filter((t) => d.count > t).length, ...d })),
  )
}

export default function GitHubGraph({ data }) {
  const cells = useMemo(() => buildCells(data.weeks), [data])
  const cols = data.weeks.length
  // Label a column when its first day starts a new month.
  const months = data.weeks.flatMap((w, x) => {
    const d = new Date(w[0].date + 'T00:00:00Z')
    return d.getUTCDate() <= 7 && x < cols - 2 ? [{ x, m: MONTHS[d.getUTCMonth()] }] : []
  })
  const last = data.weeks.at(-1)?.at(-1)?.date
  const fmt = (n) => n.toLocaleString('en-IN')

  return (
    <div className="mt-6">
      <svg viewBox={`0 -16 ${cols * STEP - GAP} ${7 * STEP - GAP + 16}`} className="block w-full" role="img" aria-label={`${data.total} GitHub contributions in the past year`}>
        {months.map(({ x, m }) => (
          <text key={x} x={x * STEP} y="-5" fontSize="9" fill="var(--muted)">{m}</text>
        ))}
        {cells.map((c) => (
          <rect key={c.date} x={c.x * STEP} y={c.y * STEP} width={CELL} height={CELL} rx="2.5" fill={`var(--g${c.level})`} className="gh-cell">
            <title>{`${c.count} contributions on ${c.date}`}</title>
          </rect>
        ))}
      </svg>

      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12.5px] text-muted">
        <p>
          <span className="font-medium text-ink">{fmt(data.total)} contributions</span> in the past year
          {last && ` · Through ${new Date(last).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`}
        </p>
        <div className="ml-auto flex items-center gap-1.5">
          Less
          {[0, 1, 2, 3, 4].map((l) => <span key={l} className="size-2.5 rounded-[2.5px]" style={{ background: `var(--g${l})` }} />)}
          More
        </div>
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ['Current streak', `${data.currentStreak} days`],
          ['Longest streak', `${data.longestStreak} days`],
          ['Public repos', fmt(data.publicRepos)],
          ['Stars earned', fmt(data.totalStars)],
        ].map(([k, v]) => (
          <div key={k} className="lift rounded-[10px] border border-line bg-chip px-3.5 py-3">
            <dt className="meta">{k}</dt>
            <dd className="mt-0.5 text-[17px] font-semibold tracking-tight text-ink">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
