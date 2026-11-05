import { Router } from 'express'
import { z } from 'zod'
import { asyncHandler, parseBody, parseIntParam } from '../utils'
import {
  assignPhotoPlace,
  createPlace,
  deletePlace,
  getPlace,
  listPlaces,
  placeStats,
  updatePlace,
} from '../../services/placeService'
import { listPhotos } from '../../services/photoService'

const router = Router()

router.get('/', (_req, res) => {
  res.json({ items: placeStats() })
})

const createSchema = z.object({
  name: z.string().min(1, '地点名称不能为空').max(40),
  lat: z.number().min(-90).max(90).nullable().optional(),
  lon: z.number().min(-180).max(180).nullable().optional(),
  iconKey: z.string().max(20).nullable().optional(),
  note: z.string().max(300).nullable().optional(),
})

router.post(
  '/',
  asyncHandler((req, res) => {
    res.status(201).json(createPlace(parseBody(createSchema, req.body)))
  }),
)

router.get(
  '/:id',
  asyncHandler((req, res) => {
    res.json(getPlace(parseIntParam(req.params.id, 'id')))
  }),
)

const updateSchema = z.object({
  name: z.string().min(1).max(40).optional(),
  lat: z.number().min(-90).max(90).nullable().optional(),
  lon: z.number().min(-180).max(180).nullable().optional(),
  iconKey: z.string().max(20).nullable().optional(),
  note: z.string().max(300).nullable().optional(),
})

router.patch(
  '/:id',
  asyncHandler((req, res) => {
    const id = parseIntParam(req.params.id, 'id')
    res.json(updatePlace(id, parseBody(updateSchema, req.body)))
  }),
)

router.delete(
  '/:id',
  asyncHandler((req, res) => {
    deletePlace(parseIntParam(req.params.id, 'id'))
    res.json({ ok: true })
  }),
)

router.get(
  '/:id/photos',
  asyncHandler((req, res) => {
    const id = parseIntParam(req.params.id, 'id')
    res.json(listPhotos({ placeId: id, limit: 200 }))
  }),
)

const assignSchema = z.object({
  photoIds: z.array(z.number().int().positive()).min(1).max(500),
})

router.post(
  '/:id/photos',
  asyncHandler((req, res) => {
    const id = parseIntParam(req.params.id, 'id')
    const { photoIds } = parseBody(assignSchema, req.body)
    for (const photoId of photoIds) assignPhotoPlace(photoId, id)
    res.json({ changed: photoIds.length })
  }),
)

router.post('/resolve', (_req, res) => {
  res.json({ items: listPlaces() })
})

export default router
