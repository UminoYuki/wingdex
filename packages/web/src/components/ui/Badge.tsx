import type { ReactNode } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/cn'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-micro font-medium leading-none whitespace-nowrap',
  {
    variants: {
      tone: {
        neutral: 'border-white/[0.12] bg-white/[0.05] text-fog-200',
        moss: 'border-moss/35 bg-moss/12 text-moss-soft',
        plume: 'border-plume/35 bg-plume/12 text-plume',
        gold: 'border-amber-gold/40 bg-amber-gold/12 text-amber-gold',
        danger: 'border-danger/40 bg-danger/12 text-danger',
        success: 'border-success/35 bg-success/12 text-success',
        outline: 'border-white/[0.14] bg-transparent text-fog-300',
      },
      size: {
        sm: 'px-1.5 py-0.5 text-micro',
        md: 'px-2 py-1 text-caption',
      },
    },
    defaultVariants: { tone: 'neutral', size: 'sm' },
  },
)

export interface BadgeProps extends VariantProps<typeof badgeVariants> {
  icon?: ReactNode
  children: ReactNode
  className?: string
  title?: string
}

export function Badge({ tone, size, icon, children, className, title }: BadgeProps) {
  return (
    <span title={title} className={cn(badgeVariants({ tone, size }), className)}>
      {icon}
      {children}
    </span>
  )
}
