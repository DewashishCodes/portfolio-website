// The flat view: every checkpoint's content on one page. No store, no browser globals,
// so the build can render it to HTML (see ssr.jsx) for crawlers and link previews.
import content from '../content/content.json'
import { Btn, Label, SECTIONS } from '../panels/sections'

const { checkpoints, profile, moreProjects } = content

const pill = 'rounded-md border border-cream/25 px-3 py-1.5 font-mono text-xs tracking-wider text-cream transition-colors hover:border-saffron hover:text-saffron'

function MoreProjects() {
  return (
    <details className="group rounded-2xl border border-cream/10 bg-cream/[0.03] p-5 sm:p-7">
      <summary className="flex cursor-pointer list-none items-center justify-between">
        <span>
          <Label>THE BENCH</Label>
          <h2 className="mt-1 text-xl font-bold text-cream">More projects ({moreProjects.length})</h2>
        </span>
        <span aria-hidden="true" className="font-mono text-saffron transition-transform group-open:rotate-45">+</span>
      </summary>
      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {moreProjects.map((p) => (
          <li key={p.url}>
            <a href={p.url} target="_blank" rel="noreferrer" className="block h-full rounded-lg bg-cream/5 p-3 hover:bg-cream/10">
              <span className="text-sm font-semibold text-cream">{p.title}</span>
              {p.pitch && <span className="mt-0.5 block text-xs text-cream/70">{p.pitch}</span>}
            </a>
          </li>
        ))}
      </ul>
    </details>
  )
}

export default function PitLane({ onExit, onTrack }) {
  return (
    <div id="pitlane" className="min-h-screen bg-carbon">
      <header className="sticky top-0 z-10 border-b border-cream/10 bg-carbon/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <span aria-hidden="true" className="h-4 w-6 shrink-0 bg-[conic-gradient(#f2e8d5_25%,#151515_0_50%,#f2e8d5_0_75%,#151515_0)] bg-[length:8px_8px]" />
          <h1 className="truncate font-mono text-xs tracking-[0.2em] text-cream">
            <span className="text-saffron">PIT LANE</span> · {profile.name.toUpperCase()}
          </h1>
          <div className="ml-auto flex shrink-0 gap-2">
            {onExit && <button type="button" onClick={() => onExit()} className={pill}>Back to the lap</button>}
            <Btn href={profile.resumeUrl} primary>Resume</Btn>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)] gap-6 px-4 py-6 lg:grid-cols-[180px_minmax(0,1fr)] lg:gap-10 lg:py-10">
        <nav aria-label="Sections" className="min-w-0 lg:sticky lg:top-20 lg:self-start">
          <ol className="flex gap-1.5 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
            {checkpoints.map((cp) => (
              <li key={cp.id} className="shrink-0">
                <a href={`#pl-${cp.id}`} className="block rounded-md px-2.5 py-1.5 font-mono text-[11px] tracking-wider text-cream/70 hover:bg-cream/5 hover:text-saffron">
                  {cp.label}
                  {cp.type === 'project' && <span className="ml-1.5 font-sans tracking-normal text-cream/50 lg:block lg:ml-0">{cp.title}</span>}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <main className="min-w-0 space-y-5">
          {checkpoints.map((cp, i) => {
            const Section = SECTIONS[cp.type]
            const lastProject = cp.type === 'project' && checkpoints[i + 1]?.type !== 'project'
            return [
              <section key={cp.id} id={`pl-${cp.id}`} aria-label={cp.label}
                className={`scroll-mt-20 rounded-2xl border p-5 sm:p-7 ${cp.type === 'profile' ? 'border-saffron/30 bg-gradient-to-br from-rosso/15 to-transparent' : 'border-cream/10 bg-cream/[0.03]'}`}>
                <div className="mb-1 flex items-center justify-between gap-3">
                  <Label>{cp.label}</Label>
                  {onTrack && (
                    <button type="button" onClick={() => onTrack(i)} className="font-mono text-[10px] tracking-widest text-cream/60 hover:text-saffron">
                      VIEW ON TRACK →
                    </button>
                  )}
                </div>
                {cp.media && (
                  <img src={cp.media} alt="" loading="lazy" decoding="async"
                    className="mb-4 aspect-video w-full rounded-lg border border-cream/10 object-cover" />
                )}
                <Section cp={cp} flat />
              </section>,
              lastProject && <MoreProjects key="bench" />,
            ]
          })}
        </main>
      </div>
    </div>
  )
}
