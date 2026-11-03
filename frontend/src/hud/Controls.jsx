import content from '../content/content.json'

// Pit Lane button and sound toggle arrive in Phase 5 / 6.
export default function Controls() {
  return (
    <div className="fixed top-4 left-4 flex gap-2">
      <a href={content.profile.resumeUrl} target="_blank" rel="noreferrer"
        className="hud-glass px-4 py-2 font-mono text-xs tracking-[0.2em] text-cream hover:text-saffron">
        RESUME
      </a>
    </div>
  )
}
