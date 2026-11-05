import crypto from 'node:crypto'
import fs from 'node:fs'
import fsp from 'node:fs/promises'
import path from 'node:path'
import exifr from 'exifr'
import pLimit from 'p-limit'
import { getDb } from '../db'
import { all, mapPhoto, mapPlace, one, run, type Row } from '../db/queries'
import { logger } from '../logger'
import type { Photo } from '../types'
import { ApiError } from '../api/utils'
import { matchOrCreatePlace } from './placeService'
import { warmThumbs } from './thumbnailService'

export const SUPPORTED_EXT = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.heic',
  '.heif',
  '.tif',
  '.tiff',
  '.dng',
  '.raf',
  '.cr2',
  '.cr3',
  '.arw',
  '.nef',
  '.orf',
  '.rw2',
])

const SKIP_DIRS = new Set(['node_modules', '.git', '.data', '$RECYCLE.BIN', 'System Volume Information'])

const parseLimit = pLimit(4)

function isHidden(name: string): boolean {
  return name.startsWith('.') || name.startsWith('~$')
}

async function* walkFiles(dir: string): AsyncGenerator<string> {
  let entries: fs.Dirent[]
  try {
    entries = await fsp.readdir(dir, { withFileTypes: true })
  } catch (error) {
    logger.warn({ dir, err: String(error) }, '目录不可读，已跳过')
    return
  }

  for (const entry of entries) {
    if (isHidden(entry.name)) continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue
      yield* walkFiles(full)
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase()
      if (SUPPORTED_EXT.has(ext)) yield full
    }
  }
}

async function quickHash(file: string): Promise<string> {
  const stat = await fsp.stat(file)
  const handle = await fsp.open(file, 'r')
  try {
    const length = Math.min(1024 * 1024, stat.size)
    const buffer = Buffer.alloc(length)
    await handle.read(buffer, 0, length, 0)
    return crypto
      .createHash('sha256')
      .update(buffer)
      .update(String(stat.size))
      .digest('hex')
  } finally {
    await handle.close()
  }
}

interface ExifData {
  DateTimeOriginal?: Date
  CreateDate?: Date
  Make?: string
  Model?: string
  LensModel?: string
  LensInfo?: number[]
  FocalLength?: number
  FocalLengthIn35mmFormat?: number
  FNumber?: number
  ExposureTime?: number
  ISO?: number
  ExposureCompensation?: number
  latitude?: number
  longitude?: number
  GPSAltitude?: number
  ExifImageWidth?: number
  ExifImageHeight?: number
  Orientation?: number
}

async function readExif(file: string): Promise<ExifData> {
  return parseLimit(async () => {
    try {
      const data = await exifr.parse(file, {
        tiff: true,
        exif: true,
        gps: true,
        pick: [
          'DateTimeOriginal',
          'CreateDate',
          'Make',
          'Model',
          'LensModel',
          'LensInfo',
          'FocalLength',
          'FocalLengthIn35mmFormat',
          'FNumber',
          'ExposureTime',
          'ISO',
          'ExposureCompensation',
          'latitude',
          'longitude',
          'GPSAltitude',
          'ExifImageWidth',
          'ExifImageHeight',
          'Orientation',
        ],
      })
      return (data ?? {}) as ExifData
    } catch {
      return {}
    }
  })
}

function formatShutter(seconds: number | undefined): string | null {
  if (!seconds || !Number.isFinite(seconds)) return null
  if (seconds >= 1) return String(Math.round(seconds * 10) / 10)
  return `1/${Math.round(1 / seconds)}`
}

function normalizeModel(make: string | undefined, model: string | undefined): string | null {
  if (!model) return null
  const trimmed = model.trim()
  if (!make || trimmed.toUpperCase().startsWith(make.toUpperCase())) return trimmed
  return `${make.trim()} ${trimmed}`
}

export interface ScanResult {
  jobId: number
  root: string
  total: number
  imported: number
  duplicated: number
  failed: number
}

export async function scanDirectory(root: string, onProgress?: (processed: number, total: number) => void): Promise<ScanResult> {
  const resolved = path.resolve(root)
  if (!fs.existsSync(resolved)) throw new ApiError(400, `目录不存在：${resolved}`)
  if (!fs.statSync(resolved).isDirectory()) throw new ApiError(400, `${resolved} 不是目录`)

  const db = getDb()
  const job = db
    .prepare('INSERT INTO scan_jobs (root, status) VALUES (?, ?)')
    .run(resolved, 'running')
  const jobId = Number(job.lastInsertRowid)

  db.prepare(
    `INSERT INTO library_roots (path, last_scan_at) VALUES (?, datetime('now'))
     ON CONFLICT(path) DO UPDATE SET last_scan_at = datetime('now')`,
  ).run(resolved)

  let total = 0
  let imported = 0
  let duplicated = 0
  let failed = 0
  const newPhotos: Photo[] = []

  const insert = db.prepare(
    `INSERT INTO photos (
      species_id, file_path, file_name, ext, file_size, file_mtime, hash, width, height, orientation,
      taken_at, camera_make, camera_model, lens, focal_len, focal_35, aperture, shutter, iso,
      exposure_comp, gps_lat, gps_lon, gps_alt, thumb_state
    ) VALUES (
      NULL, @file_path, @file_name, @ext, @file_size, @file_mtime, @hash, @width, @height, @orientation,
      @taken_at, @camera_make, @camera_model, @lens, @focal_len, @focal_35, @aperture, @shutter, @iso,
      @exposure_comp, @gps_lat, @gps_lon, @gps_alt, 'pending'
    )
    ON CONFLICT(file_path) DO UPDATE SET
      file_size = excluded.file_size,
      file_mtime = excluded.file_mtime,
      hash = excluded.hash,
      taken_at = COALESCE(excluded.taken_at, photos.taken_at),
      camera_model = COALESCE(excluded.camera_model, photos.camera_model),
      lens = COALESCE(excluded.lens, photos.lens)
    RETURNING id`,
  )

  const hashIndex = new Map<string, number>()
  for (const row of all<{ id: number; hash: string }>(
    db,
    'SELECT id, hash FROM photos WHERE hash IS NOT NULL',
  )) {
    hashIndex.set(row.hash, Number(row.id))
  }

  const files: string[] = []
  for await (const file of walkFiles(resolved)) files.push(file)
  total = files.length

  for (const file of files) {
    try {
      const stat = await fsp.stat(file)
      const hash = await quickHash(file)

      if (hashIndex.has(hash)) {
        const existingPath = one<Row>(db, 'SELECT file_path FROM photos WHERE hash = ?', [hash])
        if (existingPath && String(existingPath.file_path) !== file) {
          duplicated += 1
          continue
        }
      }

      const exif = await readExif(file)
      const takenAt = (exif.DateTimeOriginal ?? exif.CreateDate ?? null) as Date | null
      const place =
        exif.latitude != null && exif.longitude != null
          ? matchOrCreatePlace(exif.latitude, exif.longitude)
          : null

      const row = insert.get({
        file_path: file,
        file_name: path.basename(file),
        ext: path.extname(file).toLowerCase(),
        file_size: stat.size,
        file_mtime: stat.mtime.toISOString(),
        hash,
        width: exif.ExifImageWidth ?? null,
        height: exif.ExifImageHeight ?? null,
        orientation: exif.Orientation ?? null,
        taken_at: takenAt ? new Date(takenAt).toISOString() : null,
        camera_make: exif.Make ?? null,
        camera_model: normalizeModel(exif.Make, exif.Model),
        lens: exif.LensModel ?? null,
        focal_len: exif.FocalLength ?? null,
        focal_35: exif.FocalLengthIn35mmFormat ?? null,
        aperture: exif.FNumber ?? null,
        shutter: formatShutter(exif.ExposureTime),
        iso: exif.ISO ?? null,
        exposure_comp: exif.ExposureCompensation ?? null,
        gps_lat: exif.latitude ?? null,
        gps_lon: exif.longitude ?? null,
        gps_alt: exif.GPSAltitude ?? null,
      }) as { id: number } | undefined

      if (row?.id) {
        hashIndex.set(hash, row.id)
        if (place) {
          db.prepare('UPDATE photos SET place_id = ?, place_name = ? WHERE id = ?').run(
            place.id,
            place.name,
            row.id,
          )
          db.prepare('UPDATE places SET use_count = use_count + 1 WHERE id = ?').run(place.id)
        }
        const photoRow = one<Row>(db, 'SELECT * FROM photos WHERE id = ?', [row.id])
        if (photoRow) newPhotos.push(mapPhoto(photoRow))
      }
      imported += 1
    } catch (error) {
      failed += 1
      logger.warn({ file, err: String(error) }, '照片导入失败')
    }

    const processed = imported + duplicated + failed
    if (processed % 25 === 0) {
      db.prepare('UPDATE scan_jobs SET processed = ?, imported = ?, duplicated = ?, failed = ?, total = ? WHERE id = ?').run(
        processed,
        imported,
        duplicated,
        failed,
        total,
        jobId,
      )
      onProgress?.(processed, total)
      await new Promise((resolve) => setImmediate(resolve))
    }
  }

  db.prepare(
    `UPDATE scan_jobs SET status = 'done', total = ?, processed = ?, imported = ?, duplicated = ?, failed = ?,
      finished_at = datetime('now') WHERE id = ?`,
  ).run(total, total, imported, duplicated, failed, jobId)

  db.prepare(
    `UPDATE library_roots SET photo_count = (SELECT COUNT(*) FROM photos WHERE file_path LIKE ? || '%') WHERE path = ?`,
  ).run(resolved, resolved)

  for (const photo of newPhotos) warmThumbs(photo)

  logger.info({ root: resolved, total, imported, duplicated, failed }, '扫描完成')
  return { jobId, root: resolved, total, imported, duplicated, failed }
}

export function listRoots(): Array<{ id: number; path: string; note: string | null; photoCount: number; lastScanAt: string | null }> {
  return all<Row>(getDb(), 'SELECT * FROM library_roots ORDER BY last_scan_at DESC').map((row) => ({
    id: Number(row.id),
    path: String(row.path),
    note: (row.note as string) ?? null,
    photoCount: Number(row.photo_count ?? 0),
    lastScanAt: (row.last_scan_at as string) ?? null,
  }))
}

export function removeRoot(id: number): void {
  run(getDb(), 'DELETE FROM library_roots WHERE id = ?', [id])
}

export function latestScanJob(): Row | undefined {
  return one<Row>(getDb(), 'SELECT * FROM scan_jobs ORDER BY id DESC LIMIT 1')
}

export function listJobs(limit = 10): Row[] {
  return all<Row>(getDb(), 'SELECT * FROM scan_jobs ORDER BY id DESC LIMIT ?', [limit])
}

export function recentPlacesInfo(): Row[] {
  return all<Row>(getDb(), 'SELECT * FROM places ORDER BY use_count DESC LIMIT 10')
}

export { mapPlace }
