import { useMemo } from 'react'
import { checkpointProgress, checkpoints } from '../lib/scrollMap'
import { spline, wrap } from '../lib/trackSpline'
import { scroller, useRace } from '../store/useRace'

const W = 168
const H = 118
const PAD = 10

function useProjector() {
  return useMemo(() => {
    const pts = spline.getSpacedPoints(300)
    const xs = pts.map((p) => p.x)
    const zs = pts.map((p) => p.z)
    const [x0, x1, z0, z1] = [Math.min(...xs), Math.max(...xs), Math.min(...zs), Math.max(...zs)]
    const k = Math.min((W - 2 * PAD) / (x1 - x0), (H - 2 * PAD) / (z1 - z0))
    const ox = (W - (x1 - x0) * k) / 2
    const oz = (H - (z1 - z0) * k) / 2
    const proj = (t) => {
      const p = spline.getPointAt(wrap(t))
      return [ox + (p.x - x0) * k, oz + (p.z - z0) * k]
    }
    const path = pts.map((p, i) => `${i ? 'L' : 'M'}${(ox + (p.x - x0) * k).toFixed(1)},${(oz + (p.z - z0) * k).toFixed(1)}`).join('') + 'Z'
    return { proj, path }
  }, [])
}

export default function Minimap() {
  const { proj, path } = useProjector()
  const t = useRace((s) => s.t)
  const active = useRace((s) => s.active)
  const [cx, cy] = proj(t)
  const go = (i) => scroller.lenis?.scrollTo(checkpointProgress(i) * scroller.lenis.limit)

  return (
    <nav aria-label="Track map" className="hud-glass fixed bottom-4 left-4 p-2">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <path d={path} fill="none" stroke="rgba(242,232,213,0.35)" strokeWidth="6" strokeLinejoin="round" />
        <path d={path} fill="none" stroke="#F2E8D5" strokeWidth="1.5" strokeLinejoin="round" />
        {checkpoints.map((cp, i) => {
          const [x, y] = proj(cp.trackT)
          return (
            <g key={cp.id} role="button" tabIndex={0} aria-label={`Go to ${cp.label}: ${cp.title}`}
              className="cursor-pointer" onClick={() => go(i)} onKeyDown={(e) => e.key === 'Enter' && go(i)}>
              <circle cx={x} cy={y} r="9" fill="transparent" />
              <circle cx={x} cy={y} r={i === active ? 5 : 3.5} fill={i === active ? '#E86A1F' : '#F2E8D5'} />
              <title>{`${cp.label}: ${cp.title}`}</title>
            </g>
          )
        })}
        <circle cx={cx} cy={cy} r="5" fill="#C4161C" stroke="#fff" strokeWidth="1.5" />
      </svg>
    </nav>
  )
}
