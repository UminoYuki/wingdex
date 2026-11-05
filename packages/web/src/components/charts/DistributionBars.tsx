import type { DistributionRow } from '../../api/types'
import { Panel } from '../ui'
import { cn } from '../../lib/cn'

interface DistributionBarsProps {
  title: string
  subtitle?: string
  rows: DistributionRow[]
  limit?: number
  tone?: 'moss' | 'plume' | 'gold'
}

const BAR_TONE = {
  moss: 'from-moss-deep/80 to-moss',
  plume: 'from-[#3E6E9E]/80 to-plume',
  gold: 'from-[#8A6412]/80 to-amber-gold',
}

/** 分布排行：目科 / 保护级别 / 栖息地等通用排名条 */
export function DistributionBars({ title, subtitle, rows, limit = 8, tone = 'moss' }: DistributionBarsProps) {
  const data = [...rows].sort((a, b) => b.species - a.species).slice(0, limit)
  const max = data[0]?.species ?? 1

  return (
    <Panel title={title} subtitle={subtitle}>
      {data.length === 0 ? (
        <p className="py-8 text-center text-caption text-fog-300">暂无数据</p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {data.map((row) => (
            <li key={row.name} className="flex flex-col gap-1">
              <div className="flex items-baseline justify-between gap-3 text-caption">
                <span className="clamp-1 text-fog-100">{row.name}</span>
                <span className="shrink-0 tabular-nums text-fog-300">
                  {row.species} 种 · {row.photos} 张
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className={cn('h-full rounded-full bg-gradient-to-r', BAR_TONE[tone])}
                  style={{ width: `${Math.max(6, (row.species / max) * 100)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}
