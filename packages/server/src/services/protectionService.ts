import {
  GENUS_RULES,
  ORDER_RULES,
  PROTECTED_BIRDS,
  PROTECTED_MAMMALS,
  SANYOU_EXCLUDE,
  levelToText,
  type Entry,
  type Level,
} from '../data/cnProtection'
import type { ProtectionLevel } from '../types'

export interface ProtectionInput {
  cnName?: string | null
  scientificName?: string | null
  genusName?: string | null
  orderName?: string | null
  group?: string | null
  aliases?: string[]
}

export interface ProtectionResult {
  level: ProtectionLevel
  source: string
  isSanyou: boolean
  matchedName: string | null
}

const ALL: Entry[] = [...PROTECTED_BIRDS, ...PROTECTED_MAMMALS]
const BY_SCI = new Map<string, Entry>()
const BY_CN = new Map<string, Entry>()

for (const entry of ALL) {
  BY_SCI.set(entry[1].toLowerCase(), entry)
  if (!BY_CN.has(entry[0])) BY_CN.set(entry[0], entry)
}

function pick(entry: Entry, source: string): ProtectionResult {
  return {
    level: levelToText(entry[2]),
    source,
    isSanyou: false,
    matchedName: entry[0],
  }
}

export function matchProtection(input: ProtectionInput): ProtectionResult {
  const sci = (input.scientificName ?? '').trim().toLowerCase()
  if (sci) {
    const hit = BY_SCI.get(sci)
    if (hit) return pick(hit, '内置名录 · 学名匹配')
  }

  const names = [input.cnName, ...(input.aliases ?? [])]
    .map((name) => (name ?? '').trim())
    .filter(Boolean)
  for (const name of names) {
    const hit = BY_CN.get(name)
    if (hit) return pick(hit, '内置名录 · 中文名匹配')
  }

  const genus = (input.genusName ?? '').trim()
  if (genus) {
    const rule = GENUS_RULES.find((item) => item.genus.toLowerCase() === genus.toLowerCase())
    if (rule) {
      return {
        level: levelToText(rule.level),
        source: '内置名录 · 属级规则',
        isSanyou: false,
        matchedName: genus,
      }
    }
  }

  const order = (input.orderName ?? '').trim()
  if (order) {
    const rule = ORDER_RULES.find((item) => item.order === order)
    if (rule) {
      return {
        level: levelToText(rule.level),
        source: '内置名录 · 目级规则',
        isSanyou: false,
        matchedName: order,
      }
    }
  }

  const group = input.group ?? '鸟纲'
  const isBird = group === '鸟纲' || /鸟/.test(group)
  const excluded = SANYOU_EXCLUDE.has((input.cnName ?? '').trim())
  if (isBird && !excluded) {
    return {
      level: '三有',
      source: '启发式 · 本土野生鸟类默认三有',
      isSanyou: true,
      matchedName: input.cnName ?? null,
    }
  }

  return { level: '未知', source: '未匹配，可手动指定', isSanyou: false, matchedName: null }
}

export function listSanyouSample(limit = 20): string[] {
  return PROTECTED_BIRDS.slice(0, limit).map((entry) => entry[0])
}

export function levelWeight(level: ProtectionLevel | null): number {
  if (level === '国家一级') return 500
  if (level === '国家二级') return 300
  return 0
}

export function starProtectionBonus(level: ProtectionLevel | null, isSanyou: boolean): number {
  if (level === '国家一级') return 2
  if (level === '国家二级') return 1
  if (level === '三有' || isSanyou) return 0.5
  return 0
}

export type { Level }
