import { Router } from 'express'
import { z } from 'zod'
import { asyncHandler, ApiError, parseBody, parseQuery, parseIntParam } from '../utils'
import {
  deleteSticker,
  listStickers,
  sendAsset,
  sendExport,
  sendPhotoFull,
  sendSpeciesAsset,
  sendThumb,
  sendWikiImage,
  storeSticker,
} from '../../services/mediaService'
import { THUMB_SIZES, type ThumbSize } from '../../services/thumbnailService'

const router = Router()

router.get(
  '/photo/:id/thumb',
  asyncHandler(async (req, res) => {
    const id = parseIntParam(req.params.id, 'id')
    const { size } = parseQuery(z.object({ size: z.coerce.number().optional() }), req.query)
    const target = (size ?? 640) as ThumbSize
    if (!THUMB_SIZES.includes(target)) {
      throw new ApiError(400, `缩略图档位只支持：${THUMB_SIZES.join(' / ')}`)
    }
    await sendThumb(res, id, target)
  }),
)

router.get(
  '/photo/:id/full',
  asyncHandler(async (req, res) => {
    const id = parseIntParam(req.params.id, 'id')
    const { max } = parseQuery(z.object({ max: z.coerce.number().int().positive().max(6000).optional() }), req.query)
    await sendPhotoFull(res, id, max)
  }),
)

router.get('/wiki/:key', (req, res) => {
  sendWikiImage(res, String(req.params.key))
})

router.get('/species/:id/:kind', (req, res) => {
  const id = parseIntParam(req.params.id, 'id')
  const kind = String(req.params.kind)
  if (kind !== 'sound' && kind !== 'video') throw new ApiError(400, '仅支持 sound / video')
  sendSpeciesAsset(res, id, kind)
})

router.get('/asset/:key', (req, res) => {
  sendAsset(res, String(req.params.key))
})

router.get('/assets', (_req, res) => {
  res.json({ items: listStickers() })
})

const stickerSchema = z.object({
  name: z.string().min(1).max(60),
  dataUrl: z.string().min(32),
})

router.post(
  '/assets',
  asyncHandler(async (req, res) => {
    const input = parseBody(stickerSchema, req.body)
    res.status(201).json(await storeSticker(input))
  }),
)

router.delete('/asset/:key', (req, res) => {
  deleteSticker(String(req.params.key))
  res.json({ ok: true })
})

router.get('/export/:file', (req, res) => {
  sendExport(res, String(req.params.file))
})

export default router
