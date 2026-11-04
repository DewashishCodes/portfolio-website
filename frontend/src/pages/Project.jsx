import content from '../content/content.json'
import { AppIcon, Ext, Link, Reveal, Status, ToolLogo } from '../ui'

const { projects } = content

/** Demo clip when we have one (autoplays muted, like a GIF), else the card image. */
function Media({ p }) {
  const frame = 'overflow-hidden rounded-[14px] border border-line bg-chip'
  if (!p.clip) return <img src={p.media} alt={`${p.title} screenshot`} className={`${frame} w-full`} />
  return (
    <div className={`${frame} grid place-items-center`}>
      <video src={p.clip} poster={p.media} autoPlay muted loop playsInline aria-label={`${p.title} demo`} className="max-h-[min(70vh,620px)] w-auto max-w-full" />
    </div>
  )
}

export default function Project({ p }) {
  const i = projects.indexOf(p)
  const next = projects[(i + 1) % projects.length]
  const linkCls = 'inline-flex h-9 items-center gap-1.5 rounded-full border border-line bg-chip px-3.5 text-[13.5px] font-medium text-ink transition-colors hover:border-muted/40'

  return (
    <>
      <Reveal className="pt-12">
        <Link to="/projects" className="group meta inline-flex items-center gap-1.5 transition-colors hover:text-ink">
          <span className="transition-transform duration-300 ease-out group-hover:-translate-x-1">←</span> All projects
        </Link>
        <div className="mt-6 flex items-center gap-4">
          <AppIcon p={p} size={48} />
          <div>
            <h1 className="h1-sub">{p.title}</h1>
            <div className="mt-1 flex items-center gap-3">
              <Status p={p} />
              {p.license && <span className="meta">{p.license}</span>}
            </div>
          </div>
        </div>
        <p className="mt-6 text-[18px] leading-[30px] text-ink">{p.pitch}</p>
        <div className="mt-6 flex flex-wrap gap-2.5">
          {p.website && <Ext href={p.website} className={linkCls}>Visit website</Ext>}
          {p.github && <Ext href={p.github} className={linkCls}>View on GitHub</Ext>}
        </div>
      </Reveal>

      <Reveal className="mt-10">
        <Media p={p} />
        {p.metric && <p className="meta mt-3 text-center">{p.metric}</p>}
      </Reveal>

      {p.story && (
        <Reveal as="section" className="mt-14">
          <dl className="border-t border-line">
            {p.story.map((s) => (
              <div key={s.label} className="grid gap-1 border-b border-line py-5 sm:grid-cols-[110px_1fr] sm:gap-6">
                <dt className="font-num pt-0.5 text-xs tracking-wide text-accent uppercase">{s.label}</dt>
                <dd className="text-[16px] leading-[26px] text-ink first-letter:uppercase">{s.text}</dd>
              </div>
            ))}
          </dl>
        </Reveal>
      )}

      {p.tags.length > 0 && (
        <Reveal as="section" className="mt-12">
          <h2 className="h2">Built with</h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {p.tags.map((t) => (
              <li key={t} className="lift inline-flex items-center gap-2 rounded-[9px] border border-line bg-chip px-2.5 py-1.5 text-[13.5px] text-ink">
                <ToolLogo name={t} size={16} />
                {t}
              </li>
            ))}
          </ul>
        </Reveal>
      )}

      {p.gallery?.length > 0 && (
        <Reveal as="section" className="mt-12">
          <h2 className="h2">More screens</h2>
          <div className={`mt-4 grid gap-4 ${p.gallery.length > 1 ? 'sm:grid-cols-2' : ''}`}>
            {p.gallery.map((g) => (
              <img key={g} src={g} alt={`${p.title} screen`} loading="lazy" className="lift w-full rounded-[12px] border border-line" />
            ))}
          </div>
        </Reveal>
      )}

      <Reveal className="mt-16">
        <Link to={`/projects/${next.slug}`} className="lift group flex items-center gap-4 rounded-[14px] border border-line bg-chip p-5">
          <AppIcon p={next} size={36} />
          <div className="min-w-0">
            <p className="meta">Next project</p>
            <p className="h3 truncate">{next.title}</p>
          </div>
          <span className="ml-auto text-muted transition-transform duration-300 ease-out group-hover:translate-x-1">→</span>
        </Link>
      </Reveal>
    </>
  )
}
