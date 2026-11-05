import { useEffect, useRef, useState } from 'react'

const SIM = 'https://dewashishcodes.github.io/tesla-roadster-sim/'
// 16-frame barrel-roll sheet rendered from the sim's own three.js car (2x: 320x160 per frame).
const SHEET = '/media/roadster-roll.webp'
const FW = 160, FH = 80, N = 16
const GAP = 16 // empty px under the tyres in frame 0, so the car sits on the lane floor
const LAST = 'roadster-last'
const EVERY = 3 * 60 * 1000 // at most one run per 3 minutes, across all pages and reloads

/** Easter egg: every 3 minutes at most, after a random amount of scrolling on any page, the sim's roadster drives across the content column, jumps and barrel-rolls. Hover pauses it; click opens the sim. */
export default function Roadster() {
  const [run, setRun] = useState(null) // null = idle, else { ltr }
  const lane = useRef(), drive = useRef(), hop = useRef(), sprite = useRef(), shadow = useRef(), anims = useRef([])

  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let last = 0
    try { if (!import.meta.env.DEV) last = +sessionStorage[LAST] || 0 } catch {} // dev: replay on every reload
    let at = 400 + Math.random() * 1200 // px scrolled before it shows up
    const onScroll = () => {
      if (Date.now() - last < EVERY) return
      // Cap at 40% of the scrollable height so short pages can trigger it too.
      if (scrollY < Math.min(at, (document.documentElement.scrollHeight - innerHeight) * 0.4)) return
      last = Date.now()
      at = 400 + Math.random() * 1200
      try { sessionStorage[LAST] = last } catch {}
      setRun({ ltr: Math.random() < 0.5 })
    }
    addEventListener('scroll', onScroll, { passive: true })
    return () => removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!run) return
    const T = { duration: 6000, fill: 'forwards' }
    const w = lane.current.offsetWidth
    const [a, b] = run.ltr ? [-FW, w] : [w, -FW]
    const d = drive.current.animate([{ transform: `translateX(${a}px)` }, { transform: `translateX(${b}px)` }], { ...T, easing: 'linear' })
    hop.current.animate([
      { transform: 'translateY(0)', offset: 0.32, easing: 'cubic-bezier(.2,.7,.4,1)' },
      { transform: 'translateY(-170px)', offset: 0.5, easing: 'cubic-bezier(.6,0,.8,.3)' },
      { transform: 'translateY(0)', offset: 0.68 },
      { transform: 'translateY(4px)', offset: 0.71 }, // touchdown squash
      { transform: 'translateY(0)', offset: 0.76 },
    ], T)
    // Step through the sheet once in the air; repeat-x makes the last step land back on frame 0.
    sprite.current.animate([
      { backgroundPosition: '0 0', offset: 0.36, easing: `steps(${N}, end)` },
      { backgroundPosition: `-${FW * N}px 0`, offset: 0.64 },
      { backgroundPosition: `-${FW * N}px 0` }, // hold frame 0 after the roll, else it slides back through the sheet
    ], T)
    shadow.current.animate([
      { transform: 'scaleX(1)', opacity: 0.3, offset: 0.32 },
      { transform: 'scaleX(.35)', opacity: 0.08, offset: 0.5 },
      { transform: 'scaleX(1)', opacity: 0.3, offset: 0.68 },
    ], T)
    anims.current = [d, ...[hop, sprite, shadow].flatMap((r) => r.current.getAnimations())]
    d.onfinish = () => setRun(null)
  }, [run])

  // Only our motion: pausing every animation in the subtree would also freeze the tooltip fade-in.
  const hold = (on) => anims.current.forEach((x) => (on ? x.pause() : x.play()))

  if (!run) return null
  return (
    // Same width as the content column (App's max-w-[766px]), so it never runs over the side gutters.
    <div ref={lane} className="pointer-events-none fixed bottom-3 left-1/2 z-40 w-full max-w-[766px] -translate-x-1/2 overflow-hidden" style={{ height: FH + 200 }}>
      <div ref={drive} className="absolute bottom-0 left-0" style={{ width: FW, transform: `translateX(${run.ltr ? -FW : 9999}px)` }}>
        <div ref={shadow} className="absolute inset-x-5 bottom-0 h-2.5 rounded-[50%] bg-black opacity-30 blur-[2px]" />
        <div ref={hop} style={{ marginBottom: -GAP }}>
          <a href={SIM} target="_blank" rel="noopener" aria-label="Play the Flying Roadster sim (opens in a new tab)"
            onPointerEnter={() => hold(true)} onPointerLeave={() => hold(false)} onFocus={() => hold(true)} onBlur={() => hold(false)}
            className="group pointer-events-auto relative block cursor-pointer">
            <span className="absolute -top-6 left-1/2 -translate-x-1/2 rounded-full border border-line bg-chip px-2.5 py-0.5 text-xs whitespace-nowrap text-ink opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
              Play the sim ↗
            </span>
            <div ref={sprite} style={{ width: FW, height: FH, background: `url(${SHEET}) 0 0 / ${FW * N}px ${FH}px repeat-x`, transform: run.ltr ? undefined : 'scaleX(-1)' }} />
          </a>
        </div>
      </div>
    </div>
  )
}
