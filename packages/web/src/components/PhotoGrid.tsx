import { Check, MapPin, Star } from 'lucide-react'
import type { Photo } from '../api/types'
import { mediaUrl } from '../api/client'
import { cn } from '../lib/cn'
import { formatClock } from '../lib/format'
import { Skeleton } from './ui'

interface PhotoGridProps {
  photos: Photo[]
  loading?: boolean
  selectedIds?: number[]
  onToggleSelect?: (id: number) => void
  onOpen?: (index: number) => void
  columns?: string
  className?: string
}

export function PhotoGrid({
  photos,
  loading,
  selectedIds = [],
  onToggleSelect,
  onOpen,
  columns = 'grid-cols-[repeat(auto-fill,minmax(190px,1fr))]',
  className,
}: PhotoGridProps) {
  if (loading) {
    return (
      <div className={cn('grid gap-3', columns, className)}>
        {Array.from({ length: 12 }).map((_, index) => (
          <Skeleton key={index} className="aspect-[4/3] w-full" />
        ))}
      </div>
    )
  }

  return (
    <div className={cn('grid gap-3', columns, className)}>
      {photos.map((photo, index) => {
        const selected = selectedIds.includes(photo.id)
        return (
          <figure
            key={photo.id}
            className={cn(
              'group relative aspect-[4/3] overflow-hidden rounded-md border bg-ink-800 transition-all duration-base ease-natural hover:-translate-y-0.5 hover:shadow-elev-2',
              selected ? 'border-moss/70 shadow-[0_0_0_2px_rgba(87,199,133,0.25)]' : 'border-white/[0.08]',
            )}
          >
            <button
              type="button"
              onClick={() => (onToggleSelect ? onToggleSelect(photo.id) : onOpen?.(index))}
              className="absolute inset-0 z-10 cursor-pointer"
              aria-label={`查看照片 ${photo.fileName}`}
            />
            <img
              src={mediaUrl.thumb(photo.id, 640)}
              alt={photo.fileName}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-slow ease-natural group-hover:scale-[1.04]"
            />

            <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col gap-1 bg-gradient-to-t from-ink-900/92 to-transparent p-2.5">
              <div className="flex items-center justify-between text-micro text-fog-200">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {photo.placeName ?? (photo.gpsLat !== null ? '已定位' : '未定位')}
                </span>
                <span>{formatClock(photo.takenAt)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="clamp-1 text-micro text-fog-100">{photo.fileName}</span>
                {photo.rating > 0 ? (
                  <span className="flex items-center gap-0.5 text-micro text-amber-gold">
                    <Star className="h-3 w-3 fill-current" />
                    {photo.rating}
                  </span>
                ) : null}
              </div>
            </div>

            {onToggleSelect ? (
              <span
                className={cn(
                  'pointer-events-none absolute right-2 top-2 z-20 flex h-5 w-5 items-center justify-center rounded-sm border transition-colors duration-fast',
                  selected ? 'border-moss bg-moss text-ink-900' : 'border-white/40 bg-black/45 text-transparent',
                )}
              >
                <Check className="h-3 w-3" strokeWidth={2.6} />
              </span>
            ) : null}
          </figure>
        )
      })}
    </div>
  )
}
