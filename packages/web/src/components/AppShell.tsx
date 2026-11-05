import type { ReactNode } from 'react'
import { cn } from '../lib/cn'
import { TopNav } from './TopNav'
import { StatusBar } from './StatusBar'

interface AppShellProps {
  children: ReactNode
  /** 全屏画布模式（卡片编辑器）隐藏常规内边距与状态栏 */
  variant?: 'default' | 'canvas'
  className?: string
}

export function AppShell({ children, variant = 'default', className }: AppShellProps) {
  return (
    <div className="relative min-h-screen bg-ink-900 text-fog-100">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-24 h-[420px] w-[420px] rounded-full bg-moss/10 blur-[120px]" />
        <div className="absolute right-[-140px] top-24 h-[360px] w-[360px] rounded-full bg-plume/10 blur-[120px]" />
        <div className="absolute bottom-[-180px] left-1/3 h-[380px] w-[380px] rounded-full bg-amber-gold/[0.06] blur-[130px]" />
        <div className="absolute inset-0 grid-paper opacity-40" />
      </div>

      <TopNav />

      <main
        className={cn(
          'relative',
          variant === 'canvas' ? 'pt-14' : 'mx-auto w-full max-w-[1560px] px-6 pb-9 pt-[72px]',
          className,
        )}
      >
        {children}
      </main>

      {variant === 'canvas' ? null : <StatusBar />}
    </div>
  )
}

export function PageHeader({
  title,
  subtitle,
  actions,
  meta,
  className,
}: {
  title: string
  subtitle?: string
  actions?: ReactNode
  meta?: ReactNode
  className?: string
}) {
  return (
    <header className={cn('flex flex-wrap items-end justify-between gap-4 pb-5', className)}>
      <div className="flex flex-col gap-1.5">
        <h1 className="text-display text-fog-100">{title}</h1>
        {subtitle ? <p className="max-w-2xl text-caption leading-relaxed text-fog-300">{subtitle}</p> : null}
        {meta ? <div className="flex flex-wrap items-center gap-2 pt-0.5">{meta}</div> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  )
}
