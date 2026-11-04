import { useEffect, useState } from 'react'
import content from './content/content.json'
import About from './pages/About'
import Home from './pages/Home'
import Work from './pages/Work'
import { Icons, Link, usePath } from './ui'

const { profile, socials, seo } = content
const social = Object.fromEntries(socials.map((s) => [s.platform, s.url]))
const PAGES = { '/': [Home], '/projects': [Work, 'Work'], '/about': [About, 'About'] }

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
  const nav = [['/projects', 'Work'], ['/about', 'About']]
  const item = 'rounded-[7px] px-2 py-1 transition-colors hover:text-ink'
  return (
    <header className="sticky top-0 z-20 -mx-5 flex h-[60px] items-center gap-2 border-b border-line bg-col/80 px-5 backdrop-blur-[12px] backdrop-saturate-[1.4] sm:-mx-10 sm:px-10">
      <Link to="/" className="mr-3 flex items-center gap-2.5 text-[15px] font-medium text-ink">
        <img src={profile.avatar} alt="" width="24" height="24" className="size-6 rounded-[6px] border border-line bg-chip object-cover" />
        <span className="max-[380px]:hidden">{profile.name}</span>
      </Link>
      <nav className="flex items-center text-[15px] text-muted">
        {nav.map(([to, label]) => (
          <Link key={to} to={to} aria-current={path === to ? 'page' : undefined} className={`${item} ${path === to ? 'bg-chip text-ink' : ''}`}>{label}</Link>
        ))}
        <a href={profile.resumeUrl} target="_blank" rel="noreferrer" className={`${item} max-sm:hidden`}>Resume</a>
      </nav>
      <div className="ml-auto flex items-center gap-1 text-muted">
        <a href={social.GitHub} target="_blank" rel="noreferrer" aria-label="GitHub" className="grid size-8 place-items-center transition-colors hover:text-ink">{Icons.github}</a>
        <a href={social.X} target="_blank" rel="noreferrer" aria-label="X" className="grid size-8 place-items-center transition-colors hover:text-ink">{Icons.x}</a>
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
        <span className="size-1.5 rounded-full bg-green-500" />
        Last updated · {__BUILD_DATE__}
      </p>
    </footer>
  )
}

export default function App() {
  const path = usePath()
  const [Page, title] = PAGES[path.replace(/\/$/, '') || '/'] ?? PAGES['/']
  useEffect(() => { document.title = title ? `${title} · ${profile.name}` : seo.title }, [title])

  return (
    <div id="top" className="mx-auto min-h-screen max-w-[766px] bg-col px-5 sm:border-x sm:border-line sm:px-10">
      <Header path={path} />
      <main key={path}>
        <Page />
      </main>
      <Footer />
    </div>
  )
}
