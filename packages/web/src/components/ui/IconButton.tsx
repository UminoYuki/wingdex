import { type ButtonHTMLAttributes, forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/cn'

const iconButtonVariants = cva(
  'inline-flex shrink-0 items-center justify-center rounded-md transition-all duration-fast ease-natural disabled:cursor-not-allowed disabled:opacity-45',
  {
    variants: {
      variant: {
        ghost: 'text-fog-200 hover:bg-white/[0.07] hover:text-fog-100',
        glass: 'glass text-fog-100 hover:border-moss/40 hover:text-moss-soft',
        danger: 'text-fog-200 hover:bg-danger/15 hover:text-danger',
        solid: 'bg-moss/90 text-ink-900 hover:bg-moss',
      },
      size: {
        sm: 'h-6 w-6',
        md: 'h-8 w-8',
        lg: 'h-10 w-10',
      },
    },
    defaultVariants: { variant: 'ghost', size: 'md' },
  },
)

export interface IconButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof iconButtonVariants> {
  label: string
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { className, variant, size, label, children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={props.type ?? 'button'}
      title={label}
      aria-label={label}
      className={cn(iconButtonVariants({ variant, size }), className)}
      {...props}
    >
      {children}
    </button>
  )
})
