import type { CSSProperties } from 'react'
import type { CardBackPrint, CardLayer, CardOverride } from '../api/types'
import { TEXT_METRICS } from './cardMetrics'

export type LayerKind = 'text' | 'image' | 'decor'

export interface LayerMeta {
  id: string
  label: string
  kind: LayerKind
  /** 该图层可编辑的内容提示 */
  hint?: string
  fontSize?: number
  maxChars?: number
}

/** 卡面 17 图层（顺序即渲染顺序） */
export const FRONT_LAYERS: LayerMeta[] = [
  { id: 'frame', label: '卡框', kind: 'decor' },
  { id: 'title', label: '称号', kind: 'text', hint: '一句话点题，≤12 字', fontSize: TEXT_METRICS.titleSize, maxChars: 12 },
  { id: 'name', label: '卡名', kind: 'text', hint: '中文名，≤10 字', fontSize: TEXT_METRICS.nameSize, maxChars: 10 },
  { id: 'scientific', label: '学名', kind: 'text', fontSize: TEXT_METRICS.scientificSize },
  { id: 'attribute', label: '属性', kind: 'text', fontSize: TEXT_METRICS.attributeSize },
  { id: 'stars', label: '星级', kind: 'decor' },
  { id: 'art', label: '卡图', kind: 'image' },
  {
    id: 'packCode',
    label: '卡包编号',
    kind: 'text',
    hint: '卡图右下角短码（拍摄日期，无日期时回落卡号）',
    fontSize: TEXT_METRICS.packCodeSize,
    maxChars: 12,
  },
  { id: 'typeLine', label: '类型行', kind: 'text', hint: '分类与生态型，≤22 字', fontSize: TEXT_METRICS.typeSize, maxChars: 22 },
  { id: 'effect', label: '物种简介', kind: 'text', hint: '卡面摘要，≤90 字 / 4 行', fontSize: TEXT_METRICS.effectSize, maxChars: 90 },
  { id: 'record', label: '拍摄记录', kind: 'text', hint: '日期地点与参数，≤50 字 / 2 行', fontSize: TEXT_METRICS.recordSize, maxChars: 50 },
  { id: 'atk', label: 'ATK 数值', kind: 'text', fontSize: TEXT_METRICS.valueSize },
  { id: 'def', label: 'DEF 数值', kind: 'text', fontSize: TEXT_METRICS.valueSize },
  { id: 'serial', label: '卡号', kind: 'text', fontSize: TEXT_METRICS.footerSize },
  { id: 'rarity', label: '稀有度', kind: 'decor' },
  { id: 'holo', label: '闪膜', kind: 'decor' },
  { id: 'watermark', label: '水印', kind: 'decor' },
]

/** 卡背 4 图层 */
export const BACK_LAYERS: LayerMeta[] = [
  { id: 'backBase', label: '底纹主题', kind: 'decor' },
  { id: 'backEmblem', label: '纹章', kind: 'decor' },
  { id: 'backPrints', label: '镜头印花', kind: 'decor' },
  { id: 'backText', label: '卡背文字', kind: 'text', hint: '一行自定义文字，≤20 字', maxChars: 20 },
]

export const ALL_LAYER_IDS = [...FRONT_LAYERS.map((layer) => layer.id), ...BACK_LAYERS.map((layer) => layer.id)]

export function layerMeta(id: string): LayerMeta {
  return [...FRONT_LAYERS, ...BACK_LAYERS].find((layer) => layer.id === id) ?? { id, label: id, kind: 'decor' }
}

/** 单个图层微调 → CSS 样式（位置/缩放/旋转/文字表现） */
export function overrideStyle(override: CardOverride | undefined, base: CSSProperties = {}): CSSProperties {
  if (!override) return { ...base }

  const style: CSSProperties = { ...base }

  if (override.dx || override.dy || override.scale || override.rotate) {
    const dx = override.dx ?? 0
    const dy = override.dy ?? 0
    const scale = override.scale ?? 1
    const rotate = override.rotate ?? 0
    style.transform = `translate(${dx}cqw, ${dy}cqw) scale(${scale}) rotate(${rotate}deg)`
  }

  if (override.color) style.color = override.color
  if (typeof override.fontScale === 'number') style.fontSize = `${override.fontScale}cqw`
  if (typeof override.fontWeight === 'number') style.fontWeight = override.fontWeight
  if (override.italic !== undefined) style.fontStyle = override.italic ? 'italic' : 'normal'
  if (typeof override.letterSpacing === 'number') style.letterSpacing = `${override.letterSpacing}em`
  if (override.textAlign) style.textAlign = override.textAlign
  if (typeof override.effects?.opacity === 'number') style.opacity = override.effects.opacity
  if (override.effects?.outline) style.WebkitTextStroke = '0.06cqw rgba(0,0,0,0.65)'
  if (override.effects?.shadow) style.textShadow = '0 0.25cqw 0.7cqw rgba(0,0,0,0.7)'
  if (override.effects?.gradient) {
    style.backgroundImage = override.effects.gradient
    style.WebkitBackgroundClip = 'text'
    style.WebkitTextFillColor = 'transparent'
  }

  return style
}

/** 图层是否可见（overrides.visible === false 视为隐藏） */
export function isLayerVisible(override: CardOverride | undefined): boolean {
  return override?.visible !== false
}

/** 多来源覆盖合并：后者优先（预设 → 模板 → 卡片微调） */
export function mergeOverrides(
  ...sets: Array<Record<string, CardOverride> | null | undefined>
): Record<string, CardOverride> {
  const merged: Record<string, CardOverride> = {}
  for (const set of sets) {
    if (!set) continue
    for (const [key, value] of Object.entries(set)) {
      merged[key] = { ...(merged[key] ?? {}), ...value }
    }
  }
  return merged
}

/** 印花配置默认值（与服务端 defaultBackPrint 一致） */
export const DEFAULT_BACK_PRINT: CardBackPrint = {
  aperture: { enabled: false, blades: 9, rotate: 0 },
  focusRing: { enabled: false },
  mount: { enabled: false },
  filmstrip: { enabled: false },
  viewfinder: { enabled: false },
  shutter: { enabled: false, density: 8 },
  exifRing: { enabled: false, text: '' },
  bodySilhouette: { enabled: false, kind: 'dslr' },
  intensity: 0.6,
  tone: 'gold',
}

/** 合并局部印花配置，缺失项回落到默认值 */
export function normalizeBackPrint(value: Partial<CardBackPrint> | null | undefined): CardBackPrint {
  const source = value ?? {}
  return {
    aperture: { ...DEFAULT_BACK_PRINT.aperture!, ...(source.aperture ?? {}) },
    focusRing: { ...DEFAULT_BACK_PRINT.focusRing!, ...(source.focusRing ?? {}) },
    mount: { ...DEFAULT_BACK_PRINT.mount!, ...(source.mount ?? {}) },
    filmstrip: { ...DEFAULT_BACK_PRINT.filmstrip!, ...(source.filmstrip ?? {}) },
    viewfinder: { ...DEFAULT_BACK_PRINT.viewfinder!, ...(source.viewfinder ?? {}) },
    shutter: { ...DEFAULT_BACK_PRINT.shutter!, ...(source.shutter ?? {}) },
    exifRing: { ...DEFAULT_BACK_PRINT.exifRing!, ...(source.exifRing ?? {}) },
    bodySilhouette: { ...DEFAULT_BACK_PRINT.bodySilhouette!, ...(source.bodySilhouette ?? {}) },
    intensity: source.intensity ?? DEFAULT_BACK_PRINT.intensity,
    tone: source.tone ?? DEFAULT_BACK_PRINT.tone,
  }
}

/** 印花是否全部关闭 */
export function isBackPrintEmpty(config: CardBackPrint): boolean {
  return !Object.entries(config)
    .filter(([key]) => !['intensity', 'tone'].includes(key))
    .some(([, value]) => (value as { enabled?: boolean } | undefined)?.enabled)
}

/** 自定义图层（文本/贴纸/水印）→ 样式 */
export function customLayerStyle(layer: CardLayer): CSSProperties {
  return {
    transform: `translate(${layer.dx ?? 0}cqw, ${layer.dy ?? 0}cqw) scale(${layer.scale ?? 1}) rotate(${layer.rotate ?? 0}deg)`,
    color: layer.color ?? undefined,
    fontSize: layer.fontSize === undefined ? undefined : `${layer.fontSize}cqw`,
    fontWeight: layer.fontWeight,
    opacity: layer.opacity,
    mixBlendMode: (layer.blendMode ?? 'normal') as CSSProperties['mixBlendMode'],
    textShadow: layer.shadow ? '0 0.25cqw 0.7cqw rgba(0,0,0,0.7)' : undefined,
  }
}
