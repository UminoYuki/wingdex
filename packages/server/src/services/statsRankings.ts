/** 统计中的「榜单类」查询：地点排行与有照片的年份选项 */
import { getDb } from '../db'
import { all, type Row } from '../db/queries'

export function placeRanking(limit = 12): Array<{
  id: number
  name: string
  lat: number | null
  lon: number | null
  photos: number
  species: number
}> {
  return all<Row>(
    getDb(),
    `SELECT p.id, p.name, p.lat, p.lon,
      (SELECT COUNT(*) FROM photos ph WHERE ph.place_id = p.id) AS photos,
      (SELECT COUNT(DISTINCT ph.species_id) FROM photos ph WHERE ph.place_id = p.id AND ph.species_id IS NOT NULL) AS species
     FROM places p ORDER BY photos DESC LIMIT ?`,
    [limit],
  ).map((row) => ({
    id: Number(row.id),
    name: String(row.name),
    lat: row.lat == null ? null : Number(row.lat),
    lon: row.lon == null ? null : Number(row.lon),
    photos: row.photos == null ? 0 : Number(row.photos),
    species: row.species == null ? 0 : Number(row.species),
  }))
}

export function yearlyOptions(): number[] {
  const rows = all<{ year: string }>(
    getDb(),
    `SELECT DISTINCT substr(taken_at, 1, 4) AS year FROM photos WHERE taken_at IS NOT NULL ORDER BY year DESC`,
  )
  const years = rows.map((row) => Number(row.year)).filter((value) => Number.isFinite(value))
  const current = new Date().getFullYear()
  if (!years.includes(current)) years.unshift(current)
  return years
}
