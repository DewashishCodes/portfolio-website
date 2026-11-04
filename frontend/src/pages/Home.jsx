import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useEffect, useState } from 'react'
import content from '../content/content.json'
import GitHubGraph from '../GitHubGraph'
import { useLive } from '../live'
import { ProjectList, ViewToggle } from '../Projects'
import { AppIcon, Chip, Icons, Link, Reveal, Section, SideLink, ToolLogo } from '../ui'

const { profile, intro, projects, experience, highlights, contact, github } = content
const byTitle = Object.fromEntries(projects.map((p) => [p.title, p]))

function Greeting() {
  const reduced = useReducedMotion()
  const [i, setI] = useState(0)
  useEffect(() => {
    if (reduced) return
    const id = setInterval(() => setI((n) => (n + 1) % profile.greetings.length), 2400)
    return () => clearInterval(id)
  }, [reduced])
  return (
    <span className="relative block h-5 overflow-hidden text-[14px] leading-5 text-muted" aria-label={profile.greetings.join('. ')}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={i}
          aria-hidden="true"
          className="block"
          initial={{ y: 14, opacity: 0, filter: 'blur(3px)' }}
          animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
          exit={{ y: -14, opacity: 0, filter: 'blur(3px)' }}
          transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        >
          {profile.greetings[i]}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}

/** "Currently" card: what I'm doing right now, from profile.now. */
function NowCard() {
  return (
    <div className="lift mt-10 rounded-[14px] border border-line bg-chip p-4 sm:p-5">
      <p className="flex items-center gap-2 font-num text-[11px] tracking-[0.12em] text-muted uppercase">
        <span className="relative flex size-2">
          <span className="absolute inset-0 animate-ping rounded-full bg-green-500/60" />
          <span className="relative size-2 rounded-full bg-green-500" />
        </span>
        Now
      </p>
      <ul className="mt-3 grid gap-2.5 sm:grid-cols-3 sm:gap-4">
        {profile.now.map((n) => {
          const p = byTitle[n.org]
          return (
            <li key={n.org} className="flex items-center gap-3 rounded-[10px] border border-line bg-col px-3 py-2.5">
              {p ? <AppIcon p={p} size={28} /> : <span className="grid size-7 shrink-0 place-items-center rounded-[7px] bg-chip text-[13px] font-semibold text-ink">{n.org[0]}</span>}
              <div className="min-w-0">
                <p className="truncate text-[14px] font-medium text-ink">{n.org.split(' – ')[0]}</p>
                <p className="meta truncate">{n.role}{n.since && ` · since ${n.since}`}</p>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

// "{Name}" tokens in the lead become product chips.
const Lead = () => intro.lead.split(/\{(.+?)\}/).map((part, i) => (i % 2 ? <Chip key={i} p={byTitle[part]} /> : part))

export function EmailCopy({ big }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(contact.email)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      location.href = `mailto:${contact.email}`
    }
  }
  return (
    <span className="inline-flex items-center gap-2">
      <a href={`mailto:${contact.email}`} className={`link ${big ? 'text-[17px]' : 'text-[15px]'}`}>Email me</a>
      <button onClick={copy} aria-label="Copy email address" className="pop text-muted hover:text-ink">
        {copied ? Icons.check : Icons.copy}
      </button>
      <span aria-live="polite" className="sr-only">{copied ? 'Email copied' : ''}</span>
    </span>
  )
}

export default function Home() {
  const [view, setView] = useState('list')
  const gh = useLive('/api/github/contributions')
  const current = (e) => /present|pilot/i.test(e.dates)

  return (
    <>
      <Reveal className="pt-[70px]">
        <div className="flex items-center gap-5">
          <img src={profile.avatar} alt="" width="64" height="64" className="size-16 -rotate-3 rounded-[15px] border border-line bg-chip object-cover shadow-[0_6px_16px_-6px_rgba(0,0,0,.25)]" />
          <div>
            <Greeting />
            <h1 className="h1 mt-0.5">{profile.name}</h1>
            <p className="mt-1.5 text-[15px] text-muted">
              {profile.role} · {profile.now[0].role} at{' '}
              <a href={profile.now[0].url} target="_blank" rel="noreferrer" className="link">{profile.now[0].org}</a>
            </p>
          </div>
        </div>
        <p className="lead mt-10 max-w-[640px]"><Lead /></p>
        <div className="mt-8 flex flex-wrap items-center gap-7 text-[15px]">
          <Link to="/resume" className="link">Resume</Link>
          <EmailCopy />
        </div>
        <NowCard />
      </Reveal>

      <Section n="01" title="Things I've built" action={<ViewToggle view={view} setView={setView} />}>
        <ProjectList projects={projects} view={view} />
        <div className="mt-8 flex justify-center">
          <Link to="/projects" className="group inline-flex h-9 items-center gap-1.5 rounded-full border border-line bg-chip px-3.5 text-[13.5px] font-medium text-ink transition-colors hover:border-muted/40">
            Show more projects <span className="arrow">↗</span>
          </Link>
        </div>
      </Section>

      <Section n="02" title="Experience">
        <ul className="mt-5 border-t border-line">
          {experience.map((e) => (
            <li key={e.org} className="row isolate border-b border-line py-5">
              <div className="flex flex-wrap items-center gap-x-2.5">
                <h3 className="h3 row-title">{e.url ? <a href={e.url} target="_blank" rel="noreferrer" className="hover:underline underline-offset-4">{e.org}</a> : e.org}</h3>
                {current(e) && <span className="rounded-[5px] bg-accent/10 px-1.5 py-px font-num text-[10.5px] tracking-wide text-accent">NOW</span>}
                <span className="meta ml-auto">{e.dates}</span>
              </div>
              <p className="mt-0.5 text-[14px] text-muted">{[e.role, e.location].filter(Boolean).join(' · ')}</p>
              {e.bullets[0] && <p className="copy mt-3">{e.bullets[0]}</p>}
            </li>
          ))}
        </ul>
      </Section>

      <Section n="03" title="How I work" action={<SideLink to="/about#stack">Full kit</SideLink>}>
        <p className="lead mt-6">
          {intro.how.map((part, i) =>
            content.logos[part] ? (
              <span key={i} className="mx-0.5 inline-flex items-baseline gap-1.5 font-medium whitespace-nowrap">
                <ToolLogo name={part} size={17} className="pop translate-y-[3px]" />
                {part}
              </span>
            ) : (
              part
            ),
          )}
        </p>
        <ol className="mt-8 grid gap-3 sm:grid-cols-3">
          {intro.workflow.map((w, i) => (
            <li key={w.title} className="lift group rounded-[12px] border border-line bg-chip p-4">
              <div className="flex items-center justify-between">
                <span className="font-num text-xs text-accent">0{i + 1}</span>
                <span className="flex -space-x-1.5">
                  {w.tools.map((t) => (
                    <span key={t} title={t} className="grid size-7 place-items-center rounded-full border border-line bg-col transition-transform duration-300 ease-out group-hover:-translate-y-0.5">
                      <ToolLogo name={t} size={15} />
                    </span>
                  ))}
                </span>
              </div>
              <h3 className="h3 mt-4">{w.title}</h3>
              <p className="copy mt-1.5 text-[14px] leading-[21px]">{w.body}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section n="04" title="Recognition">
        <ul className="mt-5 border-t border-line">
          {highlights.map((h) => (
            <li key={h.title} className="row isolate flex flex-col gap-1 border-b border-line py-4 sm:flex-row sm:items-baseline sm:gap-6">
              <span className="row-title text-[16px] text-ink">{h.title}</span>
              <span className="meta sm:ml-auto sm:text-right">{h.detail}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section n="05" title="On GitHub" action={<SideLink href={`https://github.com/${github.username}`}>@{github.username}</SideLink>}>
        {gh?.weeks ? (
          <GitHubGraph data={gh} />
        ) : (
          <p className="copy mt-6">{github.fallback.publicRepos} public repositories and {github.fallback.totalStars} stars so far.</p>
        )}
      </Section>

      <Reveal as="section" className="-mx-5 mt-24 border-t border-line px-5 pt-14 sm:-mx-10 sm:px-10" >
        <p className="meta">Contact</p>
        <h2 className="h1 mt-3">{contact.headline}</h2>
        <p className="mt-4 text-[17px] text-muted">{contact.subline}</p>
        <p className="meta mt-3">Based in {profile.location} ({profile.timezone})</p>
        <div className="mt-8 flex flex-wrap items-center gap-7">
          <EmailCopy big />
          <Link to="/resume" className="link text-[17px]">Resume</Link>
        </div>
      </Reveal>
    </>
  )
}
