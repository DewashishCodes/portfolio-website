import { useEffect, useRef, useState } from 'react'
import content from '../content/content.json'
import { setSound } from '../lib/audio'
import { maxTier, TIERS } from '../lib/quality'
import { Credits } from '../panels/sections'
import { openPitLane, useRace } from '../store/useRace'

const hud = 'hud-glass px-3 py-2 font-mono text-[11px] tracking-[0.2em] sm:px-4 sm:text-xs text-cream hover:text-saffron'
const opt = (on) => `rounded px-2 py-1 font-mono text-[11px] tracking-wider ${on ? 'bg-cream text-carbon' : 'border border-cream/20 text-cream/80 hover:border-saffron'}`

// Sound and graphics live in a small settings drawer: visitor choices, not HUD information.
function Settings() {
  const [open, setOpen] = useState(false)
  const box = useRef()
  const soundOn = useRace((s) => s.soundOn)
  const quality = useRace((s) => s.quality)
  const auto = useRace((s) => s.qualityAuto)
  const sound = (on) => {
    setSound(on)
    useRace.setState({ soundOn: on })
  }
  const setQuality = (v) => useRace.setState(v === 'auto' ? { qualityAuto: true, quality: maxTier } : { qualityAuto: false, quality: v })

  useEffect(() => {
    if (!open) return
    const close = (e) => (e.key === 'Escape' || (e.type === 'pointerdown' && !box.current?.contains(e.target))) && setOpen(false)
    addEventListener('pointerdown', close)
    addEventListener('keydown', close)
    return () => {
      removeEventListener('pointerdown', close)
      removeEventListener('keydown', close)
    }
  }, [open])

  return (
    <div ref={box} className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls="settings" aria-label="Settings" className={hud}>
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
        </svg>
      </button>
      {open && (
        <div id="settings" className="hud-glass absolute top-full left-0 z-20 mt-2 w-[230px] space-y-3 p-3">
          <fieldset>
            <legend className="mb-1.5 font-mono text-[10px] tracking-[0.2em] text-cream/60">SOUND</legend>
            <div className="flex gap-1.5">
              <button type="button" className={opt(soundOn)} aria-pressed={soundOn} onClick={() => sound(true)}>ON</button>
              <button type="button" className={opt(!soundOn)} aria-pressed={!soundOn} onClick={() => sound(false)}>OFF</button>
            </div>
          </fieldset>
          <fieldset>
            <legend className="mb-1.5 font-mono text-[10px] tracking-[0.2em] text-cream/60">GRAPHICS</legend>
            <div className="flex flex-wrap gap-1.5">
              <button type="button" className={opt(auto)} aria-pressed={auto} onClick={() => setQuality('auto')}>AUTO</button>
              {[...TIERS].reverse().map((t) => (
                <button key={t} type="button" className={opt(!auto && quality === t)} aria-pressed={!auto && quality === t} onClick={() => setQuality(t)}>
                  {t.toUpperCase()}
                </button>
              ))}
            </div>
            {auto && <p className="mt-1.5 font-mono text-[10px] text-cream/50">Running {quality.toUpperCase()}</p>}
          </fieldset>
          <div className="border-t border-cream/10 pt-2 text-[10px] leading-relaxed text-cream/55"><Credits /></div>
        </div>
      )}
    </div>
  )
}

export default function Controls() {
  return (
    <div className="fixed top-4 left-4 z-10 flex flex-wrap gap-2">
      <button type="button" onClick={openPitLane} className={hud} aria-keyshortcuts="P">
        PIT LANE <kbd className="ml-1 hidden text-cream/50 sm:inline">P</kbd>
      </button>
      <a href={content.profile.resumeUrl} target="_blank" rel="noreferrer" className={hud}>RESUME</a>
      <Settings />
    </div>
  )
}
