import { Router } from 'express'
import { z } from 'zod'
import { asyncHandler, parseBody, parseIntParam } from '../utils'
import { assignCards, createDeck, deleteDeck, getDeck, listDecks, reorderCards, updateDeck } from '../../services/deckService'
import { listCards } from '../../services/cardService'

const router = Router()

router.get('/', (_req, res) => {
  res.json({ items: listDecks() })
})

const inputSchema = z.object({
  name: z.string().min(1, '卡组名称不能为空').max(40),
  description: z.string().max(200).nullable().optional(),
  coverCardId: z.number().int().positive().nullable().optional(),
})

router.post(
  '/',
  asyncHandler((req, res) => {
    res.status(201).json(createDeck(parseBody(inputSchema, req.body)))
  }),
)

router.get(
  '/:id',
  asyncHandler((req, res) => {
    const id = parseIntParam(req.params.id, 'id')
    res.json({ deck: getDeck(id), cards: listCards({ deckId: id, limit: 300 }).items })
  }),
)

router.patch(
  '/:id',
  asyncHandler((req, res) => {
    const id = parseIntParam(req.params.id, 'id')
    res.json(updateDeck(id, parseBody(inputSchema.partial(), req.body)))
  }),
)

router.delete(
  '/:id',
  asyncHandler((req, res) => {
    deleteDeck(parseIntParam(req.params.id, 'id'))
    res.json({ ok: true })
  }),
)

router.post(
  '/:id/cards',
  asyncHandler((req, res) => {
    const id = parseIntParam(req.params.id, 'id')
    const { cardIds } = parseBody(
      z.object({ cardIds: z.array(z.number().int().positive()).min(1).max(300) }),
      req.body,
    )
    res.json({ changed: assignCards(cardIds, id) })
  }),
)

router.post(
  '/reorder',
  asyncHandler((req, res) => {
    const { cardIds } = parseBody(
      z.object({ cardIds: z.array(z.number().int().positive()).min(1).max(300) }),
      req.body,
    )
    reorderCards(cardIds)
    res.json({ ok: true })
  }),
)

export default router
