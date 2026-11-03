import { useGLTF } from '@react-three/drei'
import { createPortal, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { CanvasTexture, Group, MathUtils, Mesh, MeshBasicMaterial, MeshStandardMaterial, PlaneGeometry, Quaternion, SRGBColorSpace, Vector3 } from 'three'
import { mapProgress } from '../lib/scrollMap'
import { frameAt, TRACK_LENGTH, turnAt } from '../lib/trackSpline'
import { useRace } from '../store/useRace'

// Model space: Y up, nose toward +Z, 1 unit = 0.0148 m (RootNode cm x Sketchfab 1.48).
const SCALE = 0.8 // the model is ~25% oversize (2.5 m wide); 0.8 gives a real ~2 m car
const U = 0.0148 * SCALE
const WHEEL = new Vector3(0, 62.86, 50.4) // steering wheel centre, model units
const TYRE_R = 26.1 * U
const RIDE = 9.17 * U // tyre bottom above model origin
// PRD says 0.55 m behind / 0.32 m above; 0.13 m above keeps the halo hoop at the top of the frame instead of mid-screen.
const EYE = new Vector3(0, WHEEL.y * U + 0.13, WHEEL.z * U - 0.5)
const EYE_HEIGHT = EYE.y - RIDE

const LOOK_AHEAD = 0.004
const MAX_ROLL = MathUtils.degToRad(4)
const X = new Vector3(1, 0, 0)
const Y = new Vector3(0, 1, 0)
const _look = new Vector3()
const _q1 = new Quaternion()
const _q2 = new Quaternion()

const gear = (kmh) => (kmh < 2 ? 'N' : String(Math.min(8, 1 + Math.floor(kmh / 42))))
const lapStr = (ms) => `${Math.floor(ms / 60000)}:${String(Math.floor((ms % 60000) / 1000)).padStart(2, '0')}`

function useCockpit() {
  const { scene } = useGLTF('/models/car.glb')
  return useMemo(() => {
    const root = scene.getObjectByName('RootNode')
    const rubber = new MeshStandardMaterial({ color: '#0e0e0e', roughness: 0.8 }) // plain sidewalls, no decal text
    scene.traverse((o) => {
      if (!o.isMesh) return
      o.castShadow = o.receiveShadow = true
      if (o.name.startsWith('Tire')) o.material = rubber
    })
    scene.updateMatrixWorld(true)

    const front = root.children.filter((n) => /^(Tire|Rim)/.test(n.name) && n.position.z > 0)
    const wheels = front.map((n) => ({ node: n, base: n.quaternion.clone() }))

    const pivot = new Group()
    pivot.position.copy(WHEEL)
    root.add(pivot)
    pivot.updateMatrixWorld(true)
    for (const name of ['Steering Wheel', 'Gears', 'Its for something', 'Car Button', 'Buttons', 'Grip Button']) {
      const n = root.children.find((c) => c.name === name)
      if (n) pivot.attach(n)
    }

    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 96
    const tex = new CanvasTexture(canvas)
    tex.colorSpace = SRGBColorSpace
    const dash = new Mesh(new PlaneGeometry(9, 3.4), new MeshBasicMaterial({ map: tex, toneMapped: false }))
    dash.position.set(0, 1.6, -8.2)
    dash.rotation.y = Math.PI
    pivot.add(dash)

    return { scene, pivot, wheels, dash: { ctx: canvas.getContext('2d'), tex } }
  }, [scene])
}

function drawDash({ ctx, tex }, speed, lapMs) {
  ctx.fillStyle = '#050505'
  ctx.fillRect(0, 0, 256, 96)
  ctx.fillStyle = '#E86A1F'
  ctx.font = 'bold 64px monospace'
  ctx.textAlign = 'center'
  ctx.fillText(gear(speed), 128, 70)
  ctx.font = 'bold 30px monospace'
  ctx.fillStyle = '#F2E8D5'
  ctx.textAlign = 'left'
  ctx.fillText(String(Math.round(speed)), 10, 40)
  ctx.font = '16px monospace'
  ctx.fillText('KM/H', 10, 62)
  ctx.textAlign = 'right'
  ctx.font = 'bold 22px monospace'
  ctx.fillText(lapStr(lapMs), 246, 40)
  ctx.font = '16px monospace'
  ctx.fillText('LAP 1', 246, 62)
  const rpm = Math.min(1, speed / 340)
  for (let i = 0; i < 12; i++) {
    ctx.fillStyle = i / 12 < rpm ? (i < 8 ? '#3ad16b' : i < 10 ? '#E86A1F' : '#C4161C') : '#222'
    ctx.fillRect(16 + i * 19.5, 80, 15, 10)
  }
  tex.needsUpdate = true
}

export default function Car() {
  const camera = useThree((s) => s.camera)
  const scene = useThree((s) => s.scene)
  const car = useCockpit()
  const st = useRef({ t: null, roll: 0, fov: 75, spin: 0, dashAt: 0 }).current

  useEffect(() => {
    scene.add(camera) // the cockpit is portalled into the camera, so the camera must be in the scene
    return () => scene.remove(camera)
  }, [scene, camera])

  useFrame((state, dt) => {
    dt = Math.min(dt, 0.05)
    const { progress, active, lapMs } = useRace.getState()
    const target = mapProgress(progress).t
    const prev = st.t ?? target
    st.t = MathUtils.damp(prev, target, 4, dt)

    const dist = (st.t - prev) * TRACK_LENGTH
    const ms = Math.abs(dist) / dt
    const speed = 340 * (1 - Math.exp(-(ms * 3.6) / 250)) // soft cap at 340 km/h
    const k = turnAt(st.t)

    const { pos } = frameAt(st.t)
    camera.position.set(pos.x, EYE_HEIGHT, pos.z)
    frameAt(st.t + LOOK_AHEAD, _look)
    camera.lookAt(_look.x, EYE_HEIGHT + 0.1, _look.z)
    st.roll = MathUtils.damp(st.roll, MathUtils.clamp(k * 3, -MAX_ROLL, MAX_ROLL), 3, dt)
    camera.rotateZ(st.roll)
    // Road buzz: a hair of pitch jitter that grows with speed.
    camera.rotateX((Math.random() - 0.5) * 0.0016 * (speed / 340))

    // Narrow FOV when braking into a checkpoint, wide on the straights.
    st.fov = MathUtils.damp(st.fov, 65 + 10 * Math.min(1, speed / 220), 3, dt)
    if (Math.abs(camera.fov - st.fov) > 0.01) {
      camera.fov = st.fov
      camera.updateProjectionMatrix()
    }

    const steer = MathUtils.clamp(k * 12, -0.35, 0.35)
    car.pivot.rotation.z = -steer * 4 // wheel turns ~4x the road-wheel angle
    st.spin += dist / TYRE_R
    _q1.setFromAxisAngle(Y, steer)
    _q2.setFromAxisAngle(X, st.spin)
    for (const w of car.wheels) w.node.quaternion.copy(_q1).multiply(_q2).multiply(w.base)

    const moving = speed > 1
    const next = { t: st.t, speed: moving ? speed : 0, lapMs: lapMs + (moving ? dt * 1000 : 0) }
    const a = mapProgress(progress).active
    if (a !== active) next.active = a
    useRace.setState(next)

    if (state.clock.elapsedTime - st.dashAt > 0.1) {
      st.dashAt = state.clock.elapsedTime
      drawDash(car.dash, next.speed, next.lapMs)
    }
  })

  return createPortal(
    <group position={[-EYE.x, -EYE.y, EYE.z]} rotation-y={Math.PI} scale={SCALE}>
      <primitive object={car.scene} />
    </group>,
    camera,
  )
}

useGLTF.preload('/models/car.glb')
