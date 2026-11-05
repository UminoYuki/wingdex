import type { Card, Photo, Species } from '../api/types'
import type { GameCardData } from './GameCard'
import { exifRingText } from './prints'
import { formatDate } from '../lib/format'

/** 类型行：类群·目/科 + 生态型，超长时省略亚级（≤22 字） */
export function composeTypeLine(species: Pick<Species, 'group' | 'orderName' | 'familyName' | 'ecoType' | 'residenceType'>): string {
  const segments = [
    species.group ?? '未分类',
    [species.orderName, species.familyName].filter(Boolean).join('/') || null,
    species.ecoType ?? species.residenceType,
  ].filter(Boolean) as string[]

  const full = segments.join('·')
  if (full.length <= 22) return full

  const withoutEco = segments.slice(0, 2).join('·')
  if (withoutEco.length <= 22) return withoutEco

  return `${full.slice(0, 21)}…`
}

export interface CardExif {
  cameraModel: string | null
  lens: string | null
  focalLength: number | null
  aperture: string | null
  shutter: string | null
  iso: number | null
}

export function buildCardExif(photo: Photo | null | undefined): CardExif {
  return {
    cameraModel: photo?.cameraModel ?? null,
    lens: photo?.lens ?? null,
    focalLength: photo?.focalLen ?? null,
    aperture: photo?.aperture == null ? null : `f/${photo.aperture}`,
    shutter: photo?.shutter ?? null,
    iso: photo?.iso ?? null,
  }
}

/** 卡面渲染数据：物种 + 照片 + 卡片覆盖字段 */
export function buildCardData(
  card: Card,
  species: Pick<Species, 'cnName' | 'scientificName'>,
  photo?: Photo | null,
): GameCardData {
  const exif = buildCardExif(photo ?? null)
  return {
    cnName: species.cnName,
    scientificName: species.scientificName,
    title: card.title ?? '',
    attribute: card.attribute,
    stars: card.stars,
    typeLine: card.layers.find((layer) => layer.id === 'typeLine')?.content ?? '',
    effectText: card.effectText ?? '',
    recordText: card.recordText ?? '',
    photoId: card.photoId,
    exifLine: exifRingText(exif),
    packCode: packCodeOf(card, photo),
  }
}

/**
 * 卡包编号浮标（真实游戏王卡卡图右下角的短码，如 DOOD-JP012）：
 * 这里用照片的拍摄日期 YYYY.MM.DD 作短码，没有日期时回落卡号，保证任何视图都有编号。
 */
export function packCodeOf(card: Pick<Card, 'serialNo'>, photo?: Photo | null): string {
  const taken = photo?.takenAt
  if (taken) {
    const date = new Date(taken)
    if (!Number.isNaN(date.getTime())) {
      const pad = (value: number) => String(value).padStart(2, '0')
      return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())}`
    }
  }
  return card.serialNo ?? ''
}

/** 拍摄记录默认文本：日期 · 地点 + 一行参数 */
export function buildRecordText(photo: Photo | null | undefined, placeName: string | null | undefined): string {
  if (!photo) return ''
  const date = formatDate(photo.takenAt)
  const where = placeName ?? (photo.gpsLat !== null ? `${photo.gpsLat.toFixed(2)}, ${photo.gpsLon?.toFixed(2)}` : null)
  const gear = [photo.cameraModel, photo.lens].filter(Boolean).join(' + ')
  const focal = photo.focalLen ? `${photo.focalLen}mm` : null
  const params = [gear, focal].filter(Boolean).join(' ')

  return [where ? `${date} · ${where}` : date, params].filter(Boolean).join('\n').slice(0, 50)
}
