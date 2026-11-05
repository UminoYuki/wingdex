import type { ReactNode } from 'react'
import { cn } from '../lib/cn'
import { tiers, type TierKey } from '../theme/tokens'

export type BadgeSize = 40 | 56 | 72 | 96

interface BadgeProps {
  tier: TierKey
  icon: ReactNode
  size?: BadgeSize
  locked?: boolean
  /** 0–1 进度，仅未解锁时展示进度环 */
  progress?: number
  /** 解锁时播放扫光 */
  sweep?: boolean
  label?: string
  className?: string
}

const sizeMap: Record<BadgeSize, { box: string; icon: string; ring: number }> = {
  40: { box: 'h-10 w-10', icon: 'h-4 w-4', ring: 20 },
  56: { box: 'h-14 w-14', icon: 'h-6 w-6', ring: 28 },
  72: { box: 'h-[72px] w-[72px]', icon: 'h-8 w-8', ring: 36 },
  96: { box: 'h-24 w-24', icon: 'h-11 w-11', ring: 48 },
}

/** 通用金属徽章外壳：铜/银/金/传说四档，未解锁灰度 + 进度环 */
export function Badge({
  tier,
  icon,
  size = 72,
  locked,
  progress = 0,
  sweep,
  label,
  className,
}: BadgeProps) {
  const tone = tiers[tier]
  const metrics = sizeMap[size]
  const radius = metrics.ring - 2
  const circumference = 2 * Math.PI * radius

  return (
    <div className={cn('relative inline-flex items-center justify-center', metrics.box, className)} title={label}>
      <div
        className={cn(
          'absolute inset-[3px] rounded-full border border-white/[0.16] shadow-[0_10px_26px_rgba(0,0,0,.5),inset_0_2px_6px_rgba(255,255,255,.22)]',
          locked && 'grayscale',
        )}
        style={{
          background: `radial-gradient(circle at 32% 26%, ${tone.to} 0%, ${tone.mid} 42%, ${tone.from} 100%)`,
          opacity: locked ? 0.42 : 1,
        }}
      />
      <span
        className={cn(
          'absolute inset-[9px] rounded-full border border-black/25',
          locked ? 'bg-black/25' : 'bg-gradient-to-br from-white/[0.10] to-black/20',
        )}
      />
      <span
        className={cn(
          'relative flex items-center justify-center text-ink-900 drop-shadow-[0_1px_1px_rgba(255,255,255,.35)]',
          metrics.icon,
          locked && 'text-fog-200 drop-shadow-none',
        )}
      >
        {icon}
      </span>

      {locked && progress > 0 ? (
        <svg className="pointer-events-none absolute inset-0 -rotate-90" viewBox={`0 0 ${metrics.ring * 2} ${metrics.ring * 2}`}>
          <circle
            cx={metrics.ring}
            cy={metrics.ring}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.12)"
            strokeWidth={2}
          />
          <circle
            cx={metrics.ring}
            cy={metrics.ring}
            r={radius}
            fill="none"
            stroke="#57C785"
            strokeWidth={2}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - Math.min(1, Math.max(0, progress)))}
            className="transition-all duration-slow ease-natural"
          />
        </svg>
      ) : null}

      {sweep && !locked ? (
        <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-full">
          <span className="absolute inset-y-0 -left-6 w-8 animate-badge-sweep bg-gradient-to-r from-transparent via-white/55 to-transparent" />
        </span>
      ) : null}
    </div>
  )
}
