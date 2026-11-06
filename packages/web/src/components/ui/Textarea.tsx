import { type TextareaHTMLAttributes, forwardRef } from 'react'
import { cn } from '../../lib/cn'

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, invalid, ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      className={cn(
        'w-full resize-y rounded-md border bg-recess px-3 py-2 text-body leading-relaxed text-fog-100',
        'placeholder:text-fog-300 transition-colors duration-base focus:outline-none',
        invalid
          ? 'border-danger/70'
          : 'border-line/[0.10] focus:border-moss/60 focus:shadow-[0_0_0_3px_rgba(87,199,133,0.12)]',
        props.disabled && 'cursor-not-allowed opacity-50',
        className,
      )}
      {...props}
    />
  )
})
