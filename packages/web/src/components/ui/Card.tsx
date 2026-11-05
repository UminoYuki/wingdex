import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/cn'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean
  padded?: boolean
  tone?: 'glass' | 'solid' | 'plain'
  children: ReactNode
}

export function Card({
  interactive,
  padded = true,
  tone = 'glass',
  className,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border',
        tone === 'glass' && 'glass shadow-elev-1',
        tone === 'solid' && 'border-white/[0.08] bg-ink-800 shadow-elev-1',
        tone === 'plain' && 'border-white/[0.08] bg-transparent',
        padded && 'p-4',
        interactive && 'lift cursor-pointer hover:border-moss/40 hover:shadow-elev-2',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({
  title,
  subtitle,
  actions,
  icon,
  className,
}: {
  title: ReactNode
  subtitle?: ReactNode
  actions?: ReactNode
  icon?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex items-start justify-between gap-3', className)}>
      <div className="flex items-start gap-2.5">
        {icon ? <span className="mt-0.5 text-moss">{icon}</span> : null}
        <div className="flex flex-col gap-0.5">
          <h3 className="text-title leading-snug text-fog-100">{title}</h3>
          {subtitle ? <p className="text-caption leading-relaxed text-fog-300">{subtitle}</p> : null}
        </div>
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-1.5">{actions}</div> : null}
    </div>
  )
}
