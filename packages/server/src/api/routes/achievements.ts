import { Router } from 'express'
import { z } from 'zod'
import { ApiError, parseBody, parseIntParam } from '../utils'
import {
  achievementDetail,
  evaluateAchievements,
  markSeen,
  pendingToasts,
} from '../../services/achievements/service'
import { ACHIEVEMENTS, CATEGORY_LABELS } from '../../services/achievements/definitions'
import { toWebAchievement, webAchievements } from '../../services/achievements/view'

const router = Router()

router.get('/', (_req, res) => {
  res.json(webAchievements())
})

/** 前端「刷新成就」按钮：重算后返回本次新解锁的 key */
router.post('/refresh', (_req, res) => {
  const { newlyUnlocked } = evaluateAchievements()
  res.json({ unlocked: newlyUnlocked.map((item) => item.key) })
})

router.get('/meta', (_req, res) => {
  res.json({ categories: CATEGORY_LABELS, total: ACHIEVEMENTS.length })
})

router.post('/evaluate', (_req, res) => {
  const { items, newlyUnlocked, metrics } = evaluateAchievements()
  res.json({
    items: items.map(toWebAchievement),
    newlyUnlocked: newlyUnlocked.map((item) => item.key),
    metrics,
  })
})

router.get('/pending', (_req, res) => {
  res.json({ items: pendingToasts().map(toWebAchievement) })
})

const seenSchema = z.object({ keys: z.array(z.string().max(40)).max(60).optional() })

router.post('/seen', (req, res) => {
  const { keys } = parseBody(seenSchema, req.body ?? {})
  res.json({ changed: markSeen(keys) })
})

router.get('/:key', (req, res) => {
  const detail = achievementDetail(String(req.params.key))
  if (!detail) throw new ApiError(404, `未知成就：${req.params.key}`)
  res.json(detail)
})

export const achievementRouter = router
export default router

/** 供 /api/stats 复用：按 id 取成就进度（保留接口一致性） */
export function achievementById(idParam: unknown) {
  const id = parseIntParam(idParam, 'id')
  const def = ACHIEVEMENTS[id - 1]
  if (!def) throw new ApiError(404, `未知成就序号 #${id}`)
  return achievementDetail(def.key)
}
