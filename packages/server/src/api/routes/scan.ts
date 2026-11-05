import fs from 'node:fs'
import path from 'node:path'
import { Router } from 'express'
import { z } from 'zod'
import { asyncHandler, ApiError, parseBody, parseIntParam } from '../utils'
import { latestScanJob, listJobs, listRoots, removeRoot, scanDirectory } from '../../services/scanService'
import { getDb } from '../../db'
import { run } from '../../db/queries'

interface ScanState {
  running: boolean
  processed: number
  total: number
  startedAt: string | null
  lastResult: Awaited<ReturnType<typeof scanDirectory>> | null
}

const state: ScanState = { running: false, processed: 0, total: 0, startedAt: null, lastResult: null }

const scanRouter = Router()

const scanSchema = z.object({
  root: z.string().min(1, '请提供要扫描的目录路径'),
  async: z.boolean().optional(),
})

scanRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    if (state.running) throw new ApiError(409, '已有扫描任务在进行中，请稍候')
    const input = parseBody(scanSchema, req.body)
    if (!path.isAbsolute(input.root.trim())) throw new ApiError(400, '请填写绝对路径')
    const root = path.resolve(input.root.trim())
    if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()) {
      throw new ApiError(400, `目录不可用：${root}`)
    }

    state.running = true
    state.startedAt = new Date().toISOString()
    state.processed = 0
    state.total = 0

    if (input.async === false) {
      try {
        const result = await scanDirectory(root, (processed, total) => {
          state.processed = processed
          state.total = total
        })
        state.lastResult = result
        res.json(result)
      } finally {
        state.running = false
      }
      return
    }

    void scanDirectory(root, (processed, total) => {
      state.processed = processed
      state.total = total
    })
      .then((result) => {
        state.lastResult = result
      })
      .catch((error) => {
        state.lastResult = null
        run(getDb(), `UPDATE scan_jobs SET status = 'failed' WHERE id = (SELECT MAX(id) FROM scan_jobs)`, [])
        throw error
      })
      .finally(() => {
        state.running = false
      })

    res.status(202).json({ accepted: true, root })
  }),
)

scanRouter.get('/status', (_req, res) => {
  res.json({
    running: state.running,
    processed: state.processed,
    total: state.total,
    startedAt: state.startedAt,
    lastResult: state.lastResult,
    latestJob: latestScanJob() ?? null,
    jobs: listJobs(8),
  })
})

/** 校验已入库照片的原图是否仍然存在 */
scanRouter.post('/verify', (_req, res) => {
  const db = getDb()
  const rows = db.prepare('SELECT id, file_path FROM photos').all() as Array<{ id: number; file_path: string }>
  let missing = 0
  for (const row of rows) {
    if (!fs.existsSync(row.file_path)) {
      missing += 1
      run(db, `UPDATE photos SET thumb_state = 'missing' WHERE id = ?`, [row.id])
    }
  }
  res.json({ checked: rows.length, missing })
})

export const rootsRouter = Router()

const rootSchema = z.object({
  path: z.string().min(1, '目录路径不能为空'),
  note: z.string().max(100).nullable().optional(),
})

rootsRouter.get('/', (_req, res) => {
  res.json({ items: listRoots() })
})

rootsRouter.post(
  '/',
  asyncHandler((req, res) => {
    const input = parseBody(rootSchema, req.body)
    if (!path.isAbsolute(input.path.trim())) {
      throw new ApiError(400, '请填写绝对路径，例如 D:\\Photos\\Birds')
    }
    const resolved = path.resolve(input.path.trim())
    if (!fs.existsSync(resolved) || !fs.statSync(resolved).isDirectory()) {
      throw new ApiError(400, `目录不可用：${resolved}`)
    }
    if (listRoots().some((item) => item.path === resolved)) {
      throw new ApiError(409, '该目录已在图库中')
    }
    const info = getDb()
      .prepare('INSERT INTO library_roots (path, note) VALUES (?, ?)')
      .run(resolved, input.note ?? null)
    res.status(201).json({ id: Number(info.lastInsertRowid), path: resolved })
  }),
)

rootsRouter.delete(
  '/:id',
  asyncHandler((req, res) => {
    removeRoot(parseIntParam(req.params.id, 'id'))
    res.json({ ok: true })
  }),
)

export default scanRouter
