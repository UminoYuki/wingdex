import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'
import pLimit from 'p-limit'
import { config } from '../config'
import { logger } from '../logger'
import type { Photo, PhotoCrop } from '../types'
import { ApiError } from '../api/utils'

export const THUMB_SIZES = [240, 640, 1600] as const
export type ThumbSize = (typeof THUMB_SIZES)[number]

const warmLimit = pLimit(2)

export function thumbFileName(photoId: number, size: ThumbSize): string {
  return `${photoId}_${size}.webp`
}

export function thumbPath(photoId: number, size: ThumbSize): string {
  return path.join(config.thumbDir, thumbFileName(photoId, size))
}

export function hasThumb(photoId: number, size: ThumbSize): boolean {
  const file = thumbPath(photoId, size)
  return fs.existsSync(file) && fs.statSync(file).size > 512
}

export async function ensureThumb(photo: Photo, size: ThumbSize): Promise<string> {
  const target = thumbPath(photo.id, size)
  if (hasThumb(photo.id, size)) return target
  if (!fs.existsSync(photo.filePath)) {
    throw new ApiError(410, '原图已不可访问，请重新定位照片目录')
  }

  await sharp(photo.filePath, { failOn: 'none', limitInputPixels: 1_200_000_000 })
    .rotate()
    .resize({ width: size, height: size, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: size >= 1600 ? 82 : 76 })
    .toFile(target)

  return target
}

export function warmThumbs(photo: Photo, sizes: ThumbSize[] = [240, 640]): void {
  for (const size of sizes) {
    if (hasThumb(photo.id, size)) continue
    void warmLimit(async () => {
      try {
        await ensureThumb(photo, size)
      } catch (error) {
        logger.warn({ id: photo.id, size, err: String(error) }, '缩略图生成失败')
      }
    })
  }
}

export interface CropResult {
  buffer: Buffer
  width: number
  height: number
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

/**
 * 卡图裁切：按调用方给定尺寸（对应卡面竖构图取景框，高:宽 ≈ 1.22:1）裁切，
 * crop 使用归一化中心点 + 缩放，保证任意档位裁切结果完全一致。
 */
export async function cropForCard(
  photo: Photo,
  crop: PhotoCrop,
  outWidth: number,
  outHeight: number,
): Promise<CropResult> {
  if (!fs.existsSync(photo.filePath)) {
    throw new ApiError(410, '原图已不可访问，无法生成卡图')
  }

  const pipeline = sharp(photo.filePath, { failOn: 'none', limitInputPixels: 1_200_000_000 }).rotate()
  const meta = await pipeline.metadata()
  const sourceW = meta.width ?? 0
  const sourceH = meta.height ?? 0
  if (!sourceW || !sourceH) throw new ApiError(415, '无法读取图片尺寸（可能是不支持的 RAW 格式）')

  const aspect = outWidth / outHeight
  const scale = clamp(crop.scale || 1, 1, 3)

  let cropW = Math.min(sourceW, sourceH * aspect)
  let cropH = cropW / aspect
  if (cropH > sourceH) {
    cropH = sourceH
    cropW = cropH * aspect
  }
  cropW = clamp(cropW / scale, 16, sourceW)
  cropH = clamp(cropH / scale, 16, sourceH)

  const centerX = clamp(crop.x ?? 0.5, 0, 1) * sourceW
  const centerY = clamp(crop.y ?? 0.5, 0, 1) * sourceH
  const left = Math.round(clamp(centerX - cropW / 2, 0, Math.max(0, sourceW - cropW)))
  const top = Math.round(clamp(centerY - cropH / 2, 0, Math.max(0, sourceH - cropH)))

  const buffer = await pipeline
    .extract({
      left,
      top,
      width: Math.max(16, Math.round(cropW)),
      height: Math.max(16, Math.round(cropH)),
    })
    .resize(outWidth, outHeight, { fit: 'fill' })
    .jpeg({ quality: 92, mozjpeg: true })
    .toBuffer()

  return { buffer, width: outWidth, height: outHeight }
}

export async function cardImageFile(
  photo: Photo,
  crop: PhotoCrop,
  outWidth: number,
  outHeight: number,
): Promise<string> {
  const key = `${photo.id}_${Math.round(crop.x * 1000)}_${Math.round(crop.y * 1000)}_${Math.round(
    (crop.scale || 1) * 100,
  )}_${outWidth}x${outHeight}`
  const target = path.join(config.cacheDir, 'cardimg', `${key}.jpg`)
  if (fs.existsSync(target) && fs.statSync(target).size > 512) return target
  fs.mkdirSync(path.dirname(target), { recursive: true })
  const result = await cropForCard(photo, crop, outWidth, outHeight)
  fs.writeFileSync(target, result.buffer)
  return target
}

export async function cleanThumbsFor(photoId: number): Promise<void> {
  for (const size of THUMB_SIZES) {
    const file = thumbPath(photoId, size)
    if (fs.existsSync(file)) fs.unlinkSync(file)
  }
}
