// Where each panel layout sits on a wide screen. Phones always get the bottom sheet.
// side: which edge the panel hugs; w: width in px. The camera reads this to frame the car in the free space.
export const LAYOUTS = {
  profile: { side: 'left', w: 400 },
  media: { side: 'right', w: 460 },
  podium: { side: 'bottom', w: 720 },
  telemetry: { side: 'right', w: 400 },
  pitstop: { side: 'left', w: 420 },
  research: { side: 'left', w: 420 },
  social: { side: 'right', w: 380 },
  hq: { side: 'right', w: 420 },
  contact: { side: 'right', w: 440 },
}

// The bottom strip is right-anchored and must clear the minimap + radio block on the left (16 + 184 + 12 + 340 + 16).
const BOTTOM_CLEAR = 572
const BOTTOM_MIN = 560 // narrower than this and it falls back to the right edge

export function frameFor(cp, width = typeof innerWidth === 'number' ? innerWidth : 1440) {
  const l = LAYOUTS[cp?.layout] ?? LAYOUTS.media
  const side = cp?.panelSide ?? l.side
  if (side !== 'bottom') return { side, w: l.w }
  const w = Math.min(l.w, width - BOTTOM_CLEAR - 16)
  return w >= BOTTOM_MIN ? { side, w } : { side: 'right', w: LAYOUTS.media.w }
}
