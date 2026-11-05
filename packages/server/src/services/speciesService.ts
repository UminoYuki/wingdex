import { getDb } from '../db'
import { all, mapSpecies, one, parseList, run, type Row } from '../db/queries'
import { logger } from '../logger'
import type { FetchStatus, Species } from '../types'
import { ApiError } from '../api/utils'
import { computeStars } from '../data/cardRules'
import { parseMorphology } from './morphology'
import { matchProtection } from './protectionService'
import { fetchDetail } from './wikiService'

export interface SpeciesFilters {
  q?: string
  group?: string
  order?: string
  family?: string
  protection?: string
  habitat?: string
  camera?: string
  lens?: string
  favorite?: boolean
  wishlist?: boolean
  sort?: 'recent' | 'photos' | 'name' | 'first' | 'stars'
  limit?: number
  offset?: number
}

export interface SpeciesWithStats extends Species {
  photoCount: number
  photoIds: number[]
  firstSeenAt: string | null
  lastSeenAt: string | null
  placeNames: string[]
  cameraCount: number
  cardCount: number
  stars: number | null
  starScore: number
  starDetail: string
}

const BASE_SELECT = `
  SELECT s.*,
    (SELECT COUNT(*) FROM photos p WHERE p.species_id = s.id) AS photo_count,
    (SELECT GROUP_CONCAT(p.id) FROM photos p WHERE p.species_id = s.id) AS photo_ids,
    (SELECT MIN(p.taken_at) FROM photos p WHERE p.species_id = s.id) AS first_seen_at,
    (SELECT MAX(p.taken_at) FROM photos p WHERE p.species_id = s.id) AS last_seen_at,
    (SELECT GROUP_CONCAT(DISTINCT pl.name) FROM photos p
       JOIN places pl ON pl.id = p.place_id WHERE p.species_id = s.id) AS place_names,
    (SELECT COUNT(DISTINCT p.camera_model) FROM photos p
       WHERE p.species_id = s.id AND p.camera_model IS NOT NULL AND p.camera_model != '') AS camera_count,
    (SELECT COUNT(*) FROM cards c WHERE c.species_id = s.id) AS card_count,
    (SELECT c.stars FROM cards c WHERE c.species_id = s.id ORDER BY c.id LIMIT 1) AS card_stars
  FROM species s
`

function mapWithStats(row: Row): SpeciesWithStats {
  const species = mapSpecies(row)
  const photoCount = Number(row.photo_count ?? 0)
  const stars = computeStars({
    iucnStatus: species.iucnStatus,
    protectionLevel: species.cnProtectionLevel,
    isSanyou: species.isSanyou,
    photoCount,
    isFirstRecord: photoCount > 0,
    wishlistAchieved: species.isWishlist && photoCount > 0,
  })

  return {
    ...species,
    photoCount,
    photoIds: parseList(row.photo_ids).map(Number).filter(Number.isFinite),
    firstSeenAt: (row.first_seen_at as string) ?? null,
    lastSeenAt: (row.last_seen_at as string) ?? null,
    placeNames: parseList(row.place_names),
    cameraCount: Number(row.camera_count ?? 0),
    cardCount: Number(row.card_count ?? 0),
    stars: row.card_stars == null ? null : Number(row.card_stars),
    starScore: stars.value,
    starDetail: stars.detail,
  }
}

function buildWhere(filters: SpeciesFilters): { sql: string; params: unknown[] } {
  const clauses: string[] = []
  const params: unknown[] = []

  if (filters.q) {
    clauses.push(
      `(s.cn_name LIKE ? OR s.scientific_name LIKE ? OR s.en_name LIKE ? OR s.aliases LIKE ?)`,
    )
    const like = `%${filters.q}%`
    params.push(like, like, like, like)
  }
  if (filters.group) {
    clauses.push('s.grp = ?')
    params.push(filters.group)
  }
  if (filters.order) {
    clauses.push('s.order_name = ?')
    params.push(filters.order)
  }
  if (filters.family) {
    clauses.push('s.family_name = ?')
    params.push(filters.family)
  }
  if (filters.protection) {
    clauses.push('s.cn_protection_level = ?')
    params.push(filters.protection)
  }
  if (filters.habitat) {
    clauses.push('s.habitats LIKE ?')
    params.push(`%${filters.habitat}%`)
  }
  if (filters.camera) {
    clauses.push(
      `EXISTS (SELECT 1 FROM photos p WHERE p.species_id = s.id AND p.camera_model = ?)`,
    )
    params.push(filters.camera)
  }
  if (filters.lens) {
    clauses.push(`EXISTS (SELECT 1 FROM photos p WHERE p.species_id = s.id AND p.lens = ?)`)
    params.push(filters.lens)
  }
  if (filters.favorite) clauses.push('s.is_favorite = 1')
  if (filters.wishlist) clauses.push('s.is_wishlist = 1')
  if (filters.wishlist === false) clauses.push('s.is_wishlist = 0')

  return {
    sql: clauses.length ? `WHERE ${clauses.join(' AND ')}` : '',
    params,
  }
}

const SORT_SQL: Record<NonNullable<SpeciesFilters['sort']>, string> = {
  recent: 'last_seen_at DESC NULLS LAST, photo_count DESC',
  photos: 'photo_count DESC',
  name: 's.cn_name ASC',
  first: 'first_seen_at ASC NULLS LAST',
  stars: 'card_stars DESC NULLS LAST',
}

export function listSpecies(filters: SpeciesFilters): {
  items: SpeciesWithStats[]
  total: number
} {
  const db = getDb()
  const where = buildWhere(filters)
  const limit = Math.min(filters.limit ?? 60, 200)
  const offset = filters.offset ?? 0
  const sort = SORT_SQL[filters.sort ?? 'recent']

  const rows = all<Row>(
    db,
    `${BASE_SELECT} ${where.sql} ORDER BY ${sort} LIMIT ? OFFSET ?`,
    [...where.params, limit, offset],
  )
  const totalRow = one<{ total: number }>(
    db,
    `SELECT COUNT(*) AS total FROM species s ${where.sql}`,
    where.params,
  )

  return {
    items: rows.map(mapWithStats),
    total: Number(totalRow?.total ?? 0),
  }
}

export function getSpecies(id: number): Species {
  const row = one<Row>(getDb(), 'SELECT * FROM species WHERE id = ?', [id])
  if (!row) throw new ApiError(404, `未找到物种 #${id}`)
  return mapSpecies(row)
}

export function getSpeciesWithStats(id: number): SpeciesWithStats {
  const row = one<Row>(getDb(), `${BASE_SELECT} WHERE s.id = ?`, [id])
  if (!row) throw new ApiError(404, `未找到物种 #${id}`)
  return mapWithStats(row)
}

export interface CreateSpeciesInput {
  cnName: string
  group?: string
  scientificName?: string | null
  enName?: string | null
  isWishlist?: boolean
  wishNote?: string | null
  note?: string | null
  autoFetch?: boolean
  wikiTitle?: string | null
}

export function createSpecies(input: CreateSpeciesInput): Species {
  const db = getDb()
  const name = input.cnName.trim()
  if (!name) throw new ApiError(400, '中文名不能为空')

  const existing = one<Row>(db, 'SELECT id FROM species WHERE cn_name = ?', [name])
  if (existing) throw new ApiError(409, `物种「${name}」已存在`)

  const info = db
    .prepare(
      `INSERT INTO species (grp, cn_name, scientific_name, en_name, is_wishlist, wish_note, note,
        fetch_status, cn_protection_level, cn_protection_source)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', '未知', '待匹配')`,
    )
    .run(
      input.group ?? '鸟纲',
      name,
      input.scientificName ?? null,
      input.enName ?? null,
      input.isWishlist ? 1 : 0,
      input.wishNote ?? null,
      input.note ?? null,
    )

  const id = Number(info.lastInsertRowid)
  logger.info({ id, name }, '新建物种')
  return getSpecies(id)
}

export interface UpdateSpeciesInput {
  cnName?: string
  group?: string
  scientificName?: string | null
  enName?: string | null
  aliases?: string[]
  orderName?: string | null
  familyName?: string | null
  genusName?: string | null
  iucnStatus?: string | null
  iucnYear?: number | null
  cnProtectionLevel?: string | null
  cnProtectionSource?: string | null
  isSanyou?: boolean
  lengthCm?: string | null
  weightG?: string | null
  wingspanCm?: string | null
  distribution?: string[]
  habitats?: string[]
  residenceType?: string | null
  diet?: string | null
  ecoType?: string | null
  summaryZh?: string | null
  summaryEn?: string | null
  note?: string | null
  tags?: string[]
  isFavorite?: boolean
  isWishlist?: boolean
  wishNote?: string | null
  coverPhotoId?: number | null
  soundPath?: string | null
  videoPath?: string | null
}

const FIELD_MAP: Record<keyof UpdateSpeciesInput, string> = {
  cnName: 'cn_name',
  group: 'grp',
  scientificName: 'scientific_name',
  enName: 'en_name',
  aliases: 'aliases',
  orderName: 'order_name',
  familyName: 'family_name',
  genusName: 'genus_name',
  iucnStatus: 'iucn_status',
  iucnYear: 'iucn_year',
  cnProtectionLevel: 'cn_protection_level',
  cnProtectionSource: 'cn_protection_source',
  isSanyou: 'is_sanyou',
  lengthCm: 'length_cm',
  weightG: 'weight_g',
  wingspanCm: 'wingspan_cm',
  distribution: 'distribution',
  habitats: 'habitats',
  residenceType: 'residence_type',
  diet: 'diet',
  ecoType: 'eco_type',
  summaryZh: 'summary_zh',
  summaryEn: 'summary_en',
  note: 'note',
  tags: 'tags',
  isFavorite: 'is_favorite',
  isWishlist: 'is_wishlist',
  wishNote: 'wish_note',
  coverPhotoId: 'cover_photo_id',
  soundPath: 'sound_path',
  videoPath: 'video_path',
}

const JSON_FIELDS = new Set(['aliases', 'distribution', 'habitats', 'tags'])
const BOOL_FIELDS = new Set(['isSanyou', 'isFavorite', 'isWishlist'])

export function updateSpecies(id: number, patch: UpdateSpeciesInput): Species {
  const sets: string[] = []
  const params: unknown[] = []

  for (const [key, column] of Object.entries(FIELD_MAP)) {
    const typedKey = key as keyof UpdateSpeciesInput
    if (!(typedKey in patch)) continue
    const value = patch[typedKey]
    sets.push(`${column} = ?`)
    if (JSON_FIELDS.has(key)) params.push(JSON.stringify(value ?? []))
    else if (BOOL_FIELDS.has(key)) params.push(value ? 1 : 0)
    else params.push((value as string | number | null) ?? null)
  }

  if (!sets.length) return getSpecies(id)
  getDb()
    .prepare(`UPDATE species SET ${sets.join(', ')} WHERE id = ?`)
    .run(...(params as never[]), id)
  return getSpecies(id)
}

export function deleteSpecies(id: number): void {
  const info = getDb().prepare('DELETE FROM species WHERE id = ?').run(id)
  if (!info.changes) throw new ApiError(404, `未找到物种 #${id}`)
  logger.warn({ id }, '删除物种（照片转回待分类）')
}

export interface FetchOptions {
  wikiTitle?: string | null
  qid?: string | null
  overwriteManual?: boolean
}

export async function refreshSpecies(id: number, options: FetchOptions = {}): Promise<Species> {
  const species = getSpecies(id)
  const title = options.wikiTitle ?? species.wikiTitle ?? species.cnName

  try {
    const detail = await fetchDetail(title)
    const morphology = parseMorphology(detail.extract, detail.extractEn ?? '')
    const protection = matchProtection({
      cnName: detail.title || species.cnName,
      scientificName: detail.scientificName ?? species.scientificName,
      genusName: detail.genusName ?? species.genusName,
      orderName: detail.orderName ?? species.orderName,
      group: species.group,
      aliases: species.aliases,
    })

    const status: FetchStatus = detail.extract ? (detail.scientificName ? 'ok' : 'partial') : 'partial'
    const db = getDb()
    db.prepare(
      `UPDATE species SET
        scientific_name = COALESCE(?, scientific_name),
        en_name = COALESCE(?, en_name),
        order_name = COALESCE(?, order_name),
        family_name = COALESCE(?, family_name),
        genus_name = COALESCE(?, genus_name),
        iucn_status = COALESCE(?, iucn_status),
        iucn_year = COALESCE(?, iucn_year),
        wiki_title = ?, wiki_url = ?, wiki_en_url = ?, qid = ?,
        wiki_image_key = COALESCE(?, wiki_image_key),
        image_credit = COALESCE(?, image_credit),
        summary_zh = ?, summary_en = COALESCE(?, summary_en),
        length_cm = COALESCE(?, length_cm),
        weight_g = COALESCE(?, weight_g),
        wingspan_cm = COALESCE(?, wingspan_cm),
        habitats = ?, distribution = ?, residence_type = COALESCE(?, residence_type),
        diet = COALESCE(?, diet), eco_type = COALESCE(?, eco_type),
        cn_protection_level = ?, cn_protection_source = ?, is_sanyou = ?,
        fetch_status = ?, fetch_error = NULL, fetched_at = datetime('now')
       WHERE id = ?`,
    ).run(
      detail.scientificName,
      detail.enName,
      detail.orderName,
      detail.familyName,
      detail.genusName,
      detail.iucnStatus,
      detail.iucnYear,
      detail.title,
      detail.wikiUrl,
      detail.wikiEnUrl,
      detail.qid,
      detail.imageKey,
      detail.imageCredit,
      detail.extract || null,
      detail.extractEn,
      morphology.lengthCm,
      morphology.weightG,
      morphology.wingspanCm,
      JSON.stringify(morphology.habitats),
      JSON.stringify(morphology.distribution.length ? morphology.distribution : detail.distribution),
      morphology.residenceType,
      morphology.diet,
      morphology.ecoType,
      protection.level,
      protection.source,
      protection.isSanyou ? 1 : 0,
      status,
      id,
    )

    logger.info({ id, title: detail.title, status }, '物种资料更新完成')
    return getSpecies(id)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    run(
      getDb(),
      `UPDATE species SET fetch_status = 'failed', fetch_error = ?, fetched_at = datetime('now') WHERE id = ?`,
      [message, id],
    )
    logger.error({ id, err: message }, '物种资料抓取失败')
    throw new ApiError(502, `抓取失败：${message}`)
  }
}

export function toggleFavorite(id: number): Species {
  getDb().prepare('UPDATE species SET is_favorite = CASE is_favorite WHEN 1 THEN 0 ELSE 1 END WHERE id = ?').run(id)
  return getSpecies(id)
}

export function toggleWishlist(id: number, note?: string | null): Species {
  const species = getSpecies(id)
  getDb()
    .prepare('UPDATE species SET is_wishlist = ?, wish_note = ? WHERE id = ?')
    .run(species.isWishlist ? 0 : 1, note ?? species.wishNote, id)
  return getSpecies(id)
}

export interface Facets {
  groups: Array<{ value: string; count: number }>
  orders: Array<{ value: string; count: number }>
  families: Array<{ value: string; count: number }>
  protections: Array<{ value: string; count: number }>
  habitats: Array<{ value: string; count: number }>
  cameras: Array<{ value: string; count: number }>
  lenses: Array<{ value: string; count: number }>
}

export function getFacets(): Facets {
  const db = getDb()
  const simple = (column: string, table = 'species', where = `IS NOT NULL AND ${column} != ''`) =>
    all<{ value: string; count: number }>(
      db,
      `SELECT ${column} AS value, COUNT(*) AS count FROM ${table} WHERE ${where}
       GROUP BY ${column} ORDER BY count DESC LIMIT 40`,
    )

  const habitats: Array<{ value: string; count: number }> = []
  const rows = all<{ habitats: string }>(
    db,
    `SELECT habitats FROM species WHERE habitats IS NOT NULL AND habitats != ''`,
  )
  const counter = new Map<string, number>()
  for (const row of rows) {
    for (const tag of parseList(row.habitats)) counter.set(tag, (counter.get(tag) ?? 0) + 1)
  }
  for (const [value, count] of [...counter.entries()].sort((a, b) => b[1] - a[1])) {
    habitats.push({ value, count })
  }

  return {
    groups: simple('grp'),
    orders: simple('order_name'),
    families: simple('family_name'),
    protections: simple('cn_protection_level'),
    habitats,
    cameras: simple('camera_model', 'photos'),
    lenses: simple('lens', 'photos'),
  }
}

export function speciesOptions(): Array<{ id: number; cnName: string; scientificName: string | null }> {
  return all<{ id: number; cn_name: string; scientific_name: string | null }>(
    getDb(),
    'SELECT id, cn_name, scientific_name FROM species ORDER BY cn_name ASC',
  ).map((row) => ({ id: Number(row.id), cnName: row.cn_name, scientificName: row.scientific_name }))
}
