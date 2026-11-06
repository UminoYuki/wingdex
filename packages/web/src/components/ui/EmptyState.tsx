import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { Button, type ButtonProps } from './Button'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: { label: string; onClick: () => void; variant?: ButtonProps['variant']; icon?: ReactNode }
  secondaryAction?: { label: string; onClick: () => void }
  className?: string
  compact?: boolean
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className,
  compact,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-line/[0.10] bg-line/[0.02] text-center',
        compact ? 'px-6 py-8' : 'px-8 py-14',
        className,
      )}
    >
      {icon ? (
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-moss/10 text-moss">{icon}</span>
      ) : null}
      <div className="flex flex-col gap-1">
        <p className="text-title text-fog-100">{title}</p>
        {description ? (
          <p className="mx-auto max-w-md text-caption leading-relaxed text-fog-300">{description}</p>
        ) : null}
      </div>
      {action || secondaryAction ? (
        <div className="mt-1 flex items-center gap-2">
          {action ? (
            <Button variant={action.variant ?? 'primary'} size="sm" icon={action.icon} onClick={action.onClick}>
              {action.label}
            </Button>
          ) : null}
          {secondaryAction ? (
            <Button variant="ghost" size="sm" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

export function ErrorState({
  message,
  onRetry,
  className,
}: {
  message: string
  onRetry?: () => void
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-3 rounded-lg border border-danger/30 bg-danger/[0.06] px-6 py-8 text-center',
        className,
      )}
    >
      <p className="text-body text-fog-100">加载失败</p>
      <p className="max-w-md text-caption leading-relaxed text-danger">{message}</p>
      {onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry}>
          重试
        </Button>
      ) : null}
    </div>
  )
}
