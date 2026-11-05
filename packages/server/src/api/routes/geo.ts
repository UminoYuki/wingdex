import { Router } from 'express'
import { z } from 'zod'
import { parseQuery } from '../utils'
import { china, mapPoints, photosWithoutGps, world } from '../../services/geoService'

const router = Router()

router.get('/world', (_req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=604800')
  res.json(world())
})

router.get('/china', (_req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=604800')
  res.json(china())
})

const pointsSchema = z.object({
  habitat: z.string().optional(),
  speciesId: z.coerce.number().int().positive().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  precision: z.coerce.number().int().min(0).max(4).optional(),
})

router.get('/points', (req, res) => {
  const query = parseQuery(pointsSchema, req.query)
  const items = mapPoints(query)
  res.json({
    items,
    summary: {
      points: items.length,
      photos: items.reduce((acc, item) => acc + item.photos, 0),
      species: items.reduce((acc, item) => acc + item.species, 0),
    },
  })
})

router.get('/missing', (req, res) => {
  const { limit } = parseQuery(
    z.object({ limit: z.coerce.number().int().min(1).max(200).optional() }),
    req.query,
  )
  res.json({ items: photosWithoutGps(limit ?? 50) })
})

export default router
