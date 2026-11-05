import { Router } from 'express'
import { z } from 'zod'
import { parseQuery } from '../utils'
import {
  gearStats,
  heatmap,
  monthly,
  overview,
  placeRanking,
  statsBundle,
  yearlyOptions,
} from '../../services/statsService'
import { recentUnlocks } from '../../services/achievements/view'

const router = Router()

const yearSchema = z.object({ year: z.coerce.number().int().min(1990).max(2100).optional() })

router.get('/', (req, res) => {
  const { year } = parseQuery(yearSchema, req.query)
  const bundle = statsBundle(year ?? new Date().getFullYear())
  res.json({ ...bundle, recentAchievements: recentUnlocks(4) })
})

router.get('/overview', (_req, res) => {
  res.json(overview())
})

router.get('/heatmap', (req, res) => {
  const { year } = parseQuery(yearSchema, req.query)
  res.json({ year: year ?? new Date().getFullYear(), items: heatmap(year ?? new Date().getFullYear()) })
})

router.get('/monthly', (req, res) => {
  const { months } = parseQuery(
    z.object({ months: z.coerce.number().int().min(3).max(60).optional() }),
    req.query,
  )
  res.json({ items: monthly(months ?? 24) })
})

router.get('/gear', (_req, res) => {
  res.json(gearStats())
})

router.get('/years', (_req, res) => {
  res.json({ years: yearlyOptions() })
})

router.get('/places', (req, res) => {
  const { limit } = parseQuery(
    z.object({ limit: z.coerce.number().int().min(1).max(60).optional() }),
    req.query,
  )
  res.json({ items: placeRanking(limit ?? 12) })
})

router.get('/recent-achievements', (_req, res) => {
  res.json({ items: recentUnlocks(8) })
})

export default router
