import { useMemo } from 'react'
import { CanvasTexture, NearestFilter, RepeatWrapping, SRGBColorSpace } from 'three'
import content from '../content/content.json'
import { useRace } from '../store/useRace'
import { outsideSign, place, TRACK_LENGTH, ROAD_WIDTH } from '../lib/trackSpline'
import { Instanced, rng } from './Environment'

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

// Gantry spanning the road. kind = 'start' (five lights) or 'finish' (chequered banner).
function Gantry({ t, kind }) {
  const { position, rotY } = place(t, 0)
  const flag = useMemo(() => checker(24, 2), [])
  const line = useMemo(() => checker(16, 2), [])
  return (
    <group position={position} rotation-y={rotY}>
      {[-8, 8].map((x) => <Box key={x} args={[0.6, 8, 0.6]} position={[x, 4, 0]} color="#2a2a2d" />)}
      <Box args={[17, 1.4, 0.8]} position={[0, 7.6, 0]} color="#1c1c1f" />
      {kind === 'start'
        ? [-3, -1.5, 0, 1.5, 3].map((x) => (
            <mesh key={x} name="start-light" position={[x, 7.6, -0.45]}>
              <circleGeometry args={[0.45, 24]} />
              <meshStandardMaterial color="#300" emissive="#ff1a1a" emissiveIntensity={0.15} side={2} />
            </mesh>
          ))
        : (
          <mesh position={[0, 7.6, -0.42]} rotation-y={Math.PI}>
            <planeGeometry args={[16, 1.2]} />
            <meshStandardMaterial map={flag} />
          </mesh>
        )}
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

function Grandstand({ rows = 8, length = 44 }) {
  const showCrowd = useRace((s) => s.quality) !== 'low' // Low tier: empty stands
  const crowd = useMemo(() => {
    const r = rng(rows * length)
    const per = Math.floor(length / 0.8)
    return (i, o, c) => {
      const row = Math.floor(i / per)
      const k = i % per
      o.position.set(-(row * 1.2 + 0.6), 0.8 * row + 1.25 + r() * 0.05, -length / 2 + 0.4 + k * 0.8)
      o.scale.set(1, 0.85 + r() * 0.3, 1)
      c.setHSL(r(), 0.55, 0.35 + r() * 0.3)
    }
  }, [rows, length])
  return (
    <group>
      {Array.from({ length: rows }, (_, row) => (
        <Box key={row} args={[1.2, 0.8 * (row + 1), length]} position={[-(row * 1.2 + 0.6), 0.4 * (row + 1), 0]} color="#8d8a85" />
      ))}
      <Box args={[rows * 1.2 + 1, 0.3, length + 2]} position={[-(rows * 0.6), 0.8 * rows + 4, 0]} color={colors.carbon} />
      <Box args={[0.2, 0.9, length]} position={[0.2, 0.45, 0]} color={colors.accent} />
      {showCrowd && (
        <Instanced count={rows * Math.floor(length / 0.8)} place={crowd} colored>
          <boxGeometry args={[0.45, 0.9, 0.5]} />
          <meshStandardMaterial roughness={0.9} />
        </Instanced>
      )}
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
        <Box key={i} args={[0.2, 4.2, 6]} position={[0.05, 2.1, -28 + i * 8]} color="#1d1d20" emissive="#120a04" />
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

function Podium() {
  const steps = [[0, 2.4, colors.accent], [-5.2, 1.6, '#cfcfd2'], [5.2, 1.1, '#b07a4a']] // P1, P2, P3
  return (
    <group rotation-y={Math.PI / 2}>
      {steps.map(([x, h, c]) => <Box key={x} args={[5, h, 4]} position={[x, h / 2, 0]} color={c} />)}
      <Box args={[18, 7, 0.4]} position={[0, 3.5, -3]} color={colors.carbon} />
      <Box args={[18, 0.4, 0.5]} position={[0, 6.8, -2.7]} color={colors.accent} emissive={colors.accent} />
    </group>
  )
}

function TelemetryScreen() {
  return (
    <group rotation-y={Math.PI / 2}>
      {[-7, 7].map((x) => <Box key={x} args={[0.5, 6, 0.5]} position={[x, 3, -0.4]} color="#2a2a2d" />)}
      <Box args={[16, 9, 0.5]} position={[0, 9, -0.4]} color="#111114" />
      <mesh name="telemetry-screen" position={[0, 9, -0.1]}>
        <planeGeometry args={[15.2, 8.2]} />
        <meshStandardMaterial color="#05070a" emissive="#0b2233" />
      </mesh>
    </group>
  )
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
      <Gantry t={cpT.grid + m(55)} kind="start" />
      <GridSlots />
      <Piece t={cpT.grid + m(60)} lateral={22}><Grandstand /></Piece>
      <Piece t={cpT.podium + m(70)} lateral={26}><Podium /></Piece>
      <Piece t={cpT.telemetry + m(60)} lateral={24}><TelemetryScreen /></Piece>
      <Piece t={cpT.pitstop + m(60)} lateral={30}><PitBuilding /></Piece>
      <Piece t={cpT.fanzone + m(55)} lateral={22}><Grandstand rows={10} length={60} /></Piece>
      <Piece t={cpT.paddock + m(60)} lateral={28}><Motorhomes /></Piece>
      <Gantry t={cpT.finish + m(55)} kind="finish" />
    </>
  )
}
