import content from '../content/content.json'
import { useLive } from '../live'
import { Arrow, Ext, Icons, Link, PageHead, Section, ToolLogo } from '../ui'
import { EmailCopy } from './Home'

const { profile, education, socials, research, stack, certifications, otherAchievements, bestPosts, github } = content
const social = Object.fromEntries(socials.map((s) => [s.platform, s]))

/** Shared shell for a social card: brand-tinted, lifts on hover, whole card is the link. */
function SocialCard({ s, icon, tint, className = '', children }) {
  return (
    <a
      href={s.url}
      target="_blank"
      rel="noreferrer"
      className={`lift group relative flex flex-col overflow-hidden rounded-[14px] border border-line bg-chip p-5 ${className}`}
      style={{ backgroundImage: `radial-gradient(120% 90% at 100% 0%, ${tint}, transparent 60%)` }}
    >
      <div className="flex items-center gap-3">
        <span className="pop grid size-10 place-items-center rounded-[10px] text-white" style={{ background: tint.replace(/[\d.]+\)$/, '1)') }}>
          <span className="scale-125">{icon}</span>
        </span>
        <div className="min-w-0">
          <p className="h3 truncate">{s.handle}</p>
          <p className="meta">{s.platform}</p>
        </div>
        <span className="ml-auto inline-flex items-center gap-1 rounded-full border border-line bg-col px-3 py-1 text-[12.5px] font-medium text-ink transition-colors group-hover:border-muted/50">
          Follow <Arrow />
        </span>
      </div>
      {children}
    </a>
  )
}

function Socials() {
  const gh = useLive('/api/github/contributions')
  const top = [...bestPosts].sort((a, b) => b.impressions - a.impressions).slice(0, 2)
  const stat = (v, k) => (
    <div>
      <p className="text-[22px] leading-7 font-semibold tracking-tight text-ink">{v}</p>
      <p className="meta">{k}</p>
    </div>
  )
  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2">
      <SocialCard s={social.LinkedIn} icon={Icons.linkedin} tint="rgba(10,102,194,.16)" className="sm:col-span-2">
        <div className="mt-5 flex flex-wrap items-end gap-x-8 gap-y-3">
          {stat(social.LinkedIn.followers, 'followers')}
          {stat(bestPosts.reduce((n, p) => n + p.impressions, 0).toLocaleString('en-IN'), 'impressions on my top posts')}
        </div>
        <ul className="mt-5 grid gap-2.5 sm:grid-cols-2">
          {top.map((p) => (
            <li key={p.caption} className="rounded-[10px] border border-line bg-col p-3.5 transition-transform duration-300 ease-out group-hover:-translate-y-0.5">
              <p className="line-clamp-3 text-[13.5px] leading-5 text-ink">{p.caption}</p>
              <p className="meta mt-2">{p.impressions.toLocaleString('en-IN')} impressions</p>
            </li>
          ))}
        </ul>
      </SocialCard>

      <SocialCard s={social.Instagram} icon={Icons.instagram} tint="rgba(221,42,123,.16)">
        <p className="copy mt-4">{social.Instagram.about}.</p>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {['laptop', 'wave', 'celebrate'].map((m, i) => (
            <div key={m} className="aspect-square overflow-hidden rounded-[8px] border border-line bg-col">
              <img src={`/mascot/casual/chibi-${m}.webp`} alt="" loading="lazy" className="size-full object-contain p-1.5 transition-transform duration-500 ease-out group-hover:scale-110" style={{ transitionDelay: `${i * 60}ms` }} />
            </div>
          ))}
        </div>
      </SocialCard>

      <SocialCard s={social.GitHub} icon={Icons.github} tint="rgba(120,113,108,.18)">
        <p className="copy mt-4">Most of what I build is open source.</p>
        <div className="mt-auto grid grid-cols-3 gap-3 pt-5">
          {stat(gh?.publicRepos ?? github.fallback.publicRepos, 'repos')}
          {stat(gh?.totalStars ?? github.fallback.totalStars, 'stars')}
          {stat(gh?.total?.toLocaleString('en-IN') ?? '–', 'contributions')}
        </div>
      </SocialCard>
    </div>
  )
}

/** One infinite row of logo tiles; the list is doubled so the loop is seamless. */
function LogoRow({ items, reverse }) {
  const tile = (t, hidden) => (
    <li key={t + hidden} aria-hidden={hidden || undefined} title={t} className="group/t relative grid h-16 min-w-16 shrink-0 place-items-center rounded-[12px] border border-line bg-chip px-3 transition-colors hover:border-muted/40">
      {content.logos[t] ? (
        <>
          <ToolLogo name={t} size={30} className="transition-transform duration-300 ease-out group-hover/t:-translate-y-1.5 group-hover/t:scale-90" />
          <span className="pointer-events-none absolute bottom-1.5 text-[10.5px] whitespace-nowrap text-muted opacity-0 transition-opacity duration-200 group-hover/t:opacity-100">{t}</span>
          <span className="sr-only">{t}</span>
        </>
      ) : (
        <span className="text-[13px] whitespace-nowrap text-ink">{t}</span>
      )}
    </li>
  )
  return (
    <div className="marquee">
      <ul className={`marquee-track ${reverse ? 'reverse' : ''}`} style={{ '--dur': `${items.length * 3.5}s` }}>
        {items.map((t) => tile(t, false))}
        {items.map((t) => tile(t, true))}
      </ul>
    </div>
  )
}

export default function About() {
  // Lowercase the role but keep acronyms: "an AI research intern".
  const lower = (s) => s.split(' ').map((w) => (/^[A-Z]{2,}$/.test(w) ? w : w.toLowerCase())).join(' ')
  const roles = profile.now.map((n) => `${/^[AEIOU]/.test(n.role) ? 'an' : 'a'} ${lower(n.role)} at ${n.org}`)
  return (
    <>
      <PageHead eyebrow="About" title="A little more about me" sub={`I'm ${profile.name}, an ${profile.role} from ${profile.location.split(',')[0]}.`} />

      <div className="mt-8 space-y-5 text-[16px] leading-7 text-ink">
        <p>{profile.oneLiner} Right now I'm {roles.slice(0, -1).join(', ')} and {roles.at(-1)}.</p>
        {otherAchievements.map((a) => <p key={a} className="text-muted">{a}.</p>)}
      </div>

      <Section title="I build in public">
        <Socials />
      </Section>

      <Section title="Toolkit" id="stack">
        <div className="mt-6 space-y-5">
          {Object.entries(stack).map(([group, items], i) => (
            <div key={group}>
              <p className="meta mb-2.5">{group}</p>
              <LogoRow items={items} reverse={i % 2 === 1} />
            </div>
          ))}
        </div>
      </Section>

      <Section title="Research">
        <ul className="mt-5 border-t border-line">
          {research.map((r) => (
            <li key={r.title} className="row isolate border-b border-line py-4">
              {r.link ? <Ext href={r.link} className="h3 row-title">{r.title}</Ext> : <h3 className="h3 row-title">{r.title}</h3>}
              <p className="meta mt-1">{r.venue}</p>
              <p className="copy mt-2">{r.abstract}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Education">
        {education.map((e) => (
          <div key={e.institution} className="mt-5 border-t border-line pt-4">
            <div className="flex flex-wrap items-baseline gap-x-3">
              <h3 className="h3">{e.institution}</h3>
              <span className="meta ml-auto">{e.years}</span>
            </div>
            <p className="copy mt-1">{e.degree}, {e.field}{e.cgpa && ` · CGPA ${e.cgpa}`}</p>
          </div>
        ))}
        <ul className="mt-6 space-y-1.5">
          {certifications.map((c) => <li key={c} className="copy">{c}</li>)}
        </ul>
      </Section>

      <div className="mt-20 flex flex-wrap items-center gap-7 text-[15px]">
        <Link to="/projects" className="link">Explore my work</Link>
        <Link to="/resume" className="link">Resume</Link>
        <EmailCopy />
      </div>
    </>
  )
}
