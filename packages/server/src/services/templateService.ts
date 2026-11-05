import { getDb } from '../db'
import { all, one, parseJson, run, type Row } from '../db/queries'
import { logger } from '../logger'
import type { CardCustomLayer, CardLayerAdjust, CardTemplate } from '../types'
import { ApiError } from '../api/utils'
import { getCard } from './cardService'
import { assertLayers, assertOverrides, assertLimit, CARD_LAYER_IDS } from './cardValidation'
import { CARD_TEXT_LIMITS } from '../config'

function mapTemplate(row: Row): CardTemplate {
  return {
    id: Number(row.id),
    name: String(row.name ?? ''),
    preset: (row.preset as string) ?? null,
    overrides: parseJson<Record<string, CardLayerAdjust>>(row.overrides, {}),
    layers: parseJson<CardCustomLayer[]>(row.layers, []),
    backConfig: parseJson<Record<string, unknown>>(row.back_config, {}),
    previewCardId: row.preview_card_id == null ? null : Number(row.preview_card_id),
    useCount: Number(row.use_count ?? 0),
    createdAt: String(row.created_at ?? ''),
    updatedAt: String(row.updated_at ?? ''),
  }
}

export function listTemplates(): CardTemplate[] {
  return all<Row>(getDb(), 'SELECT * FROM card_templates ORDER BY use_count DESC, updated_at DESC').map(mapTemplate)
}

export function getTemplate(id: number): CardTemplate {
  const row = one<Row>(getDb(), 'SELECT * FROM card_templates WHERE id = ?', [id])
  if (!row) throw new ApiError(404, `未找到模板 #${id}`)
  return mapTemplate(row)
}

export interface TemplateInput {
  name: string
  preset?: string | null
  overrides?: Record<string, CardLayerAdjust>
  layers?: CardCustomLayer[]
  backConfig?: Record<string, unknown>
  previewCardId?: number | null
}

export function createTemplate(input: TemplateInput): CardTemplate {
  const name = input.name.trim()
  if (!name) throw new ApiError(400, '模板名称不能为空')
  assertLimit('模板名称', name, 18)
  assertOverrides(input.overrides)
  assertLayers(input.layers)

  const info = getDb()
    .prepare(
      `INSERT INTO card_templates (name, preset, overrides, layers, back_config, preview_card_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .run(
      name,
      input.preset ?? 'classic',
      JSON.stringify(input.overrides ?? {}),
      JSON.stringify(input.layers ?? []),
      JSON.stringify(input.backConfig ?? {}),
      input.previewCardId ?? null,
    )
  logger.info({ id: Number(info.lastInsertRowid), name }, '保存卡片模板')
  return getTemplate(Number(info.lastInsertRowid))
}

export function updateTemplate(id: number, patch: Partial<TemplateInput>): CardTemplate {
  getTemplate(id)
  if (patch.name !== undefined) assertLimit('模板名称', patch.name, 18)
  assertOverrides(patch.overrides)
  assertLayers(patch.layers)

  const sets: string[] = []
  const params: unknown[] = []
  if (patch.name !== undefined) {
    sets.push('name = ?')
    params.push(patch.name)
  }
  if (patch.preset !== undefined) {
    sets.push('preset = ?')
    params.push(patch.preset)
  }
  if (patch.overrides !== undefined) {
    sets.push('overrides = ?')
    params.push(JSON.stringify(patch.overrides))
  }
  if (patch.layers !== undefined) {
    sets.push('layers = ?')
    params.push(JSON.stringify(patch.layers))
  }
  if (patch.backConfig !== undefined) {
    sets.push('back_config = ?')
    params.push(JSON.stringify(patch.backConfig))
  }
  if (patch.previewCardId !== undefined) {
    sets.push('preview_card_id = ?')
    params.push(patch.previewCardId)
  }
  if (sets.length) {
    sets.push(`updated_at = datetime('now')`)
    run(getDb(), `UPDATE card_templates SET ${sets.join(', ')} WHERE id = ?`, [...params, id])
  }
  return getTemplate(id)
}

export function deleteTemplate(id: number): void {
  getTemplate(id)
  run(getDb(), 'DELETE FROM card_templates WHERE id = ?', [id])
  run(getDb(), 'UPDATE cards SET template_id = NULL WHERE template_id = ?', [id])
}

export interface ApplyTemplateOptions {
  keepTexts?: boolean
  keepCrop?: boolean
}

/** 模板落地到卡片：overrides 深合并、layers 覆盖、卡背配置合并 */
export function applyTemplate(cardId: number, templateId: number, options: ApplyTemplateOptions = {}): number {
  const card = getCard(cardId)
  const template = getTemplate(templateId)

  const mergedOverrides: Record<string, CardLayerAdjust> = { ...card.overrides }
  for (const [key, value] of Object.entries(template.overrides)) {
    if (!CARD_LAYER_IDS.includes(key as (typeof CARD_LAYER_IDS)[number])) continue
    mergedOverrides[key] = { ...(mergedOverrides[key] ?? {}), ...value }
  }

  const backConfig = template.backConfig as {
    backTheme?: string
    backEmblem?: string | null
    backText?: string | null
    backPrint?: Record<string, unknown>
  }

  const sets = ['overrides = ?', 'layers = ?', 'template_id = ?', `updated_at = datetime('now')`]
  const params: unknown[] = [
    JSON.stringify(mergedOverrides),
    JSON.stringify(template.layers),
    templateId,
  ]

  if (template.preset) {
    sets.push('preset = ?')
    params.push(template.preset)
  }
  if (backConfig.backTheme) {
    sets.push('back_theme = ?')
    params.push(backConfig.backTheme)
  }
  if (backConfig.backEmblem !== undefined) {
    sets.push('back_emblem = ?')
    params.push(backConfig.backEmblem)
  }
  if (backConfig.backText !== undefined && !options.keepTexts) {
    assertLimit('卡背文字', backConfig.backText, CARD_TEXT_LIMITS.backText)
    sets.push('back_text = ?')
    params.push(backConfig.backText)
  }
  if (backConfig.backPrint) {
    sets.push('back_print = ?')
    params.push(JSON.stringify(backConfig.backPrint))
  }

  run(getDb(), `UPDATE cards SET ${sets.join(', ')} WHERE id = ?`, [...params, cardId])
  run(getDb(), 'UPDATE card_templates SET use_count = use_count + 1 WHERE id = ?', [templateId])
  logger.info({ cardId, templateId }, '应用卡片模板')
  return cardId
}

export function applyTemplateToSpecies(speciesId: number, templateId: number): number[] {
  const cards = all<{ id: number }>(getDb(), 'SELECT id FROM cards WHERE species_id = ?', [speciesId])
  for (const card of cards) applyTemplate(Number(card.id), templateId)
  return cards.map((card) => Number(card.id))
}

export function snapshotCardAsTemplate(cardId: number, name: string): CardTemplate {
  const card = getCard(cardId)
  return createTemplate({
    name,
    preset: card.preset,
    overrides: card.overrides,
    layers: card.layers,
    previewCardId: cardId,
    backConfig: {
      backTheme: card.backTheme,
      backEmblem: card.backEmblem,
      backPrint: card.backPrint,
    },
  })
}
