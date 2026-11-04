import { Environment as IBL } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef } from 'react'
import {
  BackSide, BufferAttribute, CanvasTexture, Color, DoubleSide, MeshDepthMaterial, Object3D, PlaneGeometry,
  RGBADepthPacking, SRGBColorSpace, Vector3,
} from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { place, spline, turnAt } from '../lib/trackSpline'
import { useRace } from '../store/useRace'
import { rig } from './rig'
import { usePBR } from './Track'

// Stylised golden hour (visual_rehaul.md §1.1). The horizon of the sky IS the fog colour, so the
// ground and the distant ridges dissolve into the sky with no seam.
export const PALETTE = {
  skyTop: '#2B3A67',
  skyMid: '#F4A261',
  fog: '#E9C9A8',
  sun: '#FFD9A0',
  fill: '#8FA8D8',
  grass: '#5B7A3A',
}
// Night race (visual_rehaul.md milestone 5): same geometry, a cold moon, floodlights. Horizon still equals fog.
export const NIGHT = {
  skyTop: '#03050c',
  skyMid: '#0e1530',
  fog: '#151b30',
  sun: '#a9bcff', // the moon
  fill: '#2b3a66',
  grass: '#141c10',
}
export const FOG = PALETTE.fog
export const SUN_DIR = new Vector3(-0.55, 0.27, 0.79).normalize() // ~15° elevation: long shadows
const MOON_DIR = new Vector3(0.42, 0.62, -0.66).normalize()
const LIGHTING = {
  day: { P: PALETTE, dir: SUN_DIR, sun: 3.4, hemi: 1.25, ibl: 0.45, glow: 1, fogFar: 2300 },
  night: { P: NIGHT, dir: MOON_DIR, sun: 0.55, hemi: 0.4, ibl: 0.08, glow: 0.35, fogFar: 1500 },
}

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

// Gradient dome with a sun disc and halo. Follows the camera; drawn first and never fogged.
function SkyDome({ L }) {
  const ref = useRef()
  const camera = useThree((s) => s.camera)
  const uniforms = useMemo(() => ({
    top: { value: new Color() },
    mid: { value: new Color() },
    horizon: { value: new Color() },
    sunCol: { value: new Color() },
    sunDir: { value: new Vector3() },
    glow: { value: 1 },
  }), [])
  useLayoutEffect(() => {
    uniforms.top.value.set(L.P.skyTop)
    uniforms.mid.value.set(L.P.skyMid)
    uniforms.horizon.value.set(L.P.fog)
    uniforms.sunCol.value.set(L.P.sun)
    uniforms.sunDir.value.copy(L.dir)
    uniforms.glow.value = L.glow
  }, [L, uniforms])
  useFrame(() => ref.current.position.copy(camera.position))
  return (
    <mesh ref={ref} renderOrder={-1} frustumCulled={false}>
      <sphereGeometry args={[4500, 32, 16]} />
      <shaderMaterial side={BackSide} depthWrite={false} uniforms={uniforms}
        vertexShader={`varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`}
        fragmentShader={`
          uniform vec3 top, mid, horizon, sunCol, sunDir; uniform float glow; varying vec3 vDir;
          void main(){
            vec3 d = normalize(vDir);
            float h = d.y;
            vec3 c = mix(horizon, mid, smoothstep(0.0, 0.07, h));
            c = mix(c, top, smoothstep(0.05, 0.55, h));
            float s = max(dot(d, normalize(sunDir)), 0.0);
            c += sunCol * glow * (pow(s, 6.0) * 0.35 + pow(s, 48.0) * 0.6) * (1.0 - smoothstep(0.0, 0.6, h) * 0.5);
            c += sunCol * smoothstep(0.9993, 0.9996, s) * 3.0; // disc, bright enough to bloom
            c = mix(c, horizon, 1.0 - smoothstep(-0.02, 0.012, h)); // below the horizon is all haze
            gl_FragColor = vec4(c, 1.0);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }`} />
    </mesh>
  )
}

const SHADOW = { high: 2048, medium: 1024, low: 512 }

// Low warm sun that follows the car, so the shadow map covers whatever the camera is framing.
function Sun({ L }) {
  const light = useRef()
  const quality = useRace((s) => s.quality)
  useLayoutEffect(() => {
    const sh = light.current.shadow
    sh.mapSize.set(SHADOW[quality], SHADOW[quality])
    sh.map?.dispose()
    sh.map = null
  }, [quality])
  useFrame(() => {
    const l = light.current
    l.target.position.copy(rig.car.position)
    l.position.copy(rig.car.position).addScaledVector(L.dir, 120)
    l.target.updateMatrixWorld()
  })
  return (
    <directionalLight ref={light} intensity={L.sun} color={L.P.sun} castShadow
      shadow-bias={-0.0004} shadow-normalBias={0.03} shadow-radius={4}
      shadow-camera-left={-36} shadow-camera-right={36} shadow-camera-top={36} shadow-camera-bottom={-36}
      shadow-camera-near={1} shadow-camera-far={260} />
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

// Three tree species painted into one atlas: poplar, broadleaf, pine. Two tones each, lit from the sun side.
function treeAtlas() {
  const W = 256
  const c = document.createElement('canvas')
  c.width = W * 3
  c.height = W * 2
  const g = c.getContext('2d')
  const r = rng(5)
  const blob = (x, y, rx, ry, col) => {
    g.fillStyle = col
    g.beginPath()
    g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2)
    g.fill()
  }
  const trunk = (x0, top) => {
    g.fillStyle = '#4a3526'
    g.fillRect(x0 - 7, top, 14, W * 2 - top)
  }
  const crown = (cx, cy, rx, ry, n, dark, lit) => {
    for (let i = 0; i < n; i++) {
      const a = r() * Math.PI * 2
      const d = Math.sqrt(r())
      blob(cx + Math.cos(a) * rx * d * 0.7, cy + Math.sin(a) * ry * d * 0.7, rx * (0.3 + r() * 0.2), ry * (0.25 + r() * 0.15), dark)
    }
    for (let i = 0; i < n * 0.6; i++) { // lit side: upper left, toward the sun
      const a = Math.PI * (1.05 + r() * 0.6)
      const d = Math.sqrt(r())
      blob(cx + Math.cos(a) * rx * d * 0.55, cy + Math.sin(a) * ry * d * 0.6, rx * (0.2 + r() * 0.15), ry * (0.18 + r() * 0.1), lit)
    }
  }
  // poplar: tall narrow
  trunk(W * 0.5, W * 1.5)
  crown(W * 0.5, W * 0.85, W * 0.26, W * 0.78, 26, '#3f5a2a', '#7d9a45')
  // broadleaf: round
  trunk(W * 1.5, W * 1.3)
  crown(W * 1.5, W * 1.0, W * 0.46, W * 0.5, 30, '#465f2b', '#8aa64d')
  // pine: stacked tiers
  trunk(W * 2.5, W * 1.6)
  for (let i = 0; i < 6; i++) {
    const y = W * (0.25 + i * 0.25)
    const hw = W * (0.12 + i * 0.065)
    g.fillStyle = i % 2 ? '#2f4a2c' : '#35532f'
    g.beginPath(); g.moveTo(W * 2.5, y - W * 0.22); g.lineTo(W * 2.5 + hw, y + W * 0.12); g.lineTo(W * 2.5 - hw, y + W * 0.12); g.fill()
    g.fillStyle = '#5d7d3d'
    g.beginPath(); g.moveTo(W * 2.5, y - W * 0.22); g.lineTo(W * 2.5 - hw * 0.15, y + W * 0.1); g.lineTo(W * 2.5 - hw, y + W * 0.12); g.fill()
  }
  const tex = new CanvasTexture(c)
  tex.colorSpace = SRGBColorSpace
  tex.anisotropy = 4
  return tex
}

// Two crossed quads for atlas cell `cell`, base at y=0, normals bent outward so the crown shades as a volume.
function crossGeometry(cell, w, h) {
  const quads = [0, Math.PI / 2].map((rot) => {
    const q = new PlaneGeometry(w, h, 1, 2).translate(0, h / 2, 0).rotateY(rot)
    const uv = q.attributes.uv
    for (let i = 0; i < uv.count; i++) uv.setX(i, (cell + uv.getX(i)) / 3)
    return q
  })
  const g = mergeGeometries(quads)
  const p = g.attributes.position
  const n = new Float32Array(p.count * 3)
  const v = new Vector3()
  for (let i = 0; i < p.count; i++) {
    v.set(p.getX(i), p.getY(i) - h * 0.45, p.getZ(i)).normalize().lerp(new Vector3(0, 1, 0), 0.45).normalize()
    n.set([v.x, v.y, v.z], i * 3)
  }
  g.setAttribute('normal', new BufferAttribute(n, 3))
  return g
}

const wind = { value: 0 }
// Sways the top of each instance; the base stays planted. Same patch on the shadow depth material.
function sway(shader) {
  shader.uniforms.uWind = wind
  shader.vertexShader = shader.vertexShader
    .replace('#include <common>', '#include <common>\nuniform float uWind;')
    .replace('#include <begin_vertex>', `#include <begin_vertex>
      vec4 ip = instanceMatrix[3];
      float k = max(position.y, 0.0) * 0.02;
      transformed.x += sin(uWind * 1.4 + ip.x * 0.045 + ip.z * 0.07) * k * k * 6.0;
      transformed.z += cos(uWind * 1.1 + ip.z * 0.05) * k * k * 3.0;`)
}

const TREES = { high: 1500, medium: 900, low: 500 }
const SPECIES = [
  { cell: 0, w: 4.5, h: 13 }, // poplar
  { cell: 1, w: 9, h: 10 }, // broadleaf
  { cell: 2, w: 6, h: 12 }, // pine
]

function Trees() {
  const quality = useRace((s) => s.quality)
  const atlas = useMemo(treeAtlas, [])
  const parts = useMemo(() => {
    const r = rng(11)
    const n = TREES[quality]
    const spots = [[], [], []]
    let placed = 0
    while (placed < n) {
      // Clusters: woods read better than an even scatter.
      const cx = center.x + (r() - 0.5) * 1800
      const cz = center.z + (r() - 0.5) * 1600
      const sp = Math.floor(r() * 3)
      for (let j = 0; j < 6 + r() * 14 && placed < n; j++) {
        const x = cx + (r() - 0.5) * 70
        const z = cz + (r() - 0.5) * 70
        if (nearTrack(x, z, 30)) continue
        spots[(sp + (r() < 0.2 ? 1 : 0)) % 3].push([x, z, 0.65 + r() * 0.75, r() * 6, 0.85 + r() * 0.3])
        placed++
      }
    }
    return SPECIES.map((s, i) => ({
      geo: crossGeometry(s.cell, s.w, s.h),
      place: (k, o, c) => {
        const [x, z, sc, rot, tint] = spots[i][k]
        o.position.set(x, 0, z)
        o.rotation.set(0, rot, 0)
        o.scale.setScalar(sc)
        c.setRGB(tint, tint, tint * 0.95)
      },
      count: spots[i].length,
    }))
  }, [quality])
  const mats = useMemo(() => {
    const depth = new MeshDepthMaterial({ depthPacking: RGBADepthPacking, map: atlas, alphaTest: 0.5 })
    depth.onBeforeCompile = sway
    return { depth }
  }, [atlas])
  useFrame((_, dt) => (wind.value += dt))
  return parts.map((p, i) => (
    <Instanced key={`${quality}-${i}`} count={p.count} place={p.place} colored castShadow customDepthMaterial={mats.depth}>
      <primitive object={p.geo} attach="geometry" />
      <meshStandardMaterial map={atlas} alphaTest={0.5} side={DoubleSide} roughness={1} onBeforeCompile={sway} />
    </Instanced>
  ))
}

// Distant ridge lines, a nod to the Western Ghats: faceted, two-toned by the low sun, swallowed by the fog.
function Hills() {
  const ring = (seed, n, d0, d1, s0, s1, light) => {
    const r = rng(seed)
    return (i, o, c) => {
      const a = (i / n) * Math.PI * 2 + r() * 0.12
      const d = d0 + r() * (d1 - d0)
      const w = s0 + r() * (s1 - s0)
      o.position.set(center.x + Math.cos(a) * d, -10, center.z + Math.sin(a) * d)
      o.scale.set(w * (1 + r()), s0 * 0.35 + r() * s0 * 0.6, w)
      o.rotation.y = r() * 6
      c.setHSL(0.09 + r() * 0.04, 0.22, light + r() * 0.04)
    }
  }
  const near = useMemo(() => ring(3, 40, 1250, 1600, 180, 360, 0.3), []) // eslint-disable-line react-hooks/exhaustive-deps
  const far = useMemo(() => ring(9, 34, 1900, 2300, 320, 560, 0.36), []) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <>
      {[[near, 40], [far, 34]].map(([place, n], i) => (
        <Instanced key={i} count={n} place={place} colored>
          <coneGeometry args={[1, 1, 5, 1]} />
          <meshLambertMaterial flatShading />
        </Instanced>
      ))}
    </>
  )
}

// Grass with large patches of colour variation (dry, lush, mown), baked into vertex colours.
function Ground() {
  const grass = usePBR('grass_ground', [800, 800])
  const geo = useMemo(() => {
    const g = new PlaneGeometry(8000, 8000, 160, 160)
    const p = g.attributes.position
    const col = new Float32Array(p.count * 3)
    const lush = new Color('#6f9447')
    const dry = new Color('#93a055')
    const deep = new Color('#4f7038')
    const c = new Color()
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i)
      const y = p.getY(i)
      const n1 = Math.sin(x * 0.006 + Math.sin(y * 0.004) * 2) * Math.cos(y * 0.005 - x * 0.002)
      const n2 = Math.sin(x * 0.021 + y * 0.017) * 0.5 + Math.sin(x * 0.043 - y * 0.031) * 0.25
      const k = n1 * 0.6 + n2 * 0.4
      c.copy(lush).lerp(k > 0 ? dry : deep, Math.min(1, Math.abs(k) * 1.4))
      col.set([c.r, c.g, c.b], i * 3)
    }
    g.setAttribute('color', new BufferAttribute(col, 3))
    return g
  }, [])
  return (
    <mesh rotation-x={-Math.PI / 2} position={[center.x, -0.02, center.z]} receiveShadow geometry={geo}>
      <meshStandardMaterial {...grass} vertexColors color="#cfe0b0" />
    </mesh>
  )
}

// Floodlight masts along the outside of the track (night only). The lamp heads are unlit white so they bloom;
// the actual light on the car comes from one spot that follows it, which is far cheaper than a light per mast.
const MAST_EVERY = 110 // metres
function Floodlights() {
  const spot = useRef()
  const head = useRef()
  const masts = useMemo(() => {
    const out = []
    const n = Math.floor(trackPts.length)
    for (let d = 0; d < n; d += Math.round((MAST_EVERY / 3000) * n)) {
      const t = d / n
      const side = turnAt(t) > 0 ? 1 : -1
      const { position, rotY } = place(t, side * 24)
      out.push({ position, rotY: rotY + (side > 0 ? Math.PI / 2 : -Math.PI / 2) }) // lamp faces the road
    }
    return out
  }, [])
  useFrame(() => {
    const c = rig.car
    spot.current.position.set(c.position.x + 18, 34, c.position.z + 10)
    spot.current.target.position.copy(c.position)
    spot.current.target.updateMatrixWorld()
    // Headlight: just ahead of the nose, aimed 30 m down the road.
    head.current.position.set(0, 0.55, 2.2).applyMatrix4(c.matrixWorld)
    head.current.target.position.set(0, 0, 30).applyMatrix4(c.matrixWorld)
    head.current.target.updateMatrixWorld()
  })
  return (
    <>
      <spotLight ref={spot} color="#fff1d6" intensity={9} angle={0.55} penumbra={0.7} decay={0} distance={0} />
      <spotLight ref={head} color="#eaf2ff" intensity={6} angle={0.42} penumbra={0.5} decay={0} distance={0} />
      {masts.map((mst, i) => (
        <group key={i} position={mst.position} rotation-y={mst.rotY}>
          <mesh position={[0, 11, 0]}>
            <cylinderGeometry args={[0.18, 0.25, 22, 6]} />
            <meshStandardMaterial color="#3a3d44" />
          </mesh>
          <mesh position={[0, 22.4, 0.6]} rotation-x={0.5}>
            <boxGeometry args={[3.2, 1.2, 0.3]} />
            <meshBasicMaterial color="#fff6e0" toneMapped={false} />
          </mesh>
        </group>
      ))}
    </>
  )
}

export default function Environment() {
  const night = useRace((s) => s.night)
  const L = LIGHTING[night ? 'night' : 'day']
  return (
    <>
      {/* HDRI for car reflections only; the sky you see is the gradient dome. */}
      <IBL preset={night ? 'night' : 'sunset'} environmentIntensity={L.ibl} />
      <SkyDome L={L} />
      <fog attach="fog" args={[L.P.fog, night ? 90 : 160, L.fogFar]} />
      <hemisphereLight args={[L.P.fill, L.P.grass, L.hemi]} />
      <Sun L={L} />
      {night && <Floodlights />}
      <Ground />
      <Trees />
      <Hills />
    </>
  )
}
