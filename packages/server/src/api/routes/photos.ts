import { Router } from 'express'
import { z } from 'zod'
import { asyncHandler, parseBody, parseQuery, parseIntParam, toBoolParam } from '../utils'
import {
  assignPhotos,
  deletePhoto,
  getPhoto,
  listPhotos,
  retryMissingThumbs,
  setCover,
  updatePhoto,
} from '../../services/photoService'
import { assignPhotoPlace } from '../../services/placeService'

const router = Router()

const listSchema = z.object({
  speciesId: z.coerce.number().int().positive().optional(),
  unassigned: z.string().optional(),
  placeId: z.coerce.number().int().positive().optional(),
  camera: z.string().optional(),
  lens: z.string().optional(),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  favorite: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  q: z.string().optional(),
  order: z.enum(['taken_desc', 'taken_asc', 'imported_desc']).optional(),
  limit: z.coerce.number().int().positive().max(500).optional(),
  offset: z.coerce.number().int().min(0).optional(),
})

router.get(
  '/',
  asyncHandler((req, res) => {
    const query = parseQuery(listSchema, req.query)
    res.json(
      listPhotos({
        ...query,
        unassigned: toBoolParam(query.unassigned),
        favorite: toBoolParam(query.favorite),
      }),
    )
  }),
)

router.get(
  '/:id',
  asyncHandler((req, res) => {
    res.json(getPhoto(parseIntParam(req.params.id, 'id')))
  }),
)

const updateSchema = z.object({
  speciesId: z.number().int().positive().nullable().optional(),
  placeId: z.number().int().positive().nullable().optional(),
  rating: z.number().int().min(0).max(5).optional(),
  isFavorite: z.boolean().optional(),
  note: z.string().max(500).nullable().optional(),
  takenAt: z.string().max(30).nullable().optional(),
  tags: z.array(z.string().max(20)).max(20).optional(),
})

router.patch(
  '/:id',
  asyncHandler((req, res) => {
    const id = parseIntParam(req.params.id, 'id')
    const patch = parseBody(updateSchema, req.body)

    if ('placeId' in patch) assignPhotoPlace(id, patch.placeId ?? null)
    if ('speciesId' in patch) assignPhotos([id], patch.speciesId ?? null)

    const { placeId, speciesId, ...rest } = patch
    res.json(updatePhoto(id, rest))
  }),
)

router.delete(
  '/:id',
  asyncHandler((req, res) => {
    const id = parseIntParam(req.params.id, 'id')
    const { withThumbs } = parseQuery(
      z.object({ withThumbs: z.string().optional() }),
      req.query,
    )
    deletePhoto(id, toBoolParam(withThumbs) ?? true)
    res.json({ ok: true })
  }),
)

const assignSchema = z.object({
  photoIds: z.array(z.number().int().positive()).min(1).max(500),
  speciesId: z.number().int().positive().nullable(),
})

router.post(
  '/assign',
  asyncHandler((req, res) => {
    const { photoIds, speciesId } = parseBody(assignSchema, req.body)
    res.json({ changed: assignPhotos(photoIds, speciesId) })
  }),
)

router.post(
  '/:id/cover',
  asyncHandler((req, res) => {
    const id = parseIntParam(req.params.id, 'id')
    res.json(setCover(id))
  }),
)

router.post('/thumbs/retry', (_req, res) => {
  res.json({ queued: retryMissingThumbs() })
})

export default router
