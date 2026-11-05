import type { ReactNode } from 'react'
import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area'
import { cn } from '../../lib/cn'

interface ScrollAreaProps {
  children: ReactNode
  className?: string
  viewportClassName?: string
  orientation?: 'vertical' | 'horizontal' | 'both'
}

export function ScrollArea({ children, className, viewportClassName, orientation = 'vertical' }: ScrollAreaProps) {
  return (
    <ScrollAreaPrimitive.Root
      type="hover"
      className={cn('relative overflow-hidden', className)}
      scrollHideDelay={400}
    >
      <ScrollAreaPrimitive.Viewport className={cn('h-full w-full', viewportClassName)}>
        {children}
      </ScrollAreaPrimitive.Viewport>
      {orientation !== 'horizontal' ? (
        <ScrollAreaPrimitive.Scrollbar
          orientation="vertical"
          className="flex w-2 touch-none select-none p-0.5 transition-opacity duration-200"
        >
          <ScrollAreaPrimitive.Thumb className="flex-1 rounded-full bg-white/[0.14] hover:bg-moss/45" />
        </ScrollAreaPrimitive.Scrollbar>
      ) : null}
      {orientation !== 'vertical' ? (
        <ScrollAreaPrimitive.Scrollbar
          orientation="horizontal"
          className="flex h-2 touch-none select-none flex-col p-0.5 transition-opacity duration-200"
        >
          <ScrollAreaPrimitive.Thumb className="flex-1 rounded-full bg-white/[0.14] hover:bg-moss/45" />
        </ScrollAreaPrimitive.Scrollbar>
      ) : null}
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  )
}
