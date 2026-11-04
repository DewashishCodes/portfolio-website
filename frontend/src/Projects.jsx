import { motion } from 'framer-motion'
import { AppIcon, Ext, Icons, Link, Status } from './ui'

export function ViewToggle({ view, setView }) {
  return (
    <div className="flex rounded-[11px] border border-line bg-chip p-[3px]" role="group" aria-label="Project layout">
      {['list', 'grid'].map((v) => (
        <button
          key={v}
          onClick={() => setView(v)}
          aria-pressed={view === v}
          aria-label={`${v} view`}
          className={`relative grid size-[30px] place-items-center rounded-[8px] transition-colors ${view === v ? 'text-ink' : 'text-muted hover:text-ink'}`}
        >
          {view === v && <motion.span layoutId="view-thumb" className="absolute inset-0 rounded-[8px] border border-line bg-col shadow-[0_1px_2px_rgba(0,0,0,.06)]" transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }} />}
          <span className="relative">{Icons[v]}</span>
        </button>
      ))}
    </div>
  )
}

const Metric = ({ p }) => p.metric && <p className="mt-2 text-[13px] font-medium text-ink">{p.metric}</p>

function Row({ p }) {
  return (
    <li className="row isolate border-b border-line py-[22px]">
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
        {/* The title link stretches over the whole row; the external links sit above it. */}
        <Link to={`/projects/${p.slug}`} className="row-title flex items-center gap-2.5 after:absolute after:inset-0 after:content-['']">
          <AppIcon p={p} />
          <h3 className="h3">{p.title}</h3>
        </Link>
        <Status p={p} />
        <div className="relative z-10 ml-auto flex gap-4 text-[13.5px] text-muted">
          {p.website && <Ext href={p.website} className="transition-colors hover:text-ink">Website</Ext>}
          {p.github && <Ext href={p.github} className="transition-colors hover:text-ink">GitHub</Ext>}
        </div>
      </div>
      <p className="copy mt-2">{p.pitch}</p>
      <Metric p={p} />
    </li>
  )
}

function Card({ p }) {
  return (
    <li>
      <Link to={`/projects/${p.slug}`} className="lift group block overflow-hidden rounded-[10px] border border-line bg-chip" tabIndex={-1} aria-hidden="true">
        {p.media ? (
          <img src={p.media} alt="" loading="lazy" className="aspect-[332/208] w-full object-cover object-top transition-transform duration-500 ease-out group-hover:scale-[1.02]" />
        ) : (
          <div className="grid aspect-[332/208] place-items-center" style={{ background: `color-mix(in srgb, ${p.color} 10%, var(--chip))` }}>
            <AppIcon p={p} size={56} />
          </div>
        )}
      </Link>
      <div className="mt-4 flex items-center gap-2.5">
        <AppIcon p={p} />
        <Link to={`/projects/${p.slug}`} className="h3 hover:underline hover:underline-offset-4">{p.title}</Link>
        <div className="ml-auto flex gap-3 text-muted">
          {p.website && <a href={p.website} target="_blank" rel="noreferrer" aria-label={`${p.title} website`} className="pop hover:text-ink">{Icons.globe}</a>}
          {p.github && <a href={p.github} target="_blank" rel="noreferrer" aria-label={`${p.title} on GitHub`} className="pop hover:text-ink">{Icons.github}</a>}
        </div>
      </div>
      <div className="mt-1.5"><Status p={p} /></div>
      <p className="copy mt-2">{p.pitch}</p>
      <Metric p={p} />
    </li>
  )
}

export function ProjectList({ projects, view }) {
  return view === 'grid' ? (
    <ul className="mt-6 grid gap-x-5 gap-y-10 sm:grid-cols-2">{projects.map((p) => <Card key={p.title} p={p} />)}</ul>
  ) : (
    <ul className="mt-5 border-t border-line">{projects.map((p) => <Row key={p.title} p={p} />)}</ul>
  )
}
