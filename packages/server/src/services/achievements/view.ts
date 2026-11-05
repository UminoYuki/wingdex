/**
 * 面向前端的成就视图：把内部英文枚举（category/icon/tier）映射成 UI 契约
 * （group/iconKey/中文等级），并补齐分组统计与 byTier 汇总。
 */
import {
  CATEGORY_LABELS,
  type AchievementCategory,
  type AchievementTier,
} from './definitions'
import { listAchievements, type AchievementView } from './service'

export const TIER_LABELS: Record<AchievementTier, '铜' | '银' | '金' | '传说'> = {
  bronze: '铜',
  silver: '银',
  gold: '金',
  legend: '传说',
}

export interface WebAchievement {
  key: string
  name: string
  description: string
  group: string
  tier: '铜' | '银' | '金' | '传说'
  iconKey: string
  progress: number
  target: number
  unlocked: boolean
  unlockedAt: string | null
}

export interface WebAchievementGroup {
  key: AchievementCategory
  name: string
  items: WebAchievement[]
  unlocked: number
  total: number
}

export interface WebAchievements {
  items: WebAchievement[]
  groups: WebAchievementGroup[]
  summary: {
    unlocked: number
    total: number
    byTier: Record<string, { unlocked: number; total: number }>
    latest: WebAchievement | null
  }
}

export function toWebAchievement(item: AchievementView): WebAchievement {
  return {
    key: item.key,
    name: item.name,
    description: item.description,
    group: item.category,
    tier: TIER_LABELS[item.tier],
    iconKey: item.icon,
    progress: item.progress,
    target: item.target,
    unlocked: item.unlocked,
    unlockedAt: item.unlockedAt,
  }
}

/** 成就墙与状态栏共用的完整视图 */
export function webAchievements(): WebAchievements {
  const { items } = listAchievements()
  const web = items.map(toWebAchievement)
  const unlockedItems = web.filter((item) => item.unlocked)
  const latest =
    unlockedItems
      .slice()
      .sort((a, b) => String(b.unlockedAt ?? '').localeCompare(String(a.unlockedAt ?? '')))[0] ?? null

  const byTier: Record<string, { unlocked: number; total: number }> = {}
  for (const tier of Object.values(TIER_LABELS)) byTier[tier] = { unlocked: 0, total: 0 }
  for (const item of web) {
    const bucket = byTier[item.tier]
    bucket.total += 1
    if (item.unlocked) bucket.unlocked += 1
  }

  const order = Object.keys(CATEGORY_LABELS) as AchievementCategory[]
  const groups: WebAchievementGroup[] = order
    .map((category) => {
      const grouped = web.filter((item) => item.group === category)
      return {
        key: category,
        name: CATEGORY_LABELS[category],
        items: grouped,
        unlocked: grouped.filter((item) => item.unlocked).length,
        total: grouped.length,
      }
    })
    .filter((group) => group.total > 0)

  return {
    items: web,
    groups,
    summary: { unlocked: unlockedItems.length, total: web.length, byTier, latest },
  }
}

/** 最近解锁的成就：统计页与状态栏复用 */
export function recentUnlocks(limit = 4): WebAchievement[] {
  return webAchievements()
    .items.filter((item) => item.unlocked)
    .sort((a, b) => String(b.unlockedAt ?? '').localeCompare(String(a.unlockedAt ?? '')))
    .slice(0, limit)
}
