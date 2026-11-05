import fs from 'node:fs'
import fsp from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import type { Response } from 'express'
import { config } from '../config'
import { getDb } from '../db'
import { one } from '../db/queries'
import { logger } from '../logger'
import { ApiError } from '../api/utils'
import { ensureThumb, hasThumb, THUMB_SIZES, thumbPath, type ThumbSize } from './thumbnailService'
import { getPhoto } from './photoService'

const MIME: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.heic': 'image/heic',
  '.heif': 'image/heif',
  '.tif': 'image/tiff',
  '.tiff': 'image/tiff',
  '.dng': 'image/x-adobe-dng',
  '.raf': 'image/x-fuji-raf',
  '.cr2': 'image/x-canon-cr2',
  '.cr3': 'image/x-canon-cr3',
  '.arw': 'image/x-sony-arw',
  '.nef': 'image/x-nikon-nef',
  '.orf': 'image/x-olympus-orf',
  '.rw2': 'image/x-panasonic-rw2',
  '.mp3': 'audio/mpeg',
  '.m4a': 'audio/mp4',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.mp4': 'video/mp4',
  '.mov': 'video/quicktime',
  '.zip': 'application/zip',
}

export function mimeOf(file: string): string {
  return MIME[path.extname(file).toLowerCase()] ?? 'application/octet-stream'
}

/** 只允许受控字符，避免路径穿越 */
export function safeKey(key: string): string {
  if (!/^[\w.\-\u4e00-\u9fa5]+$/.test(key)) throw new ApiError(400, '非法资源标识')
  return key
}

function sendFile(res: Response, file: string, options: { download?: string; cache?: boolean } = {}): void {
  if (!fs.existsSync(file)) throw new ApiError(404, '文件不存在或已被移动')
  const headers: Record<string, string> = { 'Content-Type': mimeOf(file) }
  if (options.cache !== false) headers['Cache-Control'] = 'public, max-age=86400'
  if (options.download) {
    headers['Content-Disposition'] = `attachment; filename="${encodeURIComponent(options.download)}"`
  }
  res.sendFile(path.resolve(file), { headers })
}

export async function sendThumb(res: Response, photoId: number, size: ThumbSize): Promise<void> {
  const photo = getPhoto(photoId)
  if (!THUMB_SIZES.includes(size)) throw new ApiError(400, '不支持的缩略图档位')
  const file = hasThumb(photoId, size) ? thumbPath(photoId, size) : await ensureThumb(photo, size)
  sendFile(res, file)
}

export async function sendPhotoFull(res: Response, photoId: number, maxWidth?: number): Promise<void> {
  const photo = getPhoto(photoId)
  if (!fs.existsSync(photo.filePath)) throw new ApiError(410, '原图已不可访问')

  if (!maxWidth || maxWidth <= 0 || photo.ext === null) {
    sendFile(res, photo.filePath)
    return
  }

  const target = path.join(config.cacheDir, 'preview', `${photoId}_${maxWidth}.jpg`)
  if (!fs.existsSync(target)) {
    fs.mkdirSync(path.dirname(target), { recursive: true })
    try {
      await sharp(photo.filePath, { failOn: 'none', limitInputPixels: 1_200_000_000 })
        .rotate()
        .resize({ width: maxWidth, withoutEnlargement: true })
        .jpeg({ quality: 88, mozjpeg: true })
        .toFile(target)
    } catch (error) {
      logger.warn({ id: photoId, err: String(error) }, '预览图生成失败，回退原图')
      sendFile(res, photo.filePath)
      return
    }
  }
  sendFile(res, target)
}

export function sendWikiImage(res: Response, key: string): void {
  sendFile(res, path.join(config.wikiImageDir, safeKey(key)))
}

export function speciesAssetPath(speciesId: number, kind: 'sound' | 'video'): string | null {
  const row = one<{ sound_path: string | null; video_path: string | null }>(
    getDb(),
    'SELECT sound_path, video_path FROM species WHERE id = ?',
    [speciesId],
  )
  if (!row) throw new ApiError(404, `未找到物种 #${speciesId}`)
  return kind === 'sound' ? row.sound_path : row.video_path
}

export function sendSpeciesAsset(res: Response, speciesId: number, kind: 'sound' | 'video'): void {
  const file = speciesAssetPath(speciesId, kind)
  if (!file) throw new ApiError(404, kind === 'sound' ? '尚未录入鸣声文件' : '尚未录入视频文件')
  sendFile(res, file, { download: path.basename(file) })
}

export function sendAsset(res: Response, key: string): void {
  sendFile(res, path.join(config.assetDir, safeKey(key)))
}

export function sendExport(res: Response, file: string): void {
  const name = path.basename(safeKey(file))
  sendFile(res, path.join(config.exportDir, name), { download: name, cache: false })
}

export interface StoredAsset {
  key: string
  url: string
  bytes: number
}

/** 编辑器贴纸/印章：前端压缩后上传 dataURL，服务端落盘为本地资源 */
export async function storeSticker(payload: {
  name: string
  dataUrl: string
}): Promise<StoredAsset> {
  const match = /^data:(image\/(?:png|jpeg|webp));base64,(.+)$/i.exec(payload.dataUrl)
  if (!match) throw new ApiError(400, '贴纸必须是 png/jpeg/webp 的 base64 数据')
  const ext = match[1] === 'image/png' ? '.png' : match[1] === 'image/webp' ? '.webp' : '.jpg'
  const base = path.basename(payload.name, path.extname(payload.name)).replace(/[^\w.\-\u4e00-\u9fa5]/g, '_')
  const key = `${base || 'sticker'}-${Date.now().toString(36)}${ext}`
  const buffer = Buffer.from(match[2], 'base64')
  if (buffer.byteLength > 6 * 1024 * 1024) throw new ApiError(413, '贴纸过大，请压缩到 6MB 以内')

  await fsp.writeFile(path.join(config.assetDir, key), buffer)
  return { key, url: `/api/media/asset/${encodeURIComponent(key)}`, bytes: buffer.byteLength }
}

export function listStickers(): StoredAsset[] {
  if (!fs.existsSync(config.assetDir)) return []
  return fs
    .readdirSync(config.assetDir)
    .filter((name) => /\.(png|jpe?g|webp)$/i.test(name))
    .map((name) => ({
      key: name,
      url: `/api/media/asset/${encodeURIComponent(name)}`,
      bytes: fs.statSync(path.join(config.assetDir, name)).size,
    }))
}

export function deleteSticker(key: string): void {
  const file = path.join(config.assetDir, safeKey(key))
  if (fs.existsSync(file)) fs.unlinkSync(file)
}
