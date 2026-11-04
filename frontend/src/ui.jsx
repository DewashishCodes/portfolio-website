import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

// ---- Router: three pages don't justify react-router. ----
export function usePath() {
  const [path, setPath] = useState(location.pathname)
  useEffect(() => {
    const on = () => setPath(location.pathname)
    addEventListener('popstate', on)
    return () => removeEventListener('popstate', on)
  }, [])
  return path
}

export function Link({ to, ...props }) {
  const go = (e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button) return
    e.preventDefault()
    const [path, hash] = to.split('#')
    if (path !== location.pathname) {
      history.pushState(null, '', to)
      dispatchEvent(new PopStateEvent('popstate'))
    }
    // Wait one frame so the new page has rendered before scrolling.
    requestAnimationFrame(() => (hash ? document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' }) : scrollTo(0, 0)))
  }
  return <a href={to} onClick={go} {...props} />
}

// ---- Icons ----
const svg = (d, props = {}) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    {d}
  </svg>
)
export const Icons = {
  github: svg(<path fill="currentColor" stroke="none" d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.56-.29-5.25-1.28-5.25-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.04 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.58.23 2.75.11 3.04.74.81 1.19 1.83 1.19 3.09 0 4.41-2.7 5.38-5.27 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z" />),
  x: svg(<path fill="currentColor" stroke="none" d="M17.75 3h3.07l-6.7 7.66L22 21h-6.17l-4.83-6.32L5.47 21H2.4l7.17-8.2L2 3h6.33l4.37 5.78L17.75 3Zm-1.08 16.17h1.7L7.4 4.74H5.58l11.1 14.43Z" />, { width: 14, height: 14 }),
  moon: svg(<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />),
  sun: svg(<><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>),
  list: svg(<path d="M5 7h14M5 12h14M5 17h14" />),
  grid: svg(<><circle cx="8" cy="8" r="3" /><circle cx="16" cy="8" r="3" /><circle cx="8" cy="16" r="3" /><circle cx="16" cy="16" r="3" /></>),
  globe: svg(<><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3Z" /></>),
  copy: svg(<><rect x="8" y="8" width="12" height="12" rx="2.5" /><path d="M16 8V6.5A2.5 2.5 0 0 0 13.5 4h-7A2.5 2.5 0 0 0 4 6.5v7A2.5 2.5 0 0 0 6.5 16H8" /></>, { width: 14, height: 14 }),
  check: svg(<path d="m5 12.5 4.5 4.5L19 7.5" />, { width: 14, height: 14 }),
}

export const Arrow = () => (
  <svg className="arrow" width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
    <path d="M2.5 7.5 7.5 2.5M3.5 2.5h4v4" />
  </svg>
)

/** External link with the nudging ↗ arrow. */
export const Ext = ({ href, children, className = '' }) => (
  <a href={href} target="_blank" rel="noreferrer" className={`group inline-flex items-center gap-1 ${className}`}>
    {children}
    <Arrow />
  </a>
)

// ---- Content atoms ----
/** Monogram app icon (projects have no favicons of their own). */
export const AppIcon = ({ p, size = 20 }) => (
  <span
    aria-hidden="true"
    className="inline-grid shrink-0 place-items-center font-semibold text-white"
    style={{ background: p.color, width: size, height: size, borderRadius: size * 0.26, fontSize: size * 0.55, lineHeight: 1 }}
  >
    {p.short[0]}
  </span>
)

/** Inline product pill used inside the hero sentence. */
export const Chip = ({ p }) => (
  <a
    href={p.website || p.github}
    target="_blank"
    rel="noreferrer"
    className="mx-0.5 inline-flex translate-y-[-1px] items-center gap-1.5 rounded-[7px] border border-line bg-chip py-px pr-[7px] pl-1 align-middle leading-7 font-medium text-ink transition-colors duration-200 hover:border-muted/40"
  >
    <AppIcon p={p} size={17} />
    {p.short}
  </a>
)

export const Status = ({ p }) =>
  p.live ? (
    <span className="meta inline-flex items-center gap-1.5">
      <span className="size-1.5 rounded-full bg-green-500" />
      {p.status}
    </span>
  ) : (
    <span className="meta">{p.status}</span>
  )

/** Fades a block up the first time it scrolls into view. */
export const Reveal = ({ children, className, as = 'div' }) => {
  const M = motion[as]
  return (
    <M className={className} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}>
      {children}
    </M>
  )
}

/** Numbered section: "01  Title ............ action". */
export const Section = ({ n, title, action, id, children }) => (
  <Reveal as="section" className="mt-24 scroll-mt-20" >
    <div id={id} className="flex items-center gap-3">
      {n && <span className="font-num text-xs text-accent">{n}</span>}
      <h2 className="h2">{title}</h2>
      {action && <div className="ml-auto">{action}</div>}
    </div>
    {children}
  </Reveal>
)

/** Small muted ↗ link for section headers. */
export const SideLink = ({ href, to, children }) => {
  const cls = 'text-[13.5px] text-muted transition-colors hover:text-ink'
  return to ? (
    <Link to={to} className={`group inline-flex items-center gap-1 ${cls}`}>
      {children}
      <Arrow />
    </Link>
  ) : (
    <Ext href={href} className={cls}>{children}</Ext>
  )
}

/** Page hero for subpages: eyebrow, title, subline. */
export const PageHead = ({ eyebrow, title, sub }) => (
  <Reveal className="pt-14">
    <p className="meta">{eyebrow}</p>
    <h1 className="h1-sub mt-3">{title}</h1>
    {sub && <p className="mt-5 text-[17px] leading-7 text-muted">{sub}</p>}
  </Reveal>
)
