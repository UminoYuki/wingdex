import { Router } from 'express'
import { z } from 'zod'
import { asyncHandler, parseBody, parseQuery, parseIntParam, toBoolParam } from '../utils'
import {
  createSpecies,
  deleteSpecies,
  getFacets,
  getSpeciesWithStats,
  listSpecies,
  refreshSpecies,
  speciesOptions,
  toggleFavorite,
  toggleWishlist,
  updateSpecies,
} from '../../services/speciesService'
import { assignPhotos, listPhotos } from '../../services/photoService'

const router = Router()

const listSchema = z.object({
  q: z.string().optional(),
  group: z.string().optional(),
  order: z.string().optional(),
  family: z.string().optional(),
  protection: z.string().optional(),
  habitat: z.string().optional(),
  camera: z.string().optional(),
  lens: z.string().optional(),
  favorite: z.string().optional(),
  wishlist: z.string().optional(),
  sort: z.enum(['recent', 'photos', 'name', 'first', 'stars']).optional(),
  limit: z.coerce.number().int().positive().max(500).optional(),
  offset: z.coerce.number().int().min(0).optional(),
})

router.get(
  '/',
  asyncHandler((req, res) => {
    const query = parseQuery(listSchema, req.query)
    const result = listSpecies({
      ...query,
      favorite: toBoolParam(query.favorite),
      wishlist: toBoolParam(query.wishlist),
    })
    res.json(result)
  }),
)

router.get('/options', (_req, res) => {
  res.json({ items: speciesOptions() })
})

router.get('/facets', (_req, res) => {
  res.json(getFacets())
})

const createSchema = z.object({
  cnName: z.string().min(1, '中文名不能为空').max(30),
  group: z.string().max(10).optional(),
  scientificName: z.string().max(80).nullable().optional(),
  enName: z.string().max(80).nullable().optional(),
  isWishlist: z.boolean().optional(),
  wishNote: z.string().max(100).nullable().optional(),
  note: z.string().max(500).nullable().optional(),
  autoFetch: z.boolean().optional(),
  wikiTitle: z.string().max(120).nullable().optional(),
})

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const input = parseBody(createSchema, req.body)
    const species = createSpecies(input)
    if (input.autoFetch) {
      const refreshed = await refreshSpecies(species.id, { wikiTitle: input.wikiTitle ?? null })
      res.status(201).json(refreshed)
      return
    }
    res.status(201).json(species)
  }),
)

const updateSchema = z.object({
  cnName: z.string().min(1).max(30).optional(),
  group: z.string().max(10).optional(),
  scientificName: z.string().max(80).nullable().optional(),
  enName: z.string().max(80).nullable().optional(),
  aliases: z.array(z.string().max(40)).max(12).optional(),
  orderName: z.string().max(40).nullable().optional(),
  familyName: z.string().max(40).nullable().optional(),
  genusName: z.string().max(40).nullable().optional(),
  iucnStatus: z.string().max(6).nullable().optional(),
  iucnYear: z.number().int().min(1994).max(2100).nullable().optional(),
  cnProtectionLevel: z.string().max(10).nullable().optional(),
  cnProtectionSource: z.string().max(60).nullable().optional(),
  isSanyou: z.boolean().optional(),
  lengthCm: z.string().max(40).nullable().optional(),
  weightG: z.string().max(40).nullable().optional(),
  wingspanCm: z.string().max(40).nullable().optional(),
  distribution: z.array(z.string().max(30)).max(30).optional(),
  habitats: z.array(z.string().max(20)).max(20).optional(),
  residenceType: z.string().max(20).nullable().optional(),
  diet: z.string().max(80).nullable().optional(),
  ecoType: z.string().max(20).nullable().optional(),
  summaryZh: z.string().max(4000).nullable().optional(),
  summaryEn: z.string().max(6000).nullable().optional(),
  note: z.string().max(2000).nullable().optional(),
  tags: z.array(z.string().max(20)).max(20).optional(),
  isFavorite: z.boolean().optional(),
  isWishlist: z.boolean().optional(),
  wishNote: z.string().max(100).nullable().optional(),
  coverPhotoId: z.number().int().positive().nullable().optional(),
  soundPath: z.string().max(300).nullable().optional(),
  videoPath: z.string().max(300).nullable().optional(),
})

router.patch(
  '/:id',
  asyncHandler((req, res) => {
    const id = parseIntParam(req.params.id, 'id')
    const patch = parseBody(updateSchema, req.body)
    res.json(updateSpecies(id, patch))
  }),
)

router.get(
  '/:id',
  asyncHandler((req, res) => {
    const id = parseIntParam(req.params.id, 'id')
    res.json(getSpeciesWithStats(id))
  }),
)

router.delete(
  '/:id',
  asyncHandler((req, res) => {
    const id = parseIntParam(req.params.id, 'id')
    deleteSpecies(id)
    res.json({ ok: true })
  }),
)

const refreshSchema = z.object({
  wikiTitle: z.string().max(120).nullable().optional(),
  qid: z.string().regex(/^Q\d+$/).nullable().optional(),
  overwriteManual: z.boolean().optional(),
})

router.post(
  '/:id/refresh',
  asyncHandler(async (req, res) => {
    const id = parseIntParam(req.params.id, 'id')
    const options = parseBody(refreshSchema, req.body ?? {})
    res.json(await refreshSpecies(id, options))
  }),
)

router.post(
  '/:id/favorite',
  asyncHandler((req, res) => {
    const id = parseIntParam(req.params.id, 'id')
    res.json(toggleFavorite(id))
  }),
)

const wishlistSchema = z.object({ note: z.string().max(100).nullable().optional() })

router.post(
  '/:id/wishlist',
  asyncHandler((req, res) => {
    const id = parseIntParam(req.params.id, 'id')
    const { note } = parseBody(wishlistSchema, req.body ?? {})
    res.json(toggleWishlist(id, note))
  }),
)

router.get(
  '/:id/photos',
  asyncHandler((req, res) => {
    const id = parseIntParam(req.params.id, 'id')
    const { limit, offset } = parseQuery(
      z.object({
        limit: z.coerce.number().int().positive().max(500).optional(),
        offset: z.coerce.number().int().min(0).optional(),
      }),
      req.query,
    )
    res.json(listPhotos({ speciesId: id, limit, offset }))
  }),
)

const assignSchema = z.object({
  photoIds: z.array(z.number().int().positive()).min(1, '请至少选择一张照片').max(500),
  speciesId: z.number().int().positive().nullable(),
})

router.post(
  '/:id/photos',
  asyncHandler((req, res) => {
    const id = parseIntParam(req.params.id, 'id')
    const { photoIds, speciesId } = parseBody(assignSchema, req.body)
    const changed = assignPhotos(photoIds, speciesId ?? id)
    res.json({ changed })
  }),
)

export default router
