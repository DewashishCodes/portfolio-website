import { Preload } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import { Suspense, useRef } from 'react'
import { PCFShadowMap, PCFSoftShadowMap } from 'three'
import { maxTier, TIERS } from '../lib/quality'
import { useRace } from '../store/useRace'
import Car from './Car'
import HiddenBoards from './HiddenBoards'
import Checkpoints from './Checkpoints'
import Effects from './Effects'
import Environment from './Environment'
import SetPieces from './SetPieces'
import Track from './Track'

const DPR = { high: [1, 2], medium: 1.25, low: 1 }

// Steps the tier down on sustained low fps, and back up at most once per tier.
// Why not drei's PerformanceMonitor: its 45 fps bound with 3 flip-flops tripped on the first scroll,
// when shader compiles, texture uploads and background-tab throttling produce a few huge frames.
// Here frames over STALL are ignored (they are hitches, not a steady GPU cost), the first
// WARMUP seconds after load or a tier change are ignored, and a decline needs two bad windows in a row.
const WINDOW = 2 // s
const WARMUP = 4 // s
const STALL = 0.2 // s
const LOW_FPS = 40
const HIGH_FPS = 57
function AutoQuality() {
  const st = useRef({ since: 0, frames: 0, time: 0, bad: 0, good: 0, banned: new Set() }).current
  useFrame((state, dt) => {
    const now = state.clock.elapsedTime
    const { quality, qualityAuto } = useRace.getState()
    if (!qualityAuto || document.hidden || dt > STALL || now - st.since < WARMUP) return
    st.frames++
    st.time += dt
    if (st.time < WINDOW) return
    const fps = st.frames / st.time
    st.frames = st.time = 0
    st.bad = fps < LOW_FPS ? st.bad + 1 : 0
    st.good = fps > HIGH_FPS ? st.good + 1 : 0
    const i = TIERS.indexOf(quality)
    let next = i
    if (st.bad >= 2 && i > 0) {
      st.banned.add(quality) // this tier failed here, never climb back into it
      next = i - 1
    } else if (st.good >= 5 && i < TIERS.indexOf(maxTier) && !st.banned.has(TIERS[i + 1])) next = i + 1
    if (next === i) return
    if (import.meta.env.DEV) console.info(`[quality] ${quality} -> ${TIERS[next]} at ${fps.toFixed(1)} fps`)
    st.since = now
    st.bad = st.good = 0
    useRace.setState({ quality: TIERS[next] })
  })
  return null
}

// Shadow maps per tier: soft 2048 on High, hard 1024 on Medium, none on Low (the car keeps its blob shadow).
function ShadowTier({ quality }) {
  useFrame(({ gl }) => {
    const want = quality === 'high' ? PCFSoftShadowMap : PCFShadowMap
    if (gl.shadowMap.enabled !== (quality !== 'low') || gl.shadowMap.type !== want) {
      gl.shadowMap.enabled = quality !== 'low'
      gl.shadowMap.type = want
      gl.shadowMap.needsUpdate = true
    }
  })
  return null
}

export default function Experience() {
  const quality = useRace((s) => s.quality)
  return (
    <Canvas
      className="!fixed inset-0"
      aria-hidden="true"
      // The scroll spacer sits on top of the canvas; take pointer events from the whole page so hidden boards
      // can be clicked. Only meshes with handlers are raycast.
      eventSource={document.getElementById('root')}
      eventPrefix="client"
      camera={{ fov: 60, near: 0.05, far: 6000 }}
      dpr={DPR[quality]}
      gl={{ antialias: quality === 'low', powerPreference: 'high-performance' }}
      shadows
      onCreated={(s) => import.meta.env.DEV && (window.__three = s)}
    >
      <AutoQuality />
      <ShadowTier quality={quality} />
      <Suspense fallback={null}>
        <Environment />
        <Track />
        <SetPieces />
        <Checkpoints />
        <Car />
        <HiddenBoards />
        {quality !== 'low' && <Effects full={quality === 'high'} />}
        <Preload all /* compile every shader and upload every texture before the first scroll, not during it */ />
      </Suspense>
    </Canvas>
  )
}
