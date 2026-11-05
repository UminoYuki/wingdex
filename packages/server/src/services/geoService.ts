import fs from 'node:fs'
import path from 'node:path'
import { feature } from 'topojson-client'
import type { FeatureCollection, Geometry } from 'geojson'
import { getDb } from '../db'
import { all, type Row } from '../db/queries'

interface MapPoint {
  lat: number
  lon: number
  photos: number
  species: number
  placeId: number | null
  placeName: string | null
  topSpecies: string | null
  firstTakenAt: string | null
  lastTakenAt: string | null
}

export interface MapFilters {
  habitat?: string
  speciesId?: number
  from?: string
  to?: string
  precision?: number
}

function num(value: unknown): number {
  return value == null ? 0 : Number(value)
}

export function mapPoints(filters: MapFilters = {}): MapPoint[] {
  const precision = Math.min(Math.max(filters.precision ?? 2, 0), 4)
  const factor = 10 ** precision
  const clauses = ['p.gps_lat IS NOT NULL', 'p.gps_lon IS NOT NULL']
  const params: unknown[] = []

  if (filters.speciesId) {
    clauses.push('p.species_id = ?')
    params.push(filters.speciesId)
  }
  if (filters.habitat) {
    clauses.push('s.habitats LIKE ?')
    params.push(`%${filters.habitat}%`)
  }
  if (filters.from) {
    clauses.push('p.taken_at >= ?')
    params.push(filters.from)
  }
  if (filters.to) {
    clauses.push('p.taken_at <= ?')
    params.push(filters.to)
  }

  const rows = all<Row>(
    getDb(),
    `SELECT
       ROUND(p.gps_lat * ${factor}) / ${factor} AS lat,
       ROUND(p.gps_lon * ${factor}) / ${factor} AS lon,
       COUNT(*) AS photos,
       COUNT(DISTINCT p.species_id) AS species,
       MIN(p.place_id) AS place_id,
       MIN(p.place_name) AS place_name,
       MIN(p.taken_at) AS first_taken,
       MAX(p.taken_at) AS last_taken
     FROM photos p LEFT JOIN species s ON s.id = p.species_id
     WHERE ${clauses.join(' AND ')}
     GROUP BY lat, lon
     ORDER BY photos DESC`,
    params,
  )

  return rows.map((row) => {
    const top = all<Row>(
      getDb(),
      `SELECT s.cn_name FROM photos p JOIN species s ON s.id = p.species_id
       WHERE ROUND(p.gps_lat * ${factor}) / ${factor} = ? AND ROUND(p.gps_lon * ${factor}) / ${factor} = ?
       GROUP BY s.id ORDER BY COUNT(*) DESC LIMIT 1`,
      [Number(row.lat), Number(row.lon)],
    )[0]

    return {
      lat: Number(row.lat),
      lon: Number(row.lon),
      photos: num(row.photos),
      species: num(row.species),
      placeId: row.place_id == null ? null : num(row.place_id),
      placeName: (row.place_name as string) ?? null,
      topSpecies: (top?.cn_name as string) ?? null,
      firstTakenAt: (row.first_taken as string) ?? null,
      lastTakenAt: (row.last_taken as string) ?? null,
    }
  })
}

export function photosWithoutGps(limit = 50): Array<{ id: number; fileName: string; placeName: string | null }> {
  return all<Row>(
    getDb(),
    `SELECT id, file_name, place_name FROM photos WHERE gps_lat IS NULL ORDER BY id DESC LIMIT ?`,
    [limit],
  ).map((row) => ({
    id: num(row.id),
    fileName: String(row.file_name),
    placeName: (row.place_name as string) ?? null,
  }))
}

let worldCache: FeatureCollection<Geometry> | null = null
let chinaCache: FeatureCollection<Geometry> | null = null

function resolveTopoFile(fileName: string): string | null {
  try {
    return require.resolve(`world-atlas/${fileName}`)
  } catch {
    // 回退：按 monorepo 常见层级逐级向上查找
  }

  let dir = __dirname
  for (let level = 0; level < 5; level += 1) {
    const candidate = path.join(dir, 'node_modules', 'world-atlas', fileName)
    if (fs.existsSync(candidate)) return candidate
    dir = path.dirname(dir)
  }
  return null
}

function loadTopo(fileName: string): FeatureCollection<Geometry> {
  const found = resolveTopoFile(fileName)
  if (!found) throw new Error(`缺少地图数据文件 ${fileName}，请先安装依赖 world-atlas`)
  const topo = JSON.parse(fs.readFileSync(found, 'utf8'))
  return feature(topo, topo.objects.countries) as unknown as FeatureCollection<Geometry>
}

export function world(): FeatureCollection<Geometry> {
  if (!worldCache) worldCache = loadTopo('countries-110m.json')
  return worldCache
}

/** 中国轮廓使用 50m 数据，更贴近观鸟点位分布 */
export function china(): FeatureCollection<Geometry> {
  if (!chinaCache) {
    const collection = loadTopo('countries-50m.json')
    chinaCache = {
      type: 'FeatureCollection',
      features: collection.features.filter((item) => String((item as { id?: string }).id) === '156'),
    }
  }
  return chinaCache
}
