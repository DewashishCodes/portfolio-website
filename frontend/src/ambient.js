// Generative ambient pad: slow chords + sparse chimes through a lowpass and a synthetic reverb.
// No audio files, nothing to license. Browsers only allow audio after a user gesture, so it starts on a click.

const CHORDS = [
  [48, 55, 59, 64, 71], // Cmaj7
  [45, 52, 57, 60, 67], // Am7
  [41, 48, 53, 57, 64], // Fmaj7
  [43, 50, 55, 59, 66], // G6-ish
]
const CHIMES = [72, 74, 76, 79, 81, 84] // C major pentatonic, an octave up
const BAR = 8 // seconds per chord
const hz = (m) => 440 * 2 ** ((m - 69) / 12)

let ctx, master, bus, timer, step = 0
let on = false

function reverb() {
  const len = ctx.sampleRate * 4
  const buf = ctx.createBuffer(2, len, ctx.sampleRate)
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c)
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 3
  }
  const r = ctx.createConvolver()
  r.buffer = buf
  return r
}

function setup() {
  ctx = new AudioContext()
  master = ctx.createGain()
  master.gain.value = 0
  bus = ctx.createBiquadFilter()
  bus.type = 'lowpass'
  bus.frequency.value = 1400
  const dry = ctx.createGain()
  const wet = ctx.createGain()
  dry.gain.value = 0.55
  wet.gain.value = 0.8
  bus.connect(dry).connect(master)
  bus.connect(reverb()).connect(wet).connect(master)
  master.connect(ctx.destination)
}

function tone(freq, type, start, attack, hold, release, peak, detune = 0) {
  const o = ctx.createOscillator()
  const g = ctx.createGain()
  o.type = type
  o.frequency.value = freq
  o.detune.value = detune
  g.gain.setValueAtTime(0, start)
  g.gain.linearRampToValueAtTime(peak, start + attack)
  g.gain.setValueAtTime(peak, start + attack + hold)
  g.gain.exponentialRampToValueAtTime(0.0001, start + attack + hold + release)
  o.connect(g).connect(bus)
  o.start(start)
  o.stop(start + attack + hold + release + 0.1)
}

function bar() {
  const t = ctx.currentTime + 0.1
  // Pad: two detuned triangles per note; long tails overlap the next chord for a seamless crossfade.
  for (const m of CHORDS[step++ % CHORDS.length]) for (const d of [-7, 7]) tone(hz(m), 'triangle', t, 3, BAR - 3, 4, 0.03, d)
  // A couple of soft chimes at random points in the bar.
  for (let i = 0; i < 2 + Math.round(Math.random()); i++) {
    tone(hz(CHIMES[Math.floor(Math.random() * CHIMES.length)]), 'sine', t + Math.random() * BAR, 0.02, 0, 3, 0.035)
  }
}

const emit = () => dispatchEvent(new Event('ambientchange'))
export const isAmbientOn = () => on

export async function startAmbient() {
  if (!ctx) setup()
  await ctx.resume()
  master.gain.cancelScheduledValues(ctx.currentTime)
  master.gain.setTargetAtTime(0.9, ctx.currentTime, 1.2) // slow fade in
  if (!timer) {
    bar()
    timer = setInterval(bar, BAR * 1000)
  }
  on = true
  emit()
}

export function stopAmbient() {
  on = false
  emit()
  if (!ctx) return
  master.gain.setTargetAtTime(0, ctx.currentTime, 0.4)
  clearInterval(timer)
  timer = null
  setTimeout(() => !on && ctx.suspend(), 2500)
}

export function toggleAmbient() {
  const next = !on
  next ? startAmbient() : stopAmbient()
  try { localStorage.music = next ? 'on' : 'off' } catch {}
}

// Remembered "on": resume at the visitor's first click or key press (autoplay rules forbid starting sooner).
export function armAmbientFromPref() {
  let pref
  try { pref = localStorage.music } catch {}
  if (pref !== 'on') return
  const go = () => {
    removeEventListener('pointerdown', go)
    removeEventListener('keydown', go)
    if (!on) startAmbient()
  }
  addEventListener('pointerdown', go)
  addEventListener('keydown', go)
}

// Silence while the tab is hidden; pick up again when it's back.
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (!ctx || !on) return
    document.hidden ? ctx.suspend() : ctx.resume()
  })
}
