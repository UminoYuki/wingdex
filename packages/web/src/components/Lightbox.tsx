import { useEffect, useState } from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { ChevronLeft, ChevronRight, Info, MapPin, Maximize2, Star, X } from 'lucide-react'
import { mediaUrl } from '../api/client'
import { usePhoto, useUpdatePhoto } from '../api/hooks'
import { ExifBadgeBar } from './ExifBadgeBar'
import { IconButton, Skeleton } from './ui'
import { cn } from '../lib/cn'
import { formatDate } from '../lib/format'
import { useUiStore } from '../store/uiStore'

/** 全屏照片查看器：键盘翻页、缩放、EXIF 面板、评分 */
export function Lightbox() {
  const viewer = useUiStore((state) => state.viewer)
  const setIndex = useUiStore((state) => state.setViewerIndex)
  const toggleExif = useUiStore((state) => state.toggleViewerExif)
  const close = useUiStore((state) => state.closeViewer)
  const [zoom, setZoom] = useState(false)
  const updatePhoto = useUpdatePhoto()

  const photoId = viewer ? viewer.photoIds[viewer.index] : null
  const { data: photo } = usePhoto(photoId ?? null)

  useEffect(() => {
    setZoom(false)
  }, [photoId])

  useEffect(() => {
    if (!viewer) return
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
      if (event.key === 'ArrowRight') setIndex(Math.min(viewer.index + 1, viewer.photoIds.length - 1))
      if (event.key === 'ArrowLeft') setIndex(Math.max(viewer.index - 1, 0))
      if (event.key === 'i') toggleExif()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [viewer, close, setIndex, toggleExif])

  if (!viewer || !photoId) return null

  return (
    <DialogPrimitive.Root open onOpenChange={(open) => (open ? undefined : close())}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[80] bg-black/88 backdrop-blur-md animate-fade-in" />
        <DialogPrimitive.Content className="fixed inset-0 z-[85] flex flex-col focus:outline-none">
          <header className="flex items-center justify-between gap-4 px-5 py-3">
            <div className="flex min-w-0 flex-col">
              <DialogPrimitive.Title className="clamp-1 text-body text-fog-100">
                {photo?.fileName ?? '照片'}
              </DialogPrimitive.Title>
              <span className="text-micro text-fog-300">
                {viewer.index + 1} / {viewer.photoIds.length} · {formatDate(photo?.takenAt ?? null)}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <IconButton
                label="照片信息"
                variant="glass"
                onClick={toggleExif}
                className={viewer.showExif ? 'text-moss-soft' : undefined}
              >
                <Info className="h-4 w-4" />
              </IconButton>
              <IconButton label="缩放" variant="glass" onClick={() => setZoom((value) => !value)}>
                <Maximize2 className="h-4 w-4" />
              </IconButton>
              <IconButton label="关闭" variant="glass" onClick={close}>
                <X className="h-4 w-4" />
              </IconButton>
            </div>
          </header>

          <div className="relative flex min-h-0 flex-1 items-center justify-center px-5">
            {photo ? (
              <img
                src={mediaUrl.full(photo.id, 2000)}
                alt={photo.fileName}
                onClick={() => setZoom((value) => !value)}
                className={cn(
                  'max-h-full rounded-md object-contain shadow-elev-3 transition-transform duration-slow ease-natural',
                  zoom ? 'scale-[1.35] cursor-zoom-out' : 'cursor-zoom-in',
                )}
              />
            ) : (
              <Skeleton className="h-[70vh] w-[70vw]" />
            )}

            {viewer.photoIds.length > 1 ? (
              <>
                <button
                  type="button"
                  aria-label="上一张"
                  disabled={viewer.index === 0}
                  onClick={() => setIndex(Math.max(viewer.index - 1, 0))}
                  className="absolute left-6 flex h-10 w-10 items-center justify-center rounded-full glass text-fog-100 transition-all hover:border-moss/40 disabled:opacity-30"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  aria-label="下一张"
                  disabled={viewer.index === viewer.photoIds.length - 1}
                  onClick={() => setIndex(Math.min(viewer.index + 1, viewer.photoIds.length - 1))}
                  className="absolute right-6 flex h-10 w-10 items-center justify-center rounded-full glass text-fog-100 transition-all hover:border-moss/40 disabled:opacity-30"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            ) : null}
          </div>

          <footer className="border-t border-line/[0.08] bg-ink-900/70 px-5 py-3">
            {viewer.showExif ? (
              <div className="flex flex-col gap-2">
                <ExifBadgeBar photo={photo ?? null} />
                <div className="flex items-center gap-3 text-micro text-fog-300">
                  {photo?.gpsLat !== null && photo?.gpsLat !== undefined ? (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {photo.gpsLat.toFixed(4)}, {photo.gpsLon?.toFixed(4)}
                    </span>
                  ) : null}
                  {photo?.tags.length ? <span>标签：{photo.tags.join('、')}</span> : null}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-4">
                <ExifBadgeBar photo={photo ?? null} compact className="max-w-[70%]" />
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      aria-label={`评 ${value} 星`}
                      onClick={() => photo && updatePhoto.mutate({ id: photo.id, rating: value })}
                      className="p-0.5 text-fog-300 transition-colors hover:text-amber-gold"
                    >
                      <Star className={cn('h-4 w-4', photo && photo.rating >= value && 'fill-current text-amber-gold')} />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </footer>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
