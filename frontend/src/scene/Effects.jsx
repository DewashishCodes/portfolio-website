import { useFrame } from '@react-three/fiber'
import { Bloom, ChromaticAberration, EffectComposer, Noise, SMAA, ToneMapping, Vignette } from '@react-three/postprocessing'
import { BlendFunction, ToneMappingMode } from 'postprocessing'
import { useRef } from 'react'
import { useRace } from '../store/useRace'

// shortcut: no radial blur (postprocessing has none built in); speed feel comes from FOV + aberration. Add a custom pass in Phase 6 if needed.
export default function Effects({ full = true }) {
  const ca = useRef()
  useFrame(() => {
    const s = useRace.getState().speed / 340
    ca.current?.offset.set(0.0012 * s * s, 0.0006 * s * s)
  })
  return (
    <EffectComposer multisampling={0}>
      <Bloom luminanceThreshold={0.9} intensity={0.4} mipmapBlur />
      {full && <ChromaticAberration ref={ca} radialModulation modulationOffset={0.3} />}
      {full && <Vignette offset={0.3} darkness={0.55} />}
      {full && <Noise opacity={0.035} blendFunction={BlendFunction.OVERLAY} />}
      <ToneMapping mode={ToneMappingMode.AGX} />
      <SMAA />
    </EffectComposer>
  )
}
