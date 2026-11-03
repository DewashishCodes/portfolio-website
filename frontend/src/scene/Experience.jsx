import { AdaptiveDpr, PerformanceMonitor } from '@react-three/drei'
import { Canvas, useThree } from '@react-three/fiber'
import { Suspense } from 'react'
import { maxTier, TIERS } from '../lib/quality'
import { useRace } from '../store/useRace'
import Car from './Car'
import Checkpoints from './Checkpoints'
import Effects from './Effects'
import Environment from './Environment'
import SetPieces from './SetPieces'
import Track from './Track'

const DPR = { high: [1, 2], medium: 1.25, low: 1 }

// Steps the tier down when fps sags and back up (never above the device cap) when it recovers.
function AutoQuality() {
  const regress = useThree((s) => s.performance.regress)
  const step = (d) => {
    const { quality, qualityAuto } = useRace.getState()
    if (!qualityAuto) return
    const i = Math.min(Math.max(TIERS.indexOf(quality) + d, 0), TIERS.indexOf(maxTier))
    useRace.setState({ quality: TIERS[i] })
  }
  return (
    <PerformanceMonitor bounds={() => [45, 58]} flipflops={3}
      onDecline={() => { regress(); step(-1) }} onIncline={() => step(1)}
      onFallback={() => useRace.getState().qualityAuto && useRace.setState({ quality: 'low' })} />
  )
}

export default function Experience() {
  const quality = useRace((s) => s.quality)
  return (
    <Canvas
      className="!fixed inset-0"
      aria-hidden="true"
      camera={{ fov: 75, near: 0.05, far: 6000 }}
      dpr={DPR[quality]}
      performance={{ min: 0.6 }}
      gl={{ antialias: quality === 'low', powerPreference: 'high-performance' }}
      shadows={quality === 'high' ? 'soft' : quality === 'medium'}
      onCreated={(s) => import.meta.env.DEV && (window.__three = s)}
    >
      <AutoQuality />
      <AdaptiveDpr pixelated />
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
