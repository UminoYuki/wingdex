import { useEffect, useRef } from 'react'
import { achievementToast } from './ui'
import { AchievementIcon } from '../icons/registry'
import { useAchievements } from '../api/hooks'

/** 全局成就监听：轮询成就列表，出现新解锁时弹出统一 toast */
export function AchievementWatcher() {
  const { data } = useAchievements()
  const seen = useRef<Set<string> | null>(null)

  useEffect(() => {
    if (!data) return

    const unlocked = data.items.filter((item) => item.unlocked)
    if (seen.current === null) {
      seen.current = new Set(unlocked.map((item) => item.key))
      return
    }

    const fresh = unlocked.filter((item) => !seen.current?.has(item.key))
    if (fresh.length === 0) return

    seen.current = new Set(unlocked.map((item) => item.key))
    fresh.slice(0, 3).forEach((item, index) => {
      window.setTimeout(() => {
        achievementToast({
          name: item.name,
          tier: item.tier,
          description: item.description,
          icon: <AchievementIcon name={item.iconKey} size={20} />,
        })
      }, index * 420)
    })
  }, [data])

  return null
}
