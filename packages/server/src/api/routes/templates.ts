import { Router } from 'express'
import { z } from 'zod'
import { asyncHandler, parseBody, parseIntParam } from '../utils'
import {
  applyTemplate,
  applyTemplateToSpecies,
  createTemplate,
  deleteTemplate,
  getTemplate,
  listTemplates,
  snapshotCardAsTemplate,
  updateTemplate,
} from '../../services/templateService'

const router = Router()

router.get('/', (_req, res) => {
  res.json({ items: listTemplates() })
})

const inputSchema = z.object({
  name: z.string().min(1, '模板名称不能为空').max(40),
  preset: z.string().max(20).nullable().optional(),
  overrides: z.record(z.string(), z.record(z.string(), z.unknown())).optional(),
  layers: z.array(z.record(z.string(), z.unknown())).max(12).optional(),
  backConfig: z.record(z.string(), z.unknown()).optional(),
  previewCardId: z.number().int().positive().nullable().optional(),
})

router.post(
  '/',
  asyncHandler((req, res) => {
    const body = parseBody(inputSchema, req.body)
    res.status(201).json(
      createTemplate({
        ...body,
        overrides: body.overrides as never,
        layers: body.layers as never,
      }),
    )
  }),
)

router.get(
  '/:id',
  asyncHandler((req, res) => {
    res.json(getTemplate(parseIntParam(req.params.id, 'id')))
  }),
)

router.patch(
  '/:id',
  asyncHandler((req, res) => {
    const id = parseIntParam(req.params.id, 'id')
    const body = parseBody(inputSchema.partial(), req.body)
    res.json(
      updateTemplate(id, {
        ...body,
        overrides: body.overrides as never,
        layers: body.layers as never,
      }),
    )
  }),
)

router.delete(
  '/:id',
  asyncHandler((req, res) => {
    deleteTemplate(parseIntParam(req.params.id, 'id'))
    res.json({ ok: true })
  }),
)

const applySchema = z.object({
  cardId: z.number().int().positive().optional(),
  speciesId: z.number().int().positive().optional(),
})

router.post(
  '/:id/apply',
  asyncHandler((req, res) => {
    const id = parseIntParam(req.params.id, 'id')
    const { cardId, speciesId } = parseBody(applySchema, req.body ?? {})
    if (speciesId) {
      res.json({ cards: applyTemplateToSpecies(speciesId, id) })
      return
    }
    if (!cardId) {
      res.status(400).json({ error: '请提供 cardId 或 speciesId' })
      return
    }
    res.json({ cards: [applyTemplate(cardId, id)] })
  }),
)

router.post(
  '/from-card',
  asyncHandler((req, res) => {
    const { cardId, name } = parseBody(
      z.object({ cardId: z.number().int().positive(), name: z.string().min(1).max(40) }),
      req.body,
    )
    res.status(201).json(snapshotCardAsTemplate(cardId, name))
  }),
)

export default router
