import { useTexture } from '@react-three/drei'
import { useLayoutEffect, useMemo, useRef } from 'react'
import { BufferAttribute, BufferGeometry, CanvasTexture, DoubleSide, Object3D, RepeatWrapping, SRGBColorSpace } from 'three'
import content from '../content/content.json'
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

// Gates in the catch fence: an 8 m gap every 160 m, staggered between the two sides.
const GATE_EVERY = 160 / TRACK_LENGTH
const GATE = 8 / TRACK_LENGTH
const gateAt = (t, side) => ((t + (side > 0 ? GATE_EVERY / 2 : 0)) % GATE_EVERY) < GATE
const straight = (t) => Math.abs(turnAt(t)) < CORNER * 0.6

// Rubbered-in racing line: dark streaks hugging the inside of each corner.
function tyreMarkTexture() {
  const c = document.createElement('canvas')
  c.width = 64
  c.height = 256
  const g = c.getContext('2d')
  g.fillStyle = '#000' // alphaMap reads the green channel: white streaks on black
  g.fillRect(0, 0, 64, 256)
  for (const [x, w] of [[10, 5], [20, 3], [40, 6], [52, 3]]) {
    const grad = g.createLinearGradient(0, 0, 0, 256)
    grad.addColorStop(0, '#000')
    grad.addColorStop(0.3, '#e6e6e6')
    grad.addColorStop(0.7, '#e6e6e6')
    grad.addColorStop(1, '#000')
    g.fillStyle = grad
    g.fillRect(x, 0, w, 256)
  }
  const tex = new CanvasTexture(c)
  tex.wrapS = tex.wrapT = RepeatWrapping
  return tex
}

// Advertising boards along the straights, in the livery, carrying the driver's own names (never real sponsors).
// Canvas is drawn sideways: strip u runs up the board, v runs along the track.
function sponsorTexture() {
  const { colors } = content.livery
  const boards = [
    ['DL GRAND PRIX', colors.body, colors.cream],
    [content.profile.now?.[0]?.org?.toUpperCase() ?? 'YAP', colors.carbon, colors.accent],
    ['#' + content.livery.number, colors.cream, colors.body],
    ['BUILT IN PUNE', colors.accent, colors.carbon],
  ]
  const c = document.createElement('canvas')
  c.width = 128
  c.height = 2048
  const g = c.getContext('2d')
  const seg = c.height / boards.length
  boards.forEach(([text, bg, fg], i) => {
    g.fillStyle = bg
    g.fillRect(0, i * seg, 128, seg)
    g.fillStyle = 'rgba(0,0,0,0.25)'
    g.fillRect(0, i * seg, 128, 6)
    g.save()
    g.translate(64, i * seg + seg / 2)
    g.rotate(Math.PI / 2)
    g.fillStyle = fg
    g.font = 'bold 76px system-ui, sans-serif'
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    g.fillText(text, 0, 4, seg - 60)
    g.restore()
  })
  const tex = new CanvasTexture(c)
  tex.colorSpace = SRGBColorSpace
  tex.wrapS = tex.wrapT = RepeatWrapping
  tex.anisotropy = 8
  return tex
}

// Marshal post at every fence gate: a small cabin with an orange roof and a flag.
function MarshalPosts() {
  const ref = useRef()
  const roof = useRef()
  const mats = useMemo(() => {
    const out = []
    const o = new Object3D()
    for (let i = 0; i < SAMPLES; i++) {
      const t = i / SAMPLES
      for (const s of [1, -1]) {
        if (!gateAt(t, s) || gateAt(t - 1 / SAMPLES, s)) continue // first sample of each gate
        const { pos, side, tan } = frameAt(t + GATE / 2)
        o.position.set(pos.x + side.x * s * 20.5, 1.2, pos.z + side.z * s * 20.5)
        o.rotation.set(0, Math.atan2(tan.x, tan.z), 0)
        o.updateMatrix()
        out.push(o.matrix.clone())
      }
    }
    return out
  }, [])
  useLayoutEffect(() => {
    const o = new Object3D()
    mats.forEach((m, i) => {
      ref.current.setMatrixAt(i, m)
      o.matrix.copy(m)
      o.matrix.decompose(o.position, o.quaternion, o.scale)
      o.position.y = 2.55
      o.updateMatrix()
      roof.current.setMatrixAt(i, o.matrix)
    })
  }, [mats])
  return (
    <>
      <instancedMesh ref={ref} args={[null, null, mats.length]} castShadow receiveShadow>
        <boxGeometry args={[2.2, 2.4, 2.2]} />
        <meshStandardMaterial color="#e9e2d2" roughness={0.8} />
      </instancedMesh>
      <instancedMesh ref={roof} args={[null, null, mats.length]} castShadow>
        <boxGeometry args={[2.7, 0.3, 2.7]} />
        <meshStandardMaterial color="#E86A1F" roughness={0.6} />
      </instancedMesh>
    </>
  )
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
      fenceL: strip({ offset: -17.6, height: 4, tile: 1, keep: (t) => !gateAt(t, -1) }),
      fenceR: strip({ offset: 17.6, height: 4, tile: 1, keep: (t) => !gateAt(t, 1) }),
      boardL: strip({ offset: -16.6, y: 0.05, height: 1.1, tile: 48, keep: (t) => straight(t) && !gateAt(t, -1) }),
      boardR: strip({ offset: 16.6, y: 0.05, height: 1.1, tile: 48, keep: (t) => straight(t) && !gateAt(t, 1) }),
      // Inside of a left turn is the driver's left (negative offset), and vice versa.
      rubberL: strip({ half: 1.1, offset: -HALF + 2.2, y: 0.012, tile: 30, keep: inCorner(1) }),
      rubberR: strip({ half: 1.1, offset: HALF - 2.2, y: 0.012, tile: 30, keep: inCorner(-1) }),
    }
  }, [])
  const asphalt = usePBR('asphalt_track', [1, 1])
  const gravel = usePBR('bicolour_gravel', [2, 1])
  const kerbTex = useMemo(() => stripeTexture('#c8312b', '#f2efe8'), [])
  const fenceTex = useMemo(fenceTexture, [])
  const sponsor = useMemo(sponsorTexture, [])
  const sponsorFlip = useMemo(() => {
    const t = sponsor.clone() // the left boards face the road from the other side: mirror so text reads
    t.repeat.set(1, -1)
    t.needsUpdate = true
    return t
  }, [sponsor])
  const rubber = useMemo(tyreMarkTexture, [])

  return (
    <group>
      <mesh geometry={geo.road} receiveShadow>
        <meshStandardMaterial {...asphalt} color="#c2c0c4" />
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
      {[[geo.boardL, sponsorFlip], [geo.boardR, sponsor]].map(([g, map], i) => (
        <mesh key={i} geometry={g} castShadow receiveShadow>
          <meshStandardMaterial map={map} roughness={0.55} side={DoubleSide} />
        </mesh>
      ))}
      {[geo.rubberL, geo.rubberR].map((g, i) => (
        <mesh key={i} geometry={g}>
          <meshBasicMaterial color="#000" alphaMap={rubber} transparent opacity={0.32} depthWrite={false} polygonOffset polygonOffsetFactor={-1} />
        </mesh>
      ))}
      <TyreWalls />
      <MarshalPosts />
    </group>
  )
}

