// Device checks run once at load. PRD §7: phones and deviceMemory <= 4 start (and stay) on Low.
export const TIERS = ['low', 'medium', 'high']

const mq = (q) => matchMedia(q).matches
export const isMobile = mq('(pointer: coarse) and (max-width: 1024px)') || (navigator.deviceMemory ?? 8) <= 4
export const maxTier = isMobile ? 'low' : 'high'

const urlTier = new URLSearchParams(location.search).get('q')
export const manualTier = TIERS.includes(urlTier) ? urlTier : null

function hasWebGL() {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

// Pit Lane is the only view for these visitors.
export const forcePit = mq('(prefers-reduced-motion: reduce)') || !hasWebGL()
