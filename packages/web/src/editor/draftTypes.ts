import type { Card, CardBackPrint, CardCrop, CardLayer, CardOverride } from '../api/types'
import { normalizeBackPrint } from '../card/layerSchema'

/** 编辑器草稿：卡面所有可编辑字段的扁平结构，便于撤销栈整体快照 */
export interface CardDraft {
  preset: string | null
  templateId: number | null
  title: string
  attribute: string
  stars: number
  atk: number
  def: number
  rarity: string
  holo: boolean
  showScientific: boolean
  showExif: boolean
  photoId: number | null
  photoCrop: CardCrop
  effectText: string
  recordText: string
  backText: string
  backTheme: string
  backEmblem: string
  backPrint: CardBackPrint
  overrides: Record<string, CardOverride>
  layers: CardLayer[]
}

/** 卡面文本硬上限（与服务端 cardRules 一致，超限不允许保存） */
export const TEXT_LIMITS = {
  title: 12,
  name: 10,
  typeLine: 22,
  effect: 90,
  record: 50,
  backText: 20,
} as const

/** 效果框总字数（简介 + 记录）上限 */
export const EFFECT_TOTAL_LIMIT = 140

/** 需要写回 cards 列、而不是 overrides.content 的图层 */
const CARD_COLUMN_LAYERS = ['title', 'effect', 'record', 'backText'] as const

export function isColumnLayer(id: string): boolean {
  return (CARD_COLUMN_LAYERS as readonly string[]).includes(id)
}

export function cardToDraft(card: Card): CardDraft {
  return {
    preset: card.preset,
    templateId: card.templateId,
    title: card.title ?? '',
    attribute: card.attribute,
    stars: card.stars,
    atk: card.atk,
    def: card.def,
    rarity: card.rarity,
    holo: card.holo,
    showScientific: card.showScientific,
    showExif: card.showExif,
    photoId: card.photoId,
    photoCrop: { ...card.photoCrop },
    effectText: card.effectText ?? '',
    recordText: card.recordText ?? '',
    backText: card.backText ?? '',
    backTheme: card.backTheme,
    backEmblem: card.backEmblem ?? 'feather',
    backPrint: normalizeBackPrint(card.backPrint),
    overrides: { ...card.overrides },
    layers: card.layers.map((layer) => ({ ...layer })),
  }
}

export function createCustomLayer(kind: CardLayer['kind'], index: number): CardLayer {
  return {
    id: `${kind}-${Date.now().toString(36)}-${index}`.slice(0, 38),
    kind,
    content: kind === 'text' ? '在这里写点什么' : '',
    assetKey: null,
    x: 50,
    y: kind === 'watermark' ? 88 : 50,
    dx: 0,
    dy: 0,
    scale: 1,
    rotate: 0,
    color: '#E8EFE9',
    fontSize: 6,
    fontWeight: 500,
    opacity: kind === 'watermark' ? 0.4 : 1,
    blendMode: 'normal',
    shadow: false,
  }
}

export interface DraftIssue {
  field: string
  message: string
}

/** 草稿 → 渲染用 Card（正反面、3D、离屏导出共用同一份数据） */
export function draftToCard(card: Card, draft: CardDraft): Card {
  return {
    ...card,
    preset: draft.preset,
    templateId: draft.templateId,
    title: draft.title || null,
    attribute: draft.attribute,
    stars: draft.stars,
    atk: draft.atk,
    def: draft.def,
    rarity: draft.rarity,
    holo: draft.holo,
    showScientific: draft.showScientific,
    showExif: draft.showExif,
    photoId: draft.photoId,
    photoCrop: draft.photoCrop,
    effectText: draft.effectText || null,
    recordText: draft.recordText || null,
    backText: draft.backText || null,
    backTheme: draft.backTheme,
    backEmblem: draft.backEmblem,
    backPrint: draft.backPrint,
    overrides: draft.overrides,
    layers: draft.layers,
  }
}

/** 字数与行数前置校验（行数在画布上另有实时提示） */
export function validateDraft(draft: CardDraft): DraftIssue[] {
  const issues: DraftIssue[] = []
  const push = (field: string, value: string, limit: number, label: string) => {
    if (value.length > limit) issues.push({ field, message: `${label} ${value.length}/${limit} 字，超出上限` })
  }

  push('title', draft.title, TEXT_LIMITS.title, '称号')
  push('name', draft.overrides.name?.content ?? '', TEXT_LIMITS.name, '卡名')
  push('typeLine', draft.overrides.typeLine?.content ?? '', TEXT_LIMITS.typeLine, '类型行')
  push('effect', draft.effectText, TEXT_LIMITS.effect, '物种简介')
  push('record', draft.recordText, TEXT_LIMITS.record, '拍摄记录')
  push('backText', draft.backText, TEXT_LIMITS.backText, '卡背文字')

  const total = draft.effectText.length + draft.recordText.length
  if (total > EFFECT_TOTAL_LIMIT) {
    issues.push({ field: 'effect', message: `效果框合计 ${total}/${EFFECT_TOTAL_LIMIT} 字，超出上限` })
  }

  return issues
}

/** 草稿 → PATCH /cards/:id 载荷（只发送卡片持久化字段） */
export function draftToPayload(draft: CardDraft): Record<string, unknown> {
  return {
    preset: draft.preset,
    templateId: draft.templateId,
    title: draft.title.trim() || null,
    attribute: draft.attribute,
    stars: draft.stars,
    atk: draft.atk,
    def: draft.def,
    rarity: draft.rarity,
    holo: draft.holo,
    showScientific: draft.showScientific,
    showExif: draft.showExif,
    photoId: draft.photoId,
    photoCrop: draft.photoCrop,
    effectText: draft.effectText || null,
    effectSource: 'manual',
    recordText: draft.recordText || null,
    backText: draft.backText || null,
    backTheme: draft.backTheme,
    backEmblem: draft.backEmblem,
    backPrint: draft.backPrint,
    overrides: draft.overrides,
    layers: draft.layers,
  }
}
