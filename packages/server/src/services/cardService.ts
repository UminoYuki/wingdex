import { getDb } from '../db'
import { all, mapCard, mapPhoto, one, run, type Row } from '../db/queries'
import { logger } from '../logger'
import type { Card, CardAttribute, CardCustomLayer, CardRarity, Photo, PhotoCrop, Species } from '../types'
import { ApiError } from '../api/utils'
import {
  buildBackPrintDefaults,
  buildGearText,
  buildSerialNo,
  computeAtk,
  computeDef,
  computeRarity,
  computeStars,
  defaultBackPrint,
  detectBodyKind,
  inferAttribute,
} from '../data/cardRules'
import { summarizeForCard } from './summarize'
import { getSpecies } from './speciesService'
import {
  assertAttribute,
  assertCardLines,
  assertCardText,
  assertCrop,
  assertLayers,
  assertNumbers,
  assertOverrides,
  assertRarity,
  assertSerial,
  textLength,
} from './cardValidation'
import { getPhoto, speciesPhotoSummary } from './photoService'

const COMPLETENESS_PARTS = [
  'scientific_name',
  'order_name',
  'family_name',
  'iucn_status',
  'summary_zh',
  'wiki_image_key',
  'length_cm',
  'habitats',
  'distribution',
]

export interface CardFilters {
  rarity?: string
  attribute?: string
  group?: string
  deckId?: number
  templateId?: number
  speciesId?: number
  holo?: boolean
  q?: string
  sort?: 'recent' | 'stars' | 'serial' | 'rarity'
  limit?: number
  offset?: number
}

export interface CardListItem extends Card {
  cnName: string
  scientificName: string | null
  group: string
  familyName: string | null
  attributeColorKey: string
  photoThumbId: number | null
}

export interface CardFull {
  card: Card
  /** 物种基础资料 + 详情页要用的聚合计数 */
  species: Species & { photoCount: number; cardCount: number }
  photo: Photo | null
  photos: Photo[]
  editable: Record<string, unknown>
}

function completenessOf(speciesId: number): number {
  const expr = COMPLETENESS_PARTS.map(
    (column) => `(CASE WHEN ${column} IS NOT NULL AND ${column} != '' THEN 1 ELSE 0 END)`,
  ).join(' + ')
  const row = one<Row>(getDb(), `SELECT (${expr}) AS score FROM species WHERE id = ?`, [speciesId])
  return Number(row?.score ?? 0) / COMPLETENESS_PARTS.length
}

function cardCountOf(speciesId: number): number {
  const row = one<Row>(getDb(), `SELECT COUNT(*) AS total FROM cards WHERE species_id = ?`, [speciesId])
  return Number(row?.total ?? 0)
}

function speciesStats(speciesId: number) {
  const db = getDb()
  const row = one<Row>(
    db,
    `SELECT
      (SELECT COUNT(*) FROM photos WHERE species_id = ?) AS photo_count,
      (SELECT COUNT(*) FROM photos WHERE species_id = ? AND rating >= 5) AS five_star,
      (SELECT COUNT(*) FROM photos WHERE species_id = ?
        AND (tags LIKE '%行为%' OR tags LIKE '%繁殖%' OR tags LIKE '%求偶%' OR tags LIKE '%育雏%')) AS behavior`,
    [speciesId, speciesId, speciesId],
  )
  const behavior = { total: Number(row?.behavior ?? 0) }
  return {
    photoCount: Number(row?.photo_count ?? 0),
    fiveStarCount: Number(row?.five_star ?? 0),
    behaviorCount: Number(behavior?.total ?? 0),
    completeness: completenessOf(speciesId),
  }
}

export function pickDefaultPhoto(speciesId: number): Photo | null {
  const db = getDb()
  const row =
    one<Row>(
      db,
      `SELECT p.* FROM photos p JOIN species s ON s.cover_photo_id = p.id WHERE s.id = ?`,
      [speciesId],
    ) ??
    one<Row>(
      db,
      `SELECT * FROM photos WHERE species_id = ?
       ORDER BY rating DESC, is_favorite DESC, taken_at ASC NULLS LAST, id ASC LIMIT 1`,
      [speciesId],
    )
  return row ? mapPhoto(row) : null
}

export function photoCandidates(speciesId: number): Photo[] {
  return all<Row>(
    getDb(),
    `SELECT * FROM photos WHERE species_id = ?
     ORDER BY rating DESC, is_favorite DESC, taken_at DESC NULLS LAST, id DESC`,
    [speciesId],
  ).map(mapPhoto)
}

function formatDay(value: string | null): string {
  if (!value) return ''
  return value.slice(0, 10)
}

export function buildRecordText(photo: Photo | null): string {
  if (!photo) return ''
  const line1 = [formatDay(photo.takenAt), photo.placeName].filter(Boolean).join(' · ')
  const gear = [photo.cameraModel, photo.lens].filter(Boolean).join(' ')
  const extra = photo.focal35 ? `${Math.round(photo.focal35)}mm` : null
  const line2 = [gear, extra].filter(Boolean).join(' · ')
  const text = [line1, line2].filter(Boolean).join('\n')
  return text.slice(0, 50)
}

export function buildTitle(species: Species): string {
  const habitat = species.habitats[0] ?? species.residenceType ?? ''
  const candidates = [
    habitat ? `${habitat}的${species.cnName}` : species.cnName,
    species.ecoType ? `${species.ecoType}${species.cnName}` : species.cnName,
    species.cnName,
  ]
  return (candidates.find((text) => text.length <= 12) ?? species.cnName).slice(0, 12)
}

export interface CardDefaults {
  attribute: CardAttribute
  stars: number
  starsSource: string
  atk: number
  def: number
  valueSource: string
  rarity: CardRarity
  title: string
  effectText: string
  recordText: string
  photoId: number | null
  crop: PhotoCrop
}

export function buildCardDefaults(speciesId: number, photoId?: number | null): CardDefaults {
  const species = getSpecies(speciesId)
  const stats = speciesStats(speciesId)
  const photo = photoId ? getPhoto(photoId) : pickDefaultPhoto(speciesId)
  const isFirstRecord = !one<Row>(getDb(), 'SELECT id FROM cards WHERE species_id = ?', [speciesId])

  const stars = computeStars({
    iucnStatus: species.iucnStatus,
    protectionLevel: species.cnProtectionLevel,
    isSanyou: species.isSanyou,
    photoCount: stats.photoCount,
    isFirstRecord: Boolean(isFirstRecord) && stats.photoCount > 0,
    wishlistAchieved: species.isWishlist && stats.photoCount > 0,
  })
  const atk = computeAtk({
    stars: stars.value,
    protectionLevel: species.cnProtectionLevel,
    photoCount: stats.photoCount,
    fiveStarCount: stats.fiveStarCount,
    profileCompleteness: stats.completeness,
    hasBehaviorShot: stats.behaviorCount > 0,
  })
  const def = computeDef({
    stars: stars.value,
    protectionLevel: species.cnProtectionLevel,
    photoCount: stats.photoCount,
    fiveStarCount: stats.fiveStarCount,
    profileCompleteness: stats.completeness,
    hasBehaviorShot: stats.behaviorCount > 0,
  })

  return {
    attribute: inferAttribute({
      orderName: species.orderName,
      familyName: species.familyName,
      ecoType: species.ecoType,
      habitats: species.habitats,
      group: species.group,
    }),
    stars: stars.value,
    starsSource: stars.detail,
    atk: atk.value,
    def: def.value,
    valueSource: `${atk.detail}；${def.detail}`,
    rarity: computeRarity(stars.value),
    title: buildTitle(species),
    effectText: summarizeForCard(species.summaryZh ?? species.note).text,
    recordText: buildRecordText(photo),
    photoId: photo?.id ?? null,
    crop: { x: 0.5, y: 0.5, scale: 1 },
  }
}

export function createCard(
  speciesId: number,
  input: Partial<Card> & { photoId?: number | null; useDefaults?: boolean } = {},
): Card {
  const species = getSpecies(speciesId)
  const defaults = buildCardDefaults(speciesId, input.photoId ?? null)
  const merged = { ...defaults, ...stripUndefined(input) }

  assertCardText({
    title: merged.title,
    effectText: merged.effectText,
    recordText: merged.recordText,
    backText: (input.backText ?? null) as string | null,
  })
  assertAttribute(merged.attribute)
  assertRarity(merged.rarity)
  assertNumbers({ stars: merged.stars, atk: merged.atk, def: merged.def })
  assertCrop(merged.crop as PhotoCrop)
  assertOverrides(input.overrides)
  assertLayers(input.layers)
  assertSerial(input.serialNo ?? null)

  const info = getDb()
    .prepare(
      `INSERT INTO cards (
        species_id, title, attribute, stars, stars_source, atk, def, value_source, rarity,
        photo_id, photo_crop, theme, preset, template_id, overrides, layers,
        effect_text, effect_source, record_text, serial_no, show_scientific, show_exif, holo,
        back_theme, back_emblem, back_text, back_print, back_gear_text, deck_id, sort_order
      ) VALUES (
        @speciesId, @title, @attribute, @stars, @starsSource, @atk, @def, @valueSource, @rarity,
        @photoId, @photoCrop, @theme, @preset, @templateId, @overrides, @layers,
        @effectText, @effectSource, @recordText, @serialNo, @showScientific, @showExif, @holo,
        @backTheme, @backEmblem, @backText, @backPrint, @backGearText, @deckId, @sortOrder
      )`,
    )
    .run({
      speciesId,
      title: merged.title ?? null,
      attribute: merged.attribute ?? '林',
      stars: merged.stars ?? 1,
      starsSource: merged.starsSource ?? null,
      atk: merged.atk ?? 0,
      def: merged.def ?? 0,
      valueSource: merged.valueSource ?? null,
      rarity: merged.rarity ?? 'N',
      photoId: merged.photoId ?? null,
      photoCrop: JSON.stringify(merged.crop ?? { x: 0.5, y: 0.5, scale: 1 }),
      theme: (input.theme as string) ?? null,
      preset: (input.preset as string) ?? 'classic',
      templateId: (input.templateId as number) ?? null,
      overrides: JSON.stringify(input.overrides ?? {}),
      layers: JSON.stringify(input.layers ?? []),
      effectText: merged.effectText ?? null,
      effectSource: input.effectSource === 'manual' ? 'manual' : 'auto',
      recordText: merged.recordText ?? null,
      serialNo: null,
      showScientific: input.showScientific === false ? 0 : 1,
      showExif: input.showExif === false ? 0 : 1,
      holo: input.holo ? 1 : 0,
      backTheme: (input.backTheme as string) ?? 'feather',
      backEmblem: (input.backEmblem as string) ?? null,
      backText: (input.backText as string) ?? null,
      backPrint: JSON.stringify(input.backPrint ?? defaultBackPrint()),
      backGearText:
        (input.backGearText as string) ??
        (buildGearText({
          cameraModel: null,
          lens: null,
          focalLen: null,
          aperture: null,
          shutter: null,
          iso: null,
          kind: 'dslr',
        }) ||
          null),
      deckId: (input.deckId as number) ?? null,
      sortOrder: (input.sortOrder as number) ?? 0,
    })

  const id = Number(info.lastInsertRowid)
  run(getDb(), 'UPDATE cards SET serial_no = ? WHERE id = ?', [buildSerialNo(id), id])

  const card = getCard(id)
  if (card.photoId) applyGearDefaults(card.id, card.photoId)
  logger.info({ id, speciesId: species.id }, '创建卡片')
  return getCard(id)
}

function applyGearDefaults(cardId: number, photoId: number): void {
  const photo = getPhoto(photoId)
  const gear = {
    cameraModel: photo.cameraModel,
    lens: photo.lens,
    focalLen: photo.focal35 ?? photo.focalLen,
    aperture: photo.aperture,
    shutter: photo.shutter,
    iso: photo.iso,
    kind: detectBodyKind(photo.cameraModel),
  }
  const print = buildBackPrintDefaults(gear)
  const card = getCard(cardId)
  const hasPrint = Object.values(card.backPrint ?? {}).some((item) => item && (item as { enabled?: boolean }).enabled)
  run(getDb(), 'UPDATE cards SET back_print = ?, back_gear_text = ? WHERE id = ?', [
    JSON.stringify(hasPrint ? card.backPrint : print),
    card.backGearText ?? buildGearText(gear),
    cardId,
  ])
}

function stripUndefined<T extends object>(input: T): Partial<T> {
  return Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined)) as Partial<T>
}

const CARD_FIELD_MAP: Record<string, string> = {
  title: 'title',
  attribute: 'attribute',
  stars: 'stars',
  starsSource: 'stars_source',
  atk: 'atk',
  def: 'def',
  valueSource: 'value_source',
  rarity: 'rarity',
  photoId: 'photo_id',
  theme: 'theme',
  preset: 'preset',
  templateId: 'template_id',
  effectText: 'effect_text',
  effectSource: 'effect_source',
  recordText: 'record_text',
  serialNo: 'serial_no',
  backTheme: 'back_theme',
  backEmblem: 'back_emblem',
  backText: 'back_text',
  backGearText: 'back_gear_text',
  deckId: 'deck_id',
  sortOrder: 'sort_order',
}

const JSON_FIELDS = new Set(['photoCrop', 'overrides', 'layers', 'backPrint'])
const BOOL_FIELDS = new Set(['showScientific', 'showExif', 'holo'])

export interface UpdateCardInput extends Partial<Card> {
  regenerateTexts?: boolean
}

export function updateCard(id: number, patch: UpdateCardInput): Card {
  const current = getCard(id)
  const next = { ...current, ...stripUndefined(patch) }

  assertCardText({
    title: next.title,
    effectText: next.effectText,
    recordText: next.recordText,
    backText: next.backText,
  })
  assertCardLines({ effectText: next.effectText, recordText: next.recordText })
  assertAttribute(next.attribute)
  assertRarity(next.rarity)
  assertNumbers({ stars: next.stars, atk: next.atk, def: next.def })
  assertCrop(next.photoCrop)
  assertOverrides(patch.overrides ?? current.overrides)
  assertLayers(patch.layers ?? current.layers)
  assertSerial(next.serialNo)

  const sets: string[] = []
  const params: unknown[] = []
  for (const [key, column] of Object.entries(CARD_FIELD_MAP)) {
    if (!(key in patch) || patch[key as keyof UpdateCardInput] === undefined) continue
    sets.push(`${column} = ?`)
    params.push((patch as Record<string, unknown>)[key] as string | number | null)
  }
  if (patch.photoCrop) {
    sets.push('photo_crop = ?')
    params.push(JSON.stringify(patch.photoCrop))
  }
  if (patch.overrides) {
    sets.push('overrides = ?')
    params.push(JSON.stringify(patch.overrides))
  }
  if (patch.layers) {
    sets.push('layers = ?')
    params.push(JSON.stringify(patch.layers))
  }
  if (patch.backPrint) {
    sets.push('back_print = ?')
    params.push(JSON.stringify(patch.backPrint))
  }
  for (const key of BOOL_FIELDS) {
    if (!(key in patch) || patch[key as keyof UpdateCardInput] === undefined) continue
    sets.push(`${snake(key)} = ?`)
    params.push(patch[key as keyof UpdateCardInput] ? 1 : 0)
  }

  if (patch.effectText !== undefined && patch.effectSource === undefined) {
    sets.push('effect_source = ?')
    params.push('manual')
  }
  if (patch.photoId !== undefined && patch.photoId !== current.photoId) {
    const photo = patch.photoId ? getPhoto(patch.photoId) : null
    if (photo) {
      sets.push('record_text = ?')
      params.push(buildRecordText(photo).slice(0, 50))
    }
  }

  if (sets.length) {
    sets.push(`updated_at = datetime('now')`)
    run(getDb(), `UPDATE cards SET ${sets.join(', ')} WHERE id = ?`, [...params, id])
  }

  if (patch.regenerateTexts) regenerateTexts(id)
  return getCard(id)
}

function snake(key: string): string {
  return key.replace(/[A-Z]/g, (char) => `_${char.toLowerCase()}`)
}

/** 重新生成文本：仅在 effect_source=auto 时覆盖简介，文字超限则按句回退 */
export function regenerateTexts(id: number, force = false): Card {
  const card = getCard(id)
  const species = getSpecies(card.speciesId)
  const photo = card.photoId ? getPhoto(card.photoId) : pickDefaultPhoto(card.speciesId)
  const effect = summarizeForCard(species.summaryZh ?? species.note)
  const record = buildRecordText(photo)
  const useAuto = force || card.effectSource === 'auto'

  const sets = ['record_text = ?', `updated_at = datetime('now')`]
  const params: unknown[] = [record]
  if (useAuto) {
    sets.unshift('effect_text = ?')
    params.unshift(effect.text)
  }
  // 卡片还没有卡图时，用物种封面/最佳照片补上，避免卡面停在「待补充照片」
  if (card.photoId == null && photo) {
    sets.unshift('photo_id = ?')
    params.unshift(photo.id)
  }
  run(getDb(), `UPDATE cards SET ${sets.join(', ')} WHERE id = ?`, [...params, id])
  return getCard(id)
}

export function recalcValues(id: number): Card {
  const card = getCard(id)
  const species = getSpecies(card.speciesId)
  const stats = speciesStats(card.speciesId)
  const stars = computeStars({
    iucnStatus: species.iucnStatus,
    protectionLevel: species.cnProtectionLevel,
    isSanyou: species.isSanyou,
    photoCount: stats.photoCount,
    wishlistAchieved: species.isWishlist && stats.photoCount > 0,
  })
  const atk = computeAtk({
    stars: stars.value,
    protectionLevel: species.cnProtectionLevel,
    photoCount: stats.photoCount,
    fiveStarCount: stats.fiveStarCount,
    profileCompleteness: stats.completeness,
    hasBehaviorShot: stats.behaviorCount > 0,
  })
  const def = computeDef({
    stars: stars.value,
    protectionLevel: species.cnProtectionLevel,
    photoCount: stats.photoCount,
    fiveStarCount: stats.fiveStarCount,
    profileCompleteness: stats.completeness,
    hasBehaviorShot: stats.behaviorCount > 0,
  })
  run(
    getDb(),
    `UPDATE cards SET stars = ?, stars_source = ?, atk = ?, def = ?, value_source = ?, rarity = ?,
      updated_at = datetime('now') WHERE id = ?`,
    [stars.value, stars.detail, atk.value, def.value, `${atk.detail}；${def.detail}`, computeRarity(stars.value), id],
  )
  return getCard(id)
}

export function getCard(id: number): Card {
  const row = one<Row>(getDb(), 'SELECT * FROM cards WHERE id = ?', [id])
  if (!row) throw new ApiError(404, `未找到卡片 #${id}`)
  return mapCard(row)
}

export function getCardFull(id: number): CardFull {
  const card = getCard(id)
  const species = getSpecies(card.speciesId)
  const photo = card.photoId ? getPhoto(card.photoId) : null
  const summary = speciesPhotoSummary(card.speciesId)
  return {
    card,
    // 详情页直接读 species.photoCount / cardCount，这里补上聚合值
    species: { ...species, photoCount: summary.photoCount, cardCount: cardCountOf(card.speciesId) },
    photo,
    photos: photoCandidates(card.speciesId),
    editable: { photoCount: summary.photoCount, fiveStarCount: summary.fiveStarCount, behaviorCount: summary.behaviorCount },
  }
}

export function deleteCard(id: number): void {
  getCard(id)
  run(getDb(), 'DELETE FROM cards WHERE id = ?', [id])
}

export function duplicateCard(id: number): Card {
  const source = getCard(id)
  return createCard(source.speciesId, {
    ...source,
    title: source.title,
    serialNo: null,
    preset: source.preset ?? 'classic',
  })
}

export function listCards(filters: CardFilters): { items: CardListItem[]; total: number } {
  const db = getDb()
  const clauses: string[] = []
  const params: unknown[] = []
  if (filters.rarity) {
    clauses.push('c.rarity = ?')
    params.push(filters.rarity)
  }
  if (filters.attribute) {
    clauses.push('c.attribute = ?')
    params.push(filters.attribute)
  }
  if (filters.group) {
    clauses.push('s.grp = ?')
    params.push(filters.group)
  }
  if (filters.deckId) {
    clauses.push('c.deck_id = ?')
    params.push(filters.deckId)
  }
  if (filters.templateId) {
    clauses.push('c.template_id = ?')
    params.push(filters.templateId)
  }
  if (filters.speciesId) {
    clauses.push('c.species_id = ?')
    params.push(filters.speciesId)
  }
  if (filters.holo) clauses.push('c.holo = 1')
  if (filters.q) {
    clauses.push('(s.cn_name LIKE ? OR c.title LIKE ? OR c.serial_no LIKE ?)')
    const like = `%${filters.q}%`
    params.push(like, like, like)
  }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''
  const order =
    filters.sort === 'stars'
      ? 'c.stars DESC, c.id ASC'
      : filters.sort === 'serial'
        ? 'c.serial_no ASC'
        : filters.sort === 'rarity'
          ? `CASE c.rarity WHEN 'LEGEND' THEN 0 WHEN 'UR' THEN 1 WHEN 'SR' THEN 2 WHEN 'R' THEN 3 ELSE 4 END, c.stars DESC`
          : 'c.updated_at DESC, c.id DESC'

  const limit = Math.min(filters.limit ?? 120, 500)
  const offset = filters.offset ?? 0
  const rows = all<Row>(
    db,
    `SELECT c.*, s.cn_name, s.scientific_name, s.grp, s.family_name
     FROM cards c JOIN species s ON s.id = c.species_id
     ${where} ORDER BY ${order} LIMIT ? OFFSET ?`,
    [...params, limit, offset],
  )
  const total = Number(
    one<{ total: number }>(
      db,
      `SELECT COUNT(*) AS total FROM cards c JOIN species s ON s.id = c.species_id ${where}`,
      params,
    )?.total ?? 0,
  )

  return {
    items: rows.map((row) => ({
      ...mapCard(row),
      cnName: String(row.cn_name ?? ''),
      scientificName: (row.scientific_name as string) ?? null,
      group: String(row.grp ?? '鸟纲'),
      familyName: (row.family_name as string) ?? null,
      attributeColorKey: String(row.attribute ?? '林'),
      photoThumbId: row.photo_id == null ? null : Number(row.photo_id),
    })),
    total,
  }
}

export interface CardStatsBundle {
  total: number
  rarity: Array<{ name: string; count: number }>
  attribute: Array<{ name: string; count: number }>
  group: Array<{ name: string; count: number }>
  deck: Array<{ id: number; name: string; count: number }>
  stars: Array<{ stars: number; count: number }>
  recent: CardListItem[]
}

export function cardStats(): CardStatsBundle {
  const db = getDb()
  return {
    total: Number(one<{ total: number }>(db, 'SELECT COUNT(*) AS total FROM cards')?.total ?? 0),
    rarity: all<{ name: string; count: number }>(
      db,
      `SELECT rarity AS name, COUNT(*) AS count FROM cards
       GROUP BY rarity
       ORDER BY CASE rarity WHEN 'LEGEND' THEN 0 WHEN 'UR' THEN 1 WHEN 'SR' THEN 2 WHEN 'R' THEN 3 ELSE 4 END`,
    ),
    attribute: all<{ name: string; count: number }>(
      db,
      'SELECT attribute AS name, COUNT(*) AS count FROM cards GROUP BY attribute ORDER BY count DESC',
    ),
    group: all<{ name: string; count: number }>(
      db,
      `SELECT s.grp AS name, COUNT(*) AS count FROM cards c
       JOIN species s ON s.id = c.species_id GROUP BY s.grp ORDER BY count DESC`,
    ),
    deck: all<{ id: number; name: string; count: number }>(
      db,
      `SELECT d.id AS id, d.name AS name, COUNT(c.id) AS count FROM decks d
       LEFT JOIN cards c ON c.deck_id = d.id GROUP BY d.id ORDER BY d.sort_order ASC, d.id ASC`,
    ),
    stars: all<{ stars: number; count: number }>(
      db,
      'SELECT stars AS stars, COUNT(*) AS count FROM cards GROUP BY stars ORDER BY stars ASC',
    ),
    recent: listCards({ sort: 'recent', limit: 6 }).items,
  }
}

export type { CardCustomLayer }
export { textLength }
