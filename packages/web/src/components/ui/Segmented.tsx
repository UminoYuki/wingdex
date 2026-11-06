import { cn } from '../../lib/cn'

export interface SegmentedOption<T extends string> {
  value: T
  label: string
  icon?: React.ReactNode
}

interface SegmentedProps<T extends string> {
  value: T
  options: SegmentedOption<T>[]
  onValueChange: (value: T) => void
  size?: 'sm' | 'md'
  className?: string
}

export function Segmented<T extends string>({
  value,
  options,
  onValueChange,
  size = 'md',
  className,
}: SegmentedProps<T>) {
  return (
    <div
      role="tablist"
      className={cn(
        'inline-flex items-center gap-0.5 rounded-md border border-line/[0.08] bg-line/[0.03] p-0.5',
        className,
      )}
    >
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onValueChange(option.value)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-sm font-medium transition-all duration-base ease-natural',
              size === 'sm' ? 'h-6 px-2 text-micro' : 'h-7 px-2.5 text-caption',
              active
                ? 'bg-moss/16 text-moss-soft shadow-elev-1'
                : 'text-fog-300 hover:bg-line/[0.05] hover:text-fog-100',
            )}
          >
            {option.icon}
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
