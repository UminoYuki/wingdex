import * as TabsPrimitive from '@radix-ui/react-tabs'
import { cn } from '../../lib/cn'

export interface TabItem {
  value: string
  label: string
  count?: number
}

interface TabsProps {
  value: string
  onValueChange: (value: string) => void
  items: TabItem[]
  className?: string
}

export function Tabs({ value, onValueChange, items, className }: TabsProps) {
  return (
    <TabsPrimitive.Root value={value} onValueChange={onValueChange} className={className}>
      <TabsPrimitive.List className="flex items-center gap-1 rounded-md border border-white/[0.08] bg-white/[0.03] p-1">
        {items.map((item) => (
          <TabsPrimitive.Trigger
            key={item.value}
            value={item.value}
            className={cn(
              'flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-caption text-fog-200 transition-all duration-base ease-natural',
              'hover:text-fog-100 data-[state=active]:bg-moss/14 data-[state=active]:text-moss-soft data-[state=active]:shadow-elev-1',
            )}
          >
            {item.label}
            {item.count === undefined ? null : (
              <span className="rounded-full bg-white/[0.08] px-1.5 text-micro tabular-nums">{item.count}</span>
            )}
          </TabsPrimitive.Trigger>
        ))}
      </TabsPrimitive.List>
    </TabsPrimitive.Root>
  )
}
