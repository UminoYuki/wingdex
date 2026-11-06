import { useCallback, useMemo, useRef, useState } from 'react'
import { Minus, Plus, RotateCcw } from 'lucide-react'
import { geoGraticule10, geoNaturalEarth1, geoPath } from 'd3-geo'
import type { GeoPointItem } from '../api/hooks'
import type { GeoResponse } from '../api/types'
import { cn } from '../lib/cn'
import { formatNumber } from '../lib/format'

const VIEW_W = 960
const VIEW_H = 540
const MIN_ZOOM = 1
const MAX_ZOOM = 12

interface FootprintMapProps {
  world?: GeoResponse | null
  points: GeoPointItem[]
  selectedId?: number | null
  onSelect?: (point: GeoPointItem) => void
  loading?: boolean
  className?: string
}

/** d3-geo 离线投影地图：国家轮廓 + 拍摄足迹气泡，支持滚轮缩放与拖拽平移 */
export function FootprintMap({ world, points, selectedId, onSelect, loading, className }: FootprintMapProps) {
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [hover, setHover] = useState<GeoPointItem | null>(null)
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null)

  const projection = useMemo(
    () =>
      geoNaturalEarth1()
        .scale((VIEW_W / 6.4) * zoom)
        .translate([VIEW_W / 2 + offset.x, VIEW_H / 2 + offset.y]),
    [offset.x, offset.y, zoom],
  )

  const pathOf = useMemo(() => geoPath(projection), [projection])
  const graticule = useMemo(() => pathOf(geoGraticule10()) ?? '', [pathOf])
  const landPath = useMemo(
    () => (world ? pathOf(world as never) ?? '' : ''),
    [pathOf, world],
  )

  const bubbles = useMemo(
    () =>
      points
        .map((point) => {
          const projected = projection([point.lon, point.lat])
          if (!projected) return null
          return {
            point,
            x: projected[0],
            y: projected[1],
            radius: Math.min(26, 3.4 + Math.sqrt(point.photos) * 2.1),
          }
        })
        .filter((item): item is { point: GeoPointItem; x: number; y: number; radius: number } => item !== null),
    [points, projection],
  )

  const clampZoom = useCallback((value: number) => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, Number(value.toFixed(2)))), [])
  const reset = useCallback(() => {
    setZoom(1)
    setOffset({ x: 0, y: 0 })
  }, [])

  return (
    <div className={cn('relative w-full overflow-hidden rounded-lg border border-line/[0.08] bg-ink-900/70', className)}>
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        preserveAspectRatio="xMidYMid meet"
        className="h-full w-full touch-none"
        style={{ cursor: drag.current ? 'grabbing' : 'grab' }}
        onWheel={(event) => {
          event.preventDefault()
          setZoom((value) => clampZoom(value * (event.deltaY > 0 ? 0.9 : 1.1)))
        }}
        onPointerDown={(event) => {
          drag.current = { x: event.clientX, y: event.clientY, ox: offset.x, oy: offset.y }
          event.currentTarget.setPointerCapture(event.pointerId)
        }}
        onPointerMove={(event) => {
          const state = drag.current
          if (!state) return
          setOffset({ x: state.ox + (event.clientX - state.x), y: state.oy + (event.clientY - state.y) })
        }}
        onPointerUp={() => {
          drag.current = null
        }}
        onPointerLeave={() => {
          drag.current = null
        }}
      >
        <defs>
          <radialGradient id="map-ocean" cx="50%" cy="42%" r="72%">
            <stop offset="0%" stopColor="#16241E" />
            <stop offset="100%" stopColor="#0C1310" />
          </radialGradient>
          <filter id="bubble-glow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="3.4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <rect x="0" y="0" width={VIEW_W} height={VIEW_H} fill="url(#map-ocean)" />
        <path d={graticule} fill="none" stroke="rgba(159,176,165,0.10)" strokeWidth="0.6" />
        <path d={landPath} fill="rgba(87,199,133,0.07)" stroke="rgba(127,209,165,0.34)" strokeWidth="0.7" />

        {bubbles.map(({ point, x, y, radius }) => {
          const active = selectedId === point.id || hover?.id === point.id
          return (
            <g
              key={`${point.id}-${point.name}`}
              transform={`translate(${x.toFixed(1)}, ${y.toFixed(1)})`}
              className="cursor-pointer"
              onPointerEnter={() => setHover(point)}
              onPointerLeave={() => setHover((value) => (value?.id === point.id ? null : value))}
              onClick={() => onSelect?.(point)}
            >
              <circle
                r={radius}
                fill={active ? 'rgba(232,176,75,0.34)' : 'rgba(111,179,201,0.24)'}
                stroke={active ? '#E8B04B' : '#6FB3C9'}
                strokeWidth={active ? 1.4 : 0.9}
                filter="url(#bubble-glow)"
              />
              <circle r={Math.max(1.2, radius * 0.22)} fill={active ? '#FFE3A3' : '#7FD1A5'} />
            </g>
          )
        })}
      </svg>

      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-3">
        <div className="pointer-events-auto flex items-center gap-1.5 rounded-md border border-line/[0.08] bg-black/45 px-2 py-1 backdrop-blur-sm">
          <span className="text-micro text-fog-300">
            {loading
              ? '加载足迹…'
              : `${formatNumber(points.length)} 个地点 · ${formatNumber(
                  points.reduce((acc, item) => acc + item.photos, 0),
                )} 张照片`}
          </span>
        </div>
        <div className="pointer-events-auto flex items-center gap-1.5">
          <MapButton label="缩小" onClick={() => setZoom((value) => clampZoom(value / 1.25))}>
            <Minus className="h-3.5 w-3.5" />
          </MapButton>
          <MapButton label="放大" onClick={() => setZoom((value) => clampZoom(value * 1.25))}>
            <Plus className="h-3.5 w-3.5" />
          </MapButton>
          <MapButton label="复位" onClick={reset}>
            <RotateCcw className="h-3.5 w-3.5" />
          </MapButton>
        </div>
      </div>

      {hover ? (
        <div className="pointer-events-none absolute bottom-3 left-3 rounded-md border border-line/[0.1] bg-black/70 px-3 py-2 backdrop-blur-sm">
          <p className="text-caption font-medium text-fog-100">{hover.name}</p>
          <p className="text-micro text-fog-300">
            {hover.photos} 张 · {hover.species} 种
            {hover.lastSeenAt ? ` · 最近 ${hover.lastSeenAt.slice(0, 10)}` : ''}
          </p>
        </div>
      ) : null}

      <span className="pointer-events-none absolute bottom-3 right-3 text-micro text-fog-300">滚轮缩放 · 拖拽平移 · 点击气泡下钻</span>
    </div>
  )
}

function MapButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="glass flex h-7 w-7 items-center justify-center rounded-md text-fog-200 transition-colors duration-fast hover:text-moss focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss/60 active:scale-95"
    >
      {children}
    </button>
  )
}
