import { getDb } from '../db'
import { all, one, parseList, type Row } from '../db/queries'

export interface OverviewStats {
  speciesCount: number
  photoCount: number
  placeCount: number
  cardCount: number
  familyCount: number
  orderCount: number
  fiveStarCount: number
  /** 五星照片占比（0–100，保留一位小数） */
  fiveStarRate: number
  favoriteCount: number
  wishlistCount: number
  wishlistAchieved: number
  cameraCount: number
  lensCount: number
  storageBytes: number
  /** 全部一级 + 二级 + 三有物种数 */
  protectionCovered: number
  /** 分档保护覆盖，供概览磁贴与详情页使用 */
  protectionCoverage: { national1: number; national2: number; sanyou: number; iucnThreatened: number }
  capturedDays: number
  /** 当前连续拍摄天数（等同 streakDays，保留两种命名以兼容前端） */
  currentStreak: number
  activeDays: number
  streakDays: number
  longestStreak: number
  lastCaptureAt: string | null
}

function num(value: unknown): number {
  return value == null ? 0 : Number(value)
}

export function overview(): OverviewStats {
  const db = getDb()
  const base = one<Row>(
    db,
    `SELECT
      (SELECT COUNT(*) FROM species) AS species_count,
      (SELECT COUNT(*) FROM photos) AS photo_count,
      (SELECT COUNT(*) FROM places) AS place_count,
      (SELECT COUNT(*) FROM cards) AS card_count,
      (SELECT COUNT(DISTINCT family_name) FROM species WHERE family_name IS NOT NULL) AS family_count,
      (SELECT COUNT(DISTINCT order_name) FROM species WHERE order_name IS NOT NULL) AS order_count,
      (SELECT COUNT(*) FROM photos WHERE rating >= 5) AS five_star,
      (SELECT COALESCE(SUM(file_size), 0) FROM photos) AS storage_bytes,
      (SELECT COUNT(*) FROM species WHERE is_wishlist = 1) AS wishlist,
      (SELECT COUNT(*) FROM species WHERE is_wishlist = 1 AND cover_photo_id IS NOT NULL) AS wishlist_done,
      (SELECT COUNT(*) FROM species WHERE cn_protection_level IN ('国家一级', '国家二级') OR is_sanyou = 1) AS protection_covered,
      (SELECT COUNT(*) FROM species WHERE is_favorite = 1) AS favorite_count,
      (SELECT COUNT(*) FROM species WHERE cn_protection_level LIKE '%一级%') AS national1,
      (SELECT COUNT(*) FROM species WHERE cn_protection_level LIKE '%二级%') AS national2,
      (SELECT COUNT(*) FROM species WHERE is_sanyou = 1) AS sanyou,
      (SELECT COUNT(*) FROM species WHERE iucn_status IN ('CR', 'EN', 'VU', 'NT')) AS iucn_threatened,
      (SELECT COUNT(DISTINCT camera_model) FROM photos WHERE camera_model IS NOT NULL) AS camera_count,
      (SELECT COUNT(DISTINCT lens) FROM photos WHERE lens IS NOT NULL) AS lens_count,
      (SELECT MAX(taken_at) FROM photos) AS last_taken`,
  )

  const days = all<{ day: string }>(
    db,
    `SELECT DISTINCT substr(taken_at, 1, 10) AS day FROM photos
     WHERE taken_at IS NOT NULL ORDER BY day ASC`,
  ).map((row) => row.day)

  const { current, longest } = streakFromDays(days)
  const fiveStarCount = num(base?.five_star)
  const photoCount = num(base?.photo_count)

  return {
    speciesCount: num(base?.species_count),
    photoCount,
    placeCount: num(base?.place_count),
    cardCount: num(base?.card_count),
    familyCount: num(base?.family_count),
    orderCount: num(base?.order_count),
    fiveStarCount,
    fiveStarRate: photoCount ? Number(((fiveStarCount / photoCount) * 100).toFixed(1)) : 0,
    favoriteCount: num(base?.favorite_count),
    wishlistCount: num(base?.wishlist),
    wishlistAchieved: num(base?.wishlist_done),
    cameraCount: num(base?.camera_count),
    lensCount: num(base?.lens_count),
    storageBytes: num(base?.storage_bytes),
    protectionCovered: num(base?.protection_covered),
    protectionCoverage: {
      national1: num(base?.national1),
      national2: num(base?.national2),
      sanyou: num(base?.sanyou),
      iucnThreatened: num(base?.iucn_threatened),
    },
    capturedDays: days.length,
    currentStreak: current,
    activeDays: days.length,
    streakDays: current,
    longestStreak: longest,
    lastCaptureAt: (base?.last_taken as string) ?? null,
  }
}

export function streakFromDays(days: string[]): { current: number; longest: number } {
  if (days.length === 0) return { current: 0, longest: 0 }
  const stamps = days.map((day) => Date.parse(`${day}T00:00:00Z`)).sort((a, b) => a - b)
  let longest = 1
  let run = 1
  for (let i = 1; i < stamps.length; i += 1) {
    const diff = Math.round((stamps[i] - stamps[i - 1]) / 86_400_000)
    run = diff === 1 ? run + 1 : 1
    longest = Math.max(longest, run)
  }

  const today = new Date()
  const todayStamp = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
  const last = stamps[stamps.length - 1]
  const gap = Math.round((todayStamp - last) / 86_400_000)
  if (gap > 1) return { current: 0, longest }

  let current = 1
  for (let i = stamps.length - 1; i > 0; i -= 1) {
    if (Math.round((stamps[i] - stamps[i - 1]) / 86_400_000) === 1) current += 1
    else break
  }
  return { current, longest: Math.max(longest, current) }
}

export function heatmap(year: number): Array<{ date: string; photos: number; species: number }> {
  return all<Row>(
    getDb(),
    `SELECT substr(taken_at, 1, 10) AS date, COUNT(*) AS photos,
       COUNT(DISTINCT species_id) AS species
     FROM photos
     WHERE taken_at IS NOT NULL AND substr(taken_at, 1, 4) = ?
     GROUP BY date ORDER BY date ASC`,
    [String(year)],
  ).map((row) => ({
    date: String(row.date),
    // count 与 photos 同值：热力日历按 count 上色，图表按 photos 展示
    count: num(row.photos),
    photos: num(row.photos),
    species: num(row.species),
  }))
}

export function monthly(months = 24): Array<{ month: string; photos: number; species: number }> {
  return all<Row>(
    getDb(),
    `SELECT substr(taken_at, 1, 7) AS month, COUNT(*) AS photos, COUNT(DISTINCT species_id) AS species
     FROM photos WHERE taken_at IS NOT NULL
     GROUP BY month ORDER BY month DESC LIMIT ?`,
    [months],
  )
    .map((row) => ({
      month: String(row.month),
      photos: num(row.photos),
      species: num(row.species),
    }))
    .reverse()
}

export interface GearRow {
  name: string
  photoCount: number
  speciesCount: number
  share: number
}

function gearBreakdown(column: 'camera_model' | 'lens'): GearRow[] {
  const rows = all<Row>(
    getDb(),
    `SELECT ${column} AS name, COUNT(*) AS photos, COUNT(DISTINCT species_id) AS species
     FROM photos WHERE ${column} IS NOT NULL AND ${column} != ''
     GROUP BY ${column} ORDER BY photos DESC`,
  )
  const total = rows.reduce((acc, row) => acc + num(row.photos), 0) || 1
  return rows.map((row) => ({
    name: String(row.name),
    photoCount: num(row.photos),
    speciesCount: num(row.species),
    // share 是百分比（0–100），前端环形图直接拼 %
    share: Number(((num(row.photos) / total) * 100).toFixed(1)),
  }))
}

function bucket(column: 'focal_35' | 'aperture' | 'iso', step: number, label: (value: number) => string) {
  const rows = all<{ value: number }>(
    getDb(),
    `SELECT ${column} AS value FROM photos WHERE ${column} IS NOT NULL AND ${column} > 0`,
  )
  const counter = new Map<string, number>()
  for (const row of rows) {
    const bucketStart = Math.floor(Number(row.value) / step) * step
    const key = label(bucketStart)
    counter.set(key, (counter.get(key) ?? 0) + 1)
  }
  return [...counter.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12)
}

export function gearStats(): {
  cameras: GearRow[]
  lenses: GearRow[]
  focal: Array<{ name: string; count: number }>
  aperture: Array<{ name: string; count: number }>
  iso: Array<{ name: string; count: number }>
  shutter: Array<{ name: string; count: number }>
  gearSpeciesRate: number
} {
  const cameras = gearBreakdown('camera_model')
  const lenses = gearBreakdown('lens')
  const totalSpecies = num(one<Row>(getDb(), 'SELECT COUNT(*) AS c FROM species')?.c)
  const gearSpecies = num(
    one<Row>(
      getDb(),
      `SELECT COUNT(DISTINCT species_id) AS c FROM photos
       WHERE species_id IS NOT NULL AND (camera_model IS NOT NULL OR lens IS NOT NULL)`,
    )?.c,
  )
  const shutterRows = all<Row>(
    getDb(),
    `SELECT shutter AS name, COUNT(*) AS count FROM photos
     WHERE shutter IS NOT NULL AND shutter != '' GROUP BY shutter ORDER BY count DESC LIMIT 12`,
  )

  return {
    cameras,
    lenses,
    focal: bucket('focal_35', 100, (value) => (value >= 600 ? '600mm+' : `${value}mm`)),
    aperture: bucket('aperture', 1, (value) => `f/${Math.max(1, value)}`),
    iso: bucket('iso', 800, (value) => (value >= 6400 ? '6400+' : `ISO ${value}`)),
    shutter: shutterRows.map((row) => ({ name: String(row.name), count: num(row.count) })),
    gearSpeciesRate: totalSpecies ? Number((gearSpecies / totalSpecies).toFixed(4)) : 0,
  }
}

type DistColumn =
  | 'grp'
  | 'order_name'
  | 'family_name'
  | 'cn_protection_level'
  | 'residence_type'
  | 'eco_type'

function distribution(column: DistColumn) {
  const db = getDb()
  const speciesRows = all<Row>(
    db,
    `SELECT COALESCE(${column}, '未录入') AS name, COUNT(*) AS species FROM species GROUP BY name`,
  )
  const photoRows = all<Row>(
    db,
    `SELECT COALESCE(s.${column}, '未录入') AS name, COUNT(*) AS photos
     FROM photos p JOIN species s ON s.id = p.species_id GROUP BY name`,
  )
  const photoMap = new Map(photoRows.map((row) => [String(row.name), num(row.photos)]))

  return speciesRows
    .map((row) => ({
      name: String(row.name),
      species: num(row.species),
      photos: photoMap.get(String(row.name)) ?? 0,
    }))
    .sort((a, b) => b.species - a.species || b.photos - a.photos)
    .slice(0, 30)
}

export function habitatDistribution(): Array<{ name: string; species: number; photos: number }> {
  const rows = all<{ id: number; habitats: string }>(
    getDb(),
    `SELECT id, habitats FROM species WHERE habitats IS NOT NULL AND habitats != ''`,
  )
  const photoRows = all<Row>(
    getDb(),
    `SELECT species_id, COUNT(*) AS photos FROM photos WHERE species_id IS NOT NULL GROUP BY species_id`,
  )
  const photosBySpecies = new Map(photoRows.map((row) => [num(row.species_id), num(row.photos)]))
  const counter = new Map<string, { species: number; photos: number }>()
  for (const row of rows) {
    for (const tag of parseList(row.habitats)) {
      const entry = counter.get(tag) ?? { species: 0, photos: 0 }
      entry.species += 1
      entry.photos += photosBySpecies.get(num(row.id)) ?? 0
      counter.set(tag, entry)
    }
  }
  return [...counter.entries()]
    .map(([name, value]) => ({ name, ...value }))
    .sort((a, b) => b.species - a.species || b.photos - a.photos)
}

export function statsBundle(year = new Date().getFullYear()) {
  const gear = gearStats()
  return {
    year,
    overview: overview(),
    heatmap: heatmap(year),
    monthly: monthly(),
    gear,
    /** 与 gear 同源的拆分视图，供图表组件直接消费 */
    cameras: gear.cameras,
    lenses: gear.lenses,
    groups: distribution('grp'),
    orders: distribution('order_name'),
    families: distribution('family_name'),
    protections: distribution('cn_protection_level'),
    residences: distribution('residence_type'),
    habitats: habitatDistribution(),
    places: placeRanking(),
    years: yearlyOptions(),
  }
}

import { placeRanking, yearlyOptions } from './statsRankings'

export { placeRanking, yearlyOptions }
