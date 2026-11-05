import { Router } from 'express'
import { z } from 'zod'
import { asyncHandler, parseBody, parseQuery, parseIntParam } from '../utils'
import {
  buildCardDefaults,
  cardStats,
  createCard,
  deleteCard,
  duplicateCard,
  getCardFull,
  listCards,
  photoCandidates,
  recalcValues,
  regenerateTexts,
  updateCard,
} from '../../services/cardService'
import { applyTemplate } from '../../services/templateService'
import { assignCards } from '../../services/deckService'

const router = Router()

const listSchema = z.object({
  rarity: z.string().max(10).optional(),
  attribute: z.string().max(4).optional(),
  group: z.string().max(10).optional(),
  deckId: z.coerce.number().int().positive().optional(),
  templateId: z.coerce.number().int().positive().optional(),
  speciesId: z.coerce.number().int().positive().optional(),
  holo: z.string().optional(),
  q: z.string().optional(),
  sort: z.enum(['recent', 'stars', 'serial', 'rarity']).optional(),
  limit: z.coerce.number().int().positive().max(500).optional(),
  offset: z.coerce.number().int().min(0).optional(),
})

router.get('/', (req, res) => {
  const query = parseQuery(listSchema, req.query)
  res.json(listCards({ ...query, holo: query.holo === '1' || query.holo === 'true' }))
})

router.get('/stats', (_req, res) => {
  res.json(cardStats())
})

const defaultsSchema = z.object({
  speciesId: z.coerce.number().int().positive(),
  photoId: z.coerce.number().int().positive().optional(),
})

router.get('/defaults', (req, res) => {
  const { speciesId, photoId } = parseQuery(defaultsSchema, req.query)
  res.json({ defaults: buildCardDefaults(speciesId, photoId ?? null), photos: photoCandidates(speciesId) })
})

router.get(
  '/candidates',
  asyncHandler((req, res) => {
    const { speciesId } = parseQuery(defaultsSchema.pick({ speciesId: true }), req.query)
    res.json({ items: photoCandidates(speciesId) })
  }),
)

const cropSchema = z.object({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  scale: z.number().min(1).max(3),
})

const layerAdjustSchema = z.object({
  visible: z.boolean().optional(),
  locked: z.boolean().optional(),
  order: z.number().int().min(0).max(40).optional(),
  dx: z.number().min(-60).max(60).optional(),
  dy: z.number().min(-60).max(60).optional(),
  scale: z.number().min(0.6).max(1.6).optional(),
  rotate: z.number().min(-15).max(15).optional(),
  color: z.string().max(30).nullable().optional(),
  fontScale: z.number().min(0.6).max(2).optional(),
  fontWeight: z.number().int().min(300).max(900).optional(),
  italic: z.boolean().optional(),
  letterSpacing: z.number().min(-2).max(4).optional(),
  textAlign: z.enum(['left', 'center', 'right']).optional(),
  effects: z
    .object({
      shadow: z.boolean().optional(),
      outline: z.boolean().optional(),
      opacity: z.number().min(0).max(1).optional(),
      gradient: z.string().max(80).nullable().optional(),
    })
    .optional(),
  content: z.string().max(120).nullable().optional(),
})

const customLayerSchema = z.object({
  id: z.string().min(1).max(40),
  kind: z.enum(['text', 'sticker', 'watermark']),
  content: z.string().max(60).optional(),
  assetKey: z.string().max(120).nullable().optional(),
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  dx: z.number().min(-50).max(50).optional(),
  dy: z.number().min(-50).max(50).optional(),
  scale: z.number().min(0.2).max(3).optional(),
  rotate: z.number().min(-180).max(180).optional(),
  color: z.string().max(30).nullable().optional(),
  fontSize: z.number().min(6).max(120).optional(),
  fontWeight: z.number().int().min(300).max(900).optional(),
  opacity: z.number().min(0).max(1).optional(),
  blendMode: z.string().max(20).optional(),
  shadow: z.boolean().optional(),
})

const cardBodySchema = z.object({
  speciesId: z.number().int().positive(),
  photoId: z.number().int().positive().nullable().optional(),
  title: z.string().max(40).nullable().optional(),
  attribute: z.string().max(4).optional(),
  stars: z.number().min(1).max(10).optional(),
  starsSource: z.string().max(200).nullable().optional(),
  atk: z.number().int().min(0).max(4000).optional(),
  def: z.number().int().min(0).max(4000).optional(),
  valueSource: z.string().max(300).nullable().optional(),
  rarity: z.string().max(10).optional(),
  photoCrop: cropSchema.optional(),
  theme: z.string().max(20).nullable().optional(),
  preset: z.string().max(20).nullable().optional(),
  templateId: z.number().int().positive().nullable().optional(),
  overrides: z.record(z.string(), layerAdjustSchema).optional(),
  layers: z.array(customLayerSchema).max(12).optional(),
  effectText: z.string().max(300).nullable().optional(),
  effectSource: z.enum(['auto', 'manual']).optional(),
  recordText: z.string().max(120).nullable().optional(),
  serialNo: z.string().max(12).nullable().optional(),
  showScientific: z.boolean().optional(),
  showExif: z.boolean().optional(),
  holo: z.boolean().optional(),
  backTheme: z.string().max(20).nullable().optional(),
  backEmblem: z.string().max(20).nullable().optional(),
  backText: z.string().max(40).nullable().optional(),
  backPrint: z.record(z.string(), z.unknown()).optional(),
  backGearText: z.string().max(120).nullable().optional(),
  deckId: z.number().int().positive().nullable().optional(),
  sortOrder: z.number().int().min(0).max(999).optional(),
})

router.post('/', (req, res) => {
  const { speciesId, ...rest } = parseBody(cardBodySchema, req.body)
  // zod 已做边界校验，卡片服务会再做一次业务校验（字数/数值/比例）
  res.status(201).json(createCard(speciesId, rest as Parameters<typeof createCard>[1]))
})

router.get(
  '/:id',
  asyncHandler((req, res) => {
    res.json(getCardFull(parseIntParam(req.params.id, 'id')))
  }),
)

const patchSchema = cardBodySchema.partial().extend({ regenerateTexts: z.boolean().optional() })

router.patch(
  '/:id',
  asyncHandler((req, res) => {
    const id = parseIntParam(req.params.id, 'id')
    const body = parseBody(patchSchema, req.body)
    const { speciesId, ...rest } = body
    res.json(updateCard(id, rest as Parameters<typeof updateCard>[1]))
  }),
)

router.delete(
  '/:id',
  asyncHandler((req, res) => {
    deleteCard(parseIntParam(req.params.id, 'id'))
    res.json({ ok: true })
  }),
)

router.post(
  '/:id/duplicate',
  asyncHandler((req, res) => {
    res.status(201).json(duplicateCard(parseIntParam(req.params.id, 'id')))
  }),
)

router.post(
  '/:id/regenerate',
  asyncHandler((req, res) => {
    const id = parseIntParam(req.params.id, 'id')
    const { force } = parseBody(z.object({ force: z.boolean().optional() }), req.body ?? {})
    res.json(regenerateTexts(id, force))
  }),
)

router.post(
  '/:id/recalc',
  asyncHandler((req, res) => {
    res.json(recalcValues(parseIntParam(req.params.id, 'id')))
  }),
)

router.post(
  '/:id/template',
  asyncHandler((req, res) => {
    const id = parseIntParam(req.params.id, 'id')
    const { templateId, keepTexts } = parseBody(
      z.object({ templateId: z.number().int().positive(), keepTexts: z.boolean().optional() }),
      req.body,
    )
    applyTemplate(id, templateId, { keepTexts })
    res.json(getCardFull(id))
  }),
)

router.post(
  '/batch/deck',
  asyncHandler((req, res) => {
    const { cardIds, deckId } = parseBody(
      z.object({
        cardIds: z.array(z.number().int().positive()).min(1).max(300),
        deckId: z.number().int().positive().nullable(),
      }),
      req.body,
    )
    res.json({ changed: assignCards(cardIds, deckId) })
  }),
)

export default router
