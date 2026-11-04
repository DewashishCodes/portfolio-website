// Achievements: one-time radio lines, in character, at most eight words. Persisted per browser.
// Hidden pit boards: one per checkpoint, clicked in the world; all of them unlocks a secret message.
import { radio, useRace } from '../store/useRace'
import { checkpoints } from './scrollMap'

const KEY = 'dl-gp-achievements'
const BOARDS = 'dl-gp-boards'

const read = (key) => {
  try {
    return new Set(JSON.parse(localStorage.getItem(key)) ?? [])
  } catch {
    return new Set()
  }
}
const write = (key, set) => {
  try {
    localStorage.setItem(key, JSON.stringify([...set]))
  } catch {
    // storage blocked: progress lasts for this visit only
  }
}

export const ACHIEVEMENTS = {
  perfect: { line: 'Perfect start.', title: 'Perfect start' }, // the start sequence has its own radio line
  purple: { line: 'Purple sector. Mega.', title: 'Purple sector' },
  drs: { line: 'DRS open. Go, go, go.', title: 'DRS' },
  projects: { line: 'All projects opened. Respect.', title: 'All five projects' },
  board: { line: 'Found the hidden board.', title: 'Hidden board' },
  night: { line: 'Night race. Lights on.', title: 'Night race' },
  lap: { line: 'Lap complete.', title: 'On the board' },
  fullLap: { line: 'Thirteen boards. You would make a great engineer.', title: 'Full lap' }, // and the resume button gets its chequered stamp
}

const unlocked = read(KEY)
export const hasAchievement = (id) => unlocked.has(id)

// line overrides the default (e.g. "Lap complete, P4 overall."); silent skips the radio.
export function unlock(id, { line, silent } = {}) {
  if (unlocked.has(id)) return
  unlocked.add(id)
  write(KEY, unlocked)
  useRace.setState({ achievements: unlocked.size })
  if (!silent) radio(line ?? ACHIEVEMENTS[id].line, 'casual', 'laugh')
}

export const BOARD_COUNT = checkpoints.length
const found = read(BOARDS)
export const boardsFound = () => found

export function findBoard(i) {
  if (found.has(i)) return
  found.add(i)
  write(BOARDS, found)
  useRace.setState({ boards: found.size })
  if (found.size === BOARD_COUNT) {
    unlock('fullLap')
    return
  }
  if (!hasAchievement('board')) return unlock('board')
  radio(`Board ${found.size} of ${BOARD_COUNT}. Keep looking.`, 'casual', 'wink')
}

// Store-driven unlocks: purple sector, DRS, all five projects held. Returns a cleanup.
export function watchAchievements() {
  const projects = checkpoints.flatMap((c, i) => (c.type === 'project' ? [i] : []))
  const seen = new Set()
  return useRace.subscribe((s, p) => {
    if (s.sectorFlash !== p.sectorFlash && s.sectorFlash?.color === 'purple') unlock('purple')
    if (s.drs && !p.drs) unlock('drs')
    if (s.start === 'go' && p.start !== 'go' && s.night) setTimeout(() => unlock('night'), 5000) // after the start radio
    if (s.active !== p.active && projects.includes(s.active)) {
      seen.add(s.active)
      if (seen.size === projects.length) unlock('projects')
    }
  })
}

useRace.setState({ boards: found.size, achievements: unlocked.size }) // seed the HUD counters from storage
