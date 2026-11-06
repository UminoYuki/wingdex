import * as SwitchPrimitive from '@radix-ui/react-switch'
import { cn } from '../../lib/cn'

interface SwitchProps {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  label?: string
  hint?: string
  disabled?: boolean
  className?: string
}

export function Switch({ checked, onCheckedChange, label, hint, disabled, className }: SwitchProps) {
  return (
    <label
      className={cn(
        'flex cursor-pointer items-center justify-between gap-4 rounded-md px-1 py-1',
        disabled && 'cursor-not-allowed opacity-50',
        className,
      )}
    >
      {label ? (
        <span className="flex flex-col gap-0.5">
          <span className="text-body text-fog-100">{label}</span>
          {hint ? <span className="text-micro text-fog-300">{hint}</span> : null}
        </span>
      ) : null}
      <SwitchPrimitive.Root
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        className={cn(
          'relative h-5 w-9 shrink-0 rounded-full border transition-colors duration-base',
          checked ? 'border-moss/60 bg-moss/35' : 'border-line/[0.12] bg-recess',
        )}
      >
        <SwitchPrimitive.Thumb
          className={cn(
            'block h-3.5 w-3.5 translate-x-[3px] rounded-full bg-fog-100 shadow-elev-1 transition-transform duration-base ease-natural',
            checked && 'translate-x-[19px] bg-moss',
          )}
        />
      </SwitchPrimitive.Root>
    </label>
  )
}
