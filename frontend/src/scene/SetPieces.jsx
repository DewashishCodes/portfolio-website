import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo } from 'react'
import { CanvasTexture, NearestFilter, PlaneGeometry, RepeatWrapping, SRGBColorSpace, Vector2 } from 'three'
import content from '../content/content.json'
import { useRace } from '../store/useRace'
import { outsideSign, place, TRACK_LENGTH, ROAD_WIDTH } from '../lib/trackSpline'
import { FINISH_T, START_T } from '../lib/scrollMap'
import { useLive } from '../lib/live'
import { rng } from './Environment'

const m = (metres) => metres / TRACK_LENGTH
const cpT = Object.fromEntries(content.checkpoints.map((c) => [c.id, c.trackT]))
const { colors } = content.livery

// Puts children beside the track. Children are modelled as if on the driver's RIGHT,
// front facing local +x (toward the road); the left side is a mirror.
function Piece({ t, lateral = 30, side, children }) {
  const s = side ?? -outsideSign(t) // default: opposite the checkpoint billboard
  const { position, rotY } = place(t, s * lateral)
  return (
    <group position={position} rotation-y={rotY}>
      <group scale-x={s}>{children}</group>
    </group>
  )
}

function checker(n = 8, rows = 2) {
  const c = document.createElement('canvas')
  c.width = n
  c.height = rows
  const g = c.getContext('2d')
  for (let x = 0; x < n; x++) for (let y = 0; y < rows; y++) {
    g.fillStyle = (x + y) % 2 ? '#111' : '#f4f4f4'
    g.fillRect(x, y, 1, 1)
  }
  const tex = new CanvasTexture(c)
  tex.magFilter = NearestFilter
  tex.colorSpace = SRGBColorSpace
  tex.wrapS = tex.wrapT = RepeatWrapping
  return tex
}

const Box = ({ args, color, position, emissive, ...rest }) => (
  <mesh position={position} castShadow receiveShadow {...rest}>
    <boxGeometry args={args} />
    <meshStandardMaterial color={color} emissive={emissive ?? '#000'} roughness={0.7} />
  </mesh>
)

// Chequered flag on a pole, waving: a travelling sine wave that grows toward the free edge.
function WavingFlag(props) {
  const tex = useMemo(() => checker(8, 6), [])
  const geo = useMemo(() => new PlaneGeometry(7, 4.5, 28, 10).translate(3.5, 0, 0), [])
  const base = useMemo(() => geo.attributes.position.array.slice(), [geo])
  useFrame(({ clock }) => {
    const p = geo.attributes.position
    const t = clock.elapsedTime * 5
    for (let i = 0; i < p.count; i++) {
      const x = base[i * 3]
      const k = x / 7
      p.setZ(i, k * (Math.sin(x * 1.4 - t) * 0.45 + Math.sin(base[i * 3 + 1] * 1.8 + t * 0.6) * 0.1))
    }
    p.needsUpdate = true
    geo.computeVertexNormals()
  })
  return (
    <group {...props}>
      <Box args={[0.18, 7, 0.18]} position={[0, 3.5, 0]} color="#d9d9dc" />
      <mesh geometry={geo} position={[0, 4.6, 0]} castShadow>
        <meshStandardMaterial map={tex} side={2} roughness={0.8} />
      </mesh>
    </group>
  )
}

// Lettered board on top of a gantry, facing the oncoming car.
function SignBoard({ text, ...props }) {
  const tex = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = 1024
    c.height = 160
    const g = c.getContext('2d')
    g.fillStyle = colors.carbon
    g.fillRect(0, 0, 1024, 160)
    g.fillStyle = colors.accent
    g.fillRect(0, 148, 1024, 12)
    g.fillStyle = colors.cream
    g.font = 'italic 900 112px system-ui, sans-serif'
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    g.fillText(text, 512, 78, 980)
    const t = new CanvasTexture(c)
    t.colorSpace = SRGBColorSpace
    t.anisotropy = 8
    return t
  }, [text])
  return (
    <group {...props}>
      <Box args={[12.4, 2.1, 0.3]} position={[0, 0, 0.18]} color="#1c1c1f" />
      <mesh rotation-y={Math.PI}>
        <planeGeometry args={[12, 1.9]} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
    </group>
  )
}

// Gantry spanning the road. kind = 'start' (five lights) or 'finish' (chequered banner).
function Gantry({ t, kind }) {
  const lights = useRace((s) => s.lights) // mirrors the HUD lights during the start sequence
  const { position, rotY } = place(t, 0)
  const flag = useMemo(() => checker(24, 2), [])
  const line = useMemo(() => checker(16, 2), [])
  return (
    <group position={position} rotation-y={rotY}>
      {[-8, 8].map((x) => <Box key={x} args={[0.6, 8, 0.6]} position={[x, 4, 0]} color="#2a2a2d" />)}
      <Box args={[17, 1.4, 0.8]} position={[0, 7.6, 0]} color="#1c1c1f" />
      {kind === 'start'
        ? [-3, -1.5, 0, 1.5, 3].map((x, i) => (
            <mesh key={x} name="start-light" position={[x, 7.6, -0.45]}>
              <circleGeometry args={[0.45, 24]} />
              <meshStandardMaterial color="#300" emissive="#ff1a1a" emissiveIntensity={i < lights ? 6 : 0.15} side={2} />
            </mesh>
          ))
        : (
          <mesh position={[0, 7.6, -0.42]} rotation-y={Math.PI}>
            <planeGeometry args={[16, 1.2]} />
            <meshStandardMaterial map={flag} />
          </mesh>
        )}
      {kind === 'finish' && <SignBoard text="FINISH" position={[0, 9.4, -0.2]} />}
      {kind === 'start' && <SignBoard text="DL GRAND PRIX" position={[0, 9.4, -0.2]} />}
      {kind === 'finish' && <WavingFlag position={[-8.6, 0, 0]} rotation-y={Math.PI} /> /* beside the post, below the halo bar and clear of its pillar */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.025, 0]} receiveShadow>
        <planeGeometry args={[ROAD_WIDTH, kind === 'start' ? 0.6 : 1.5]} />
        {kind === 'start' ? <meshStandardMaterial color="#f2f2f2" /> : <meshStandardMaterial map={line} />}
      </mesh>
    </group>
  )
}

// Painted grid slots behind the start line, staggered left/right like a real grid.
function GridSlots() {
  return [1, 2, 3, 4, 5, 6].map((i) => {
    const { position, rotY } = place(cpT.grid + m(55 - i * 8), (i % 2 ? 1 : -1) * 2.8)
    return (
      <mesh key={i} position={[position[0], 0.025, position[2]]} rotation={[-Math.PI / 2, 0, rotY]} receiveShadow>
        <planeGeometry args={[2.4, 0.25]} />
        <meshStandardMaterial color="#f2f2f2" />
      </mesh>
    )
  })
}

// Crowd sprite sheet: one strip of fans, two frames (seated / cheering) stacked vertically.
// Shirts come from a small warm palette, not random hues, so the stands read as a crowd and not as noise.
const CROWD_FRAME = 2 // flipbook frames per second
const CROWD_CHEER = 7
const CHEER = new Set(content.checkpoints.flatMap((c, i) => (c.id === 'podium' || c.id === 'finish' ? [i] : [])))
function crowdTexture() {
  const W = 512
  const H = 64
  const c = document.createElement('canvas')
  c.width = W
  c.height = H * 2
  const g = c.getContext('2d')
  const r = rng(21)
  const shirts = [colors.body, colors.body, colors.accent, colors.cream, '#2b3a67', '#f4a261', '#3d3d42', colors.detail]
  const skin = ['#8d5a3b', '#a86f4a', '#c48a5e', '#6e4530', '#d9a27a']
  const fans = Array.from({ length: 30 }, (_, i) => ({
    x: 8 + i * 16.6 + r() * 4,
    shirt: shirts[Math.floor(r() * shirts.length)],
    skin: skin[Math.floor(r() * skin.length)],
    h: 34 + r() * 8,
    cheer: r() < 0.45,
    flag: r() < 0.08,
  }))
  for (let f = 0; f < 2; f++) {
    const y0 = f * H
    for (const p of fans) {
      const up = f === 1 && p.cheer
      const base = y0 + H
      const top = base - p.h - (up ? 4 : 0)
      g.fillStyle = p.shirt
      g.beginPath()
      g.roundRect(p.x - 6, top + 11, 12, p.h - 11, [5, 5, 0, 0])
      g.fill()
      g.fillStyle = p.skin
      g.beginPath()
      g.arc(p.x, top + 6, 5.2, 0, Math.PI * 2)
      g.fill()
      if (up) { // arms up
        g.strokeStyle = p.skin
        g.lineWidth = 3
        g.beginPath(); g.moveTo(p.x - 5, top + 14); g.lineTo(p.x - 9, top - 3); g.stroke()
        g.beginPath(); g.moveTo(p.x + 5, top + 14); g.lineTo(p.x + 9, top - 3); g.stroke()
        if (p.flag) {
          g.fillStyle = colors.accent
          g.fillRect(p.x + 9, top - 12, 12, 8)
        }
      }
    }
  }
  const tex = new CanvasTexture(c)
  tex.colorSpace = SRGBColorSpace
  tex.wrapS = RepeatWrapping
  tex.repeat.set(1, 0.5)
  return tex
}

function Grandstand({ rows = 8, length = 44 }) {
  const sheet = useMemo(crowdTexture, [])
  const rowTex = useMemo(() => Array.from({ length: rows }, (_, row) => {
    const t = sheet.clone()
    t.repeat.set(length / 8, 0.5) // one 512 px strip covers 8 m of seats
    t.offset.x = (row * 0.37) % 1
    t.needsUpdate = true
    return t
  }), [sheet, rows, length])
  const st = useMemo(() => ({ f: 0 }), [])
  useFrame((_, dt) => {
    const cheer = CHEER.has(useRace.getState().active) ? CROWD_CHEER : CROWD_FRAME // the crowd goes wild at podium and finish
    st.f += Math.min(dt, 0.1) * cheer
    const frame = Math.floor(st.f)
    rowTex.forEach((t, row) => (t.offset.y = (frame + row) % 2 ? 0.5 : 0))
  })
  const roofY = 0.8 * rows + 4
  return (
    <group>
      {Array.from({ length: rows }, (_, row) => (
        <Box key={row} args={[1.2, 0.8 * (row + 1), length]} position={[-(row * 1.2 + 0.6), 0.4 * (row + 1), 0]} color="#8d8a85" />
      ))}
      {rowTex.map((t, row) => (
        <mesh key={row} position={[-(row * 1.2 + 0.55), 0.8 * (row + 1) + 0.5, 0]} rotation-y={Math.PI / 2}>
          <planeGeometry args={[length, 1]} />
          <meshStandardMaterial map={t} alphaTest={0.5} roughness={1} />
        </mesh>
      ))}
      {/* Roof on three pillars, livery stripe along the front edge. */}
      <Box args={[rows * 1.2 + 1, 0.3, length + 2]} position={[-(rows * 0.6), roofY, 0]} color={colors.carbon} />
      <Box args={[0.25, 0.7, length + 2]} position={[0.55, roofY - 0.1, 0]} color={colors.body} />
      <Box args={[0.26, 0.18, length + 2]} position={[0.56, roofY + 0.2, 0]} color={colors.accent} emissive={colors.accent} />
      {[-length / 2, 0, length / 2].map((z) => <Box key={z} args={[0.35, roofY, 0.35]} position={[-(rows * 1.2), roofY / 2, z]} color="#2a2a2d" />)}
      <Box args={[0.2, 0.9, length]} position={[0.2, 0.45, 0]} color={colors.accent} />
    </group>
  )
}

function PitBuilding() {
  const lane = useMemo(() => checker(2, 2), [])
  return (
    <group>
      <Box args={[12, 8, 64]} position={[-6, 4, 0]} color="#d8d2c6" />
      <Box args={[12.4, 0.6, 64.4]} position={[-6, 8.3, 0]} color={colors.carbon} />
      {Array.from({ length: 8 }, (_, i) => (
        <group key={i} position={[0.05, 0, -28 + i * 8]}>
          <Box args={[0.2, 4.2, 6]} position={[0, 2.1, 0]} color="#2a1c10" emissive="#5a2e0e" />
          <Box args={[0.3, 0.5, 6.4]} position={[0.1, 4.5, 0]} color={i % 2 ? colors.body : colors.accent} />
        </group>
      ))}
      {/* Pit box painted in front of garage 4. */}
      <mesh rotation-x={-Math.PI / 2} position={[4, 0.03, 4]}>
        <planeGeometry args={[6, 7]} />
        <meshStandardMaterial color={colors.accent} transparent opacity={0.55} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[4, 0.01, 0]} receiveShadow>
        <planeGeometry args={[8, 64]} />
        <meshStandardMaterial color="#56585c" map={lane} />
      </mesh>
    </group>
  )
}

// Lathe-turned cup on the top step.
function Trophy(props) {
  const pts = useMemo(() => [[0, 0], [0.45, 0], [0.45, 0.12], [0.14, 0.2], [0.1, 0.7], [0.18, 0.8], [0.55, 1.0], [0.62, 1.55], [0.55, 1.6], [0, 1.25]]
    .map(([x, y]) => new Vector2(x, y)), [])
  return (
    <mesh {...props} castShadow>
      <latheGeometry args={[pts, 28]} />
      <meshStandardMaterial color="#e0b04a" metalness={1} roughness={0.22} />
    </mesh>
  )
}

function Podium() {
  const steps = [[0, 2.4, colors.accent], [-5.2, 1.6, '#cfcfd2'], [5.2, 1.1, '#b07a4a']] // P1, P2, P3
  return (
    <group rotation-y={Math.PI / 2}>
      {steps.map(([x, h, c]) => <Box key={x} args={[5, h, 4]} position={[x, h / 2, 0]} color={c} />)}
      <Trophy position={[0, 2.4, 0.6]} />
      <Box args={[18, 7, 0.4]} position={[0, 3.5, -3]} color={colors.carbon} />
      <Box args={[18, 0.4, 0.5]} position={[0, 6.8, -2.7]} color={colors.accent} emissive={colors.accent} />
    </group>
  )
}

// Pit wall screen: the full-year contribution heatmap from the live API (content.json numbers when offline).
const HEAT = ['#1a2230', '#7a3a14', '#b5521b', '#E86A1F', '#ffb071']
function drawTelemetry(g, live) {
  const W = 1024
  const H = 552
  g.fillStyle = '#07090d'
  g.fillRect(0, 0, W, H)
  g.fillStyle = colors.accent
  g.fillRect(0, 0, W, 10)
  g.fillStyle = '#F2E8D5'
  g.font = 'bold 44px ui-monospace, monospace'
  g.fillText('GITHUB TELEMETRY', 40, 72)
  g.fillStyle = 'rgba(242,232,213,0.6)'
  g.font = '26px ui-monospace, monospace'
  g.fillText('@' + content.github.username, 40, 110)
  const stats = live ?? content.github.fallback
  const tiles = live
    ? [['CONTRIBUTIONS', live.total], ['STREAK', live.currentStreak + 'd'], ['BEST', live.longestStreak + 'd']]
    : [['REPOS', stats.publicRepos], ['STARS', stats.totalStars], ['FOLLOWERS', stats.followers]]
  tiles.forEach(([k, v], i) => {
    const x = 560 + i * 158
    g.fillStyle = 'rgba(242,232,213,0.55)'
    g.font = '18px ui-monospace, monospace'
    g.fillText(k, x, 62)
    g.fillStyle = '#F2E8D5'
    g.font = 'bold 46px ui-monospace, monospace'
    g.fillText(String(v), x, 110)
  })
  const weeks = live?.weeks ?? []
  const cell = 17
  const gap = 2
  const x0 = (W - 53 * (cell + gap)) / 2
  for (let w = 0; w < 53; w++) {
    for (let d = 0; d < 7; d++) {
      const n = weeks[weeks.length - 53 + w]?.[d]?.count ?? 0
      g.fillStyle = HEAT[n === 0 ? 0 : n < 3 ? 1 : n < 6 ? 2 : n < 10 ? 3 : 4]
      g.fillRect(x0 + w * (cell + gap), 170 + d * (cell + gap), cell, cell)
    }
  }
  g.fillStyle = 'rgba(242,232,213,0.5)'
  g.font = '20px ui-monospace, monospace'
  g.fillText(live ? 'LAST 12 MONTHS · LIVE' : 'LIVE FEED OFFLINE', x0, 330)
  // Sparkline of weekly totals along the bottom.
  const totals = weeks.slice(-53).map((w) => w.reduce((a, d) => a + d.count, 0))
  const max = Math.max(1, ...totals)
  g.strokeStyle = colors.accent
  g.lineWidth = 4
  g.beginPath()
  totals.forEach((v, i) => g[i ? 'lineTo' : 'moveTo'](x0 + i * (cell + gap) + cell / 2, 510 - (v / max) * 140))
  g.stroke()
}

// mirror: the Piece wrapper mirrors left-side pieces; flip the face back so the text reads.
function TelemetryScreen({ mirror = 1 }) {
  const live = useLive('/api/github/contributions')
  const tex = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = 1024
    c.height = 552
    const t = new CanvasTexture(c)
    t.colorSpace = SRGBColorSpace
    t.anisotropy = 8
    return t
  }, [])
  useEffect(() => {
    drawTelemetry(tex.image.getContext('2d'), live)
    tex.needsUpdate = true
  }, [tex, live])
  return (
    <group rotation-y={Math.PI / 2}>
      {[-7, 7].map((x) => <Box key={x} args={[0.5, 1.6, 0.5]} position={[x, 0.8, -0.4]} color="#2a2a2d" />)}
      <Box args={[16, 9, 0.5]} position={[0, 6, -0.4]} color="#111114" />
      <mesh name="telemetry-screen" position={[0, 6, -0.1]} scale-x={mirror}>
        <planeGeometry args={[15.2, 8.2]} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
    </group>
  )
}

// Pit crew at the four wheels plus the lollipop man, around the car's stopping point in the pit box.
// Car local: +x = driver's left, +z = forward; wheels at about x ±0.95, z +1.6 / -2.0.
function CrewMember({ position, face, crouch = true }) {
  const h = crouch ? 0.75 : 1.15
  return (
    <group position={position} rotation-y={face}>
      <Box args={[0.42, h * 0.55, 0.32]} position={[0, h * 0.27, 0]} color={colors.carbon} />
      <mesh position={[0, h * 0.55 + 0.32, 0.06]} rotation-x={crouch ? 0.5 : 0} castShadow>
        <capsuleGeometry args={[0.22, 0.42, 4, 10]} />
        <meshStandardMaterial color={colors.carbon} roughness={0.8} />
      </mesh>
      <Box args={[0.46, 0.08, 0.36]} position={[0, h * 0.55 + 0.42, 0.1]} color={colors.accent} />
      <mesh position={[0, h * 0.55 + 0.82, crouch ? 0.28 : 0.05]} castShadow>
        <sphereGeometry args={[0.16, 14, 10]} />
        <meshStandardMaterial color={colors.body} roughness={0.3} metalness={0.2} />
      </mesh>
    </group>
  )
}

function PitBox({ t }) {
  const { position, rotY } = place(t, 0)
  const wheels = [[1, 1.6], [-1, 1.6], [1, -2.0], [-1, -2.0]]
  return (
    <group position={position} rotation-y={rotY}>
      {wheels.map(([x, z]) => <CrewMember key={`${x}${z}`} position={[x * 1.75, 0, z]} face={x > 0 ? -Math.PI / 2 : Math.PI / 2} />)}
      <CrewMember position={[0, 0, 4.3]} face={Math.PI} crouch={false} />
      <group position={[0.35, 0, 4.1]}>
        <Box args={[0.06, 1.9, 0.06]} position={[0, 0.95, 0]} color="#d9d9d9" />
        <mesh position={[0, 2.05, 0]} rotation-y={Math.PI}>
          <circleGeometry args={[0.3, 20]} />
          <meshStandardMaterial color={colors.body} side={2} />
        </mesh>
      </group>
      {/* Pit box markings under the car. */}
      {[[-1.7, 0, 0.12, 7.6], [1.7, 0, 0.12, 7.6], [0, 3.8, 3.52, 0.12], [0, -3.8, 3.52, 0.12]].map(([x, z, w, l]) => (
        <mesh key={`${x}${z}`} rotation-x={-Math.PI / 2} position={[x, 0.028, z]}>
          <planeGeometry args={[w, l]} />
          <meshStandardMaterial color={colors.accent} />
        </mesh>
      ))}
    </group>
  )
}

// Fan zone: the social handles as trackside boards, angled toward the oncoming car.
function socialTexture({ platform, handle, followers, showFollowers }) {
  const c = document.createElement('canvas')
  c.width = 1024
  c.height = 400
  const g = c.getContext('2d')
  g.fillStyle = colors.carbon
  g.fillRect(0, 0, 1024, 400)
  g.fillStyle = colors.body
  g.fillRect(0, 0, 24, 400)
  g.fillStyle = colors.accent
  g.font = 'bold 54px ui-monospace, monospace'
  g.fillText(platform.toUpperCase(), 70, 100)
  g.fillStyle = '#F2E8D5'
  g.font = 'bold 96px system-ui, sans-serif'
  g.fillText(handle, 70, 230, 900)
  if (showFollowers && followers) {
    g.fillStyle = 'rgba(242,232,213,0.7)'
    g.font = '52px ui-monospace, monospace'
    g.fillText(`${followers} FOLLOWERS`, 70, 330)
  }
  const t = new CanvasTexture(c)
  t.colorSpace = SRGBColorSpace
  t.anisotropy = 8
  return t
}

function SocialBoards({ t }) {
  const boards = useMemo(() => content.socials.map((s, i) => {
    const side = i % 2 ? -1 : 1 // alternate driver's right / left
    const { position, rotY } = place(t + m(22 + i * 16), side * 15.6)
    return { key: s.platform, position, rotY: rotY + side * (Math.PI / 2 + 0.6), tex: socialTexture(s) }
  }), [t])
  return boards.map((b) => (
    <group key={b.key} position={b.position} rotation-y={b.rotY}>
      {[-2.4, 2.4].map((x) => <Box key={x} args={[0.18, 1.2, 0.18]} position={[x, 0.6, -0.1]} color="#2a2a2d" />)}
      <Box args={[6.3, 2.55, 0.15]} position={[0, 2.35, -0.1]} color="#1c1c1f" />
      <mesh position={[0, 2.35, 0]}>
        <planeGeometry args={[6.1, 2.38]} />
        <meshBasicMaterial map={b.tex} toneMapped={false} />
      </mesh>
    </group>
  ))
}

function Motorhomes() {
  return [0, 1, 2, 3].map((i) => (
    <group key={i} position={[-i * 2, 0, -24 + i * 16]}>
      <Box args={[4, 4.2, 14]} position={[-2, 2.1, 0]} color={i % 2 ? colors.cream : colors.carbon} />
      <Box args={[4.05, 0.4, 14.05]} position={[-2, 3.4, 0]} color={colors.accent} />
    </group>
  ))
}

export default function SetPieces() {
  return (
    <>
      <Gantry t={START_T} kind="start" />
      <GridSlots />
      <Piece t={cpT.grid + m(60)} lateral={22}><Grandstand /></Piece>
      <Piece t={cpT.podium + m(32)} lateral={26}><Podium /></Piece>
      {/* Across the track from the trackside camera, so the screen is the backdrop behind the car. */}
      <Piece t={cpT.telemetry + m(22)} lateral={27} side={outsideSign(cpT.telemetry)}><TelemetryScreen mirror={outsideSign(cpT.telemetry)} /></Piece>
      <Piece t={cpT.pitstop + m(36)} lateral={30}><PitBuilding /></Piece>
      <PitBox t={cpT.pitstop} />
      <Piece t={cpT.fanzone + m(55)} lateral={22}><Grandstand rows={10} length={60} /></Piece>
      <SocialBoards t={cpT.fanzone} />
      <Piece t={cpT.paddock + m(60)} lateral={28}><Motorhomes /></Piece>
      <Gantry t={FINISH_T} kind="finish" />
    </>
  )
}
