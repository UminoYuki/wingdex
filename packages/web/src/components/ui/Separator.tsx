import * as SeparatorPrimitive from '@radix-ui/react-separator'
import { cn } from '../../lib/cn'

interface SeparatorProps {
  orientation?: 'horizontal' | 'vertical'
  label?: string
  className?: string
}

export function Separator({ orientation = 'horizontal', label, className }: SeparatorProps) {
  if (label) {
    return (
      <div className={cn('flex items-center gap-3', className)}>
        <span className="h-px flex-1 bg-line/[0.08]" />
        <span className="text-micro uppercase tracking-wider text-fog-300">{label}</span>
        <span className="h-px flex-1 bg-line/[0.08]" />
      </div>
    )
  }

  return (
    <SeparatorPrimitive.Root
      orientation={orientation}
      className={cn(
        'shrink-0 bg-line/[0.08]',
        orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
        className,
      )}
    />
  )
}
