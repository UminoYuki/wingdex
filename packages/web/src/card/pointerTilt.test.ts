import assert from 'node:assert/strict'
import test from 'node:test'
import { pointerTilt, REST_TILT, shuffleItems } from './pointerTilt.ts'

const box = { left: 0, top: 0, width: 100, height: 200, maxTilt: 10, reducedMotion: false }

test('center of the card does not tilt and parks the glare in the middle', () => {
  const sample = pointerTilt({ ...box, clientX: 50, clientY: 100 })
  assert.equal(sample.rx, 0)
  assert.equal(sample.ry, 0)
  assert.equal(sample.glareX, 50)
  assert.equal(sample.glareY, 50)
  assert.equal(sample.active, true)
})

test('pointer at the right edge yaws, pointer at the bottom pitches the opposite way', () => {
  const right = pointerTilt({ ...box, clientX: 100, clientY: 100 })
  assert.equal(right.ry, 10)
  assert.equal(right.rx, 0)
  const bottom = pointerTilt({ ...box, clientX: 50, clientY: 200 })
  assert.equal(bottom.rx, -10)
  assert.equal(bottom.glareY, 100)
})

test('reduced motion and a zero-size box leave the card flat', () => {
  assert.deepEqual(pointerTilt({ ...box, clientX: 0, clientY: 0, reducedMotion: true }), REST_TILT)
  assert.deepEqual(pointerTilt({ ...box, clientX: 10, clientY: 10, width: 0 }), REST_TILT)
})

test('glare can still be active when tilt is disabled for the drag viewer', () => {
  const sample = pointerTilt({ ...box, clientX: 0, clientY: 0, maxTilt: 0 })
  assert.equal(sample.rx, 0)
  assert.equal(sample.ry, 0)
  assert.equal(sample.active, true)
  assert.equal(sample.glareX, 0)
})

test('shuffle is a permutation and honors the injected random source', () => {
  const values = [1, 2, 3, 4]
  let n = 0
  const random = () => {
    n += 1
    return n % 2 === 0 ? 0 : 0.99
  }
  const next = shuffleItems(values, random)
  assert.deepEqual([...next].sort((a, b) => a - b), values)
  assert.notDeepEqual(next, values)
  assert.deepEqual(values, [1, 2, 3, 4])
})
