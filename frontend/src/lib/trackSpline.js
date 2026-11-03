import { CatmullRomCurve3, Vector3 } from 'three'

// Hand-drawn closed loop (x, z in metres), clockwise from the start/finish straight.
const RAW = [
  [0, 0], [250, 0], [420, -30], [480, -140], [420, -250], [480, -360], [620, -400],
  [700, -520], [600, -640], [420, -620], [300, -520], [160, -600], [0, -560],
  [-120, -440], [-80, -300], [-200, -200], [-160, -60],
]

export const TRACK_LENGTH = 3000
export const ROAD_WIDTH = 12

function build() {
  const pts = RAW.map(([x, z]) => new Vector3(x, 0, z))
  const c = new CatmullRomCurve3(pts, true, 'centripetal')
  const k = TRACK_LENGTH / c.getLength()
  pts.forEach((p) => p.multiplyScalar(k))
  const curve = new CatmullRomCurve3(pts, true, 'centripetal')
  curve.arcLengthDivisions = 4000
  curve.updateArcLengths()
  return curve
}

export const spline = build()

const UP = new Vector3(0, 1, 0)
const _a = new Vector3()
const _b = new Vector3()

const wrap = (t) => ((t % 1) + 1) % 1

// Signed curvature-ish value: positive = turning left. Used for roll, steering, billboard side.
export function turnAt(t, ahead = 0.004) {
  spline.getTangentAt(wrap(t), _a)
  spline.getTangentAt(wrap(t + ahead), _b)
  return _a.cross(_b).y / ahead / TRACK_LENGTH
}

export function frameAt(t, pos = new Vector3(), tan = new Vector3(), side = new Vector3()) {
  spline.getPointAt(wrap(t), pos)
  spline.getTangentAt(wrap(t), tan)
  side.crossVectors(tan, UP).normalize() // points to the driver's right
  return { pos, tan, side }
}

// +1 if the outside of the bend at t is the driver's right, -1 if left.
export const outsideSign = (t) => (turnAt(t) > 0 ? 1 : -1)

// World placement at track position t, `lateral` metres to the driver's right.
// rotY points local +z along the direction of travel; local -x is the driver's right.
export function place(t, lateral = 0) {
  const { pos, tan, side } = frameAt(t)
  pos.addScaledVector(side, lateral)
  return { position: [pos.x, 0, pos.z], rotY: Math.atan2(tan.x, tan.z) }
}

export { wrap }
