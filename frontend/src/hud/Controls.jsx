import content from '../content/content.json'
import { setSound } from '../lib/audio'
import { maxTier, TIERS } from '../lib/quality'
import { openPitLane, useRace } from '../store/useRace'

const hud = 'hud-glass px-3 py-2 font-mono text-[11px] tracking-[0.2em] sm:px-4 sm:text-xs text-cream hover:text-saffron'

export default function Controls() {
  const soundOn = useRace((s) => s.soundOn)
  const toggleSound = () => {
    setSound(!soundOn)
    useRace.setState({ soundOn: !soundOn })
  }
  const quality = useRace((s) => s.quality)
  const auto = useRace((s) => s.qualityAuto)
  const setQuality = (v) => useRace.setState(v === 'auto' ? { qualityAuto: true, quality: maxTier } : { qualityAuto: false, quality: v })

  return (
    <div className="fixed top-4 left-4 flex flex-wrap gap-2">
      <button type="button" onClick={openPitLane} className={hud} aria-keyshortcuts="P">
        PIT LANE <kbd className="ml-1 hidden text-cream/50 sm:inline">P</kbd>
      </button>
      <button type="button" onClick={toggleSound} className={hud} aria-pressed={soundOn}>
        SOUND {soundOn ? 'ON' : 'OFF'}
      </button>
      <a href={content.profile.resumeUrl} target="_blank" rel="noreferrer" className={hud}>RESUME</a>
      <label className="hud-glass hidden items-center sm:flex font-mono text-xs tracking-[0.2em] text-cream">
        <span className="sr-only">Graphics quality</span>
        <select value={auto ? 'auto' : quality} onChange={(e) => setQuality(e.target.value)}
          className="cursor-pointer appearance-none bg-transparent px-3 py-2 uppercase outline-none focus-visible:text-saffron">
          <option value="auto" className="bg-carbon">AUTO · {quality.toUpperCase()}</option>
          {[...TIERS].reverse().map((t) => <option key={t} value={t} className="bg-carbon">{t.toUpperCase()}</option>)}
        </select>
      </label>
    </div>
  )
}
