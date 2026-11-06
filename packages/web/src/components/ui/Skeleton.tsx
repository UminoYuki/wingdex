import { cn } from '../../lib/cn'

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'wd-skeleton relative overflow-hidden rounded-md border border-line/10 bg-line/[0.04]',
        'after:absolute after:inset-0 after:animate-holo-shift after:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.06),transparent)] after:bg-[length:200%_100%]',
        className,
      )}
    />
  )
}

export function SkeletonGrid({ count = 8, className }: { count?: number; className?: string }) {
  return (
    <div className={cn('grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-5', className)}>
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton key={index} className="aspect-[59/86] w-full" />
      ))}
    </div>
  )
}

export function SkeletonRows({ count = 4, className }: { count?: number; className?: string }) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton key={index} className="h-10 w-full" />
      ))}
    </div>
  )
}
