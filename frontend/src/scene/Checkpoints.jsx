import { useMemo } from 'react'
import { CanvasTexture, SRGBColorSpace, Vector3 } from 'three'
import { checkpoints } from '../lib/scrollMap'
import { frameAt, turnAt, TRACK_LENGTH } from '../lib/trackSpline'

function labelTexture(label, title) {
  const c = document.createElement('canvas')
  c.width = 1024
  c.height = 512
  const g = c.getContext('2d')
  g.fillStyle = '#141416'
  g.fillRect(0, 0, 1024, 512)
  g.fillStyle = '#E86A1F'
  g.fillRect(0, 0, 1024, 24)
  g.fillStyle = '#E86A1F'
  g.font = 'bold 72px system-ui, sans-serif'
  g.fillText(label, 48, 140)
  g.fillStyle = '#F2E8D5'
  g.font = 'bold 84px system-ui, sans-serif'
  const words = title.split(' ')
  let line = ''
  let y = 280
  for (const w of words) {
    if (g.measureText(line + w).width > 920) {
      g.fillText(line, 48, y)
      line = ''
      y += 100
    }
    line += w + ' '
  }
  g.fillText(line, 48, y)
  const tex = new CanvasTexture(c)
  tex.colorSpace = SRGBColorSpace
  tex.anisotropy = 8
  return tex
}

const AHEAD = 45 / TRACK_LENGTH // billboard sits 45 m past the checkpoint so it is in view while holding

function Billboard({ cp }) {
  const { position, rotationY, tex } = useMemo(() => {
    const tb = cp.trackT + AHEAD
    const { pos, side } = frameAt(tb)
    const outside = turnAt(tb) > 0 ? 1 : -1 // left turn -> put it on the right (outside)
    pos.addScaledVector(side, outside * 21) // just beyond the catch fence
    const eye = frameAt(cp.trackT).pos
    const look = new Vector3().subVectors(eye, pos)
    return { position: [pos.x, 0, pos.z], rotationY: Math.atan2(look.x, look.z), tex: labelTexture(cp.label, cp.title) }
  }, [cp])
  return (
    <group position={position} rotation-y={rotationY} scale={1.5}>
      <mesh position={[0, 4.5, 0]} castShadow>
        <boxGeometry args={[8.4, 4.4, 0.3]} />
        <meshStandardMaterial color="#1c1c1f" />
      </mesh>
      <mesh position={[0, 4.5, 0.16]}>
        <planeGeometry args={[8, 4]} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
      <mesh position={[0, 1.25, 0]}>
        <boxGeometry args={[0.35, 2.5, 0.35]} />
        <meshStandardMaterial color="#888" />
      </mesh>
    </group>
  )
}

export default function Checkpoints() {
  return checkpoints.map((cp) => <Billboard key={cp.id} cp={cp} />)
}
