import * as CheckboxPrimitive from '@radix-ui/react-checkbox'
import { Check } from 'lucide-react'
import { cn } from '../../lib/cn'

interface CheckboxProps {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  label?: string
  hint?: string
  disabled?: boolean
  className?: string
}

export function Checkbox({ checked, onCheckedChange, label, hint, disabled, className }: CheckboxProps) {
  return (
    <label
      className={cn(
        'flex cursor-pointer items-start gap-2.5 py-1',
        disabled && 'cursor-not-allowed opacity-50',
        className,
      )}
    >
      <CheckboxPrimitive.Root
        checked={checked}
        onCheckedChange={(value) => onCheckedChange(value === true)}
        disabled={disabled}
        className={cn(
          'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border transition-colors duration-fast',
          checked ? 'border-moss bg-moss text-ink-900' : 'border-line/[0.16] bg-recess hover:border-moss/50',
        )}
      >
        <CheckboxPrimitive.Indicator>
          <Check className="h-3 w-3" strokeWidth={2.5} />
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
      {label ? (
        <span className="flex flex-col gap-0.5">
          <span className="text-body leading-snug text-fog-100">{label}</span>
          {hint ? <span className="text-micro text-fog-300">{hint}</span> : null}
        </span>
      ) : null}
    </label>
  )
}
