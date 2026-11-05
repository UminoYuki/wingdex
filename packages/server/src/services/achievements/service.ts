import { getDb } from '../../db'
import { all, one, type Row } from '../../db/queries'
import { logger } from '../../logger'
import {
  ACHIEVEMENTS,
  ACHIEVEMENT_MAP,
  ACHIEVEMENT_TOTAL,
  CATEGORY_LABELS,
  type AchievementCategory,
  type AchievementDef,
} from './definitions'
import { computeMetrics } from './metrics'

export interface AchievementView extends AchievementDef {
  progress: number
  ratio: number
  unlocked: boolean
  unlockedAt: string | null
}

type StateRow = Row & { key: string; unlocked_at: string | null; progress: number }

function stateMap(): Map<string, StateRow> {
  return new Map(
    all<StateRow>(getDb(), 'SELECT * FROM achievement_state').map((row) => [String(row.key), row]),
  )
}

function upsertState(key: string, progress: number, target: number, unlocked: boolean): void {
  getDb()
    .prepare(
      `INSERT INTO achievement_state (key, progress, target, unlocked_at, updated_at)
       VALUES (@key, @progress, @target, @unlockedAt, datetime('now'))
       ON CONFLICT(key) DO UPDATE SET
         progress = MAX(achievement_state.progress, excluded.progress),
         target = excluded.target,
         unlocked_at = COALESCE(achievement_state.unlocked_at, excluded.unlocked_at),
         updated_at = datetime('now')`,
    )
    .run({
      key,
      progress,
      target,
      unlockedAt: unlocked ? new Date().toISOString() : null,
    })
}

/** 结算成就：进度只增不减，首次达标即写入解锁时间 */
export function evaluateAchievements(): {
  items: AchievementView[]
  newlyUnlocked: AchievementView[]
  metrics: Record<string, number>
} {
  const metrics = computeMetrics()
  const states = stateMap()
  const items: AchievementView[] = []
  const newlyUnlocked: AchievementView[] = []

  for (const def of ACHIEVEMENTS) {
    const raw = metrics[def.metric] ?? 0
    const progress = Math.min(raw, def.target)
    const prev = states.get(def.key)
    const alreadyUnlocked = Boolean(prev?.unlocked_at)
    const unlocked = alreadyUnlocked || progress >= def.target
    upsertState(def.key, progress, def.target, unlocked)

    const view: AchievementView = {
      ...def,
      progress,
      ratio: def.target > 0 ? Math.min(1, progress / def.target) : 1,
      unlocked,
      unlockedAt: prev?.unlocked_at ?? (unlocked ? new Date().toISOString() : null),
    }
    items.push(view)
    if (unlocked && !alreadyUnlocked) newlyUnlocked.push(view)
  }

  if (newlyUnlocked.length) {
    logger.info({ keys: newlyUnlocked.map((item) => item.key) }, '解锁新成就')
  }
  return { items, newlyUnlocked, metrics }
}

export function listAchievements(): {
  items: AchievementView[]
  groups: Array<{ category: AchievementCategory; label: string; items: AchievementView[] }>
  summary: { unlocked: number; total: number; ratio: number; unseen: number }
} {
  const { items } = evaluateAchievements()
  return {
    items,
    groups: groupItems(items),
    summary: summarise(items),
  }
}

export function groupItems(items: AchievementView[]) {
  const order = Object.keys(CATEGORY_LABELS) as AchievementCategory[]
  return order
    .map((category) => ({
      category,
      label: CATEGORY_LABELS[category],
      items: items.filter((item) => item.category === category),
    }))
    .filter((group) => group.items.length > 0)
}

export function summarise(items: AchievementView[]) {
  const unlocked = items.filter((item) => item.unlocked).length
  return {
    unlocked,
    total: ACHIEVEMENT_TOTAL,
    ratio: Number((unlocked / ACHIEVEMENT_TOTAL).toFixed(4)),
    unseen: unseenKeys().length,
  }
}

export function unseenKeys(): string[] {
  return all<{ key: string }>(
    getDb(),
    `SELECT key FROM achievement_state WHERE unlocked_at IS NOT NULL AND seen = 0 ORDER BY unlocked_at ASC`,
  ).map((row) => String(row.key))
}

export function pendingToasts(): AchievementView[] {
  const keys = unseenKeys()
  if (!keys.length) return []
  const items = evaluateAchievements().items
  return keys
    .map((key) => items.find((item) => item.key === key))
    .filter((item): item is AchievementView => Boolean(item))
}

export function markSeen(keys?: string[]): number {
  const db = getDb()
  if (!keys || keys.length === 0) {
    const info = db.prepare('UPDATE achievement_state SET seen = 1 WHERE seen = 0').run()
    return info.changes
  }
  const stmt = db.prepare('UPDATE achievement_state SET seen = 1 WHERE key = ?')
  return keys.reduce((acc, key) => acc + (ACHIEVEMENT_MAP.has(key) ? stmt.run(key).changes : 0), 0)
}

export function achievementDetail(key: string): { def: AchievementDef; view: AchievementView | null } | null {
  const def = ACHIEVEMENT_MAP.get(key)
  if (!def) return null
  const state = one<StateRow>(getDb(), 'SELECT * FROM achievement_state WHERE key = ?', [key])
  const view = state
    ? {
        ...def,
        progress: Number(state.progress ?? 0),
        ratio: Math.min(1, Number(state.progress ?? 0) / def.target),
        unlocked: Boolean(state.unlocked_at),
        unlockedAt: (state.unlocked_at as string) ?? null,
      }
    : null
  return { def, view }
}
