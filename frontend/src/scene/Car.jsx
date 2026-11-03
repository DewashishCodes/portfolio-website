import { useFrame, useThree } from '@react-three/fiber'
import { useRef } from 'react'
import { MathUtils, Vector3 } from 'three'
import { mapProgress } from '../lib/scrollMap'
import { frameAt, turnAt, TRACK_LENGTH } from '../lib/trackSpline'
import { useRace } from '../store/useRace'

const EYE = 1.0 // driver head height, metres
const LOOK_AHEAD = 0.004
const MAX_ROLL = MathUtils.degToRad(4)
const _look = new Vector3()

// Greybox driver's-eye rig. Phase 2 parents the cockpit model to this camera.
export default function Car() {
  const camera = useThree((s) => s.camera)
  const st = useRef({ t: null, roll: 0 }).current

  useFrame((_, dt) => {
    dt = Math.min(dt, 0.05)
    const { progress, active, lapMs } = useRace.getState()
    const target = mapProgress(progress).t
    const prev = st.t ?? target
    st.t = MathUtils.damp(prev, target, 4, dt)

    const { pos } = frameAt(st.t)
    camera.position.set(pos.x, EYE, pos.z)
    frameAt(st.t + LOOK_AHEAD, _look)
    camera.lookAt(_look.x, EYE - 0.1, _look.z)
    st.roll = MathUtils.damp(st.roll, MathUtils.clamp(turnAt(st.t) * 3, -MAX_ROLL, MAX_ROLL), 3, dt)
    camera.rotateZ(st.roll)

    const ms = (Math.abs(st.t - prev) * TRACK_LENGTH) / dt // metres per second
    const speed = 340 * (1 - Math.exp(-(ms * 3.6) / 250)) // soft cap at 340 km/h
    const moving = speed > 1
    const next = { t: st.t, speed: moving ? speed : 0, lapMs: lapMs + (moving ? dt * 1000 : 0) }
    const a = mapProgress(progress).active
    if (a !== active) next.active = a
    useRace.setState(next)
  })
  return null
}
