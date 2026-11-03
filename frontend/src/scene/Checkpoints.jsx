import { useMemo } from 'react'
import { CanvasTexture, SRGBColorSpace, Vector3 } from 'three'
import { checkpoints } from '../lib/scrollMap'
import { frameAt, turnAt, TRACK_LENGTH } from '../lib/trackSpline'

const W = 1024
const H = 576 // 16:9, matches the 1600x900 project media

function wrapText(g, text, x, y, maxW, lineH) {
  let line = ''
  for (const w of text.split(' ')) {
    if (line && g.measureText(line + w).width > maxW) {
      g.fillText(line, x, y)
      line = ''
      y += lineH
    }
    line += w + ' '
  }
  g.fillText(line, x, y)
}

// Billboard face: project media with a title strip, or a big title card for other checkpoints.
function billboardTexture({ label, title, media }) {
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const g = c.getContext('2d')
  const tex = new CanvasTexture(c)
  tex.colorSpace = SRGBColorSpace
  tex.anisotropy = 8

  const strip = () => {
    g.fillStyle = 'rgba(20,20,22,0.92)'
    g.fillRect(0, H - 120, W, 120)
    g.fillStyle = '#E86A1F'
    g.fillRect(0, H - 120, W, 8)
    g.font = 'bold 40px system-ui, sans-serif'
    g.fillText(label, 36, H - 52)
    const x = 36 + g.measureText(label).width + 40
    g.fillStyle = '#F2E8D5'
    g.font = 'bold 52px system-ui, sans-serif'
    g.fillText(title, x, H - 50, W - x - 36)
    tex.needsUpdate = true
  }

  g.fillStyle = '#141416'
  g.fillRect(0, 0, W, H)
  if (media) {
    const img = new Image()
    img.onload = () => {
      g.drawImage(img, 0, 0, W, H)
      strip()
    }
    img.src = media
    strip() // shown until the image arrives
  } else {
    g.fillStyle = '#E86A1F'
    g.fillRect(0, 0, W, 24)
    g.font = 'bold 76px system-ui, sans-serif'
    g.fillText(label, 56, 160)
    g.fillStyle = '#F2E8D5'
    g.font = 'bold 96px system-ui, sans-serif'
    wrapText(g, title, 56, 300, W - 112, 112)
  }
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
