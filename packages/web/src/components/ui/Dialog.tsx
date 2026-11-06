import type { ReactNode } from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '../../lib/cn'
import { useIsNarrow } from '../../hooks/useMediaQuery'

export const DialogTrigger = DialogPrimitive.Trigger
export const DialogClose = DialogPrimitive.Close

interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: ReactNode
  description?: ReactNode
  footer?: ReactNode
  width?: 'sm' | 'md' | 'lg' | 'xl'
  /** 强制浮层形态，默认窄窗口自动降级为 Drawer */
  forceVariant?: 'modal' | 'drawer'
  className?: string
  children?: ReactNode
}

const widthClass = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-3xl',
  xl: 'max-w-5xl',
}

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  footer,
  width = 'md',
  forceVariant,
  className,
  children,
}: DialogProps) {
  const narrow = useIsNarrow()
  const drawer = forceVariant ? forceVariant === 'drawer' : narrow

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm animate-fade-in" />
        <DialogPrimitive.Content
          className={cn(
            'fixed z-[70] glass-strong shadow-elev-3 focus:outline-none animate-fade-up',
            drawer
              ? 'inset-x-0 bottom-0 max-h-[88vh] rounded-t-lg border-b-0'
              : cn(
                  // inset-0 + m-auto 居中：不能用 -translate-1/2 居中，
                  // 否则会被 animate-fade-up（animation-fill-mode: both）的 transform 覆盖，
                  // 浮层会贴到 50%/50% 处并把卡片挤出窗口
                  'inset-0 m-auto h-fit max-h-[90vh] w-[92vw] rounded-lg',
                  widthClass[width],
                ),
            // overflow-hidden + 内容区 min-h-0：浮层超高时由内容区滚动，而不是被窗口裁掉
            'flex flex-col overflow-hidden',
            className,
          )}
        >
          <header className="flex items-start justify-between gap-4 border-b border-line/[0.08] px-5 py-4">
            <div className="flex flex-col gap-1">
              <DialogPrimitive.Title className="text-title text-fog-100">{title}</DialogPrimitive.Title>
              {description ? (
                <DialogPrimitive.Description className="text-caption leading-relaxed text-fog-300">
                  {description}
                </DialogPrimitive.Description>
              ) : null}
            </div>
            <DialogPrimitive.Close
              aria-label="关闭"
              className="rounded-md p-1 text-fog-300 transition-colors duration-fast hover:bg-line/[0.07] hover:text-fog-100"
            >
              <X className="h-4 w-4" />
            </DialogPrimitive.Close>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>

          {footer ? (
            <footer className="flex items-center justify-end gap-2 border-t border-line/[0.08] px-5 py-3">
              {footer}
            </footer>
          ) : null}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
