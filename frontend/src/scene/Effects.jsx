import { useFrame } from '@react-three/fiber'
import { Bloom, BrightnessContrast, ChromaticAberration, EffectComposer, HueSaturation, Noise, SMAA, ToneMapping, Vignette } from '@react-three/postprocessing'
import { BlendFunction, ToneMappingMode } from 'postprocessing'
import { useRef } from 'react'
import { rig } from './rig'

// Medium and High. Bloom threshold is high so only the sun disc, brake lights and saffron emissives glow.
// The warm grade (a touch more saturation and contrast) keeps the golden hour from washing out under AgX.
export default function Effects({ full = true }) {
  const ca = useRef()
  useFrame(() => {
    const s = rig.speed / 340
    ca.current?.offset.set(0.0012 * s * s, 0.0006 * s * s)
  })
  return (
    <EffectComposer multisampling={0}>
      <Bloom luminanceThreshold={0.92} luminanceSmoothing={0.1} intensity={0.55} mipmapBlur />
      {full && <ChromaticAberration ref={ca} radialModulation modulationOffset={0.3} />}
      <ToneMapping mode={ToneMappingMode.AGX} />
      <HueSaturation saturation={0.14} />
      <BrightnessContrast contrast={0.06} />
      <Vignette offset={0.32} darkness={full ? 0.55 : 0.45} />
      {full && <Noise opacity={0.03} blendFunction={BlendFunction.OVERLAY} />}
      <SMAA />
    </EffectComposer>
  )
}
