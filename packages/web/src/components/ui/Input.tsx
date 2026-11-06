import { type InputHTMLAttributes, forwardRef } from 'react'
import { cn } from '../../lib/cn'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean
  prefixIcon?: React.ReactNode
  suffix?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, invalid, prefixIcon, suffix, ...props },
  ref,
) {
  return (
    <div
      className={cn(
        'flex h-9 w-full items-center gap-2 rounded-md border bg-recess px-3 transition-colors duration-base',
        invalid ? 'border-danger/70' : 'border-line/[0.10] focus-within:border-moss/60',
        'focus-within:shadow-[0_0_0_3px_rgba(87,199,133,0.12)]',
        props.disabled && 'opacity-50',
        className,
      )}
    >
      {prefixIcon ? <span className="text-fog-300">{prefixIcon}</span> : null}
      <input
        ref={ref}
        className="h-full w-full border-0 bg-transparent text-body text-fog-100 placeholder:text-fog-300 focus:outline-none disabled:cursor-not-allowed"
        {...props}
      />
      {suffix ? <span className="flex items-center text-fog-300">{suffix}</span> : null}
    </div>
  )
})
