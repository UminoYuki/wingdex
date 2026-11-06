import assert from 'node:assert/strict'
import test from 'node:test'
import { parsePrefs } from './prefsStore.ts'

test('prefs ignore unknown skin names and keep a hinted theme', () => {
  const prefs = parsePrefs({ theme: 'nope', cardSkin: 'pokemon', backSkin: 'lens', deckView: 'stage' }, 'journal')
  assert.equal(prefs.theme, 'journal')
  assert.equal(prefs.cardSkin, 'atlas')
  assert.equal(prefs.backSkin, 'lens')
  assert.equal(prefs.deckView, 'stage')
})

test('a stored theme wins over the hint', () => {
  const prefs = parsePrefs({ theme: 'obsidian' }, 'forest')
  assert.equal(prefs.theme, 'obsidian')
})
