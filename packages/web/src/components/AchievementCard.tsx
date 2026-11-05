import { Lock } from 'lucide-react'
import type { AchievementView } from '../api/types'
import { Badge } from './Badge'
import { AchievementIcon } from '../icons/registry'
import { cn } from '../lib/cn'
import { formatDate } from '../lib/format'
import type { TierKey } from '../theme/tokens'

interface AchievementCardProps {
  item: AchievementView
  sweep?: boolean
  className?: string
}

/** 成就卡：金属徽章 + 进度 + 解锁时间 */
export function AchievementCard({ item, sweep, className }: AchievementCardProps) {
  const ratio = item.target > 0 ? Math.min(1, item.progress / item.target) : 0

  return (
    <article
      className={cn(
        'glass flex flex-col items-center gap-2.5 rounded-lg px-4 py-5 text-center shadow-elev-1 transition-all duration-base ease-natural hover:shadow-elev-2',
        item.unlocked ? 'border-amber-gold/25' : 'opacity-95',
        className,
      )}
    >
      <Badge
        tier={item.tier as TierKey}
        icon={<AchievementIcon name={item.iconKey} size={22} />}
        size={72}
        locked={!item.unlocked}
        progress={item.unlocked ? 1 : ratio}
        sweep={sweep}
        label={item.name}
      />
      <h3 className={cn('text-body font-medium', item.unlocked ? 'text-fog-100' : 'text-fog-200')}>{item.name}</h3>
      <p className="clamp-2 text-micro leading-relaxed text-fog-300">{item.description}</p>

      {item.unlocked ? (
        <span className="text-micro text-amber-gold">已于 {formatDate(item.unlockedAt)} 解锁</span>
      ) : (
        <span className="flex items-center gap-1 text-micro text-fog-300">
          <Lock className="h-3 w-3" />
          进度 {Math.min(item.progress, item.target)}/{item.target}
        </span>
      )}
    </article>
  )
}
