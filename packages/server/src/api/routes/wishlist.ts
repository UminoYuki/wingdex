import { Router } from 'express'
import { z } from 'zod'
import { asyncHandler, parseBody, parseIntParam } from '../utils'
import { createSpecies, getSpeciesWithStats, listSpecies, updateSpecies } from '../../services/speciesService'
import { refreshSpecies } from '../../services/speciesService'
import { getDb } from '../../db'
import { one, type Row } from '../../db/queries'

const router = Router()

router.get('/', (_req, res) => {
  const { items } = listSpecies({ wishlist: true, limit: 200, sort: 'name' })
  res.json({
    items: items.map((item) => ({
      ...item,
      achieved: Boolean(item.coverPhotoId),
      targetCount: 1,
      progress: item.photoCount > 0 ? 1 : 0,
    })),
    summary: {
      total: items.length,
      achieved: items.filter((item) => item.coverPhotoId != null).length,
    },
  })
})

const createSchema = z.object({
  cnName: z.string().min(1, '请填写目标物种中文名').max(30),
  group: z.string().max(10).optional(),
  wishNote: z.string().max(100).nullable().optional(),
  autoFetch: z.boolean().optional(),
})

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const input = parseBody(createSchema, req.body)
    let species = createSpecies({
      cnName: input.cnName,
      group: input.group,
      isWishlist: true,
      wishNote: input.wishNote ?? null,
    })
    if (input.autoFetch) {
      species = await refreshSpecies(species.id, {})
    }
    res.status(201).json(species)
  }),
)

const patchSchema = z.object({
  wishNote: z.string().max(100).nullable().optional(),
  group: z.string().max(10).optional(),
  isWishlist: z.boolean().optional(),
})

router.patch(
  '/:id',
  asyncHandler((req, res) => {
    const id = parseIntParam(req.params.id, 'id')
    res.json(updateSpecies(id, parseBody(patchSchema, req.body)))
  }),
)

/** 标记达成：把该物种移出想拍清单并记录达成时间 */
router.post(
  '/:id/achieve',
  asyncHandler((req, res) => {
    const id = parseIntParam(req.params.id, 'id')
    res.json(updateSpecies(id, { isWishlist: false }))
  }),
)

router.delete(
  '/:id',
  asyncHandler((req, res) => {
    const id = parseIntParam(req.params.id, 'id')
    res.json(updateSpecies(id, { isWishlist: false, wishNote: null }))
  }),
)

router.get(
  '/:id',
  asyncHandler((req, res) => {
    const id = parseIntParam(req.params.id, 'id')
    const species = getSpeciesWithStats(id)
    const photos = one<Row>(getDb(), 'SELECT COUNT(*) AS total FROM photos WHERE species_id = ?', [id])
    res.json({ ...species, photoTotal: Number(photos?.total ?? 0) })
  }),
)

export default router
