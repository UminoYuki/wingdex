import type { CSSProperties } from 'react'
import type { Card, CardOverride } from '../api/types'
import {
  BACK_LAYERS,
  FRONT_LAYERS,
  isLayerVisible,
  mergeOverrides,
  normalizeBackPrint,
  overrideStyle,
  type LayerMeta,
} from './layerSchema'
import { attributeColor, backThemeBackground, PAPER, PRINT_TONES, rarityKey, RARITY_STYLES, type PrintToneKey } from './cardTheme'
import { presetByKey } from './presets'
import { CARD_RADIUS } from './cardMetrics'

export interface ResolvedLayer {
  id: string
  label: string
  kind: 'text' | 'image' | 'decor'
  visible: boolean
  locked: boolean
  hidden: boolean
  style: CSSProperties
  override: CardOverride | undefined
}

export interface ResolvedCardStyle {
  front: {
    layers: ResolvedLayer[]
    frame: CSSProperties
    nameColor: string
    /**
     * 文本纸面（米色纸 + 墨色字）的墨色：各层 overrides.color 优先，未覆盖时取 PAPER 默认。
     * 纸面本身由 GameCard 用 PAPER.face / PAPER.edge 绘制，不随稀有度变化。
     */
    ink: {
      /** 类型行 */
      type: string
      /** 物种简介 */
      effect: string
      /** 拍摄记录 */
      record: string
      /** ATK·DEF 数值 */
      value: string
      /** ATK/ DEF/ 前缀 */
      label: string
      /** 框内分隔线 */
      rule: string
    }
    attribute: { start: string; end: string; text: string }
    rarity: { key: string; label: string; foil: boolean; nameColor: string; glow: string }
    holo: boolean
  }
  back: {
    layers: ResolvedLayer[]
    /** 底纹背景（多层 CSS 渐变叠加） */
    texture: string
    tone: PrintToneKey
    intensity: number
    emblem: string
    theme: string
    line: string
    faint: string
    textColor: string
  }
  texts: Record<string, string>
}

export interface ResolveContext {
  cnName: string
  scientificName: string | null
  title: string
  attribute: string
  stars: number
  typeLine: string
  effectText: string
  recordText: string
  atk: number
  def: number
  serialNo: string
  /** 卡包编号浮标（卡图右下角短码） */
  packCode: string
  rarity: string
  backText: string
  holo: boolean
  exifLine: string | null
}

/** 解析优先级：默认规则 → 预设 → 卡片 overrides（正面）/ backOverrides（背面） */
export function resolveCardStyle(card: Card, ctx: ResolveContext): ResolvedCardStyle {
  const preset = presetByKey(card.preset)
  const overrides = mergeOverrides(preset.overrides, card.overrides)
  const backOverrides = card.overrides ?? {}

  const buildLayers = (metas: LayerMeta[], source: Record<string, CardOverride>): ResolvedLayer[] =>
    metas.map((meta) => {
      const override = source[meta.id]
      const base: CSSProperties = {}
      if (meta.fontSize) {
        base.fontSize = `${meta.fontSize}cqw`
        base.lineHeight = meta.id === 'effect' || meta.id === 'record' ? '1.32' : '1.15'
      }
      return {
        id: meta.id,
        label: meta.label,
        kind: meta.kind,
        visible: isLayerVisible(override),
        locked: Boolean(override?.locked),
        hidden: !isLayerVisible(override),
        style: overrideStyle(override, base),
        override,
      }
    })

  const attribute = attributeColor(card.attribute)
  const rarityKeyValue = card.holo ? '传说' : rarityKey(card.rarity)
  const rarity = RARITY_STYLES[rarityKeyValue]
  const backPrint = normalizeBackPrint(card.backPrint)
  const tone = (backPrint.tone ?? 'gold') as PrintToneKey

  return {
    front: {
      layers: buildLayers(FRONT_LAYERS, overrides),
      frame: {
        background: rarity.frame,
        // 圆角由 cardMetrics 的 CARD_RADIUS 统一给出（真实游戏王卡为直角 0），卡面各层与 3D 薄片都从那里取
        borderRadius: `${CARD_RADIUS}cqw`,
      },
      nameColor: overrides.name?.color ?? rarity.nameColor,
      ink: {
        type: overrides.typeLine?.color ?? PAPER.ink,
        effect: overrides.effect?.color ?? PAPER.ink,
        record: overrides.record?.color ?? PAPER.inkSoft,
        value: overrides.atk?.color ?? overrides.def?.color ?? PAPER.ink,
        label: overrides.atk?.color ?? overrides.def?.color ?? PAPER.inkLabel,
        rule: PAPER.rule,
      },
      attribute,
      rarity: {
        key: rarityKeyValue,
        label: rarity.label,
        foil: rarity.foil,
        nameColor: rarity.nameColor,
        glow: rarity.glow,
      },
      holo: card.holo,
    },
    back: {
      layers: buildLayers(BACK_LAYERS, backOverrides),
      texture: backThemeBackground(card.backTheme),
      tone,
      intensity: backPrint.intensity ?? 0.6,
      emblem: card.backEmblem ?? 'feather',
      theme: card.backTheme,
      line: PRINT_TONES[tone].line,
      faint: PRINT_TONES[tone].faint,
      textColor: PRINT_TONES[tone].text,
    },
    texts: buildTexts(ctx, rarity.label, overrides, backOverrides),
  }
}

/** 文本解析：自动数据 → 图层 content 覆盖（编辑器写入 overrides[id].content） */
function buildTexts(
  ctx: ResolveContext,
  rarityLabel: string,
  overrides: Record<string, CardOverride>,
  backOverrides: Record<string, CardOverride>,
): Record<string, string> {
  const texts: Record<string, string> = {
    title: ctx.title,
    name: ctx.cnName,
    scientific: ctx.scientificName ?? '',
    attribute: ctx.attribute,
    stars: String(ctx.stars),
    typeLine: ctx.typeLine,
    effect: ctx.effectText,
    record: ctx.recordText,
    atk: String(ctx.atk),
    def: String(ctx.def),
    serial: ctx.serialNo,
    packCode: ctx.packCode,
    rarity: rarityLabel,
    backText: ctx.backText,
    exif: ctx.exifLine ?? '',
  }

  for (const meta of FRONT_LAYERS) {
    const content = overrides[meta.id]?.content
    if (typeof content === 'string' && content.trim()) texts[meta.id] = content
  }
  const backContent = backOverrides.backText?.content
  if (typeof backContent === 'string' && backContent.trim()) texts.backText = backContent

  return texts
}

export function layerOverrideOf(style: ResolvedCardStyle, id: string): CardOverride | undefined {
  return style.front.layers.find((layer) => layer.id === id)?.override
}
