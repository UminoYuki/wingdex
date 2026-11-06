import * as SelectPrimitive from '@radix-ui/react-select'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '../../lib/cn'

export interface SelectOption {
  value: string
  label: string
  hint?: string
}

interface SelectProps {
  value: string
  onValueChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  className?: string
  disabled?: boolean
  size?: 'sm' | 'md'
}

export function Select({
  value,
  onValueChange,
  options,
  placeholder = '请选择',
  className,
  disabled,
  size = 'md',
}: SelectProps) {
  return (
    <SelectPrimitive.Root value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectPrimitive.Trigger
        className={cn(
          'flex w-full items-center justify-between gap-2 rounded-md border border-line/[0.10] bg-recess px-3 text-body text-fog-100',
          'transition-colors duration-base hover:border-moss/40 focus:border-moss/60 focus:outline-none',
          'data-[placeholder]:text-fog-300 disabled:cursor-not-allowed disabled:opacity-50',
          size === 'sm' ? 'h-7 text-caption' : 'h-9',
          className,
        )}
      >
        <SelectPrimitive.Value placeholder={placeholder} />
        <SelectPrimitive.Icon>
          <ChevronDown className="h-3.5 w-3.5 text-fog-300" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={6}
          className="z-[70] min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-md border border-line/[0.10] bg-ink-800/95 p-1 shadow-elev-3 backdrop-blur-xl animate-fade-in"
        >
          <SelectPrimitive.Viewport className="max-h-72">
            {options.map((option) => (
              <SelectPrimitive.Item
                key={option.value}
                value={option.value}
                className="flex cursor-pointer items-center justify-between gap-3 rounded-sm px-2.5 py-1.5 text-body text-fog-200 outline-none data-[highlighted]:bg-moss/12 data-[highlighted]:text-fog-100 data-[state=checked]:text-moss-soft"
              >
                <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
                <span className="flex items-center gap-2">
                  {option.hint ? <span className="text-micro text-fog-300">{option.hint}</span> : null}
                  <SelectPrimitive.ItemIndicator>
                    <Check className="h-3.5 w-3.5" />
                  </SelectPrimitive.ItemIndicator>
                </span>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  )
}
