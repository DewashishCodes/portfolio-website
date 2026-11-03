import { useTexture } from '@react-three/drei'
import { useLayoutEffect, useMemo, useRef } from 'react'
import { BufferAttribute, BufferGeometry, CanvasTexture, DoubleSide, Object3D, RepeatWrapping, SRGBColorSpace } from 'three'
import { frameAt, ROAD_WIDTH, TRACK_LENGTH, turnAt } from '../lib/trackSpline'

const SAMPLES = 3000
const CORNER = 1 / 150 // curvature above this counts as a corner (radius under 150 m)
const HALF = ROAD_WIDTH / 2

// Strip along the spline. Flat ribbon (height 0) or vertical wall (height > 0).
// `keep(t)` drops quads where it returns false, so kerbs/gravel only appear in corners.
function strip({ half = 0, offset = 0, y = 0, height = 0, tile = 2 * half || height, keep }) {
  const pos = []
  const uv = []
  const idx = []
  let run = false
  for (let i = 0; i <= SAMPLES; i++) {
    const t = i / SAMPLES
    const on = !keep || keep(t)
    if (!on) {
      run = false
      continue
    }
    const { pos: p, side } = frameAt(t)
    const v = (t * TRACK_LENGTH) / tile
    const base = pos.length / 3
    if (height) {
      for (const h of [y, y + height]) pos.push(p.x + side.x * offset, h, p.z + side.z * offset)
    } else {
      for (const d of [offset - half, offset + half]) pos.push(p.x + side.x * d, y, p.z + side.z * d)
    }
    uv.push(0, v, 1, v)
    if (run) idx.push(base - 2, base - 1, base, base - 1, base + 1, base)
    run = true
  }
  const g = new BufferGeometry()
  g.setAttribute('position', new BufferAttribute(new Float32Array(pos), 3))
  g.setAttribute('uv', new BufferAttribute(new Float32Array(uv), 2))
  g.setIndex(idx)
  g.computeVertexNormals()
  return g
}

function stripeTexture(a, b, cells = 2) {
  const c = document.createElement('canvas')
  c.width = 4
  c.height = 64
  const g = c.getContext('2d')
  for (let i = 0; i < cells; i++) {
    g.fillStyle = i % 2 ? b : a
    g.fillRect(0, (i * 64) / cells, 4, 64 / cells)
  }
  const tex = new CanvasTexture(c)
  tex.colorSpace = SRGBColorSpace
  tex.wrapS = tex.wrapT = RepeatWrapping
  return tex
}

function fenceTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 64
  const g = c.getContext('2d')
  g.strokeStyle = '#b9bcc0'
  g.lineWidth = 2
  for (let i = -64; i < 128; i += 16) {
    g.beginPath(); g.moveTo(i, 0); g.lineTo(i + 64, 64); g.stroke()
    g.beginPath(); g.moveTo(i + 64, 0); g.lineTo(i, 64); g.stroke()
  }
  const tex = new CanvasTexture(c)
  tex.wrapS = tex.wrapT = RepeatWrapping
  tex.repeat.set(4, 1)
  return tex
}

export function usePBR(name, repeat = [1, 1]) {
  const maps = useTexture({
    map: `/textures/${name}/${name}_diff_1k.jpg`,
    normalMap: `/textures/${name}/${name}_nor_gl_1k.jpg`,
    aoMap: `/textures/${name}/${name}_arm_1k.jpg`,
  })
  return useMemo(() => {
    maps.map.colorSpace = SRGBColorSpace
    for (const t of Object.values(maps)) {
      t.wrapS = t.wrapT = RepeatWrapping
      t.repeat.set(...repeat)
      t.anisotropy = 8
    }
    // arm = AO (R), roughness (G), metalness (B): one texture feeds all three slots.
    return { ...maps, roughnessMap: maps.aoMap, metalnessMap: maps.aoMap }
  }, [maps]) // eslint-disable-line react-hooks/exhaustive-deps
}

function TyreWalls() {
  const ref = useRef()
  const mats = useMemo(() => {
    const out = []
    const o = new Object3D()
    for (let i = 0; i < SAMPLES; i += 2) {
      const t = i / SAMPLES
      const k = turnAt(t)
      if (Math.abs(k) < CORNER) continue
      const { pos, side } = frameAt(t)
      const s = k > 0 ? 1 : -1
      for (let h = 0; h < 2; h++) {
        o.position.set(pos.x + side.x * s * 16.4, 0.15 + h * 0.3, pos.z + side.z * s * 16.4)
        o.updateMatrix()
        out.push(o.matrix.clone())
      }
    }
    return out
  }, [])
  useLayoutEffect(() => mats.forEach((m, i) => ref.current.setMatrixAt(i, m)), [mats])
  return (
    <instancedMesh ref={ref} args={[null, null, mats.length]} castShadow receiveShadow>
      <cylinderGeometry args={[0.32, 0.32, 0.3, 10]} />
      <meshStandardMaterial color="#1b1b1b" roughness={0.9} />
    </instancedMesh>
  )
}

export default function Track() {
  const geo = useMemo(() => {
    const inCorner = (s) => (t) => s * turnAt(t) > CORNER
    const anyCorner = (t) => Math.abs(turnAt(t)) > CORNER
    return {
      road: strip({ half: HALF }),
      lineL: strip({ half: 0.12, offset: -HALF + 0.35, y: 0.01, tile: 1 }),
      lineR: strip({ half: 0.12, offset: HALF - 0.35, y: 0.01, tile: 1 }),
      kerbL: strip({ half: 0.6, offset: -HALF - 0.6, y: 0.02, tile: 2.4, keep: anyCorner }),
      kerbR: strip({ half: 0.6, offset: HALF + 0.6, y: 0.02, tile: 2.4, keep: anyCorner }),
      // Gravel only on the outside of the bend: right side for left turns, left side for right turns.
      gravelR: strip({ half: 4.4, offset: HALF + 5.6, y: 0.015, tile: 8, keep: inCorner(1) }),
      gravelL: strip({ half: 4.4, offset: -HALF - 5.6, y: 0.015, tile: 8, keep: inCorner(-1) }),
      armcoL: strip({ offset: -17, y: 0.3, height: 0.6 }),
      armcoR: strip({ offset: 17, y: 0.3, height: 0.6 }),
      fenceL: strip({ offset: -17.6, height: 4, tile: 1 }),
      fenceR: strip({ offset: 17.6, height: 4, tile: 1 }),
    }
  }, [])
  const asphalt = usePBR('asphalt_track', [1, 1])
  const gravel = usePBR('bicolour_gravel', [2, 1])
  const kerbTex = useMemo(() => stripeTexture('#c8312b', '#f2efe8'), [])
  const fenceTex = useMemo(fenceTexture, [])

  return (
    <group>
      <mesh geometry={geo.road} receiveShadow>
        <meshStandardMaterial {...asphalt} color="#9a9a9a" />
      </mesh>
      {[geo.lineL, geo.lineR].map((g, i) => (
        <mesh key={i} geometry={g} receiveShadow>
          <meshStandardMaterial color="#eeeeea" roughness={0.6} />
        </mesh>
      ))}
      {[geo.kerbL, geo.kerbR].map((g, i) => (
        <mesh key={i} geometry={g} receiveShadow>
          <meshStandardMaterial map={kerbTex} roughness={0.5} />
        </mesh>
      ))}
      {[geo.gravelL, geo.gravelR].map((g, i) => (
        <mesh key={i} geometry={g} receiveShadow>
          <meshStandardMaterial {...gravel} />
        </mesh>
      ))}
      {[geo.armcoL, geo.armcoR].map((g, i) => (
        <mesh key={i} geometry={g} castShadow receiveShadow>
          <meshStandardMaterial color="#b8bcc2" metalness={0.85} roughness={0.35} side={DoubleSide} />
        </mesh>
      ))}
      {[geo.fenceL, geo.fenceR].map((g, i) => (
        <mesh key={i} geometry={g}>
          <meshStandardMaterial alphaMap={fenceTex} transparent alphaTest={0.3} color="#c9ccd0" metalness={0.6} side={DoubleSide} depthWrite={false} />
        </mesh>
      ))}
      <TyreWalls />
    </group>
  )
}

