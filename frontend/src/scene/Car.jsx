import { useGLTF } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { Box3, CanvasTexture, Group, MathUtils, Mesh, MeshBasicMaterial, MeshStandardMaterial, PlaneGeometry, Quaternion, SRGBColorSpace, Vector3 } from 'three'
import content from '../content/content.json'
import { engine } from '../lib/audio'
import { FINISH_T, mapProgress } from '../lib/scrollMap'
import { frameAt, TRACK_LENGTH, turnAt } from '../lib/trackSpline'
import { radio, useRace } from '../store/useRace'
import { kerbAt, poseCamera, rig, shotFor, speedFov } from './rig'

// Model space: Y up, nose toward +Z, 1 unit = 0.0148 m (RootNode cm x Sketchfab 1.48).
const SCALE = 0.8 // the model is ~25% oversize (2.5 m wide); 0.8 gives a real ~2 m car
const U = 0.0148 * SCALE
const WHEEL = new Vector3(0, 62.86, 50.4) // steering wheel centre, model units
const TYRE_R = 26.1 * U
const RIDE = 9.17 * U // tyre bottom above model origin
// 0.13 m above the wheel keeps the halo hoop at the top of the frame instead of mid-screen.
const EYE = new Vector3(0, WHEEL.y * U + 0.13 - RIDE, WHEEL.z * U - 0.5) // car local, origin on the road
rig.eye.copy(EYE)

const LOOK_AHEAD = 0.004
const MAX_ROLL = MathUtils.degToRad(4)
const READOUT_FLOOR = 40 // km/h shown while the visitor is scrolling, so a dwell never reads as parked
const CUT_BLACK = 0.09 // s of black before the new shot appears
const CUT_HOLD = 0.7 // s a shot must hold before the next cut, so dithering on a dwell edge cannot strobe
const LAUNCH_SHAKE = 700 // ms of camera shake after lights out
const X = new Vector3(1, 0, 0)
const Y = new Vector3(0, 1, 0)
const _look = new Vector3()
const _q1 = new Quaternion()
const _q2 = new Quaternion()

const gear = (kmh) => (kmh < 2 ? 'N' : String(Math.min(8, 1 + Math.floor(kmh / 42))))
const lapStr = (ms) => `${Math.floor(ms / 60000)}:${String(Math.floor((ms % 60000) / 1000)).padStart(2, '0')}`

function useCar() {
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
    rig.nose = new Box3().setFromObject(scene).max.z * SCALE

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

// Soft dark ellipse under the car: the contact shadow on every tier, including Low where shadow maps are off.
function blobTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const g = c.getContext('2d')
  const grad = g.createRadialGradient(64, 64, 8, 64, 64, 64)
  grad.addColorStop(0, 'rgba(0,0,0,0.75)')
  grad.addColorStop(0.55, 'rgba(0,0,0,0.45)')
  grad.addColorStop(1, 'rgba(0,0,0,0)')
  g.fillStyle = grad
  g.fillRect(0, 0, 128, 128)
  return new CanvasTexture(c)
}

// Driver helmet in the livery, only seen from outside the car.
function Helmet({ visible }) {
  const { colors } = content.livery
  return (
    <group position={[0, EYE.y - 0.06, EYE.z - 0.12]} visible={visible}>
      <mesh castShadow>
        <sphereGeometry args={[0.15, 20, 14]} />
        <meshStandardMaterial color={colors.body ?? '#C4161C'} roughness={0.25} metalness={0.2} />
      </mesh>
      <mesh rotation-x={Math.PI / 2} position={[0, 0.02, 0]}>
        <torusGeometry args={[0.152, 0.018, 8, 24]} />
        <meshStandardMaterial color={colors.accent ?? '#E86A1F'} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.0, 0.09]} scale={[1, 0.45, 0.7]}>
        <sphereGeometry args={[0.13, 16, 10]} />
        <meshStandardMaterial color="#0a0a0c" roughness={0.05} metalness={0.6} />
      </mesh>
    </group>
  )
}

export default function Car() {
  const camera = useThree((s) => s.camera)
  const car = useCar()
  const body = useRef()
  const blob = useMemo(blobTexture, [])
  const st = useRef({ t: null, roll: 0, fov: 60, spin: 0, dashAt: 0, look: new Vector3(), shot: null, cutAt: -9, pending: null, film: 0, outside: true }).current
  const helmet = useRef()

  useFrame((state, dt) => {
    const realDt = dt < 1 ? dt : 0 // the lap clock uses real time; a long gap means the tab was hidden, so it pauses
    dt = Math.min(dt, 0.05)
    const time = state.clock.elapsedTime
    const { progress, active, lapMs, lightsOut, lightsOutAt, finishedAt, scrolledAt } = useRace.getState()
    const target = mapProgress(progress).t
    const prev = st.t ?? target
    st.t = MathUtils.damp(prev, target, 4, dt)

    const dist = (st.t - prev) * TRACK_LENGTH
    const ms = Math.abs(dist) / dt
    const speed = 340 * (1 - Math.exp(-(ms * 3.6) / 250)) // soft cap at 340 km/h
    const k = turnAt(st.t)

    // Car body: on the road, nose toward the look-ahead point, a little lean into the corner.
    const { pos } = frameAt(st.t)
    frameAt(st.t + LOOK_AHEAD, _look)
    st.roll = MathUtils.damp(st.roll, MathUtils.clamp(k * 3, -MAX_ROLL, MAX_ROLL), 3, dt)
    const g = body.current
    g.position.set(pos.x, 0, pos.z)
    g.rotation.set(0, Math.atan2(_look.x - pos.x, _look.z - pos.z), -st.roll * 0.4, 'YXZ')
    g.updateMatrixWorld()
    rig.car.position.copy(g.position)
    rig.car.quaternion.copy(g.quaternion)
    rig.car.updateMatrixWorld()
    rig.t = st.t
    rig.speed = speed
    rig.kerb = kerbAt(st.t)

    const steer = MathUtils.clamp(k * 12, -0.35, 0.35)
    car.pivot.rotation.z = -steer * 4 // wheel turns ~4x the road-wheel angle
    st.spin += dist / TYRE_R
    _q1.setFromAxisAngle(Y, steer)
    _q2.setFromAxisAngle(X, st.spin)
    for (const w of car.wheels) w.node.quaternion.copy(_q1).multiply(_q2).multiply(w.base)

    // Camera: hold the current shot, cut (never lerp) to a new one through a few frames of black.
    const want = shotFor(active)
    const cut = document.getElementById('cut')
    if (!st.shot) st.shot = want
    else if (!st.pending && want.key !== st.shot.key && time - st.cutAt > CUT_HOLD) {
      st.pending = want
      st.cutAt = time
      if (cut) cut.style.opacity = '1'
    }
    let snap = !st.posed
    if (st.pending && time - st.cutAt >= CUT_BLACK) {
      st.shotAt = time
      st.shot = st.pending
      st.pending = null
      snap = true
      if (cut) cut.style.opacity = '0'
    }
    st.posed = true
    rig.shot = st.shot.shot
    const base = poseCamera(camera, st.shot, st, time - (st.shotAt ?? 0), dt, snap) // time since the cut, so orbits start where framed

    // Speed feel: wider FOV with speed, shake that grows with speed and spikes on kerbs.
    const sp = Math.min(1, speed / 220)
    const portrait = camera.aspect < 1 ? 22 : 0
    st.fov = snap ? base + portrait : MathUtils.damp(st.fov, base + portrait + speedFov(st.shot.shot) * sp, 3, dt)
    const mounted = st.shot.shot === 'cockpit' || st.shot.shot === 'onboard-rear' || st.shot.shot === 'chase'
    const launch = Math.max(0, 1 - (performance.now() - rig.launchAt) / LAUNCH_SHAKE)
    const shake = (mounted ? 1 : 0.15) * ((speed / 340) * (0.0012 + rig.kerb * 0.0045) + launch * launch * 0.01)
    camera.rotateX((Math.random() - 0.5) * shake + Math.sin(time * 23) * shake * 0.4)
    camera.rotateY(Math.sin(time * 17.3) * shake * 0.3)

    // Panel open on a wide screen: slide the frame so the subject sits in the space left of it.
    const panel = active >= 0 && innerWidth >= 640 && camera.aspect >= 1 && st.shot.shot !== 'cockpit'
    const frac = panel ? 218 / innerWidth : 0
    const film = 70 * frac * Math.tan(MathUtils.degToRad(st.fov) * camera.aspect / 2)
    st.film = snap ? film : MathUtils.damp(st.film, film, 4, dt)
    if (Math.abs(camera.fov - st.fov) > 0.01 || Math.abs(camera.filmOffset - st.film) > 0.001) {
      camera.fov = st.fov
      camera.filmOffset = st.film
      camera.updateProjectionMatrix()
    }

    const outside = st.shot.shot !== 'cockpit'
    if (outside !== st.outside) {
      st.outside = outside
      helmet.current.visible = outside
    }

    const scrolling = lightsOut && performance.now() - scrolledAt < 1200
    const readout = scrolling ? Math.max(READOUT_FLOOR, speed) : speed > 1 ? speed : 0
    const next = { t: st.t, speed: readout }
    if (lightsOutAt && !finishedAt) next.lapMs = lapMs + realDt * 1000
    if (!finishedAt && lightsOut && st.t >= FINISH_T) {
      next.finishedAt = performance.now()
      next.confetti = useRace.getState().confetti + 1
      radio(lightsOutAt ? 'Chequered flag! What a lap.' : 'Chequered flag! Took the pit lane shortcut, I saw.', 'suit', 'laugh')
    }
    engine(Math.max(speed, rig.rev))
    const a = mapProgress(progress).active
    if (a !== active) next.active = a
    useRace.setState(next)

    if (time - st.dashAt > 0.1) {
      st.dashAt = time
      drawDash(car.dash, readout, next.lapMs)
    }
  })

  return (
    <group ref={body}>
      <group position-y={-RIDE} scale={SCALE}>
        <primitive object={car.scene} />
      </group>
      <group ref={helmet}><Helmet visible /></group>
      <mesh rotation-x={-Math.PI / 2} position-y={0.03} renderOrder={1}>
        <planeGeometry args={[2.6, 6.2]} />
        <meshBasicMaterial map={blob} transparent depthWrite={false} toneMapped={false} polygonOffset polygonOffsetFactor={-2} />
      </mesh>
    </group>
  )
}

useGLTF.preload('/models/car.glb')
