import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import {
  habitatVisual,
  lensCaption,
  parseBackSkin,
  parseCardSkin,
  parseDeckView,
  scrollBeadCount,
  showsFoil,
} from './cardSkin.ts'

test('skin ids outside the three fronts fall back to the atlas card', () => {
  assert.equal(parseCardSkin('yugioh'), 'atlas')
  assert.equal(parseCardSkin('field'), 'field')
  assert.equal(parseCardSkin('scroll'), 'scroll')
  assert.equal(parseBackSkin('pokemon'), 'archive')
  assert.equal(parseBackSkin('lens'), 'lens')
  assert.equal(parseDeckView('coverflow'), 'wall')
  assert.equal(parseDeckView('binder'), 'binder')
})

test('habitat colors stay on the eight Wingdex attributes', () => {
  assert.equal(habitatVisual('林').pip, habitatVisual(null).pip)
  assert.notEqual(habitatVisual('海').pip, habitatVisual('夜').pip)
  assert.equal(habitatVisual('都').ink.length > 0, true)
})

test('scroll beads cap at five and high star counts fold in half', () => {
  assert.equal(scrollBeadCount(1), 1)
  assert.equal(scrollBeadCount(4), 4)
  assert.equal(scrollBeadCount(8), 4)
  assert.equal(scrollBeadCount(12), 5)
  assert.equal(scrollBeadCount(Number.NaN), 4)
})

test('foil follows rarity without inventing a commercial stamp', () => {
  assert.equal(showsFoil('N', false), false)
  assert.equal(showsFoil('R', false), false)
  assert.equal(showsFoil('SR', false), true)
  assert.equal(showsFoil('N', true), true)
  assert.equal(showsFoil('传说', false), true)
})

test('lens caption prefers the real lens name and otherwise builds one from EXIF', () => {
  assert.equal(lensCaption({ lens: 'FE 200-600' }), 'FE 200-600')
  assert.equal(lensCaption({ focalLength: 600, aperture: 'f/4' }), '600mm F/4 ED')
  assert.match(lensCaption(null), /600mm/)
})

test('print and reduced-motion rules flatten tilt, glare and lens spin', () => {
  const css = readFileSync(new URL('./card-skins.css', import.meta.url), 'utf8')
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/)
  assert.match(css, /@media print/)
  assert.match(css, /html\[data-flat-cards\]/)
  assert.match(css, /\.wd-tilt-inner/)
  assert.doesNotMatch(css, /Pokémon|Yu-Gi-Oh|KONAMI|三国杀/)
})
