import { useMemo } from 'react'
import { CanvasTexture, SRGBColorSpace, Vector3 } from 'three'
import { checkpoints } from '../lib/scrollMap'
import { frameAt, turnAt, TRACK_LENGTH } from '../lib/trackSpline'

const W = 1600
const H = 900 // 16:9, the project media at full resolution

// Billboard face. Projects: the screenshot itself, full bleed, no title (the panel has the title).
// Everything else: the checkpoint's `board` line from content.json, a fact the panel does not lead with.
function billboardTexture({ media, board, label }) {
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const g = c.getContext('2d')
  const tex = new CanvasTexture(c)
  tex.colorSpace = SRGBColorSpace
  tex.anisotropy = 8

  g.fillStyle = '#141416'
  g.fillRect(0, 0, W, H)
  if (media) {
    const img = new Image()
    img.onload = () => {
      g.drawImage(img, 0, 0, W, H)
      tex.needsUpdate = true
    }
    img.src = media
  } else {
    const { big = label, small = '' } = board ?? {}
    g.fillStyle = '#C4161C'
    g.fillRect(0, 0, W, 40)
    g.fillStyle = '#E86A1F'
    g.fillRect(0, 40, W, 14)
    g.textAlign = 'center'
    g.fillStyle = '#F2E8D5'
    g.font = 'bold 260px system-ui, sans-serif'
    g.fillText(big, W / 2, H / 2 + 70, W - 120)
    g.fillStyle = '#E86A1F'
    g.font = 'bold 72px ui-monospace, monospace'
    g.fillText(small, W / 2, H - 120, W - 120)
  }
  tex.needsUpdate = true
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
    return { position: [pos.x, 0, pos.z], rotationY: Math.atan2(look.x, look.z), tex: billboardTexture(cp) }
  }, [cp])
  return (
    <group position={position} rotation-y={rotationY} scale={1.5}>
      <mesh position={[0, 5, 0]} castShadow>
        <boxGeometry args={[8.4, 4.9, 0.3]} />
        <meshStandardMaterial color="#1c1c1f" />
      </mesh>
      <mesh position={[0, 5, 0.16]}>
        <planeGeometry args={[8, 4.5]} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
      <mesh position={[0, 1.3, 0]}>
        <boxGeometry args={[0.35, 2.6, 0.35]} />
        <meshStandardMaterial color="#888" />
      </mesh>
    </group>
  )
}

export default function Checkpoints() {
  return checkpoints.map((cp) => <Billboard key={cp.id} cp={cp} />)
}
