import { useFrame } from '@react-three/fiber'
import { useMemo, useRef, useState } from 'react'
import { CanvasTexture, SRGBColorSpace } from 'three'
import content from '../content/content.json'
import { boardsFound, findBoard } from '../lib/achievements'
import { checkpoints } from '../lib/scrollMap'
import { place, TRACK_LENGTH } from '../lib/trackSpline'

const m = (metres) => metres / TRACK_LENGTH
const { colors } = content.livery

// A crew pit board: black slate, saffron frame, the checkpoint number. Small and off the racing line on purpose.
function boardTexture(n) {
  const c = document.createElement('canvas')
  c.width = 128
  c.height = 96
  const g = c.getContext('2d')
  g.fillStyle = colors.accent ?? '#E86A1F'
  g.fillRect(0, 0, 128, 96)
  g.fillStyle = '#0b0b0c'
  g.fillRect(8, 8, 112, 80)
  g.fillStyle = '#F2E8D5'
  g.font = 'bold 30px ui-monospace, monospace'
  g.textAlign = 'center'
  g.fillText('P' + String(n).padStart(2, '0'), 64, 46)
  g.fillStyle = colors.accent ?? '#E86A1F'
  g.font = 'bold 20px ui-monospace, monospace'
  g.fillText('BOX?', 64, 74)
  const t = new CanvasTexture(c)
  t.colorSpace = SRGBColorSpace
  return t
}

// Clicks that land on HUD controls or panels are not meant for the world.
const onHud = (e) => e.nativeEvent?.target?.closest?.('button, a, input, textarea, article, section, nav, [role="dialog"]')

function Board({ i, cp }) {
  const [gone, setGone] = useState(() => boardsFound().has(i))
  const [hover, setHover] = useState(false)
  const g = useRef()
  const spec = useMemo(() => {
    // Per-checkpoint override in content.json ("hidden": { "ahead": 20, "lateral": -10 }), else a varied default
    // just past the road edge, 12-26 m ahead of the stop, alternating sides.
    const h = cp.hidden ?? {}
    const ahead = h.ahead ?? 12 + ((i * 7) % 15)
    const lateral = h.lateral ?? (i % 2 ? -1 : 1) * (8.5 + ((i * 3) % 5))
    const { position, rotY } = place(cp.trackT + m(ahead), lateral)
    return { position, rotY: rotY + Math.PI, tex: boardTexture(i + 1) }
  }, [i, cp])
  useFrame(({ clock }) => {
    if (!g.current) return
    const k = clock.elapsedTime * 2 + i
    g.current.rotation.y = spec.rotY + Math.sin(k * 0.6) * 0.25 // a crew member waving it, so it catches the eye
    g.current.position.y = 0.05 * Math.sin(k)
  })
  if (gone) return null
  return (
    <group position={spec.position}>
      <group ref={g}>
        <mesh position={[0, 0.65, 0]}>
          <cylinderGeometry args={[0.025, 0.025, 1.3, 6]} />
          <meshStandardMaterial color="#9a9a9a" />
        </mesh>
        <mesh position={[0, 1.45, 0]} scale={hover ? 1.15 : 1}
          onClick={(e) => {
            if (onHud(e)) return
            e.stopPropagation()
            document.body.style.cursor = ''
            setGone(true)
            findBoard(i)
          }}
          onPointerOver={(e) => { if (!onHud(e)) { setHover(true); document.body.style.cursor = 'pointer' } }}
          onPointerOut={() => { setHover(false); document.body.style.cursor = '' }}>
          <planeGeometry args={[0.9, 0.68]} />
          <meshBasicMaterial map={spec.tex} toneMapped={false} side={2} />
        </mesh>
      </group>
    </group>
  )
}

export default function HiddenBoards() {
  return checkpoints.map((cp, i) => <Board key={cp.id} i={i} cp={cp} />)
}
