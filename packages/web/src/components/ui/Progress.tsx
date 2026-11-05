import { cn } from '../../lib/cn'

interface ProgressProps {
  value: number
  max?: number
  label?: string
  hint?: string
  tone?: 'moss' | 'plume' | 'gold' | 'danger'
  size?: 'sm' | 'md'
  className?: string
}

const toneClass = {
  moss: 'from-moss-deep to-moss',
  plume: 'from-plume/70 to-plume',
  gold: 'from-amber-gold/70 to-amber-gold',
  danger: 'from-danger/70 to-danger',
}

export function Progress({ value, max = 100, label, hint, tone = 'moss', size = 'md', className }: ProgressProps) {
  const ratio = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label ? (
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-caption text-fog-200">{label}</span>
          <span className="text-micro tabular-nums text-fog-300">{hint ?? `${Math.round(ratio * 100)}%`}</span>
        </div>
      ) : null}
      <div className={cn('w-full overflow-hidden rounded-full bg-white/[0.08]', size === 'sm' ? 'h-1' : 'h-1.5')}>
        <div
          className={cn('h-full rounded-full bg-gradient-to-r transition-all duration-slow ease-natural', toneClass[tone])}
          style={{ width: `${ratio * 100}%` }}
        />
      </div>
    </div>
  )
}

interface ProgressRingProps {
  value: number
  max?: number
  size?: number
  thickness?: number
  label?: string
  hint?: string
  tone?: 'moss' | 'gold' | 'plume'
  className?: string
}

export function ProgressRing({
  value,
  max = 100,
  size = 96,
  thickness = 7,
  label,
  hint,
  tone = 'moss',
  className,
}: ProgressRingProps) {
  const ratio = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0
  const radius = (size - thickness) / 2
  const circumference = 2 * Math.PI * radius
  const stroke = {
    moss: 'url(#ring-moss)',
    gold: 'url(#ring-gold)',
    plume: 'url(#ring-plume)',
  }[tone]

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="ring-moss" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#3E9E6B" />
            <stop offset="100%" stopColor="#57C785" />
          </linearGradient>
          <linearGradient id="ring-gold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#8A6412" />
            <stop offset="100%" stopColor="#E8B04B" />
          </linearGradient>
          <linearGradient id="ring-plume" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#4B7FC9" />
            <stop offset="100%" stopColor="#6FB3C9" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.09)"
          strokeWidth={thickness}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={stroke}
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - ratio)}
          className="transition-all duration-slow ease-natural"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-title tabular-nums text-fog-100">{label ?? `${Math.round(ratio * 100)}%`}</span>
        {hint ? <span className="text-micro text-fog-300">{hint}</span> : null}
      </div>
    </div>
  )
}
