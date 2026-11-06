import * as SliderPrimitive from '@radix-ui/react-slider'
import { cn } from '../../lib/cn'

interface SliderProps {
  value: number
  min?: number
  max?: number
  step?: number
  onValueChange: (value: number) => void
  label?: string
  format?: (value: number) => string
  className?: string
}

export function Slider({
  value,
  min = 0,
  max = 100,
  step = 1,
  onValueChange,
  label,
  format,
  className,
}: SliderProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label ? (
        <div className="flex items-baseline justify-between">
          <span className="text-caption text-fog-200">{label}</span>
          <span className="text-micro tabular-nums text-fog-300">{format ? format(value) : value}</span>
        </div>
      ) : null}
      <SliderPrimitive.Root
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(next) => onValueChange(next[0] ?? min)}
        className="relative flex h-5 w-full touch-none items-center select-none"
      >
        <SliderPrimitive.Track className="relative h-1 w-full grow overflow-hidden rounded-full bg-line/[0.10]">
          <SliderPrimitive.Range className="absolute h-full bg-gradient-to-r from-moss-deep to-moss" />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb className="block h-3.5 w-3.5 rounded-full border border-moss/70 bg-ink-800 shadow-elev-1 transition-transform duration-fast hover:scale-110 focus:outline-none" />
      </SliderPrimitive.Root>
    </div>
  )
}
