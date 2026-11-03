import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import { useRace } from '../store/useRace'
import Car from './Car'
import Checkpoints from './Checkpoints'
import Effects from './Effects'
import Environment from './Environment'
import SetPieces from './SetPieces'
import Track from './Track'

export default function Experience() {
  const quality = useRace((s) => s.quality)
  return (
    <Canvas
      className="!fixed inset-0"
      aria-hidden="true"
      camera={{ fov: 75, near: 0.05, far: 6000 }}
      dpr={quality === 'high' ? [1, 2] : quality === 'medium' ? 1.25 : 1}
      gl={{ antialias: quality === 'low', powerPreference: 'high-performance' }}
      shadows={quality === 'high' ? 'soft' : quality === 'medium'}
      onCreated={(s) => import.meta.env.DEV && (window.__three = s)}
    >
      <Suspense fallback={null}>
        <Environment />
        <Track />
        <SetPieces />
        <Checkpoints />
        <Car />
        {quality !== 'low' && <Effects full={quality === 'high'} />}
      </Suspense>
    </Canvas>
  )
}
