import { getDb } from '../db'
import { all, mapPlace, one, run, type Row } from '../db/queries'
import type { Place } from '../types'
import { ApiError } from '../api/utils'

const EPSILON = 0.004

export function listPlaces(): Place[] {
  return all<Row>(
    getDb(),
    `SELECT p.*, (SELECT COUNT(*) FROM photos ph WHERE ph.place_id = p.id) AS photo_count
     FROM places p ORDER BY p.use_count DESC, p.name ASC`,
  ).map(mapPlace)
}

export function getPlace(id: number): Place {
  const row = one<Row>(getDb(), 'SELECT * FROM places WHERE id = ?', [id])
  if (!row) throw new ApiError(404, `未找到地点 #${id}`)
  return mapPlace(row)
}

export function createPlace(input: {
  name: string
  lat?: number | null
  lon?: number | null
  iconKey?: string | null
  note?: string | null
}): Place {
  const name = input.name.trim()
  if (!name) throw new ApiError(400, '地点名称不能为空')
  const info = getDb()
    .prepare('INSERT INTO places (name, lat, lon, icon_key, note) VALUES (?, ?, ?, ?, ?)')
    .run(name, input.lat ?? null, input.lon ?? null, input.iconKey ?? 'pin', input.note ?? null)
  return getPlace(Number(info.lastInsertRowid))
}

export function updatePlace(
  id: number,
  patch: { name?: string; iconKey?: string | null; note?: string | null; lat?: number | null; lon?: number | null },
): Place {
  const sets: string[] = []
  const params: unknown[] = []
  if (patch.name !== undefined) {
    sets.push('name = ?')
    params.push(patch.name)
  }
  if (patch.iconKey !== undefined) {
    sets.push('icon_key = ?')
    params.push(patch.iconKey)
  }
  if (patch.note !== undefined) {
    sets.push('note = ?')
    params.push(patch.note)
  }
  if (patch.lat !== undefined) {
    sets.push('lat = ?')
    params.push(patch.lat)
  }
  if (patch.lon !== undefined) {
    sets.push('lon = ?')
    params.push(patch.lon)
  }
  if (sets.length) {
    run(getDb(), `UPDATE places SET ${sets.join(', ')} WHERE id = ?`, [...params, id])
  }
  return getPlace(id)
}

export function deletePlace(id: number): void {
  run(getDb(), 'UPDATE photos SET place_id = NULL WHERE place_id = ?', [id])
  run(getDb(), 'DELETE FROM places WHERE id = ?', [id])
}

export function assignPhotoPlace(photoId: number, placeId: number | null): void {
  if (placeId == null) {
    run(getDb(), 'UPDATE photos SET place_id = NULL, place_name = NULL WHERE id = ?', [photoId])
    return
  }
  const place = getPlace(placeId)
  run(getDb(), 'UPDATE photos SET place_id = ?, place_name = ? WHERE id = ?', [
    place.id,
    place.name,
    photoId,
  ])
  run(getDb(), 'UPDATE places SET use_count = use_count + 1 WHERE id = ?', [place.id])
}

export function findNearby(lat: number, lon: number): Place | null {
  const row = one<Row>(
    getDb(),
    `SELECT * FROM places
     WHERE lat IS NOT NULL AND lon IS NOT NULL
       AND ABS(lat - ?) < ? AND ABS(lon - ?) < ?
     ORDER BY ABS(lat - ?) + ABS(lon - ?) ASC LIMIT 1`,
    [lat, EPSILON, lon, EPSILON, lat, lon],
  )
  return row ? mapPlace(row) : null
}

export function formatCoordName(lat: number, lon: number): string {
  const ns = lat >= 0 ? 'N' : 'S'
  const ew = lon >= 0 ? 'E' : 'W'
  return `${Math.abs(lat).toFixed(3)}°${ns} ${Math.abs(lon).toFixed(3)}°${ew}`
}

/** 扫描时按 GPS 自动落点：命中附近地点则复用，否则按坐标创建待命名地点 */
export function matchOrCreatePlace(lat: number, lon: number): Place {
  const nearby = findNearby(lat, lon)
  if (nearby) return nearby
  const info = getDb()
    .prepare('INSERT INTO places (name, lat, lon, icon_key, note) VALUES (?, ?, ?, ?, ?)')
    .run(formatCoordName(lat, lon), lat, lon, 'pin', '扫描自动生成，可重命名')
  const created = getPlace(Number(info.lastInsertRowid))
  return created
}

export interface PlaceStat extends Place {
  photoCount: number
  speciesCount: number
  firstTakenAt: string | null
}

export function placeStats(): PlaceStat[] {
  return all<Row>(
    getDb(),
    `SELECT p.*,
      (SELECT COUNT(*) FROM photos ph WHERE ph.place_id = p.id) AS photo_count,
      (SELECT COUNT(DISTINCT ph.species_id) FROM photos ph WHERE ph.place_id = p.id AND ph.species_id IS NOT NULL) AS species_count,
      (SELECT MIN(ph.taken_at) FROM photos ph WHERE ph.place_id = p.id) AS first_taken_at
     FROM places p
     ORDER BY photo_count DESC, p.use_count DESC`,
  ).map((row) => ({
    ...mapPlace(row),
    photoCount: Number(row.photo_count ?? 0),
    speciesCount: Number(row.species_count ?? 0),
    firstTakenAt: (row.first_taken_at as string) ?? null,
  }))
}
