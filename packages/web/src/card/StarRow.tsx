import { cn } from '../lib/cn'

interface StarRowProps {
  stars: number
  /** 星级上限，默认 10 */
  max?: number
  size?: number
  className?: string
  /** 空星是否可见 */
  showEmpty?: boolean
}

/** 卡面星级：1–10 星，实心/空心按卡宽比例缩放 */
export function StarRow({ stars, max = 10, size = 2.1, className, showEmpty = true }: StarRowProps) {
  const filled = Math.max(0, Math.min(max, Math.round(stars)))

  return (
    <span className={cn('flex items-center gap-[0.25cqw]', className)} aria-label={`${filled} / ${max} 星`}>
      {Array.from({ length: max }).map((_, index) => {
        const active = index < filled
        if (!active && !showEmpty) return null
        // 真实游戏王卡的星级是「实心星 + 一圈深色描边」，压在卡框上才不会糊进底色
        return (
          <svg
            key={index}
            viewBox="0 0 24 24"
            style={{ width: `${size}cqw`, height: `${size}cqw` }}
            className={cn('shrink-0', active ? 'text-amber-gold' : 'text-white/20')}
            fill="currentColor"
            stroke={active ? 'rgba(26,14,2,0.6)' : 'rgba(0,0,0,0.25)'}
            strokeWidth={1.1}
            strokeLinejoin="round"
          >
            <path d="M12 2.6l2.9 6.06 6.6.83-4.84 4.5 1.2 6.5L12 17.4l-5.86 3.09 1.2-6.5L2.5 9.49l6.6-.83z" />
          </svg>
        )
      })}
    </span>
  )
}
