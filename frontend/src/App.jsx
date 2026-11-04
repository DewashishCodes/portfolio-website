import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import content from './content/content.json'
import About from './pages/About'
import Home from './pages/Home'
import Project from './pages/Project'
import Resume from './pages/Resume'
import Work from './pages/Work'
import { Icons, Link, scrollToTarget, usePath } from './ui'

const { profile, socials, seo } = content
const social = Object.fromEntries(socials.map((s) => [s.platform, s.url]))
const PAGES = { '/': [Home], '/projects': [Work, 'Work'], '/about': [About, 'About'], '/resume': [Resume, 'Resume'] }

// [Page component, tab title] for a path; unknown paths fall back to home.
function route(path) {
  const p = path.replace(/\/$/, '') || '/'
  const slug = p.match(/^\/projects\/([\w-]+)$/)?.[1]
  const project = slug && content.projects.find((x) => x.slug === slug)
  if (project) return [() => <Project p={project} />, project.title]
  return PAGES[p] ?? PAGES['/']
}

// One count per browser: the first visit POSTs, later ones only read.
// A shared promise so StrictMode's double effect can't count twice.
let visitsP
const getVisits = () => {
  if (visitsP) return visitsP
  let counted = false
  try { counted = localStorage.counted === '1' } catch {}
  return (visitsP = fetch(counted ? '/api/visits' : '/api/visit', { method: counted ? 'GET' : 'POST' })
    .then((r) => (r.ok ? r.json() : null))
    .then((d) => {
      if (d && !counted) try { localStorage.counted = '1' } catch {}
      return d?.visits ?? null
    })
    .catch(() => null))
}

function Visitors() {
  const [n, setN] = useState(null)
  useEffect(() => { getVisits().then(setN) }, [])
  return n == null ? null : <>{n.toLocaleString('en-IN')} {n === 1 ? 'visitor' : 'visitors'} ·</>
}

function ThemeToggle() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))
  const toggle = () => {
    const d = document.documentElement.classList.toggle('dark')
    try { localStorage.theme = d ? 'dark' : 'light' } catch {}
    setDark(d)
  }
  return (
    <button onClick={toggle} aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'} className={`grid size-8 place-items-center rounded-[8px] text-muted transition-colors hover:text-ink ${dark ? 'bg-chip text-ink' : ''}`}>
      {dark ? Icons.sun : Icons.moon}
    </button>
  )
}

function Header({ path }) {
  const nav = [['/projects', 'Work'], ['/about', 'About'], ['/resume', 'Resume']]
  const iconLink = 'pop grid size-8 place-items-center hover:text-ink'
  const item = 'rounded-[7px] px-2 py-1 transition-colors hover:text-ink'
  return (
    <header className="sticky top-0 z-20 -mx-5 flex h-[60px] items-center gap-2 border-b border-line bg-col/80 px-5 backdrop-blur-[12px] backdrop-saturate-[1.4] sm:-mx-10 sm:px-10">
      <Link to="/" className="mr-3 flex items-center gap-2.5 text-[15px] font-medium text-ink">
        <img src={profile.avatar} alt="" width="24" height="24" className="size-6 rounded-[6px] border border-line bg-chip object-cover" />
        <span className="max-sm:hidden">{profile.name}</span>
      </Link>
      <nav className="flex items-center text-[15px] text-muted">
        {nav.map(([to, label]) => {
          const on = path === to || path.startsWith(to + '/')
          return <Link key={to} to={to} aria-current={on ? 'page' : undefined} className={`${item} ${on ? 'bg-chip text-ink' : ''}`}>{label}</Link>
        })}
      </nav>
      <div className="ml-auto flex items-center gap-0.5 text-muted">
        <a href={social.GitHub} target="_blank" rel="noreferrer" aria-label="GitHub" className={iconLink}>{Icons.github}</a>
        <a href={social.Instagram} target="_blank" rel="noreferrer" aria-label="Instagram" className={iconLink}>{Icons.instagram}</a>
        <a href={social.X} target="_blank" rel="noreferrer" aria-label="X" className={`${iconLink} max-[420px]:hidden`}>{Icons.x}</a>
        <span className="mx-1.5 h-4 w-px bg-line" />
        <ThemeToggle />
      </div>
    </header>
  )
}

function Footer() {
  return (
    <footer className="mt-20 border-t border-dashed border-line pt-7 pb-10 text-[14px]">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-muted">
        {socials.map((s) => <a key={s.platform} href={s.url} target="_blank" rel="noreferrer" className="transition-colors hover:text-ink">{s.platform}</a>)}
        <a href="#top" onClick={(e) => (e.preventDefault(), scrollTo({ top: 0, behavior: 'smooth' }))} className="ml-auto transition-colors hover:text-ink">Back to top</a>
      </div>
      <p className="meta mt-5">Designed and built by {profile.name.split(' ')[0]}.</p>
      <p className="meta mt-2 flex items-center gap-2">
        <span className="size-1.5 animate-pulse rounded-full bg-green-500" />
        <Visitors /> Last updated · {__BUILD_DATE__}
      </p>
    </footer>
  )
}

export default function App() {
  const path = usePath()
  const [Page, title] = route(path)
  useEffect(() => { document.title = title ? `${title} · ${profile.name}` : seo.title }, [title])

  return (
    <div id="top" className="mx-auto min-h-screen max-w-[766px] bg-col px-5 sm:border-x sm:border-line sm:px-10">
      <Header path={path} />
      {/* Old page fades out, then we scroll and the new one fades in. */}
      <AnimatePresence mode="wait" initial={false} onExitComplete={() => scrollToTarget()}>
        <motion.main
          key={path}
          initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -6, filter: 'blur(4px)' }}
          transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
        >
          <Page />
        </motion.main>
      </AnimatePresence>
      <Footer />
    </div>
  )
}
