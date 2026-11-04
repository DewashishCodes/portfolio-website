import content from '../content/content.json'
import { Ext, Link, PageHead, Section } from '../ui'
import { EmailCopy } from './Home'

const { profile, education, socials, research, stack, certifications, otherAchievements } = content

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
        <ul className="mt-6 grid gap-4 sm:grid-cols-3">
          {socials.filter((s) => s.platform !== 'X').map((s) => (
            <li key={s.platform}>
              <a href={s.url} target="_blank" rel="noreferrer" className="group block h-full rounded-[12px] border border-line bg-chip p-4 transition-colors hover:border-muted/40">
                <p className="font-num text-[10.5px] tracking-[0.08em] text-muted uppercase">{s.platform}</p>
                <p className="h3 mt-2">{s.handle}</p>
                <p className="meta mt-1">{s.about || 'Code, experiments and open source'}</p>
                {s.showFollowers && s.followers && <p className="mt-3 text-[13px] font-medium text-ink">{s.followers} followers</p>}
              </a>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Research">
        <ul className="mt-5 border-t border-line">
          {research.map((r) => (
            <li key={r.title} className="border-b border-line py-4">
              {r.link ? <Ext href={r.link} className="h3 hover:text-muted">{r.title}</Ext> : <h3 className="h3">{r.title}</h3>}
              <p className="meta mt-1">{r.venue}</p>
              <p className="copy mt-2">{r.abstract}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Toolkit" id="stack">
        <dl className="mt-5 border-t border-line">
          {Object.entries(stack).map(([group, items]) => (
            <div key={group} className="grid gap-2 border-b border-line py-4 sm:grid-cols-[150px_1fr]">
              <dt className="meta pt-0.5">{group}</dt>
              <dd className="flex flex-wrap gap-1.5">
                {items.map((t) => <span key={t} className="rounded-[6px] border border-line bg-chip px-2 py-0.5 text-[13px] text-ink">{t}</span>)}
              </dd>
            </div>
          ))}
        </dl>
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
        <Ext href={profile.resumeUrl} className="link">Resume</Ext>
        <EmailCopy />
      </div>
    </>
  )
}
