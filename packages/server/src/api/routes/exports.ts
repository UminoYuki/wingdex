import { Router } from 'express'
import { z } from 'zod'
import { asyncHandler, parseBody, parseQuery, parseIntParam } from '../utils'
import {
  buildSheet,
  cleanupExports,
  deleteExport,
  listExports,
  saveExportFromDataUrl,
  zipExports,
} from '../../services/cardExportService'

const router = Router()

router.get('/', (_req, res) => {
  res.json({ items: listExports() })
})

const saveSchema = z.object({
  fileName: z.string().min(1).max(80),
  dataUrl: z.string().min(32, '缺少图片数据'),
})

router.post(
  '/',
  asyncHandler((req, res) => {
    const { fileName, dataUrl } = parseBody(saveSchema, req.body)
    res.status(201).json(saveExportFromDataUrl(fileName, dataUrl))
  }),
)

router.delete(
  '/:file',
  asyncHandler((req, res) => {
    deleteExport(String(req.params.file))
    res.json({ ok: true })
  }),
)

const sheetSchema = z.object({
  files: z.array(z.string().max(120)).min(1, '请选择要拼版的图片').max(12),
  mirrorBack: z.boolean().optional(),
  bleed: z.number().min(0).max(40).optional(),
  marks: z.boolean().optional(),
  columns: z.number().int().min(1).max(4).optional(),
})

router.post(
  '/sheet',
  asyncHandler(async (req, res) => {
    const options = parseBody(sheetSchema, req.body)
    res.status(201).json(await buildSheet(options))
  }),
)

const zipSchema = z.object({
  files: z.array(z.string().max(120)).min(1).max(200),
  name: z.string().max(60).optional(),
})

router.post(
  '/zip',
  asyncHandler(async (req, res) => {
    const { files, name } = parseBody(zipSchema, req.body)
    res.status(201).json(await zipExports(files, name))
  }),
)

router.post('/cleanup', (req, res) => {
  const { keepDays } = parseQuery(
    z.object({ keepDays: z.coerce.number().int().min(1).max(365).optional() }),
    req.query,
  )
  res.json({ removed: cleanupExports(keepDays ?? 30) })
})

export default router
