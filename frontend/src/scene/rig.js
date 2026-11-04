import { MathUtils, Object3D, Vector3 } from 'three'
import { checkpoints } from '../lib/scrollMap'
import { frameAt, outsideSign, TRACK_LENGTH, turnAt } from '../lib/trackSpline'

// Shared per-frame state the car writes and the camera rig, sun and blob shadow read.
// Mutable on purpose: it changes every frame and nothing re-renders from it.
export const rig = {
  car: new Object3D(), // world transform of the car body (yaw + lean), origin on the road
  t: 0,
  speed: 0, // km/h, physical (no readout floor)
  kerb: 0, // 0..1, how hard the car is cornering, drives shake
  shot: 'chase',
  eye: new Vector3(), // cockpit eye, car local metres
  rev: 0, // engine rev target while held on the grid (km/h equivalent)
  launchAt: -1e9, // performance.now() at lights out, for the launch shake
  nose: 2.6, // metres from car origin to the front wing tip, set from the model bounds
}

const m = (metres) => metres / TRACK_LENGTH
const _p = new Vector3()
const _q = new Vector3()
const _look = new Vector3()

// Shot spec from content.json: "chase" or { "shot": "trackside", "ahead": -14, "lateral": 9, "height": 1.3 }.
const spec = (cp) => (typeof cp?.camera === 'string' ? { shot: cp.camera } : cp?.camera ?? { shot: 'chase' })

// Which shot to hold right now. Travel segments are always chase; each dwell picks its own.
// key changes only when the camera must cut (two different trackside spots are two keys).
export function shotFor(active) {
  if (active < 0) return { key: 'chase', shot: 'chase' }
  const s = spec(checkpoints[active])
  const anchored = s.shot === 'trackside' || s.shot === 'heli'
  return { ...s, i: active, key: anchored ? `${s.shot}:${active}` : s.shot }
}

const FOV = { cockpit: 56, chase: 52, trackside: 30, heli: 36, 'onboard-rear': 62 }
const SPEED_FOV = { cockpit: 14, chase: 12, trackside: 0, heli: 0, 'onboard-rear': 6 } // added at full speed

// Writes the camera pose for a shot. `snap` skips damping (used right after a cut).
// Returns the fov the shot wants before speed and aspect adjustments.
export function poseCamera(camera, s, st, time, dt, snap) {
  const car = rig.car
  const k = snap ? 1 : 1 - Math.exp(-6 * dt)
  switch (s.shot) {
    case 'cockpit': {
      camera.position.copy(rig.eye)
      car.localToWorld(camera.position)
      camera.quaternion.copy(car.quaternion)
      camera.rotateY(Math.PI) // car local +z is forward, a camera looks down -z
      camera.rotateX(0.01)
      camera.rotateZ(st.roll * 0.6) // chassis gives 40% of the lean, the head the rest
      return FOV.cockpit
    }
    case 'trackside': {
      // Static camera near the apex, panning to follow the car.
      const t = checkpoints[s.i].trackT + m(s.ahead ?? -16)
      const side = (s.side ?? 1) * outsideSign(checkpoints[s.i].trackT)
      const { pos, side: right } = frameAt(t, _p)
      camera.position.copy(pos).addScaledVector(right, side * (s.lateral ?? 10.5))
      camera.position.y = s.height ?? 1.4
      _look.copy(car.position).setY(0.7)
      st.look.lerp(_look, snap ? 1 : k)
      camera.lookAt(st.look)
      return FOV.trackside
    }
    case 'heli': {
      // High, slow sway around the car, aimed `ahead` metres in front of it so the set piece shares the frame.
      // angle is in the car frame: 0 = in front, PI = behind.
      const a = (s.angle ?? 2.6) + Math.sin(time * 0.12) * 0.35 // sway around the framed angle; a full orbit loses the car on long dwells
      const r = s.radius ?? 24
      _q.set(0, 0, s.ahead ?? 0).applyQuaternion(car.quaternion).add(car.position)
      _p.set(Math.sin(a) * r, s.height ?? 9, Math.cos(a) * r).applyQuaternion(car.quaternion).add(car.position)
      if (snap) camera.position.copy(_p)
      else camera.position.lerp(_p, k)
      _q.y = 1
      if (snap) st.look.copy(_q)
      else st.look.lerp(_q, k)
      camera.lookAt(st.look)
      return FOV.heli
    }
    case 'onboard-rear': {
      // Nose camera looking back over the halo.
      camera.position.set(0, 1.0, rig.nose - 0.6) // high enough to clear the nose bodywork
      car.localToWorld(camera.position)
      _look.set(0, 0.9, -3)
      car.localToWorld(_look)
      camera.lookAt(_look)
      return FOV['onboard-rear']
    }
    default: {
      // Chase: on rails along the spline behind the car, so it swings through corners.
      const back = s.back ?? 8
      frameAt(rig.t - m(back), _p)
      _p.y = s.height ?? 2.5
      frameAt(rig.t + m(9), _q)
      _q.y = 0.2 // aim low so the car sits in the middle third, clear of the minimap
      if (snap) {
        camera.position.copy(_p)
        st.look.copy(_q)
      } else {
        camera.position.lerp(_p, 1 - Math.exp(-12 * dt))
        st.look.lerp(_q, 1 - Math.exp(-12 * dt))
      }
      camera.lookAt(st.look)
      return FOV.chase
    }
  }
}

export const speedFov = (shot) => SPEED_FOV[shot] ?? 0

// 0..1 kerb factor at t: corner sharpness past the kerb threshold.
export const kerbAt = (t) => MathUtils.clamp((Math.abs(turnAt(t)) - 1 / 150) * 120, 0, 1)
