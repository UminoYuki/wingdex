import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

interface FieldProps {
  label: string
  hint?: string
  error?: string | null
  required?: boolean
  /** 右侧附加信息，如字数计数 */
  counter?: ReactNode
  htmlFor?: string
  className?: string
  children: ReactNode
}

export function Field({ label, hint, error, required, counter, htmlFor, className, children }: FieldProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={htmlFor} className="flex items-center gap-1 text-caption font-medium text-fog-200">
          {label}
          {required ? <span className="text-danger">*</span> : null}
        </label>
        {counter ? <span className="text-micro tabular-nums text-fog-300">{counter}</span> : null}
      </div>
      {children}
      {error ? (
        <p className="text-micro leading-relaxed text-danger">{error}</p>
      ) : hint ? (
        <p className="text-micro leading-relaxed text-fog-300">{hint}</p>
      ) : null}
    </div>
  )
}

export function CharCounter({ value, limit }: { value: number; limit: number }) {
  const over = value > limit
  return (
    <span className={cn('tabular-nums', over ? 'font-medium text-danger' : 'text-fog-300')}>
      {value}/{limit}
    </span>
  )
}
