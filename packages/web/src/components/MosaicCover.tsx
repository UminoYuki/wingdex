import { Feather } from 'lucide-react'
import { cn } from '../lib/cn'
import { mediaUrl, type ThumbSize } from '../api/client'
import { initialOf } from '../lib/format'

interface MosaicCoverProps {
  photoIds: number[]
  name: string
  thumbSize?: ThumbSize
  className?: string
  /** 模糊作为背景层使用 */
  overlay?: boolean
}

/** 物种卡片封面：最多 4 张照片拼贴 + 渐变叠层 */
export function MosaicCover({ photoIds, name, thumbSize = 640, className, overlay = true }: MosaicCoverProps) {
  const photos = photoIds.slice(0, 4)

  if (photos.length === 0) {
    return (
      <div
        className={cn(
          'relative flex h-full w-full items-center justify-center overflow-hidden bg-gradient-to-br from-ink-700 via-ink-800 to-ink-900',
          className,
        )}
      >
        <span className="absolute -right-6 -top-8 h-28 w-28 rounded-full bg-moss/10 blur-2xl" />
        <span className="flex flex-col items-center gap-1.5 text-fog-300">
          <Feather className="h-6 w-6" />
          <span className="text-micro">待补充照片</span>
        </span>
      </div>
    )
  }

  return (
    <div className={cn('relative h-full w-full overflow-hidden', className)}>
      <div className={cn('grid h-full w-full gap-[2px]', photos.length === 1 ? 'grid-cols-1' : 'grid-cols-2 grid-rows-2')}>
        {photos.map((photoId, index) => (
          <div
            key={photoId}
            className={cn(
              'relative overflow-hidden bg-ink-800',
              photos.length === 3 && index === 0 ? 'row-span-2' : '',
            )}
          >
            <img
              src={mediaUrl.thumb(photoId, thumbSize)}
              alt={`${name} 照片 ${index + 1}`}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-slow ease-natural hover:scale-[1.06]"
            />
          </div>
        ))}
      </div>
      {overlay ? (
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-900/92 via-ink-900/25 to-transparent" />
      ) : null}
      {photos.length === 0 ? (
        <span className="absolute bottom-2 right-3 text-display text-white/10">{initialOf(name)}</span>
      ) : null}
    </div>
  )
}
