import { Aperture, Camera, CalendarDays, Focus, Gauge, MapPin, Timer } from 'lucide-react'
import type { Photo } from '../api/types'
import { Badge } from './ui'
import { formatAperture, formatClock, formatFocal, formatGps, formatShutter } from '../lib/format'
import { cn } from '../lib/cn'

interface ExifBadgeBarProps {
  photo: Photo | null
  placeName?: string | null
  className?: string
  compact?: boolean
}

/** 拍摄参数徽章条：机身/镜头/焦距/光圈/快门/ISO/时间/地点 */
export function ExifBadgeBar({ photo, placeName, className, compact }: ExifBadgeBarProps) {
  if (!photo) {
    return <p className={cn('text-micro text-fog-300', className)}>该照片没有可用的拍摄参数</p>
  }

  const items: Array<{ key: string; icon: React.ReactNode; text: string; tone?: 'moss' | 'plume' | 'neutral' }> = []

  if (photo.cameraModel) items.push({ key: 'camera', icon: <Camera className="h-3 w-3" />, text: photo.cameraModel })
  if (photo.lens) items.push({ key: 'lens', icon: <Focus className="h-3 w-3" />, text: photo.lens })
  const focal = formatFocal(photo.focalLen)
  if (focal) items.push({ key: 'focal', icon: <Aperture className="h-3 w-3" />, text: focal, tone: 'plume' })
  const aperture = formatAperture(photo.aperture)
  if (aperture) items.push({ key: 'aperture', icon: <Aperture className="h-3 w-3" />, text: aperture })
  const shutter = formatShutter(photo.shutter)
  if (shutter) items.push({ key: 'shutter', icon: <Timer className="h-3 w-3" />, text: shutter })
  if (photo.iso) items.push({ key: 'iso', icon: <Gauge className="h-3 w-3" />, text: `ISO ${photo.iso}` })
  if (photo.takenAt) items.push({ key: 'taken', icon: <CalendarDays className="h-3 w-3" />, text: formatClock(photo.takenAt) })

  const gps = formatGps(photo.gpsLat, photo.gpsLon)
  const location = placeName ?? gps
  if (location) items.push({ key: 'place', icon: <MapPin className="h-3 w-3" />, text: location, tone: 'moss' })

  if (items.length === 0) {
    return <p className={cn('text-micro text-fog-300', className)}>该照片没有可用的拍摄参数</p>
  }

  return (
    <div className={cn('flex flex-wrap items-center gap-1.5', className)}>
      {items.map((item) => (
        <Badge key={item.key} tone={item.tone ?? 'neutral'} icon={item.icon}>
          <span className={compact ? 'max-w-[120px] truncate' : ''}>{item.text}</span>
        </Badge>
      ))}
    </div>
  )
}
