// Synthesised engine note: two detuned oscillators through a resonant low-pass, pitch from speed and gear.
// No samples to download. The AudioContext is only created from the sound toggle (a click), so it is
// always allowed to start, and it suspends while the tab is hidden.
let ctx, master, filter, a, b
let on = false

function build() {
  ctx = new AudioContext()
  master = ctx.createGain()
  master.gain.value = 0
  filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.Q.value = 6
  a = ctx.createOscillator()
  a.type = 'sawtooth'
  b = ctx.createOscillator()
  b.type = 'square'
  const sub = ctx.createGain()
  sub.gain.value = 0.4
  a.connect(filter)
  b.connect(sub).connect(filter)
  filter.connect(master).connect(ctx.destination)
  a.start()
  b.start()
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) ctx.suspend()
    else if (on) ctx.resume()
  })
}

export function setSound(value) {
  on = value
  if (on && !ctx) build()
  if (!ctx) return
  if (on) ctx.resume()
  else ctx.suspend()
}

// kmh: road speed, or a rev target while the car is held on the grid.
export function engine(kmh) {
  if (!on || !ctx || ctx.state !== 'running') return
  const gear = Math.min(7, Math.floor(kmh / 42))
  const rpm = kmh < 2 ? 0.1 : 0.3 + ((kmh - gear * 42) / 42) * 0.62 + gear * 0.012 // saw-tooth through the gears
  const t = ctx.currentTime
  const f = 42 + rpm * 160
  a.frequency.setTargetAtTime(f, t, 0.03)
  b.frequency.setTargetAtTime(f * 0.501, t, 0.03)
  filter.frequency.setTargetAtTime(260 + rpm * 2400, t, 0.05)
  master.gain.setTargetAtTime(0.035 + rpm * 0.05, t, 0.08)
}
