import { Canvas } from '@react-three/fiber'
import Car from './Car'
import Checkpoints from './Checkpoints'
import Track from './Track'

export default function Experience() {
  return (
    <Canvas
      className="!fixed inset-0"
      aria-hidden="true"
      camera={{ fov: 75, near: 0.1, far: 3000 }}
      dpr={[1, 2]}
      shadows
    >
      <color attach="background" args={['#c9b8a0']} />
      <fog attach="fog" args={['#c9b8a0', 150, 1400]} />
      <hemisphereLight args={['#fff1dc', '#5b6650', 0.9]} />
      <directionalLight position={[-300, 200, 200]} intensity={1.6} color="#ffd9a8" />
      <Track />
      <Checkpoints />
      <Car />
    </Canvas>
  )
}
