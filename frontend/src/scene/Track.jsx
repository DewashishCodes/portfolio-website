import { useMemo } from 'react'
import { BufferAttribute, BufferGeometry } from 'three'
import { frameAt, ROAD_WIDTH, TRACK_LENGTH } from '../lib/trackSpline'

const SAMPLES = 3000

// Ribbon along the spline: `half` metres either side of the centre line, `offset` shifts it sideways.
export function ribbon(half, offset = 0, y = 0) {
  const pos = new Float32Array((SAMPLES + 1) * 2 * 3)
  const uv = new Float32Array((SAMPLES + 1) * 2 * 2)
  const idx = []
  for (let i = 0; i <= SAMPLES; i++) {
    const { pos: p, side } = frameAt(i / SAMPLES)
    for (let s = 0; s < 2; s++) {
      const d = offset + (s ? half : -half)
      const j = (i * 2 + s) * 3
      pos[j] = p.x + side.x * d
      pos[j + 1] = y
      pos[j + 2] = p.z + side.z * d
      uv[(i * 2 + s) * 2] = s
      uv[(i * 2 + s) * 2 + 1] = (i / SAMPLES) * (TRACK_LENGTH / (half * 2))
    }
    if (i < SAMPLES) {
      const a = i * 2
      idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2)
    }
  }
  const g = new BufferGeometry()
  g.setAttribute('position', new BufferAttribute(pos, 3))
  g.setAttribute('uv', new BufferAttribute(uv, 2))
  g.setIndex(idx)
  g.computeVertexNormals()
  return g
}

export default function Track() {
  const road = useMemo(() => ribbon(ROAD_WIDTH / 2), [])
  const lineL = useMemo(() => ribbon(0.15, -ROAD_WIDTH / 2 + 0.4, 0.01), [])
  const lineR = useMemo(() => ribbon(0.15, ROAD_WIDTH / 2 - 0.4, 0.01), [])
  return (
    <group>
      <mesh geometry={road} receiveShadow>
        <meshStandardMaterial color="#55585c" roughness={0.9} />
      </mesh>
      <mesh geometry={lineL}>
        <meshBasicMaterial color="#e8e8e8" />
      </mesh>
      <mesh geometry={lineR}>
        <meshBasicMaterial color="#e8e8e8" />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.05, 0]} receiveShadow>
        <planeGeometry args={[6000, 6000]} />
        <meshStandardMaterial color="#6f7d63" roughness={1} />
      </mesh>
    </group>
  )
}
