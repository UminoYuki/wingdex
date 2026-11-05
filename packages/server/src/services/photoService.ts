import fs from 'node:fs'
import { getDb } from '../db'
import { all, mapPhoto, one, run, type Row } from '../db/queries'
import { logger } from '../logger'
import type { Photo } from '../types'
import { ApiError } from '../api/utils'
import { warmThumbs } from './thumbnailService'

export interface PhotoFilters {
  speciesId?: number
  unassigned?: boolean
  placeId?: number
  camera?: string
  lens?: string
  rating?: number
  favorite?: boolean
  from?: string
  to?: string
  q?: string
  order?: 'taken_desc' | 'taken_asc' | 'imported_desc'
  limit?: number
  offset?: number
}

function buildWhere(filters: PhotoFilters): { sql: string; params: unknown[] } {
  const clauses: string[] = []
  const params: unknown[] = []

  if (filters.unassigned) clauses.push('species_id IS NULL')
  else if (filters.speciesId) {
    clauses.push('species_id = ?')
    params.push(filters.speciesId)
  }
  if (filters.placeId) {
    clauses.push('place_id = ?')
    params.push(filters.placeId)
  }
  if (filters.camera) {
    clauses.push('camera_model = ?')
    params.push(filters.camera)
  }
  if (filters.lens) {
    clauses.push('lens = ?')
    params.push(filters.lens)
  }
  if (filters.rating) {
    clauses.push('rating >= ?')
    params.push(filters.rating)
  }
  if (filters.favorite) clauses.push('is_favorite = 1')
  if (filters.from) {
    clauses.push('taken_at >= ?')
    params.push(filters.from)
  }
  if (filters.to) {
    clauses.push('taken_at <= ?')
    params.push(filters.to)
  }
  if (filters.q) {
    clauses.push('(file_name LIKE ? OR place_name LIKE ? OR note LIKE ?)')
    const like = `%${filters.q}%`
    params.push(like, like, like)
  }

  return { sql: clauses.length ? `WHERE ${clauses.join(' AND ')}` : '', params }
}

const ORDER_SQL: Record<NonNullable<PhotoFilters['order']>, string> = {
  taken_desc: 'taken_at DESC NULLS LAST, id DESC',
  taken_asc: 'taken_at ASC NULLS LAST, id ASC',
  imported_desc: 'imported_at DESC, id DESC',
}

export function listPhotos(filters: PhotoFilters): { items: Photo[]; total: number } {
  const db = getDb()
  const where = buildWhere(filters)
  const limit = Math.min(filters.limit ?? 120, 500)
  const offset = filters.offset ?? 0
  const order = ORDER_SQL[filters.order ?? 'taken_desc']

  const rows = all<Row>(db, `SELECT * FROM photos ${where.sql} ORDER BY ${order} LIMIT ? OFFSET ?`, [
    ...where.params,
    limit,
    offset,
  ])
  const totalRow = one<{ total: number }>(db, `SELECT COUNT(*) AS total FROM photos ${where.sql}`, where.params)

  return { items: rows.map(mapPhoto), total: Number(totalRow?.total ?? 0) }
}

export function getPhoto(id: number): Photo {
  const row = one<Row>(getDb(), 'SELECT * FROM photos WHERE id = ?', [id])
  if (!row) throw new ApiError(404, `未找到照片 #${id}`)
  return mapPhoto(row)
}

export function assignPhotos(photoIds: number[], speciesId: number | null): number {
  const db = getDb()
  const stmt = db.prepare('UPDATE photos SET species_id = ? WHERE id = ?')
  const tx = db.transaction((ids: number[]) => {
    let changed = 0
    for (const id of ids) changed += stmt.run(speciesId, id).changes
    return changed
  })
  const changed = tx(photoIds)

  if (speciesId) {
    const cover = one<Row>(
      db,
      `SELECT cover_photo_id FROM species WHERE id = ?`,
      [speciesId],
    )
    if (!cover?.cover_photo_id) {
      const first = one<Row>(
        db,
        `SELECT id FROM photos WHERE species_id = ?
         ORDER BY rating DESC, taken_at ASC NULLS LAST LIMIT 1`,
        [speciesId],
      )
      if (first?.id) run(db, 'UPDATE species SET cover_photo_id = ? WHERE id = ?', [first.id, speciesId])
    }
  }

  logger.info({ count: changed, speciesId }, '照片指派完成')
  return changed
}

export interface UpdatePhotoInput {
  speciesId?: number | null
  placeId?: number | null
  rating?: number
  isFavorite?: boolean
  note?: string | null
  takenAt?: string | null
  tags?: string[]
}

const PHOTO_FIELD_MAP: Record<keyof UpdatePhotoInput, string> = {
  speciesId: 'species_id',
  placeId: 'place_id',
  rating: 'rating',
  isFavorite: 'is_favorite',
  note: 'note',
  takenAt: 'taken_at',
  tags: 'tags',
}

export function updatePhoto(id: number, patch: UpdatePhotoInput): Photo {
  const sets: string[] = []
  const params: unknown[] = []
  for (const [key, column] of Object.entries(PHOTO_FIELD_MAP)) {
    const typed = key as keyof UpdatePhotoInput
    if (!(typed in patch)) continue
    const value = patch[typed]
    sets.push(`${column} = ?`)
    if (key === 'tags') params.push(JSON.stringify(value ?? []))
    else if (key === 'isFavorite') params.push(value ? 1 : 0)
    else params.push((value as string | number | null) ?? null)
  }
  if (sets.length) {
    run(getDb(), `UPDATE photos SET ${sets.join(', ')} WHERE id = ?`, [...params, id])
  }
  return getPhoto(id)
}

export function deletePhoto(id: number, removeThumbs = true): void {
  const photo = getPhoto(id)
  run(getDb(), 'DELETE FROM photos WHERE id = ?', [id])
  if (removeThumbs && photo.id) {
    logger.info({ id }, '删除照片索引（原图保留）')
  }
}

export function setCover(photoId: number): Photo {
  const photo = getPhoto(photoId)
  if (!photo.speciesId) throw new ApiError(400, '该照片尚未指派物种，无法设为封面')
  run(getDb(), 'UPDATE species SET cover_photo_id = ? WHERE id = ?', [photoId, photo.speciesId])
  return photo
}

export function retryMissingThumbs(limit = 200): number {
  const rows = all<Row>(
    getDb(),
    `SELECT * FROM photos WHERE thumb_state != 'ok' OR thumb_state IS NULL LIMIT ?`,
    [limit],
  )
  let queued = 0
  for (const row of rows) {
    const photo = mapPhoto(row)
    if (fs.existsSync(photo.filePath)) {
      warmThumbs(photo)
      queued += 1
    } else {
      run(getDb(), `UPDATE photos SET thumb_state = 'missing' WHERE id = ?`, [photo.id])
    }
  }
  return queued
}

export function speciesPhotoSummary(speciesId: number): {
  photoCount: number
  fiveStarCount: number
  behaviorCount: number
  cameras: string[]
  lenses: string[]
} {
  const db = getDb()
  const stats = one<{ total: number; five: number }>(
    db,
    `SELECT COUNT(*) AS total, SUM(CASE WHEN rating >= 5 THEN 1 ELSE 0 END) AS five
     FROM photos WHERE species_id = ?`,
    [speciesId],
  )
  const behavior = one<{ total: number }>(
    db,
    `SELECT COUNT(*) AS total FROM photos WHERE species_id = ? AND (tags LIKE '%行为%' OR tags LIKE '%繁殖%' OR tags LIKE '%求偶%' OR tags LIKE '%育雏%')`,
    [speciesId],
  )
  const gear = all<{ camera_model: string | null; lens: string | null }>(
    db,
    `SELECT DISTINCT camera_model, lens FROM photos WHERE species_id = ?`,
    [speciesId],
  )

  return {
    photoCount: Number(stats?.total ?? 0),
    fiveStarCount: Number(stats?.five ?? 0),
    behaviorCount: Number(behavior?.total ?? 0),
    cameras: gear.map((item) => item.camera_model).filter((v): v is string => Boolean(v)),
    lenses: gear.map((item) => item.lens).filter((v): v is string => Boolean(v)),
  }
}
