import { Environment as IBL, Sky } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef } from 'react'
import { Color, Object3D, Vector3 } from 'three'
import { spline } from '../lib/trackSpline'
import { useRace } from '../store/useRace'
import { usePBR } from './Track'

export const FOG = '#d9a77c'
const SUN_DIR = new Vector3(-0.55, 0.32, 0.77).normalize() // low golden-hour sun, tuned to the sunset preset

// Deterministic RNG so the scenery is the same on every load.
export function rng(seed = 7) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const trackPts = spline.getSpacedPoints(600)
const center = trackPts.reduce((a, p) => a.add(p), new Vector3()).divideScalar(trackPts.length)
const nearTrack = (x, z, d) => trackPts.some((p) => (p.x - x) ** 2 + (p.z - z) ** 2 < d * d)

// Sun that follows the camera so the shadow map only covers what is near the driver.
function Sun() {
  const light = useRef()
  const camera = useThree((s) => s.camera)
  useFrame(() => {
    const l = light.current
    l.target.position.copy(camera.position)
    l.position.copy(camera.position).addScaledVector(SUN_DIR, 80)
    l.target.updateMatrixWorld()
  })
  return (
    <directionalLight ref={light} intensity={2.2} color="#ffcf9a" castShadow
      shadow-mapSize={[2048, 2048]} shadow-bias={-0.0004} shadow-normalBias={0.02}
      shadow-camera-left={-30} shadow-camera-right={30} shadow-camera-top={30} shadow-camera-bottom={-30}
      shadow-camera-near={1} shadow-camera-far={200} />
  )
}

function Instanced({ count, place, colored, children, ...props }) {
  const ref = useRef()
  useLayoutEffect(() => {
    const o = new Object3D()
    const c = new Color()
    for (let i = 0; i < count; i++) {
      place(i, o, c)
      o.updateMatrix()
      ref.current.setMatrixAt(i, o.matrix)
      if (colored) ref.current.setColorAt(i, c)
    }
    ref.current.instanceMatrix.needsUpdate = true
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true
  }, [count, place]) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <instancedMesh ref={ref} args={[null, null, count]} {...props}>
      {children}
    </instancedMesh>
  )
}
export { Instanced }

const TREES = { high: 1400, medium: 800, low: 450 }

function Trees() {
  const quality = useRace((s) => s.quality)
  const n = TREES[quality]
  const spots = useMemo(() => {
    const r = rng(11)
    const out = []
    while (out.length < n) {
      const x = center.x + (r() - 0.5) * 1800
      const z = center.z + (r() - 0.5) * 1600
      if (!nearTrack(x, z, 32)) out.push([x, z, 0.7 + r() * 0.8, r()])
    }
    return out
  }, [n])
  const crown = useMemo(() => (i, o, c) => {
    const [x, z, s, h] = spots[i]
    o.position.set(x, 3.2 * s + 3 * s, z)
    o.scale.setScalar(s)
    c.setHSL(0.22 + h * 0.07, 0.45, 0.09 + h * 0.06)
  }, [spots])
  const trunk = useMemo(() => (i, o) => {
    const [x, z, s] = spots[i]
    o.position.set(x, 1.6 * s, z)
    o.scale.setScalar(s)
  }, [spots])
  return (
    <>
      <Instanced count={spots.length} place={crown} colored castShadow>
        <coneGeometry args={[2.6, 7, 7]} />
        <meshStandardMaterial roughness={0.95} />
      </Instanced>
      {quality !== 'low' && ( // Low tier: crowns only
        <Instanced count={spots.length} place={trunk}>
          <cylinderGeometry args={[0.25, 0.35, 3.2, 5]} />
          <meshStandardMaterial color="#4a3526" roughness={1} />
        </Instanced>
      )}
    </>
  )
}

// Distant ridge line, a nod to the Western Ghats.
function Hills() {
  const place = useMemo(() => {
    const r = rng(3)
    return (i, o, c) => {
      const a = (i / 48) * Math.PI * 2 + r() * 0.1
      const d = 2100 + r() * 500
      o.position.set(center.x + Math.cos(a) * d, -20, center.z + Math.sin(a) * d)
      o.scale.set(260 + r() * 260, 120 + r() * 200, 260 + r() * 260)
      o.rotation.y = r() * 6
      c.setHSL(0.6, 0.12, 0.12 + r() * 0.05)
    }
  }, [])
  return (
    <Instanced count={48} place={place} colored>
      <coneGeometry args={[1, 1, 6, 1]} />
      <meshStandardMaterial roughness={1} flatShading />
    </Instanced>
  )
}

function Ground() {
  const grass = usePBR('grass_ground', [800, 800])
  return (
    <mesh rotation-x={-Math.PI / 2} position={[center.x, -0.02, center.z]} receiveShadow>
      <planeGeometry args={[8000, 8000]} />
      <meshStandardMaterial {...grass} color="#8fae6a" />
    </mesh>
  )
}

export default function Environment() {
  return (
    <>
      {/* HDRI for light + reflections only: its photo background has a close-up tree that breaks scale. */}
      <IBL preset="sunset" environmentIntensity={0.8} />
      <Sky sunPosition={SUN_DIR.toArray()} turbidity={6} rayleigh={2.2} mieCoefficient={0.006} mieDirectionalG={0.85} distance={5000} />
      <fog attach="fog" args={[FOG, 250, 2600]} />
      <Sun />
      <Ground />
      <Trees />
      <Hills />
    </>
  )
}
