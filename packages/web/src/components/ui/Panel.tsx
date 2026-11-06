import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

interface PanelProps {
  title?: ReactNode
  subtitle?: ReactNode
  actions?: ReactNode
  icon?: ReactNode
  footer?: ReactNode
  className?: string
  bodyClassName?: string
  children: ReactNode
}

/** 统一信息区块：标题行 + 内容 + 可选页脚 */
export function Panel({ title, subtitle, actions, icon, footer, className, bodyClassName, children }: PanelProps) {
  return (
    <section className={cn('glass flex flex-col overflow-hidden rounded-lg shadow-elev-1', className)}>
      {title ? (
        <header className="flex items-start justify-between gap-3 border-b border-line/[0.07] px-4 py-3">
          <div className="flex items-start gap-2.5">
            {icon ? <span className="mt-0.5 text-moss">{icon}</span> : null}
            <div className="flex flex-col gap-0.5">
              <h2 className="text-title leading-snug text-fog-100">{title}</h2>
              {subtitle ? <p className="text-caption leading-relaxed text-fog-300">{subtitle}</p> : null}
            </div>
          </div>
          {actions ? <div className="flex shrink-0 items-center gap-1.5">{actions}</div> : null}
        </header>
      ) : null}
      <div className={cn('flex-1 p-4', bodyClassName)}>{children}</div>
      {footer ? <footer className="border-t border-line/[0.07] px-4 py-3">{footer}</footer> : null}
    </section>
  )
}

export function StatTile({
  label,
  value,
  hint,
  icon,
  tone = 'moss',
  className,
}: {
  label: string
  value: ReactNode
  hint?: string
  icon?: ReactNode
  tone?: 'moss' | 'plume' | 'gold' | 'danger'
  className?: string
}) {
  const toneClass = {
    moss: 'text-moss',
    plume: 'text-plume',
    gold: 'text-amber-gold',
    danger: 'text-danger',
  }[tone]

  return (
    <div className={cn('glass flex items-center gap-3 rounded-md px-3.5 py-3 shadow-elev-1', className)}>
      {icon ? (
        <span className={cn('flex h-9 w-9 items-center justify-center rounded-md bg-line/[0.05]', toneClass)}>
          {icon}
        </span>
      ) : null}
      <div className="flex flex-col">
        <span className="text-micro uppercase tracking-wide text-fog-300">{label}</span>
        <span className="text-title tabular-nums text-fog-100">{value}</span>
        {hint ? <span className="text-micro text-fog-300">{hint}</span> : null}
      </div>
    </div>
  )
}
