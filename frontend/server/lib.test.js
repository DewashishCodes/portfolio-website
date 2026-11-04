// node server/lib.test.js
import assert from 'node:assert/strict'
import { streaks } from './lib.js'

const d = (date, count) => ({ date, count })
const days = [d('2026-11-01', 1), d('2026-11-02', 0), d('2026-11-03', 2), d('2026-11-04', 3), d('2026-11-05', 0)]
assert.deepEqual(streaks(days, '2026-11-04'), [2, 2])
// Today still empty: the streak ending yesterday still counts.
assert.deepEqual(streaks([...days.slice(0, 4), d('2026-11-05', 0)], '2026-11-05'), [2, 2])
assert.deepEqual(streaks([d('2026-11-04', 0), d('2026-11-05', 0)], '2026-11-05'), [0, 0])
assert.deepEqual(streaks([], '2026-11-05'), [0, 0])
console.log('ok')
