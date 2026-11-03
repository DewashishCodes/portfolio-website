// Content blocks for each checkpoint type. Pure content: the 3D overlay (InfoPanel) and the
// Pit Lane page both render these, so text only ever lives in content.json.
import content from '../content/content.json'

const { profile, highlights, github, stack, research, socials, bestPosts, education, experience, certifications, otherAchievements, contact } = content

export const Label = ({ children }) => <div className="font-mono text-[11px] tracking-[0.2em] text-saffron">{children}</div>

export const Btn = ({ href, children, primary, ...rest }) => (
  <a href={href} target={href?.startsWith('http') ? '_blank' : undefined} rel="noreferrer" {...rest}
    className={`inline-flex items-center rounded-md px-3 py-1.5 font-mono text-xs tracking-wider transition-colors ${primary ? 'bg-saffron text-carbon hover:bg-cream' : 'border border-cream/25 text-cream hover:border-saffron hover:text-saffron'}`}>
    {children}
  </a>
)

const Tags = ({ items }) => (
  <ul className="flex flex-wrap gap-1.5">
    {items.map((t) => <li key={t} className="rounded bg-cream/10 px-2 py-0.5 text-xs text-cream/85">{t}</li>)}
  </ul>
)

function Profile() {
  const fp = profile.featuredProduct
  return (
    <>
      <h2 className="text-2xl font-bold text-cream">{profile.name}</h2>
      <p className="mt-1 text-cream/85">{profile.headline}</p>
      <p className="mt-2 text-sm text-cream/70">{profile.oneLiner}</p>
      <ul className="mt-3 space-y-0.5 text-sm text-cream/85">
        {profile.now.map((n) => (
          <li key={n.org}><span className="text-saffron">●</span> {n.role}, {n.url ? <a className="underline decoration-cream/30 hover:text-saffron" href={n.url} target="_blank" rel="noreferrer">{n.org}</a> : n.org}{n.since && <span className="text-cream/50"> · since {n.since}</span>}</li>
        ))}
      </ul>
      <div className="mt-4 rounded-lg border border-saffron/40 bg-saffron/5 p-3">
        <Label>FEATURED · {fp.status.toUpperCase()}</Label>
        <h3 className="mt-1 text-lg font-semibold text-cream">{fp.name}</h3>
        <p className="text-sm text-cream/85">{fp.tagline}</p>
        <p className="mt-1 text-sm text-cream/70">{fp.description}</p>
        <div className="mt-2"><Tags items={fp.features} /></div>
        <div className="mt-3 flex flex-wrap gap-2">
          {fp.links.website && <Btn href={fp.links.website} primary>Website</Btn>}
          {fp.links.instagram && <Btn href={fp.links.instagram}>Instagram</Btn>}
          {fp.links.github && <Btn href={fp.links.github}>GitHub</Btn>}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Btn href={profile.resumeUrl}>Resume</Btn>
      </div>
      <p className="mt-3 font-mono text-xs text-cream/60">Scroll to start the lap ↓</p>
    </>
  )
}

export function Project({ cp, stars = cp.stars }) {
  return (
    <>
      <h2 className="text-2xl font-bold text-cream">{cp.title}</h2>
      <p className="mt-1 text-cream/85">{cp.pitch}</p>
      <ul className="mt-3 space-y-1.5 text-sm text-cream/80">
        {cp.bullets.map((b) => {
          const [head, ...rest] = b.split(': ')
          return <li key={b}>{rest.length ? <><strong className="text-cream">{head}:</strong> {rest.join(': ')}</> : b}</li>
        })}
      </ul>
      <div className="mt-3"><Tags items={cp.tags} /></div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {cp.repoUrl && <Btn href={cp.repoUrl} primary>GitHub{stars > 0 && ` ★ ${stars}`}</Btn>}
        {cp.demoUrl && <Btn href={cp.demoUrl}>Demo</Btn>}
        {cp.license && <span className="font-mono text-xs text-cream/50">{cp.license}</span>}
      </div>
    </>
  )
}

function Highlights() {
  return (
    <>
      <h2 className="text-2xl font-bold text-cream">Highlights</h2>
      <ol className="mt-3 space-y-2">
        {highlights.map((h) => (
          <li key={h.title} className="flex gap-3 rounded-lg bg-cream/5 p-2.5">
            <span className={`w-20 shrink-0 font-mono text-xs font-bold ${h.place === 'P1' ? 'text-saffron' : 'text-cream/70'}`}>{h.place}</span>
            <div>
              <h3 className="text-sm font-semibold text-cream">{h.title}</h3>
              <p className="text-xs text-cream/70">{h.detail}</p>
            </div>
          </li>
        ))}
      </ol>
      {otherAchievements?.length > 0 && (
        <ul className="mt-3 space-y-1 text-xs text-cream/70">
          {otherAchievements.map((a) => <li key={a}>· {a}</li>)}
        </ul>
      )}
    </>
  )
}

// Phase 4 swaps the fallback numbers for live GitHub data and adds the heatmap.
export function Telemetry({ stats = github.fallback, children }) {
  const tiles = [['PUBLIC REPOS', stats.publicRepos], ['TOTAL STARS', stats.totalStars], ['FOLLOWERS', stats.followers]]
  return (
    <>
      <h2 className="text-2xl font-bold text-cream">GitHub telemetry</h2>
      <dl className="mt-3 grid grid-cols-3 gap-2">
        {tiles.map(([k, v]) => (
          <div key={k} className="rounded-lg bg-cream/5 p-2.5">
            <dt className="font-mono text-[10px] tracking-widest text-cream/60">{k}</dt>
            <dd className="text-2xl font-bold text-cream tabular-nums">{v}</dd>
          </div>
        ))}
      </dl>
      {children}
      <div className="mt-4"><Btn href={`https://github.com/${github.username}`} primary>@{github.username}</Btn></div>
    </>
  )
}

function Stack() {
  return (
    <>
      <h2 className="text-2xl font-bold text-cream">Tech stack + agentic stack</h2>
      <div className="mt-3 space-y-3">
        {Object.entries(stack).map(([group, items]) => (
          <div key={group}>
            <h3 className="mb-1 font-mono text-[11px] tracking-[0.2em] text-saffron">{group.toUpperCase()}</h3>
            <Tags items={items} />
          </div>
        ))}
      </div>
    </>
  )
}

function Research() {
  return (
    <>
      <h2 className="text-2xl font-bold text-cream">Research</h2>
      <div className="mt-3 space-y-3">
        {research.map((r) => (
          <article key={r.title} className="rounded-lg bg-cream/5 p-3">
            <Label>{r.venue}</Label>
            <h3 className="mt-1 text-sm font-semibold text-cream">{r.title}</h3>
            {r.authors && <p className="text-xs text-cream/60">{r.authors}</p>}
            <p className="mt-1 text-xs text-cream/75">{r.abstract}</p>
            {r.link && <div className="mt-2"><Btn href={r.link}>Read</Btn></div>}
          </article>
        ))}
      </div>
    </>
  )
}

function Socials() {
  return (
    <>
      <h2 className="text-2xl font-bold text-cream">I build in public</h2>
      <ul className="mt-3 grid grid-cols-2 gap-2">
        {socials.map((s) => (
          <li key={s.platform}>
            <a href={s.url} target="_blank" rel="noreferrer" className="block rounded-lg bg-cream/5 p-2.5 hover:bg-cream/10">
              <span className="font-mono text-[10px] tracking-widest text-saffron">{s.platform.toUpperCase()}</span>
              <span className="block text-sm text-cream">{s.handle}</span>
              {s.showFollowers && s.followers && <span className="text-xs text-cream/60">{s.followers} followers</span>}
            </a>
          </li>
        ))}
      </ul>
      <h3 className="mt-4 font-mono text-[11px] tracking-[0.2em] text-saffron">BEST POSTS</h3>
      <ul className="mt-2 space-y-2">
        {bestPosts.map((p) => (
          <li key={p.caption}>
            <a href={p.url} target="_blank" rel="noreferrer" className="block rounded-lg border border-cream/10 p-2.5 text-xs text-cream/85 hover:border-saffron">
              {p.caption}
              <span className="mt-1 block font-mono text-[10px] text-cream/50">{p.platform} · {p.impressions.toLocaleString('en-IN')} impressions</span>
            </a>
          </li>
        ))}
      </ul>
    </>
  )
}

function Education() {
  return (
    <>
      <h2 className="text-2xl font-bold text-cream">Team HQ</h2>
      {education.map((e) => (
        <div key={e.institution} className="mt-3 rounded-lg bg-cream/5 p-3">
          <Label>EDUCATION</Label>
          <h3 className="mt-1 text-sm font-semibold text-cream">{e.institution}</h3>
          <p className="text-xs text-cream/75">{e.degree}, {e.field} · {e.years}{e.cgpa && ` · CGPA ${e.cgpa}`}</p>
        </div>
      ))}
      <h3 className="mt-4 font-mono text-[11px] tracking-[0.2em] text-saffron">EXPERIENCE</h3>
      <ol className="mt-2 space-y-3 border-l border-cream/15 pl-3">
        {experience.map((x) => (
          <li key={x.org + x.role}>
            <h4 className="text-sm font-semibold text-cream">{x.role}, {x.url ? <a href={x.url} target="_blank" rel="noreferrer" className="underline decoration-cream/30 hover:text-saffron">{x.org}</a> : x.org}</h4>
            <p className="font-mono text-[10px] text-cream/55">{x.dates}{x.location && ` · ${x.location}`}</p>
            {x.bullets.length > 0 && (
              <ul className="mt-1 space-y-0.5 text-xs text-cream/75">{x.bullets.map((b) => <li key={b}>· {b}</li>)}</ul>
            )}
          </li>
        ))}
      </ol>
      <h3 className="mt-4 font-mono text-[11px] tracking-[0.2em] text-saffron">CERTIFICATIONS</h3>
      <ul className="mt-1 space-y-0.5 text-xs text-cream/75">{certifications.map((c) => <li key={c}>· {c}</li>)}</ul>
    </>
  )
}

const linkFor = {
  linkedin: () => socials.find((s) => s.platform === 'LinkedIn'),
  github: () => socials.find((s) => s.platform === 'GitHub'),
  x: () => socials.find((s) => s.platform === 'X'),
}

// Phase 4 replaces the mailto buttons with the contact form.
export function Contact({ onCta }) {
  return (
    <>
      <h2 className="text-2xl font-bold text-cream">{contact.headline}</h2>
      <p className="mt-1 text-cream/80">{contact.subline}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {contact.ctas.map((c) => (
          <Btn key={c.intent} primary href={onCta ? undefined : `mailto:${contact.email}?subject=${encodeURIComponent(c.label)}`}
            onClick={onCta && ((e) => { e.preventDefault(); onCta(c.intent) })} role={onCta ? 'button' : undefined}>
            {c.label}
          </Btn>
        ))}
      </div>
      <ul className="mt-4 space-y-1 text-sm">
        <li><a className="text-cream underline decoration-cream/30 hover:text-saffron" href={`mailto:${contact.email}`}>{contact.email}</a></li>
        <li className="flex flex-wrap gap-2 pt-1">
          {contact.links.map((k) => k === 'resume'
            ? <Btn key={k} href={profile.resumeUrl}>Resume</Btn>
            : linkFor[k]?.() && <Btn key={k} href={linkFor[k]().url}>{linkFor[k]().platform}</Btn>)}
        </li>
      </ul>
      <footer className="mt-5 border-t border-cream/10 pt-3 text-[11px] leading-relaxed text-cream/55">
        <p>{contact.credit}</p>
        <p>
          Car model: <a className="underline" href="https://sketchfab.com/3d-models/ferrari-f1-2019-1b050bffe4e749b586b4782ee7ff4fd0" target="_blank" rel="noreferrer">"Ferrari F1 2019"</a> by valvetin,
          licensed <a className="underline" href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a>. Textures: Poly Haven (CC0).
        </p>
      </footer>
    </>
  )
}

export const SECTIONS = { profile: Profile, project: Project, highlights: Highlights, github: Telemetry, stack: Stack, research: Research, socials: Socials, education: Education, contact: Contact }
