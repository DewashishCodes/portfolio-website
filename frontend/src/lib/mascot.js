import manifest from '../../public/mascot/manifest.json'

const files = new Set(Object.values(manifest).flat().map((f) => f.file))

// Head portrait for an outfit + expression; falls back to the casual outfit, then neutral.
export function headSrc(outfit = 'casual', expression = 'neutral') {
  for (const src of [`/mascot/${outfit}/head-${expression}.webp`, `/mascot/casual/head-${expression}.webp`]) {
    if (files.has(src)) return src
  }
  return `/mascot/${outfit}/head-neutral.webp`
}

// Every file referenced from content.json must exist in the kit.
if (import.meta.env.DEV) {
  import('../content/content.json').then(({ default: c }) => {
    const refs = [...c.checkpoints.map((cp) => cp.mascot.fullBody), ...Object.values(c.ambientLines).map((a) => a.image)]
    refs.filter(Boolean).forEach((r) => console.assert(files.has(r), 'mascot file missing:', r))
  })
}
