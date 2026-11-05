import { type ButtonHTMLAttributes, forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'
import { cn } from '../../lib/cn'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-all duration-fast ease-natural disabled:cursor-not-allowed disabled:opacity-45 select-none',
  {
    variants: {
      variant: {
        primary:
          'bg-moss text-ink-900 shadow-elev-1 hover:bg-moss-soft hover:shadow-elev-2 active:translate-y-px',
        secondary:
          'glass text-fog-100 hover:border-moss/40 hover:bg-moss/10 active:translate-y-px',
        ghost: 'text-fog-200 hover:bg-white/[0.06] hover:text-fog-100 active:bg-white/[0.09]',
        outline:
          'border border-white/[0.14] bg-transparent text-fog-100 hover:border-moss/50 hover:text-moss-soft',
        danger: 'bg-danger/90 text-white hover:bg-danger active:translate-y-px',
        gold: 'bg-amber-gold text-ink-900 hover:brightness-110 active:translate-y-px',
      },
      size: {
        sm: 'h-7 px-2.5 text-caption',
        md: 'h-9 px-3.5 text-body',
        lg: 'h-11 px-5 text-body',
      },
      block: { true: 'w-full', false: '' },
    },
    defaultVariants: { variant: 'secondary', size: 'md', block: false },
  },
)

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean
  icon?: React.ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant, size, block, loading, icon, children, disabled, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={props.type ?? 'button'}
      className={cn(buttonVariants({ variant, size, block }), className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : icon}
      {children}
    </button>
  )
})
