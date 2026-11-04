// Content blocks for each checkpoint type. Pure content: the 3D overlay (InfoPanel) and the
// Pit Lane page both render these, so text only ever lives in content.json.
// `flat` (Pit Lane) shows everything; the lap version uses tabs and toggles so no panel needs an inner scrollbar.
import { animate, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import content from '../content/content.json'
import { REPOS_URL, repoKey, useLive } from '../lib/live'

const { profile, highlights, github, stack, research, socials, bestPosts, education, experience, certifications, otherAchievements, contact } = content

export const Label = ({ children }) => <div className="font-mono text-[11px] tracking-[0.2em] text-saffron">{children}</div>

export const Btn = ({ href, children, primary, ...rest }) => (
  <a href={href} target={href?.startsWith('http') ? '_blank' : undefined} rel="noreferrer" {...rest}
    className={`inline-flex items-center rounded-md px-3 py-1.5 font-mono text-xs tracking-wider transition-colors ${primary ? 'bg-saffron text-carbon hover:bg-cream' : 'border border-cream/25 text-cream hover:border-saffron hover:text-saffron'}`}>
    {children}
  </a>
)

const H3 = ({ children, className = '' }) => <h3 className={`font-mono text-[11px] tracking-[0.2em] text-saffron ${className}`}>{children}</h3>

// max: show at most this many, the rest behind "+N" (expands in place).
const Tags = ({ items, max = Infinity }) => {
  const [all, setAll] = useState(false)
  const shown = all ? items : items.slice(0, max)
  return (
    <ul className="flex flex-wrap gap-1.5">
      {shown.map((t) => <li key={t} className="rounded bg-cream/10 px-2 py-0.5 text-xs text-cream/85">{t}</li>)}
      {shown.length < items.length && (
        <li>
          <button type="button" onClick={() => setAll(true)} aria-label={`Show ${items.length - shown.length} more`}
            className="rounded border border-cream/20 px-2 py-0.5 text-xs text-cream/70 hover:border-saffron hover:text-saffron">
            +{items.length - shown.length}
          </button>
        </li>
      )}
    </ul>
  )
}

// One tab visible at a time in the lap; every tab stacked in the Pit Lane.
// tabs: [{ key, label, dot? }]; render(tab) draws one tab's body.
function Tabs({ tabs, flat, render, label }) {
  const [cur, setCur] = useState(tabs[0].key)
  if (flat) return tabs.map((t) => <div key={t.key} className="mt-4"><H3 className="mb-2">{t.label.toUpperCase()}</H3>{render(t)}</div>)
  const tab = tabs.find((t) => t.key === cur) ?? tabs[0]
  return (
    <>
      <div role="tablist" aria-label={label} className="mt-3 flex flex-wrap gap-1.5">
        {tabs.map((t) => (
          <button key={t.key} type="button" role="tab" aria-selected={t.key === tab.key} onClick={() => setCur(t.key)}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 font-mono text-[11px] tracking-wider ${t.key === tab.key ? 'bg-cream text-carbon' : 'border border-cream/20 text-cream/80 hover:border-saffron'}`}>
            {t.dot && <span className="size-2.5 rounded-full ring-1 ring-black/40" style={{ background: t.dot }} aria-hidden="true" />}
            {t.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" className="mt-3">{render(tab)}</div>
    </>
  )
}

// A number that counts up from 0 on arrival (300 ms, ease-out). "1,598" and "42d" work; other values pass through.
function CountUp({ value }) {
  const m = String(value ?? '').match(/^([\d,]+)(.*)$/)
  const target = m ? Number(m[1].replace(/,/g, '')) : null
  const suffix = m ? m[2] : ''
  const [n, setN] = useState(0)
  useEffect(() => {
    if (target == null) return
    return animate(0, target, { duration: 0.3, ease: 'easeOut', onUpdate: (x) => setN(Math.round(x)) }).stop
  }, [target])
  return target == null ? <>{value}</> : <>{n.toLocaleString('en-IN')}{suffix}</>
}

function Profile({ flat }) {
  const fp = profile.featuredProduct
  return (
    <>
      <h2 className="text-2xl font-bold text-cream">{profile.name}</h2>
      <p className="mt-1 text-cream/85">{profile.headline}</p>
      {flat && <p className="mt-2 text-sm text-cream/70">{profile.oneLiner}</p>}
      <ul className="mt-3 space-y-0.5 text-sm text-cream/85">
        {profile.now.map((n) => (
          <li key={n.org}><span className="text-saffron">●</span> {n.role}, {n.url ? <a className="underline decoration-cream/30 hover:text-saffron" href={n.url} target="_blank" rel="noreferrer">{n.org}</a> : n.org}{n.since && <span className="text-cream/50"> · since {n.since}</span>}</li>
        ))}
      </ul>
      <div className="mt-3 rounded-lg border border-saffron/40 bg-saffron/5 p-3">
        <Label>FEATURED · {fp.status.toUpperCase()}</Label>
        <h3 className="mt-1 text-lg font-semibold text-cream">{fp.name}</h3>
        <p className="text-sm text-cream/85">{fp.tagline}</p>
        {flat && <p className="mt-1 text-sm text-cream/70">{fp.description}</p>}
        {flat && <div className="mt-2"><Tags items={fp.features} /></div>}
        <div className="mt-3 flex flex-wrap gap-2">
          {fp.links.website && <Btn href={fp.links.website} primary>Website</Btn>}
          {fp.links.instagram && <Btn href={fp.links.instagram}>Instagram</Btn>}
          {fp.links.github && <Btn href={fp.links.github}>GitHub</Btn>}
        </div>
      </div>
      {flat && (
        <div className="mt-4 flex flex-wrap gap-2">
          <Btn href={profile.resumeUrl}>Resume</Btn>
        </div>
      )}
    </>
  )
}

const firstSentence = (t) => t.match(/^.*?[.!?](\s|$)/)?.[0].trim() ?? t

const Bullets = ({ items }) => (
  <ul className="space-y-1.5 text-sm text-cream/80">
    {items.map((b) => {
      const [head, ...rest] = b.split(': ')
      return <li key={b}>{rest.length ? <><strong className="text-cream">{head}:</strong> {rest.join(': ')}</> : b}</li>
    })}
  </ul>
)

// Media layout: the screenshot is the hero, the pitch is one line, and the bullets sit behind a Telemetry
// toggle that swaps in for the image in the same box, so the panel never changes height.
export function Project({ cp, flat }) {
  const live = useLive(REPOS_URL)?.[cp.repoUrl && repoKey(cp.repoUrl)]
  const stars = live?.stars ?? cp.stars
  const [open, setOpen] = useState(false)
  const links = (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      {cp.repoUrl && <Btn href={cp.repoUrl} primary>GitHub{stars > 0 && ` ★ ${stars}`}</Btn>}
      {cp.demoUrl && <Btn href={cp.demoUrl}>Demo</Btn>}
      {!flat && (
        <button type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)}
          className={`rounded-md px-3 py-1.5 font-mono text-xs tracking-wider ${open ? 'bg-cream text-carbon' : 'border border-cream/25 text-cream hover:border-saffron hover:text-saffron'}`}>
          {open ? 'SCREENSHOT' : 'TELEMETRY'}
        </button>
      )}
      {cp.license && <span className="font-mono text-xs text-cream/50">{cp.license}</span>}
    </div>
  )
  if (flat) return (
    <>
      <h2 className="text-2xl font-bold text-cream">{cp.title}</h2>
      <p className="mt-1 text-cream/85">{cp.pitch}</p>
      {cp.media && <img src={cp.media} alt={`${cp.title} screenshot`} loading="lazy" className="mt-3 aspect-video w-full max-w-xl rounded-lg object-cover" />}
      <div className="mt-3"><Bullets items={cp.bullets} /></div>
      <div className="mt-3"><Tags items={cp.tags} /></div>
      {links}
    </>
  )
  return (
    <>
      <div className="relative mt-2 aspect-video max-h-[27vh] w-full overflow-hidden rounded-lg bg-black/40">
        {open || !cp.media
          ? <div className="absolute inset-0 p-3 [&_ul]:text-[13px] [&_ul]:leading-snug"><Bullets items={cp.bullets} /></div>
          : <img src={cp.media} alt={`${cp.title} screenshot`} className="absolute inset-0 size-full object-cover" />}
      </div>
      <h2 className="mt-3 text-xl font-bold text-cream">{cp.title}</h2>
      <p className="mt-0.5 text-[15px] leading-snug text-cream/85">{firstSentence(cp.pitch)}</p>
      <div className="mt-2.5"><Tags items={cp.tags} max={5} /></div>
      {links}
    </>
  )
}

const STEP = { P1: 'order-2 h-24 bg-saffron text-carbon', P2: 'order-1 h-16 bg-cream/20 text-cream', P3: 'order-3 h-12 bg-[#b07a4a]/60 text-cream' }

// P1/P2/P3 as podium steps (P2 left, P1 centre), then the "fastest lap" and other cards.
// In the lap this is a wide lower-third strip: steps on the left, cards on the right.
function Highlights({ flat }) {
  const podium = highlights.filter((h) => STEP[h.place])
  const rest = highlights.filter((h) => !STEP[h.place])
  return (
    <>
      <h2 className="text-2xl font-bold text-cream">Highlights</h2>
      <div className={flat ? '' : 'sm:grid sm:grid-cols-[1.1fr_1fr] sm:gap-5'}>
        <div>
          <ol aria-label="Podium" className="mt-4 flex items-end gap-1.5">
            {podium.map((h) => (
              <li key={h.title} className={`flex flex-1 flex-col ${STEP[h.place].split(' ')[0]}`}>
                <h3 className="mb-1.5 px-1 text-center text-xs font-semibold leading-tight text-cream">{h.title}</h3>
                <span className={`flex justify-center rounded-t-md pt-1.5 font-mono text-lg font-bold ${STEP[h.place].split(' ').slice(1).join(' ')}`}>{h.place}</span>
              </li>
            ))}
          </ol>
          <ul className="mt-2 space-y-1 text-xs text-cream/75">
            {podium.map((h) => <li key={h.title}><strong className="font-mono text-cream">{h.place}</strong> {h.detail}</li>)}
          </ul>
        </div>
        <div>
          <ul className="mt-3 space-y-2">
            {rest.map((h) => {
              const fastest = h.place === 'FASTEST LAP'
              return (
                <li key={h.title} className={`rounded-lg p-2.5 ${fastest ? 'border border-[#b77cff]/50 bg-[#b77cff]/10' : 'bg-cream/5'}`}>
                  <span className={`font-mono text-[10px] font-bold tracking-widest ${fastest ? 'text-[#c9a2ff]' : 'text-cream/70'}`}>{h.place}</span>
                  <h3 className="text-sm font-semibold text-cream">{h.title}</h3>
                  {h.detail && <p className="text-xs text-cream/70">{h.detail}</p>}
                </li>
              )
            })}
          </ul>
          {flat && otherAchievements?.length > 0 && (
            <ul className="mt-3 space-y-1 text-xs text-cream/70">
              {otherAchievements.map((a) => <li key={a}>· {a}</li>)}
            </ul>
          )}
        </div>
      </div>
    </>
  )
}

const heat = (n) => (n === 0 ? 'bg-cream/10' : n < 3 ? 'bg-saffron/35' : n < 6 ? 'bg-saffron/65' : 'bg-saffron')

function Heatmap({ weeks }) {
  return (
    <div className="mt-3 flex gap-[2px] overflow-hidden" role="img" aria-label="Contribution heatmap, last 26 weeks">
      {weeks.slice(-26).map((w) => (
        <div key={w[0].date} className="flex flex-col gap-[2px]">
          {w.map((d) => <span key={d.date} title={`${d.count} on ${d.date}`} className={`size-[9px] rounded-[2px] ${heat(d.count)}`} />)}
        </div>
      ))}
    </div>
  )
}

// Live numbers from the backend; content.json fallback when it is down or has no token.
export function Telemetry() {
  const live = useLive('/api/github/contributions')
  const stats = live ?? github.fallback
  const tiles = [['PUBLIC REPOS', stats.publicRepos], ['TOTAL STARS', stats.totalStars], ['FOLLOWERS', stats.followers]]
  if (live) tiles.push(['CONTRIBUTIONS · 1Y', live.total], ['CURRENT STREAK', `${live.currentStreak}d`], ['LONGEST STREAK', `${live.longestStreak}d`])
  return (
    <>
      <h2 className="text-2xl font-bold text-cream">GitHub telemetry</h2>
      <dl className="mt-3 grid grid-cols-3 gap-2">
        {tiles.map(([k, v]) => (
          <div key={k} className="rounded-lg bg-cream/5 p-2.5">
            <dt className="font-mono text-[10px] tracking-widest text-cream/60">{k}</dt>
            <dd className="text-2xl font-bold text-cream tabular-nums"><CountUp value={v} /></dd>
          </div>
        ))}
      </dl>
      {live && <><Heatmap weeks={live.weeks} /><p className="mt-1 font-mono text-[10px] text-cream/50">LAST 26 WEEKS</p></>}
      <div className="mt-4"><Btn href={`https://github.com/${github.username}`} primary>@{github.username}</Btn></div>
    </>
  )
}

// Pit stop: the stationary clock counts for real from the moment the car stops in the box.
function PitTimer() {
  const [ms, setMs] = useState(0)
  useEffect(() => {
    const t0 = performance.now()
    const id = setInterval(() => setMs(performance.now() - t0), 100)
    return () => clearInterval(id)
  }, [])
  return <span className="font-mono text-sm font-bold tabular-nums text-saffron">{(ms / 1000).toFixed(1)}s</span>
}

// Stack groups as tyre compounds, in content.json order. One compound fitted at a time.
const COMPOUNDS = [['Soft', '#e8322b'], ['Medium', '#f5c518'], ['Hard', '#f2f2f2'], ['Inter', '#3ab54a'], ['Wet', '#2f7fd6']]

function Stack({ flat }) {
  const tabs = Object.keys(stack).map((group, i) => {
    const [tyre, dot] = COMPOUNDS[i % COMPOUNDS.length]
    return { key: group, label: flat ? group : tyre, dot, group }
  })
  return (
    <>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-2xl font-bold text-cream">Tech stack + agentic stack</h2>
        {!flat && <span aria-hidden="true" className="shrink-0 font-mono text-[10px] tracking-widest text-cream/60">STATIONARY <PitTimer /></span>}
      </div>
      <Tabs tabs={tabs} flat={flat} label="Tyre compounds" render={(t) => (
        <>
          {!flat && <H3 className="mb-2">{t.group.toUpperCase()}</H3>}
          <ul key={t.key} className="flex flex-wrap gap-1.5">
            {stack[t.group].map((x, n) => (
              <motion.li key={x} className="rounded bg-cream/10 px-2 py-0.5 text-xs text-cream/85"
                initial={flat ? false : { opacity: 0, y: -10, scale: 0.75 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: n * 0.05, type: 'spring', stiffness: 500, damping: 22 }}>
                {x}
              </motion.li>
            ))}
          </ul>
        </>
      )} />
    </>
  )
}

function Paper({ r }) {
  return (
    <article className="rounded-lg bg-cream/5 p-3">
      <Label>{r.venue}</Label>
      <h3 className="mt-1 text-sm font-semibold text-cream">{r.title}</h3>
      {r.authors && <p className="text-xs text-cream/60">{r.authors}</p>}
      <p className="mt-1 text-xs text-cream/75">{r.abstract}</p>
      {r.link && <div className="mt-2"><Btn href={r.link}>Read</Btn></div>}
    </article>
  )
}

// One paper at a time in the lap, with prev / next.
function Research({ flat }) {
  const [i, setI] = useState(0)
  const step = (d) => setI((i + d + research.length) % research.length)
  return (
    <>
      <h2 className="text-2xl font-bold text-cream">Research</h2>
      {flat ? <div className="mt-3 space-y-3">{research.map((r) => <Paper key={r.title} r={r} />)}</div> : (
        <>
          <div className="mt-3"><Paper r={research[i]} /></div>
          {research.length > 1 && (
            <div className="mt-2 flex items-center justify-between font-mono text-[11px] tracking-wider text-cream/70">
              <button type="button" onClick={() => step(-1)} className="rounded border border-cream/20 px-2 py-1 hover:border-saffron">← PREV</button>
              <span aria-live="polite">RUN {i + 1}/{research.length}</span>
              <button type="button" onClick={() => step(1)} className="rounded border border-cream/20 px-2 py-1 hover:border-saffron">NEXT →</button>
            </div>
          )}
        </>
      )}
    </>
  )
}

// In the lap the handles and follower counts are trackside boards (SetPieces); the panel keeps the best posts.
function Socials({ flat }) {
  return (
    <>
      <h2 className="text-2xl font-bold text-cream">I build in public</h2>
      {flat ? (
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
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          {socials.map((s) => <Btn key={s.platform} href={s.url}>{s.platform}</Btn>)}
        </div>
      )}
      <H3 className="mt-4">BEST POSTS</H3>
      <ul className="mt-2 space-y-2">
        {(flat ? bestPosts : bestPosts.slice(0, 3)).map((p) => (
          <li key={p.caption}>
            <a href={p.url} target="_blank" rel="noreferrer" className="block rounded-lg border border-cream/10 p-2.5 text-xs text-cream/85 hover:border-saffron">
              {p.caption}
              <span className="mt-1 block font-mono text-[10px] text-cream/50">
                {p.platform} · {flat ? p.impressions.toLocaleString('en-IN') : <CountUp value={p.impressions} />} impressions
              </span>
            </a>
          </li>
        ))}
      </ul>
    </>
  )
}

// Team HQ: education, experience and certifications as three tabs in the lap.
function Education({ flat }) {
  const tabs = [{ key: 'edu', label: 'Education' }, { key: 'exp', label: 'Experience' }, { key: 'cert', label: 'Certifications' }]
  const body = (t) => {
    if (t.key === 'edu') return education.map((e) => (
      <div key={e.institution} className="rounded-lg bg-cream/5 p-3">
        <h3 className="text-sm font-semibold text-cream">{e.institution}</h3>
        <p className="text-xs text-cream/75">{e.degree}, {e.field} · {e.years}{e.cgpa && ` · CGPA ${e.cgpa}`}</p>
      </div>
    ))
    if (t.key === 'cert') return <ul className="space-y-0.5 text-xs text-cream/75">{certifications.map((c) => <li key={c}>· {c}</li>)}</ul>
    return (
      <ol className="space-y-3 border-l border-cream/15 pl-3">
        {experience.map((x) => (
          <li key={x.org + x.role}>
            <h4 className="text-sm font-semibold text-cream">{x.role}, {x.url ? <a href={x.url} target="_blank" rel="noreferrer" className="underline decoration-cream/30 hover:text-saffron">{x.org}</a> : x.org}</h4>
            <p className="font-mono text-[10px] text-cream/55">{x.dates}{x.location && ` · ${x.location}`}</p>
            {flat && x.bullets.length > 0 && (
              <ul className="mt-1 space-y-0.5 text-xs text-cream/75">{x.bullets.map((b) => <li key={b}>· {b}</li>)}</ul>
            )}
          </li>
        ))}
      </ol>
    )
  }
  return (
    <>
      <h2 className="text-2xl font-bold text-cream">Team HQ</h2>
      <Tabs tabs={tabs} flat={flat} label="Team HQ" render={body} />
    </>
  )
}

// Attribution (CC BY for the car). Shown in the Pit Lane footer and the lap's settings drawer.
export const Credits = () => (
  <>
    <p>{contact.credit}</p>
    <p>
      Car model: <a className="underline" href="https://sketchfab.com/3d-models/ferrari-f1-2019-1b050bffe4e749b586b4782ee7ff4fd0" target="_blank" rel="noreferrer">"Ferrari F1 2019"</a> by valvetin,
      licensed <a className="underline" href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a>. Textures: Poly Haven (CC0).
    </p>
  </>
)

const linkFor = {
  linkedin: () => socials.find((s) => s.platform === 'LinkedIn'),
  github: () => socials.find((s) => s.platform === 'GitHub'),
  x: () => socials.find((s) => s.platform === 'X'),
}

const field = 'w-full rounded-md border border-cream/20 bg-carbon/60 px-3 py-2 text-sm text-cream placeholder:text-cream/40 focus:border-saffron focus:outline-none'

// The subject pills, one row per field, one big send button.
function ContactForm() {
  const [type, setType] = useState(contact.ctas[0].intent)
  const [state, setState] = useState('idle') // idle | sending | sent | error message
  async function submit(e) {
    e.preventDefault()
    setState('sending')
    const body = { ...Object.fromEntries(new FormData(e.currentTarget)), type }
    try {
      const r = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      setState(r.ok ? 'sent' : r.status === 429 ? 'Too many messages, try again in an hour.' : r.status === 422 ? 'Check the email and message (5+ characters).' : 'error')
    } catch { setState('error') }
  }
  if (state === 'sent') return <p role="status" className="mt-4 rounded-lg border border-saffron/40 bg-saffron/5 p-3 text-sm text-cream">Copy that. Message received, I'll radio back soon.</p>
  const err = state !== 'idle' && state !== 'sending' && (state === 'error' ? <>Couldn't send. Email me directly at <a className="underline" href={`mailto:${contact.email}`}>{contact.email}</a>.</> : state)
  return (
    <form onSubmit={submit} className="mt-4 space-y-2">
      <div role="radiogroup" aria-label="Subject" className="flex flex-wrap gap-2">
        {[...contact.ctas, { label: 'Just saying hi', intent: 'other' }].map((c) => (
          <button key={c.intent} type="button" role="radio" aria-checked={type === c.intent} onClick={() => setType(c.intent)}
            className={`rounded-md px-3 py-1.5 font-mono text-xs tracking-wider ${type === c.intent ? 'bg-saffron text-carbon' : 'border border-cream/25 text-cream hover:border-saffron'}`}>
            {c.label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label className="block"><span className="sr-only">Name</span><input name="name" required maxLength={100} placeholder="Name" autoComplete="name" className={field} /></label>
        <label className="block"><span className="sr-only">Email</span><input name="email" type="email" required maxLength={200} placeholder="Email" autoComplete="email" className={field} /></label>
      </div>
      <label className="block"><span className="sr-only">Message</span><textarea name="message" required minLength={5} maxLength={4000} rows={2} placeholder="Message" className={field} /></label>
      {/* honeypot: hidden from people and screen readers, bots fill it */}
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
      {err && <p role="alert" className="text-xs text-saffron">{err}</p>}
      <button disabled={state === 'sending'} className="w-full rounded-md bg-saffron px-4 py-3 font-mono text-sm font-bold tracking-[0.2em] text-carbon hover:bg-cream disabled:opacity-60">
        {state === 'sending' ? 'TRANSMITTING…' : 'SEND ON TEAM RADIO'}
      </button>
    </form>
  )
}

export function Contact({ flat }) {
  return (
    <>
      <h2 className="text-2xl font-bold text-cream">{contact.headline}</h2>
      <p className="mt-1 text-cream/80">{contact.subline}</p>
      <ContactForm />
      <ul className="mt-4 space-y-1 text-sm">
        <li><a className="text-cream underline decoration-cream/30 hover:text-saffron" href={`mailto:${contact.email}`}>{contact.email}</a></li>
        <li className="flex flex-wrap gap-2 pt-1">
          {contact.links.map((k) => k === 'resume'
            ? <Btn key={k} href={profile.resumeUrl}>Resume</Btn>
            : linkFor[k]?.() && <Btn key={k} href={linkFor[k]().url}>{linkFor[k]().platform}</Btn>)}
        </li>
      </ul>
      {flat && <footer className="mt-5 border-t border-cream/10 pt-3 text-[11px] leading-relaxed text-cream/55"><Credits /></footer>}
    </>
  )
}

export const SECTIONS = { profile: Profile, project: Project, highlights: Highlights, github: Telemetry, stack: Stack, research: Research, socials: Socials, education: Education, contact: Contact }
