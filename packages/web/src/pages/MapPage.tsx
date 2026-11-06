import { useMemo, useState } from 'react'
import { ExternalLink, MapPin, Navigation } from 'lucide-react'
import type { GeoPointItem } from '../api/hooks'
import { mediaUrl } from '../api/client'
import { useFacets, useGeoPoints, useGeoWorld, usePhotos } from '../api/hooks'
import { PageHeader } from '../components/AppShell'
import { MissingGeoPanel } from '../components/map/MissingGeoPanel'
import { FootprintMap } from '../map/FootprintMap'
import { Badge, Button, EmptyState, ErrorState, Panel, Select, Skeleton } from '../components/ui'
import { formatDate, formatNumber } from '../lib/format'
import { useUiStore } from '../store/uiStore'

/** 足迹地图：离线世界轮廓 + 拍摄气泡 + 栖息地筛选 + 未定位补录 */
export default function MapPage() {
  const [habitat, setHabitat] = useState('')
  const [selectedId, setSelectedId] = useState<number | null>(null)

  const world = useGeoWorld()
  const points = useGeoPoints(habitat ? { habitat } : {})
  const facets = useFacets()
  const openViewer = useUiStore((state) => state.openViewer)

  const items = points.data?.items ?? []
  const selected = useMemo(() => items.find((item) => item.id === selectedId) ?? null, [items, selectedId])
  const photos = usePhotos(selected ? { placeId: selected.id, limit: 24 } : { limit: 0 })
  const placePhotos = selected ? (photos.data?.items ?? []) : []

  const habitatOptions = [
    { value: '', label: '全部栖息地' },
    ...(facets.data?.habitats ?? []).map((item) => ({ value: item.value, label: `${item.value} · ${item.count}` })),
  ]

  const summary = points.data?.summary

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="足迹地图"
        subtitle="气泡大小代表该地点的出片量与物种数，滚轮缩放、拖拽平移，点击气泡可以翻出那里拍到的照片。"
        meta={
          summary ? (
            <>
              <Badge tone="plume" icon={<Navigation className="h-3 w-3" />}>
                {formatNumber(summary.points)} 个地点
              </Badge>
              <Badge tone="moss">{formatNumber(summary.photos)} 张照片</Badge>
              <Badge tone="neutral">{formatNumber(summary.species)} 个物种</Badge>
            </>
          ) : null
        }
        actions={
          <div className="w-56">
            <Select value={habitat} options={habitatOptions} onValueChange={setHabitat} />
          </div>
        }
      />

      {world.isError ? (
        <ErrorState message="地图轮廓加载失败，请确认本地服务正在运行" onRetry={() => void world.refetch()} />
      ) : null}

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex flex-col gap-5">
          <FootprintMap
            world={world.data ?? null}
            points={items}
            selectedId={selectedId}
            onSelect={(point) => setSelectedId(point.id)}
            loading={points.isLoading}
            className="aspect-[16/9] max-h-[560px] min-h-[320px]"
          />

          {points.isLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : items.length === 0 ? (
            <EmptyState
              title={habitat ? '该栖息地下还没有定位记录' : '还没有带定位的照片'}
              description="导入带 GPS 的照片，或在右侧把无定位的照片补录到地点，气泡就会亮起来。"
            />
          ) : (
            <Panel title="地点清单" subtitle="按出片量排序，点击可与地图联动">
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {[...items]
                  .sort((a, b) => b.photos - a.photos)
                  .map((point) => (
                    <PointRow
                      key={`${point.id}-${point.name}`}
                      point={point}
                      active={selectedId === point.id}
                      onSelect={() => setSelectedId(point.id)}
                    />
                  ))}
              </div>
            </Panel>
          )}
        </div>

        <div className="flex flex-col gap-5">
          {selected ? (
            <Panel
              title={selected.name}
              subtitle={`${selected.photos} 张照片 · ${selected.species} 个物种 · 最近 ${formatDate(selected.lastSeenAt)}`}
              actions={
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<ExternalLink className="h-3.5 w-3.5" />}
                  onClick={() =>
                    window.open(
                      `https://www.openstreetmap.org/?mlat=${selected.lat}&mlon=${selected.lon}#map=12/${selected.lat}/${selected.lon}`,
                      '_blank',
                      'noopener',
                    )
                  }
                >
                  OSM
                </Button>
              }
            >
              {placePhotos.length === 0 ? (
                <Skeleton className="aspect-[4/3] w-full" />
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {placePhotos.map((photo) => (
                    <button
                      key={photo.id}
                      type="button"
                      onClick={() => openViewer(placePhotos.map((item) => item.id), placePhotos.indexOf(photo))}
                      className="group aspect-[4/3] overflow-hidden rounded-md border border-line/[0.08] bg-ink-800 transition-all duration-fast hover:-translate-y-0.5 hover:border-moss/40"
                    >
                      <img
                        src={mediaUrl.thumb(photo.id, 240)}
                        alt={photo.fileName}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-slow group-hover:scale-[1.06]"
                      />
                    </button>
                  ))}
                </div>
              )}
            </Panel>
          ) : (
            <Panel title="下钻查看" subtitle="点击地图气泡或右侧清单里的地点">
              <EmptyState compact title="还没有选中地点" description="选中后可查看那里的照片，并一键在 OpenStreetMap 打开坐标。" />
            </Panel>
          )}

          <MissingGeoPanel />
        </div>
      </div>
    </div>
  )
}

function PointRow({ point, active, onSelect }: { point: GeoPointItem; active: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex items-center gap-2.5 rounded-md border px-3 py-2 text-left transition-colors duration-base ${
        active ? 'border-moss/50 bg-moss/[0.08]' : 'border-line/[0.06] bg-line/[0.02] hover:border-moss/30'
      }`}
    >
      <MapPin className={`h-3.5 w-3.5 shrink-0 ${active ? 'text-moss' : 'text-fog-300'}`} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-body text-fog-100">{point.name}</span>
        <span className="text-micro text-fog-300">
          {point.photos} 张 · {point.species} 种
        </span>
      </span>
    </button>
  )
}
