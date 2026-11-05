import { config } from '../config'
import { getDb } from '../db'
import { one, parseJson, run } from '../db/queries'

const WD_API = 'https://www.wikidata.org/w/api.php'
const MAX_HOPS = 8

export interface TaxonChain {
  genusName?: string
  familyName?: string
  orderName?: string
  className?: string
  phylumName?: string
}

interface EntityClaims {
  claims?: Record<string, Array<{ mainsnak?: { datavalue?: { value?: { id?: string } } } }>>
  labels?: Record<string, { value: string }>
}

function readCache<T>(key: string): T | null {
  const row = one<{ payload: string }>(getDb(), 'SELECT payload FROM wiki_cache WHERE cache_key = ?', [key])
  return row ? parseJson<T | null>(row.payload, null) : null
}

function writeCache(key: string, payload: unknown): void {
  run(
    getDb(),
    `INSERT INTO wiki_cache (cache_key, kind, payload, fetched_at) VALUES (?, 'taxon', ?, datetime('now'))
     ON CONFLICT(cache_key) DO UPDATE SET payload = excluded.payload, fetched_at = datetime('now')`,
    [key, JSON.stringify(payload)],
  )
}

async function fetchEntities(qids: string[]): Promise<Record<string, EntityClaims>> {
  if (!qids.length) return {}
  const cacheKey = `taxon-entities:${[...qids].sort().join(',')}`
  const cached = readCache<Record<string, EntityClaims>>(cacheKey)
  if (cached) return cached

  const search = new URLSearchParams({
    action: 'wbgetentities',
    format: 'json',
    ids: qids.join('|'),
    props: 'claims',
    languages: 'zh|zh-hans|en',
  })
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), config.fetchTimeoutMs)
  try {
    const res = await fetch(`${WD_API}?${search.toString()}`, {
      headers: { 'User-Agent': config.userAgent },
      signal: controller.signal,
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = (await res.json()) as { entities?: Record<string, EntityClaims> }
    const entities = data.entities ?? {}
    writeCache(cacheKey, entities)
    return entities
  } finally {
    clearTimeout(timer)
  }
}

/**
 * 分类层级关键词：排除亚级（亚科 / 亚目 / 亚属…），否则「鹭亚科(Ardeinae)」会被误判为科。
 * 例如苍鹭的 P171 链是 苍鹭 → 鹭属 → 鹭亚科 → 鹭科 → 鹈形目，取到的科必须是鹭科。
 */
const RANK_KEYWORDS: Array<{ words: string[]; exclude?: string[]; key: keyof TaxonChain }> = [
  { words: ['属'], exclude: ['亚属'], key: 'genusName' },
  { words: ['科'], exclude: ['亚科', '总科', '下科', '小科'], key: 'familyName' },
  { words: ['目'], exclude: ['亚目', '总目', '下目'], key: 'orderName' },
  { words: ['纲'], exclude: ['亚纲'], key: 'className' },
  { words: ['门'], exclude: ['亚门'], key: 'phylumName' },
]

/**
 * 从「上级分类 P171」逐级向上回溯，提取属 / 科 / 目 / 纲。
 * 每跳都会缓存，后续同科物种基本命中缓存，不会重复请求。
 */
export async function mapTaxonChain(
  startQid: string,
  fetchLabels: (ids: string[]) => Promise<Record<string, string>>,
): Promise<TaxonChain> {
  const chain: TaxonChain = {}
  const visited = new Set<string>()
  let current: string | null = startQid
  const ids: string[] = []

  for (let hop = 0; hop < MAX_HOPS && current; hop += 1) {
    if (visited.has(current)) break
    visited.add(current)
    ids.push(current)
    const entities = await fetchEntities([current])
    const entity: EntityClaims | undefined = entities[current]
    const next: string | null = entity?.claims?.P171?.[0]?.mainsnak?.datavalue?.value?.id ?? null
    if (!next) break
    current = next
  }

  const names = await fetchLabels(ids)
  const ranks = await fetchRanks(ids)

  for (const id of ids) {
    const name = names[id]
    const rank = ranks[id] ?? ''
    if (!name || !rank) continue
    for (const rule of RANK_KEYWORDS) {
      const hit = rule.words.some((word) => rank.includes(word))
      const excluded = (rule.exclude ?? []).some((word) => rank.includes(word))
      if (hit && !excluded && !chain[rule.key]) {
        chain[rule.key] = name
        break
      }
    }
  }

  // 拉丁学名链兜底：属名通常为学名首个词
  return chain
}

async function fetchRanks(ids: string[]): Promise<Record<string, string>> {
  if (!ids.length) return {}
  const cacheKey = `taxon-ranks:${[...ids].sort().join(',')}`
  const cached = readCache<Record<string, string>>(cacheKey)
  if (cached) return cached

  const entities = await fetchEntities(ids)
  const rankQids: string[] = []
  const pending: Array<{ id: string; rankQid: string }> = []
  for (const [id, entity] of Object.entries(entities)) {
    const rankQid = entity.claims?.P105?.[0]?.mainsnak?.datavalue?.value?.id
    if (rankQid) {
      pending.push({ id, rankQid })
      rankQids.push(rankQid)
    }
  }

  const rankEntities = await fetchEntityLabelsLocal(rankQids)
  const out: Record<string, string> = {}
  for (const item of pending) out[item.id] = rankEntities[item.rankQid] ?? ''
  writeCache(cacheKey, out)
  return out
}

async function fetchEntityLabelsLocal(ids: string[]): Promise<Record<string, string>> {
  if (!ids.length) return {}
  const unique = Array.from(new Set(ids))
  const search = new URLSearchParams({
    action: 'wbgetentities',
    format: 'json',
    ids: unique.join('|'),
    props: 'labels',
    languages: 'zh|zh-hans|en',
  })
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), config.fetchTimeoutMs)
  try {
    const res = await fetch(`${WD_API}?${search.toString()}`, {
      headers: { 'User-Agent': config.userAgent },
      signal: controller.signal,
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = (await res.json()) as {
      entities?: Record<string, { labels?: Record<string, { value: string }> }>
    }
    const out: Record<string, string> = {}
    for (const [id, entity] of Object.entries(data.entities ?? {})) {
      out[id] =
        entity.labels?.zh?.value ?? entity.labels?.['zh-hans']?.value ?? entity.labels?.en?.value ?? ''
    }
    return out
  } finally {
    clearTimeout(timer)
  }
}
