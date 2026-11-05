import { CARD_LINE_CHARS, CARD_LINE_LIMITS, CARD_TEXT_LIMITS } from '../config'
import { ATTRIBUTES, CARD_RATIO } from '../data/cardRules'
import type { CardCustomLayer, CardLayerAdjust, CardRarity, PhotoCrop } from '../types'
import { ApiError } from '../api/utils'

export const CARD_LAYER_IDS = [
  'frame',
  'title',
  'name',
  'scientific',
  'attribute',
  'stars',
  'art',
  'typeLine',
  'effect',
  'record',
  'atk',
  'def',
  'serial',
  'rarity',
  'holo',
  'watermark',
  'backBase',
  'backEmblem',
  'backPrints',
  'backText',
] as const

export const CARD_RARITIES: CardRarity[] = ['N', 'R', 'SR', 'UR', 'LEGEND']

export function textLength(text: string | null | undefined): number {
  return (text ?? '').trim().length
}

export function assertLimit(label: string, text: string | null | undefined, limit: number): void {
  const length = textLength(text)
  if (length > limit) {
    throw new ApiError(400, `${label}超出上限：${length}/${limit} 字`)
  }
}

export function assertCardText(input: {
  title?: string | null
  effectText?: string | null
  recordText?: string | null
  backText?: string | null
}): void {
  if (input.title !== undefined) assertLimit('称号', input.title, CARD_TEXT_LIMITS.title)
  if (input.effectText !== undefined) assertLimit('物种简介', input.effectText, CARD_TEXT_LIMITS.effect)
  if (input.recordText !== undefined) assertLimit('拍摄记录', input.recordText, CARD_TEXT_LIMITS.record)
  if (input.backText !== undefined) assertLimit('卡背文字', input.backText, CARD_TEXT_LIMITS.backText)

  const total = textLength(input.effectText) + textLength(input.recordText)
  if (total > CARD_TEXT_LIMITS.effectTotal) {
    throw new ApiError(
      400,
      `效果框总字数超出上限：${total}/${CARD_TEXT_LIMITS.effectTotal} 字（简介 ${CARD_TEXT_LIMITS.effect} + 记录 ${CARD_TEXT_LIMITS.record}）`,
    )
  }
}

/** 按中文字宽估算行数：中文 1，ASCII 0.55 */
export function estimateLines(text: string | null | undefined, charsPerLine: number): number {
  const clean = (text ?? '').replace(/\r/g, '')
  if (!clean) return 0
  return clean
    .split('\n')
    .map((line) => {
      const weight = [...line].reduce(
        (acc, char) => acc + (/[\u4e00-\u9fa5，。！？；：、（）「」]/.test(char) ? 1 : 0.55),
        0,
      )
      return Math.max(1, Math.ceil(weight / charsPerLine))
    })
    .reduce((acc, value) => acc + value, 0)
}

export function assertCardLines(input: { effectText?: string | null; recordText?: string | null }): void {
  if (input.effectText !== undefined) {
    const lines = estimateLines(input.effectText, CARD_LINE_CHARS.effect)
    if (lines > CARD_LINE_LIMITS.effect) {
      throw new ApiError(400, `物种简介预计 ${lines} 行，超过卡面 ${CARD_LINE_LIMITS.effect} 行容量`)
    }
  }
  if (input.recordText !== undefined) {
    const lines = estimateLines(input.recordText, CARD_LINE_CHARS.record)
    if (lines > CARD_LINE_LIMITS.record) {
      throw new ApiError(400, `拍摄记录预计 ${lines} 行，超过卡面 ${CARD_LINE_LIMITS.record} 行容量`)
    }
  }
}

export function assertAttribute(attribute: unknown): void {
  if (attribute !== undefined && !ATTRIBUTES.includes(attribute as never)) {
    throw new ApiError(400, `属性必须是：${ATTRIBUTES.join(' / ')}`)
  }
}

export function assertRarity(rarity: unknown): void {
  if (rarity !== undefined && !CARD_RARITIES.includes(rarity as CardRarity)) {
    throw new ApiError(400, `稀有度必须是：${CARD_RARITIES.join(' / ')}`)
  }
}

export function assertNumbers(input: { stars?: number; atk?: number; def?: number }): void {
  if (input.stars !== undefined) {
    const stars = Number(input.stars)
    if (!Number.isFinite(stars) || stars < 1 || stars > 10) throw new ApiError(400, '星级范围 1–10')
    if (Math.abs(stars * 2 - Math.round(stars * 2)) > 1e-6) throw new ApiError(400, '星级最小步进 0.5')
  }
  for (const [label, value] of [
    ['ATK', input.atk],
    ['DEF', input.def],
  ] as const) {
    if (value === undefined) continue
    const parsed = Number(value)
    if (!Number.isFinite(parsed) || parsed < 0 || parsed > 4000) {
      throw new ApiError(400, `${label} 范围 0–4000`)
    }
  }
}

export function assertCrop(crop: PhotoCrop | undefined): void {
  if (!crop) return
  const { x, y, scale } = crop
  if (![x, y, scale].every((value) => Number.isFinite(Number(value)))) {
    throw new ApiError(400, '裁切参数必须是数字')
  }
  if (x < 0 || x > 1 || y < 0 || y > 1) throw new ApiError(400, '裁切中心点范围 0–1')
  if (scale < 1 || scale > 3) throw new ApiError(400, '裁切缩放范围 1–3')
}

export function assertOverrides(overrides: Record<string, CardLayerAdjust> | undefined): void {
  if (!overrides) return
  for (const [key, value] of Object.entries(overrides)) {
    if (!CARD_LAYER_IDS.includes(key as (typeof CARD_LAYER_IDS)[number])) {
      throw new ApiError(400, `未知图层：${key}`)
    }
    if (value.dx !== undefined && (value.dx < -60 || value.dx > 60)) throw new ApiError(400, `${key} 水平偏移超范围`)
    if (value.dy !== undefined && (value.dy < -60 || value.dy > 60)) throw new ApiError(400, `${key} 垂直偏移超范围`)
    if (value.scale !== undefined && (value.scale < 0.6 || value.scale > 1.6)) {
      throw new ApiError(400, `${key} 缩放范围 0.6–1.6`)
    }
    if (value.rotate !== undefined && (value.rotate < -15 || value.rotate > 15)) {
      throw new ApiError(400, `${key} 旋转范围 ±15°`)
    }
    if (value.effects?.opacity !== undefined && (value.effects.opacity < 0 || value.effects.opacity > 1)) {
      throw new ApiError(400, `${key} 透明度范围 0–1`)
    }
  }
}

export function assertLayers(layers: CardCustomLayer[] | undefined): void {
  if (!layers) return
  if (layers.length > 12) throw new ApiError(400, '自定义图层最多 12 个')
  for (const layer of layers) {
    if (!['text', 'sticker', 'watermark'].includes(layer.kind)) {
      throw new ApiError(400, `自定义图层类型不合法：${layer.kind}`)
    }
    if (layer.kind === 'text') assertLimit('自定义文本', layer.content, 60)
    if (layer.kind === 'sticker' && !layer.assetKey) throw new ApiError(400, '贴纸图层缺少素材 key')

    const dx = layer.dx ?? 0
    const dy = layer.dy ?? 0
    const scale = layer.scale ?? 1
    const rotate = layer.rotate ?? 0

    if (dx < -50 || dx > 50 || dy < -50 || dy > 50) {
      throw new ApiError(400, '自定义图层位置范围 ±50%')
    }
    if (scale < 0.2 || scale > 3) throw new ApiError(400, '自定义图层缩放范围 0.2–3')
    if (rotate < -180 || rotate > 180) throw new ApiError(400, '自定义图层旋转范围 ±180°')
  }
}

export function assertRatio(width: number, height: number): void {
  const ratio = width / height
  const expected = CARD_RATIO.w / CARD_RATIO.h
  if (Math.abs(ratio - expected) > 0.01) {
    throw new ApiError(400, `卡片比例必须是 ${CARD_RATIO.w}:${CARD_RATIO.h}（当前 ${ratio.toFixed(4)}）`)
  }
}

export function assertSerial(serial: string | null | undefined): void {
  if (!serial) return
  if (!/^[A-Z]{2}-\d{4}$/.test(serial)) throw new ApiError(400, '卡号格式应为 BA-0000')
}
