import type { Database } from 'better-sqlite3'
import { getDb } from './index'
import type {
  Card,
  CardBackPrintConfig,
  CardCustomLayer,
  CardLayerAdjust,
  Photo,
  PhotoCrop,
  Place,
  Species,
} from '../types'

export type Row = Record<string, unknown>

export function parseJson<T>(value: unknown, fallback: T): T {
  if (value == null || value === '') return fallback
  if (typeof value !== 'string') return value as T
  try {
    const parsed = JSON.parse(value)
    return (parsed ?? fallback) as T
  } catch {
    return fallback
  }
}

export function parseList(value: unknown): string[] {
  if (!value) return []
  if (Array.isArray(value)) return value as string[]
  const text = String(value)
  if (text.startsWith('[')) return parseJson<string[]>(text, [])
  return text
    .split(/[|,，;；]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

export function toBool(value: unknown): boolean {
  return value === 1 || value === true || value === '1'
}

export function mapSpecies(row: Row): Species {
  return {
    id: Number(row.id),
    group: String(row.grp ?? '鸟纲'),
    cnName: String(row.cn_name ?? ''),
    scientificName: (row.scientific_name as string) ?? null,
    enName: (row.en_name as string) ?? null,
    aliases: parseList(row.aliases),
    orderName: (row.order_name as string) ?? null,
    familyName: (row.family_name as string) ?? null,
    genusName: (row.genus_name as string) ?? null,
    iucnStatus: (row.iucn_status as Species['iucnStatus']) ?? null,
    iucnYear: row.iucn_year == null ? null : Number(row.iucn_year),
    cnProtectionLevel: (row.cn_protection_level as Species['cnProtectionLevel']) ?? null,
    cnProtectionSource: (row.cn_protection_source as string) ?? null,
    isSanyou: toBool(row.is_sanyou),
    lengthCm: (row.length_cm as string) ?? null,
    weightG: (row.weight_g as string) ?? null,
    wingspanCm: (row.wingspan_cm as string) ?? null,
    morphologySource: (row.morphology_source as string) ?? null,
    distribution: parseList(row.distribution),
    habitats: parseList(row.habitats),
    residenceType: (row.residence_type as string) ?? null,
    diet: (row.diet as string) ?? null,
    ecoType: (row.eco_type as string) ?? null,
    summaryZh: (row.summary_zh as string) ?? null,
    summaryEn: (row.summary_en as string) ?? null,
    wikiTitle: (row.wiki_title as string) ?? null,
    wikiUrl: (row.wiki_url as string) ?? null,
    wikiEnUrl: (row.wiki_en_url as string) ?? null,
    qid: (row.qid as string) ?? null,
    wikiImageKey: (row.wiki_image_key as string) ?? null,
    imageCredit: (row.image_credit as string) ?? null,
    soundPath: (row.sound_path as string) ?? null,
    videoPath: (row.video_path as string) ?? null,
    fetchStatus: (row.fetch_status as Species['fetchStatus']) ?? 'pending',
    fetchError: (row.fetch_error as string) ?? null,
    fetchedAt: (row.fetched_at as string) ?? null,
    coverPhotoId: row.cover_photo_id == null ? null : Number(row.cover_photo_id),
    isFavorite: toBool(row.is_favorite),
    isWishlist: toBool(row.is_wishlist),
    wishNote: (row.wish_note as string) ?? null,
    note: (row.note as string) ?? null,
    tags: parseList(row.tags),
    createdAt: String(row.created_at ?? ''),
  }
}

export function mapPhoto(row: Row): Photo {
  return {
    id: Number(row.id),
    speciesId: row.species_id == null ? null : Number(row.species_id),
    filePath: String(row.file_path ?? ''),
    fileName: String(row.file_name ?? ''),
    ext: (row.ext as string) ?? null,
    fileSize: row.file_size == null ? null : Number(row.file_size),
    fileMtime: (row.file_mtime as string) ?? null,
    hash: (row.hash as string) ?? null,
    width: row.width == null ? null : Number(row.width),
    height: row.height == null ? null : Number(row.height),
    orientation: row.orientation == null ? null : Number(row.orientation),
    takenAt: (row.taken_at as string) ?? null,
    cameraMake: (row.camera_make as string) ?? null,
    cameraModel: (row.camera_model as string) ?? null,
    lens: (row.lens as string) ?? null,
    focalLen: row.focal_len == null ? null : Number(row.focal_len),
    focal35: row.focal_35 == null ? null : Number(row.focal_35),
    aperture: row.aperture == null ? null : Number(row.aperture),
    shutter: (row.shutter as string) ?? null,
    iso: row.iso == null ? null : Number(row.iso),
    exposureComp: row.exposure_comp == null ? null : Number(row.exposure_comp),
    gpsLat: row.gps_lat == null ? null : Number(row.gps_lat),
    gpsLon: row.gps_lon == null ? null : Number(row.gps_lon),
    gpsAlt: row.gps_alt == null ? null : Number(row.gps_alt),
    placeId: row.place_id == null ? null : Number(row.place_id),
    placeName: (row.place_name as string) ?? null,
    isFavorite: toBool(row.is_favorite),
    rating: Number(row.rating ?? 0),
    note: (row.note as string) ?? null,
    tags: parseList(row.tags),
    thumbState: String(row.thumb_state ?? 'pending'),
    importedAt: String(row.imported_at ?? ''),
  }
}

export function mapPlace(row: Row): Place {
  return {
    id: Number(row.id),
    name: String(row.name ?? ''),
    lat: row.lat == null ? null : Number(row.lat),
    lon: row.lon == null ? null : Number(row.lon),
    iconKey: (row.icon_key as string) ?? null,
    note: (row.note as string) ?? null,
    useCount: Number(row.use_count ?? 0),
    createdAt: String(row.created_at ?? ''),
  }
}

export function mapCard(row: Row): Card {
  return {
    id: Number(row.id),
    speciesId: Number(row.species_id),
    title: (row.title as string) ?? null,
    attribute: (row.attribute as Card['attribute']) ?? '林',
    stars: Number(row.stars ?? 1),
    starsSource: (row.stars_source as string) ?? null,
    atk: Number(row.atk ?? 0),
    def: Number(row.def ?? 0),
    valueSource: (row.value_source as string) ?? null,
    rarity: (row.rarity as Card['rarity']) ?? 'N',
    photoId: row.photo_id == null ? null : Number(row.photo_id),
    photoCrop: parseJson<PhotoCrop>(row.photo_crop, { x: 0.5, y: 0.5, scale: 1 }),
    theme: (row.theme as string) ?? null,
    preset: (row.preset as string) ?? null,
    templateId: row.template_id == null ? null : Number(row.template_id),
    overrides: parseJson<Record<string, CardLayerAdjust>>(row.overrides, {}),
    layers: parseJson<CardCustomLayer[]>(row.layers, []),
    effectText: (row.effect_text as string) ?? null,
    effectSource: row.effect_source === 'manual' ? 'manual' : 'auto',
    recordText: (row.record_text as string) ?? null,
    serialNo: (row.serial_no as string) ?? null,
    showScientific: toBool(row.show_scientific ?? 1),
    showExif: toBool(row.show_exif ?? 1),
    holo: toBool(row.holo),
    backTheme: String(row.back_theme ?? 'feather'),
    backEmblem: (row.back_emblem as string) ?? null,
    backText: (row.back_text as string) ?? null,
    backPrint: parseJson<CardBackPrintConfig>(row.back_print, {}),
    backGearText: (row.back_gear_text as string) ?? null,
    deckId: row.deck_id == null ? null : Number(row.deck_id),
    sortOrder: Number(row.sort_order ?? 0),
    createdAt: String(row.created_at ?? ''),
    updatedAt: String(row.updated_at ?? ''),
  }
}

export function all<T = Row>(db: Database, sql: string, params: unknown[] = []): T[] {
  return db.prepare(sql).all(...(params as never[])) as T[]
}

export function one<T = Row>(db: Database, sql: string, params: unknown[] = []): T | undefined {
  return db.prepare(sql).get(...(params as never[])) as T | undefined
}

export function run(db: Database, sql: string, params: unknown[] = []): void {
  db.prepare(sql).run(...(params as never[]))
}

export function getMeta(key: string): string | null {
  const row = one<{ value: string }>(
    getDb(),
    'SELECT value FROM app_meta WHERE key = ?',
    [key],
  )
  return row?.value ?? null
}

export function setMeta(key: string, value: string): void {
  run(
    getDb(),
    `INSERT INTO app_meta (key, value, updated_at) VALUES (?, ?, datetime('now'))
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`,
    [key, value],
  )
}
