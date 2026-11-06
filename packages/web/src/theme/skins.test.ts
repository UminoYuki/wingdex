import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { parseTheme } from './skins.ts'

test('unknown theme falls back to forest so the previous night UI stays default', () => {
  assert.equal(parseTheme(null), 'forest')
  assert.equal(parseTheme(''), 'forest')
  assert.equal(parseTheme('pokemon'), 'forest')
  assert.equal(parseTheme('journal'), 'journal')
  assert.equal(parseTheme('obsidian'), 'obsidian')
})

test('theme stylesheet defines all three skins and the channel tokens tailwind reads', () => {
  const css = readFileSync(new URL('./tokens.css', import.meta.url), 'utf8')
  for (const name of ['journal', 'forest', 'obsidian']) {
    assert.match(css, new RegExp(`data-theme='${name}'`))
  }
  assert.match(css, /--c-ink-900:/)
  assert.match(css, /--c-line:/)
  assert.match(css, /--surface-recess:/)
})
