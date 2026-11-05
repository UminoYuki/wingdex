import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { ApiError } from '../api/utils'
import { config } from '../config'
import { getDb } from '../db'
import { one, parseJson, run } from '../db/queries'
import { logger } from '../logger'
import pLimit from 'p-limit'
import type { WikiCandidate, WikiDetail } from '../types'
import { mapTaxonChain } from './wikiTaxonomy'

const limit = pLimit(config.wikiConcurrency)
const ZH_API = 'https://zh.wikipedia.org/w/api.php'
const EN_API = 'https://en.wikipedia.org/w/api.php'
const WD_API = 'https://www.wikidata.org/w/api.php'
const COMMONS_FILE = 'https://commons.wikimedia.org/wiki/Special:FilePath/'

interface CacheRow {
  payload: string
  fetched_at: string
}

function readCache<T>(key: string, maxAgeHours: number): T | null {
  const row = one<CacheRow>(getDb(), 'SELECT payload, fetched_at FROM wiki_cache WHERE cache_key = ?', [key])
  if (!row) return null
  const ageHours = (Date.now() - new Date(`${row.fetched_at.replace(' ', 'T')}Z`).getTime()) / 3_600_000
  if (Number.isNaN(ageHours) || ageHours > maxAgeHours) return null
  return parseJson<T | null>(row.payload, null)
}

function writeCache(key: string, kind: string, payload: unknown): void {
  run(
    getDb(),
    `INSERT INTO wiki_cache (cache_key, kind, payload, fetched_at) VALUES (?, ?, ?, datetime('now'))
     ON CONFLICT(cache_key) DO UPDATE SET payload = excluded.payload, fetched_at = datetime('now')`,
    [key, kind, JSON.stringify(payload)],
  )
}

interface FetchFailure extends Error {
  /** 429 / 5xx 与网络中断、超时都属于可重试 */
  retryable?: boolean
  retryAfterMs?: number
  status?: number
}

async function httpJson<T>(url: string, attempt = 0): Promise<T> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), config.fetchTimeoutMs)
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': config.userAgent, 'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.7' },
      signal: controller.signal,
    })
    if (!res.ok) {
      const failure = new Error(`HTTP ${res.status}`) as FetchFailure
      failure.status = res.status
      failure.retryable = res.status === 429 || res.status >= 500
      const retryAfter = Number(res.headers.get('retry-after'))
      if (Number.isFinite(retryAfter) && retryAfter > 0) failure.retryAfterMs = retryAfter * 1000
      throw failure
    }
    return (await res.json()) as T
  } catch (error) {
    const failure = error as FetchFailure
    // 网络中断与超时也重试；明确的 4xx（如 404）直接放弃
    const retryable = failure.retryable ?? true
    const wait = failure.retryAfterMs ?? 400 * (attempt + 1)
    // 限流窗口长于上限时不再原地等待：否则界面会长时间无响应，且等待结束通常仍被拒
    if (retryable && attempt < config.fetchRetries && wait <= config.fetchRetryMaxWaitMs) {
      logger.warn({ url, attempt: attempt + 1, wait, err: failure.message }, '维基请求失败，准备重试')
      await new Promise((resolve) => setTimeout(resolve, wait))
      return httpJson<T>(url, attempt + 1)
    }
    throw toFriendlyWikiError(failure, url)
  } finally {
    clearTimeout(timer)
  }
}

/** 把底层抓取异常转换成前端可直接展示的 ApiError */
function toFriendlyWikiError(error: FetchFailure, url: string): ApiError {
  if (error.status === 429) {
    return new ApiError(503, '维基百科接口限流（HTTP 429），请稍后重试，或先在录入页手动补充资料')
  }
  if (error.status && error.status >= 500) {
    return new ApiError(503, `维基百科服务异常（HTTP ${error.status}），请稍后重试`)
  }
  if (error.name === 'AbortError') {
    return new ApiError(504, `维基百科请求超时（${Math.round(config.fetchTimeoutMs / 1000)}s），请检查网络后重试`)
  }
  // fetch 只抛「fetch failed」，把底层网络错误码翻译成可读原因
  const code = (error as { cause?: { code?: string } }).cause?.code
  if (code) {
    const readable: Record<string, string> = {
      ENOTFOUND: '域名解析失败',
      EAI_AGAIN: '域名解析超时',
      ECONNREFUSED: '连接被拒绝',
      ECONNRESET: '连接被重置',
      ETIMEDOUT: '连接超时',
      CERT_HAS_EXPIRED: '证书已过期',
    }
    logger.warn({ url, code }, '维基请求网络层失败')
    return new ApiError(502, `无法连接维基百科（${readable[code] ?? code}），请检查网络或代理设置`)
  }
  logger.warn({ url, err: error.message }, '维基请求最终失败')
  return new ApiError(502, `维基百科请求失败：${error.message}`)
}

function api(base: string, params: Record<string, string | number>): string {
  const search = new URLSearchParams({ format: 'json', formatversion: '2', origin: '*' })
  for (const [key, value] of Object.entries(params)) search.set(key, String(value))
  return `${base}?${search.toString()}`
}

interface SearchPage {
  pageid: number
  title: string
  description?: string
  thumbnail?: { source: string }
}

export async function searchCandidates(query: string): Promise<WikiCandidate[]> {
  const trimmed = query.trim()
  if (!trimmed) return []
  const cacheKey = `search:${trimmed.toLowerCase()}`
  const cached = readCache<WikiCandidate[]>(cacheKey, 24 * 7)
  if (cached) return rankCandidates(cached, trimmed)

  const url = api(ZH_API, {
    action: 'query',
    generator: 'search',
    gsrsearch: trimmed,
    gsrlimit: 8,
    gsrinfo: 'totalhits',
    prop: 'pageimages|description',
    piprop: 'thumbnail',
    pithumbsize: 160,
    redirects: 1,
  })

  const candidates = await limit(async () => {
    const data = await httpJson<{ query?: { pages?: SearchPage[] } }>(url)
    const pages = data.query?.pages ?? []
    return pages.map((page) => ({
      title: page.title,
      description: page.description ?? '',
      url: `https://zh.wikipedia.org/wiki/${encodeURIComponent(page.title.replace(/ /g, '_'))}`,
      thumbnail: page.thumbnail?.source,
    }))
  })

  if (!candidates.length) {
    const wd = await searchWikidata(trimmed)
    writeCache(cacheKey, 'search', wd)
    return rankCandidates(wd, trimmed)
  }

  const ranked = rankCandidates(candidates, trimmed)
  writeCache(cacheKey, 'search', ranked)
  return ranked
}

/**
 * 维基搜索按词条热度排序，搜「夜鹭」时科属条目常排在种之前。
 * 这里把精确命中 / 前缀命中提到最前，其余保持维基原始相关度顺序。
 */
function rankCandidates(items: WikiCandidate[], query: string): WikiCandidate[] {
  const needle = query.replace(/\s+/g, '').toLowerCase()
  if (!needle) return items
  const scoreOf = (item: WikiCandidate): number => {
    const title = item.title.replace(/\s+/g, '').toLowerCase()
    if (title === needle) return 0
    if (title.startsWith(needle)) return 1
    if (title.includes(needle)) return 2
    return 3
  }
  return items
    .map((item, index) => ({ item, index, score: scoreOf(item) }))
    .sort((a, b) => a.score - b.score || a.index - b.index)
    .map((entry) => entry.item)
}

async function searchWikidata(query: string): Promise<WikiCandidate[]> {
  const url = api(WD_API, {
    action: 'wbsearchentities',
    search: query,
    language: 'zh',
    uselang: 'zh',
    type: 'item',
    limit: 8,
  })
  const data = await httpJson<{
    search?: Array<{ id: string; label?: string; description?: string }>
  }>(url)
  return (data.search ?? []).map((item) => ({
    title: item.label ?? item.id,
    description: item.description ?? '',
    url: `https://www.wikidata.org/wiki/${item.id}`,
    qid: item.id,
  }))
}

interface PageDetail {
  query?: {
    pages?: Array<{
      title: string
      missing?: boolean
      extract?: string
      pageprops?: { wikibase_item?: string }
      langlinks?: Array<{ lang: string; title: string }>
      thumbnail?: { source: string }
      original?: { source: string }
      fullurl?: string
    }>
  }
}

function cleanExtract(text: string | undefined): string {
  return (text ?? '')
    .replace(/\n{2,}/g, '\n')
    .replace(/\s+/g, ' ')
    .trim()
}

/** 子请求失败只降级为空值并记入警告：英文简介 / 维基数据 / 配图出问题不该让整条抓取报废 */
async function degrade<T>(label: string, warnings: string[], task: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await task()
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    warnings.push(`${label}抓取失败：${message}`)
    logger.warn({ label, err: message }, '维基子请求失败，已降级继续')
    return fallback
  }
}

export interface FetchDetailOptions {
  /** 预览场景只取文字资料：跳过配图下载，少一次请求、更快出结果 */
  withImage?: boolean
}

export async function fetchDetail(title: string, options: FetchDetailOptions = {}): Promise<WikiDetail> {
  const withImage = options.withImage ?? true
  // 是否含配图分开缓存，避免「预览缓存」把正式抓取的配图顶掉
  const cacheKey = `detail${withImage ? '' : '-lite'}:${title}`
  const cached = readCache<WikiDetail>(cacheKey, 24 * 30)
  if (cached) return cached

  const zhUrl = api(ZH_API, {
    action: 'query',
    titles: title,
    prop: 'extracts|pageimages|pageprops|langlinks|info',
    exintro: 1,
    explaintext: 1,
    redirects: 1,
    piprop: 'original|thumbnail',
    pithumbsize: 1200,
    lllang: 'en',
    inprop: 'url',
  })
  const zh = await limit(() => httpJson<PageDetail>(zhUrl))
  const zhPage = zh.query?.pages?.[0]
  if (!zhPage || zhPage.missing) throw new ApiError(404, `维基百科未找到词条「${title}」`)

  const warnings: string[] = []
  const qid = zhPage.pageprops?.wikibase_item ?? null
  const enTitle = zhPage.langlinks?.find((item) => item.lang === 'en')?.title ?? null
  const taxonomy = await degrade('英文简介', warnings, () => fetchWikipediaEn(enTitle), { extractEn: null })

  const detail: WikiDetail = {
    title: zhPage.title,
    extract: cleanExtract(zhPage.extract),
    extractEn: taxonomy.extractEn,
    enTitle,
    qid,
    scientificName: null,
    enName: null,
    orderName: null,
    familyName: null,
    genusName: null,
    iucnStatus: null,
    iucnYear: null,
    distribution: [],
    imageKey: null,
    imageCredit: null,
    wikiUrl: zhPage.fullurl ?? `https://zh.wikipedia.org/wiki/${encodeURIComponent(title)}`,
    wikiEnUrl: enTitle ? `https://en.wikipedia.org/wiki/${encodeURIComponent(enTitle)}` : null,
    warnings,
  }

  if (qid) {
    const entity = await degrade('维基数据（学名/分类/IUCN）', warnings, () => fetchEntity(qid), null)
    if (entity) {
      detail.scientificName = entity.scientificName
      detail.enName = entity.enName
      detail.orderName = entity.orderName
      detail.familyName = entity.familyName
      detail.genusName = entity.genusName
      detail.iucnStatus = entity.iucnStatus
      detail.iucnYear = entity.iucnYear
      detail.distribution = entity.distribution
    }
    const imageSource = entity?.imageUrl ?? zhPage.original?.source ?? zhPage.thumbnail?.source ?? null
    if (imageSource && withImage) {
      const saved = await degrade('配图下载', warnings, () => saveWikiImage(imageSource, qid), null)
      detail.imageKey = saved?.key ?? null
      detail.imageCredit = saved?.credit ?? null
    }
  }

  // 导语为空的条目（消歧义页等）不写缓存，避免 30 天内一直返回空资料
  if (detail.extract) writeCache(cacheKey, 'detail', detail)
  else logger.warn({ title, qid }, '维基条目导语为空，跳过缓存')
  logger.info({ title, qid, warnings: warnings.length }, '维基资料抓取完成')
  return detail
}

async function fetchWikipediaEn(enTitle: string | null): Promise<{ extractEn: string | null }> {
  if (!enTitle) return { extractEn: null }
  const cacheKey = `en:${enTitle}`
  const cached = readCache<{ extractEn: string }>(cacheKey, 24 * 30)
  if (cached) return cached
  const url = api(EN_API, {
    action: 'query',
    titles: enTitle,
    prop: 'extracts',
    exintro: 1,
    explaintext: 1,
    redirects: 1,
  })
  const data = await limit(() => httpJson<PageDetail>(url))
  const result = { extractEn: cleanExtract(data.query?.pages?.[0]?.extract) || null }
  if (result.extractEn) writeCache(cacheKey, 'en-extract', result)
  return result
}

async function saveWikiImage(
  source: string,
  qid: string,
): Promise<{ key: string; credit: string } | null> {
  const key = crypto.createHash('sha1').update(source).digest('hex').slice(0, 16)
  const ext = path.extname(new URL(source).pathname) || '.jpg'
  const file = path.join(config.wikiImageDir, `${key}${ext}`)
  if (fs.existsSync(file) && fs.statSync(file).size > 1024) {
    return { key: `${key}${ext}`, credit: `维基共享资源 · ${qid}` }
  }
  const buffer = await limit(async () => {
    const res = await fetch(source, {
      headers: { 'User-Agent': config.userAgent },
      signal: AbortSignal.timeout(config.fetchTimeoutMs),
    })
    if (!res.ok) throw new Error(`图片下载失败 HTTP ${res.status}`)
    return Buffer.from(await res.arrayBuffer())
  })
  fs.writeFileSync(file, buffer)
  return { key: `${key}${ext}`, credit: `维基共享资源 · ${qid}` }
}

export async function fetchEntity(qid: string): Promise<{
  scientificName: string | null
  enName: string | null
  orderName: string | null
  familyName: string | null
  genusName: string | null
  iucnStatus: string | null
  iucnYear: number | null
  distribution: string[]
  imageUrl: string | null
}> {
  const cacheKey = `entity:${qid}`
  const cached = readCache<Awaited<ReturnType<typeof fetchEntity>>>(cacheKey, 24 * 30)
  if (cached) return cached

  const url = api(WD_API, {
    action: 'wbgetentities',
    ids: qid,
    props: 'claims|labels|descriptions',
    languages: 'zh|zh-hans|en',
  })
  const data = await limit(() =>
    httpJson<{
      entities?: Record<
        string,
        {
          labels?: Record<string, { value: string }>
          claims?: Record<
            string,
            Array<{ mainsnak?: { datavalue?: { value: unknown } }; qualifiers?: Record<string, unknown[]> }>
          >
        }
      >
    }>(url),
  )

  const entity = data.entities?.[qid]
  const claims = entity?.claims ?? {}
  const claimValue = (prop: string): unknown => {
    const list = claims[prop]
    const value = list?.[0]?.mainsnak?.datavalue?.value
    return value ?? null
  }

  const scientificName = (claimValue('P225') as string | null) ?? null
  const enLabel = entity?.labels?.en?.value ?? null
  const enName = enLabel ?? null

  const iucnQid = (claimValue('P141') as { id?: string } | string | null) ?? null
  const iucnId = typeof iucnQid === 'string' ? iucnQid : (iucnQid?.id ?? null)
  let iucnStatus: string | null = null
  let iucnYear: number | null = null
  if (iucnId) {
    const status = await fetchIucnLabel(iucnId)
    iucnStatus = status.code
    const quad = claims['P141']?.[0]?.qualifiers?.['P585'] as
      | Array<{ datavalue?: { value?: { time?: string } } }>
      | undefined
    const time = quad?.[0]?.datavalue?.value?.time
    if (time) iucnYear = Number(time.slice(1, 5))
  }

  const parentQid = (claimValue('P171') as { id?: string } | null)?.id ?? null
  const chain = parentQid ? await mapTaxonChain(parentQid, fetchEntityLabels) : {}

  const imageFile = claimValue('P18') as string | null
  const imageUrl = imageFile
    ? `${COMMONS_FILE}${encodeURIComponent(imageFile.replace(/ /g, '_'))}?width=1400`
    : null

  const distributionIds = (claims['P183'] ?? [])
    .map((claim) => (claim.mainsnak?.datavalue?.value as { id?: string } | undefined)?.id)
    .filter((id): id is string => Boolean(id))
  const distribution = distributionIds.length
    ? Object.values(await fetchEntityLabels(distributionIds))
    : []

  const result = {
    scientificName,
    enName,
    orderName: chain.orderName ?? null,
    familyName: chain.familyName ?? null,
    genusName: chain.genusName ?? null,
    iucnStatus,
    iucnYear,
    distribution,
    imageUrl,
  }
  writeCache(cacheKey, 'entity', result)
  return result
}

const IUCN_QID_LABELS: Record<string, string> = {
  EX: '灭绝',
  EW: '野外灭绝',
  CR: '极危',
  EN: '濒危',
  VU: '易危',
  NT: '近危',
  LC: '无危',
  DD: '数据缺乏',
  NE: '未评估',
}

async function fetchIucnLabel(statusQid: string): Promise<{ code: string | null; label: string }> {
  const cacheKey = `iucn:${statusQid}`
  const cached = readCache<{ code: string | null; label: string }>(cacheKey, 24 * 90)
  if (cached) return cached

  const url = api(WD_API, {
    action: 'wbgetentities',
    ids: statusQid,
    props: 'labels',
    languages: 'zh|zh-hans|en',
  })
  const data = await limit(() =>
    httpJson<{
      entities?: Record<string, { labels?: Record<string, { value: string }> }>
    }>(url),
  )
  const labels = data.entities?.[statusQid]?.labels ?? {}
  const zhLabel = labels.zh?.value ?? labels['zh-hans']?.value ?? labels.en?.value ?? ''
  let code: string | null = null
  for (const [key, label] of Object.entries(IUCN_QID_LABELS)) {
    if (zhLabel.includes(label)) {
      code = key
      break
    }
  }
  const result = { code, label: zhLabel }
  writeCache(cacheKey, 'iucn', result)
  return result
}

export async function fetchEntityLabels(ids: string[]): Promise<Record<string, string>> {
  if (!ids.length) return {}
  const unique = Array.from(new Set(ids))
  const cacheKey = `labels:${unique.sort().join(',')}`
  const cached = readCache<Record<string, string>>(cacheKey, 24 * 30)
  if (cached) return cached

  const map: Record<string, string> = {}
  const chunks: string[][] = []
  for (let i = 0; i < unique.length; i += 40) chunks.push(unique.slice(i, i + 40))

  for (const chunk of chunks) {
    const url = api(WD_API, {
      action: 'wbgetentities',
      ids: chunk.join('|'),
      props: 'labels|claims',
      languages: 'zh|zh-hans|en',
    })
    const data = await limit(() =>
      httpJson<{
        entities?: Record<
          string,
          {
            labels?: Record<string, { value: string }>
            claims?: Record<string, Array<{ mainsnak?: { datavalue?: { value?: { id?: string } } } }>>
          }
        >
      }>(url),
    )
    for (const [id, value] of Object.entries(data.entities ?? {})) {
      map[id] = value.labels?.zh?.value ?? value.labels?.['zh-hans']?.value ?? value.labels?.en?.value ?? id
    }
  }
  writeCache(cacheKey, 'labels', map)
  return map
}

export async function fetchEntityRanks(ids: string[]): Promise<Record<string, string>> {
  if (!ids.length) return {}
  const url = api(WD_API, {
    action: 'wbgetentities',
    ids: ids.join('|'),
    props: 'claims',
  })
  const data = await limit(() =>
    httpJson<{
      entities?: Record<
        string,
        { claims?: Record<string, Array<{ mainsnak?: { datavalue?: { value?: { id?: string } } } }>> }
      >
    }>(url),
  )
  const rankQids: Record<string, string[]> = {}
  for (const [id, value] of Object.entries(data.entities ?? {})) {
    const rankQid = value.claims?.P105?.[0]?.mainsnak?.datavalue?.value?.id
    if (rankQid) rankQids[id] = [rankQid]
  }
  const rankLabels = await fetchEntityLabels(Object.values(rankQids).flat())
  const out: Record<string, string> = {}
  for (const [id, list] of Object.entries(rankQids)) out[id] = rankLabels[list[0]] ?? ''
  return out
}
