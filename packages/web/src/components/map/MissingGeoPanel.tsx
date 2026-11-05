import { useState } from 'react'
import { MapPin, MapPinned } from 'lucide-react'
import { useAssignPlacePhotos, useCreatePlace, useGeoMissing, usePlaces } from '../../api/hooks'
import type { GeoMissingItem } from '../../api/hooks'
import { Badge, Button, Dialog, EmptyState, Field, Input, Panel, Select, Skeleton, notify } from '../ui'
import { formatDate } from '../../lib/format'

interface MissingGeoPanelProps {
  className?: string
}

/** 没有 GPS 的照片：手动补录地点，把足迹补到地图上 */
export function MissingGeoPanel({ className }: MissingGeoPanelProps) {
  const missing = useGeoMissing(60)
  const places = usePlaces()
  const createPlace = useCreatePlace()
  const assignPhotos = useAssignPlacePhotos()

  const [target, setTarget] = useState<GeoMissingItem | null>(null)
  const [placeId, setPlaceId] = useState('')
  const [draft, setDraft] = useState({ name: '', lat: '', lon: '' })

  const placeOptions = [
    { value: '', label: '新建地点' },
    ...(places.data?.items ?? []).map((place) => ({
      value: String(place.id),
      label: `${place.name}${place.useCount ? ` · ${place.useCount} 次` : ''}`,
    })),
  ]

  const reset = () => {
    setTarget(null)
    setPlaceId('')
    setDraft({ name: '', lat: '', lon: '' })
  }

  const submit = () => {
    if (!target) return
    if (placeId) {
      assignPhotos.mutate(
        { placeId: Number(placeId), photoIds: [target.id] },
        {
          onSuccess: () => {
            notify.success('已把照片归入该地点')
            reset()
          },
        },
      )
      return
    }
    if (!draft.name.trim()) {
      notify.error('地点名称不能为空', '也可以从下拉里选择一个已有地点')
      return
    }
    createPlace.mutate(
      {
        name: draft.name.trim(),
        lat: draft.lat ? Number(draft.lat) : null,
        lon: draft.lon ? Number(draft.lon) : null,
      },
      {
        onSuccess: (place) => {
          assignPhotos.mutate(
            { placeId: place.id, photoIds: [target.id] },
            {
              onSuccess: () => {
                notify.success(`已新建地点「${place.name}」并归入照片`)
                reset()
              },
            },
          )
        },
      },
    )
  }

  const items = missing.data?.items ?? []
  const busy = createPlace.isPending || assignPhotos.isPending

  return (
    <Panel
      className={className}
      title="未定位照片补录"
      subtitle="这批照片没有 GPS 信息，手动归到地点后即可出现在足迹地图上"
      actions={<Badge tone={items.length ? 'gold' : 'neutral'}>{items.length} 张待补录</Badge>}
    >
      {missing.isLoading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState compact title="全部照片都有定位" description="新导入的无 GPS 照片会自动出现在这里，方便补录。" />
      ) : (
        <ul className="flex max-h-[420px] flex-col gap-2 overflow-y-auto pr-1">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-3 rounded-md border border-white/[0.06] bg-white/[0.02] px-3 py-2.5"
            >
              <MapPin className="h-4 w-4 shrink-0 text-fog-300" />
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-body text-fog-100">{item.fileName}</span>
                <span className="text-micro text-fog-300">
                  {[item.speciesCnName ?? '未指派物种', item.placeName ?? '无地点', formatDate(item.takenAt)].join(' · ')}
                </span>
              </div>
              <Button size="sm" variant="secondary" icon={<MapPinned className="h-3.5 w-3.5" />} onClick={() => setTarget(item)}>
                补录
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Dialog
        open={Boolean(target)}
        onOpenChange={(open) => (open ? undefined : reset())}
        title="补录拍摄地点"
        description={target ? `${target.fileName} · ${formatDate(target.takenAt)}` : undefined}
        footer={
          <>
            <Button variant="ghost" onClick={reset}>
              取消
            </Button>
            <Button loading={busy} onClick={submit}>
              保存地点
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Field label="已有地点" hint="选择后直接归入，不再新建">
            <Select value={placeId} options={placeOptions} onValueChange={setPlaceId} />
          </Field>
          {placeId ? null : (
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="地点名称" required className="md:col-span-1">
                <Input
                  value={draft.name}
                  placeholder="例如 崇明东滩"
                  onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
                />
              </Field>
              <Field label="纬度">
                <Input
                  value={draft.lat}
                  placeholder="31.6219"
                  onChange={(event) => setDraft((current) => ({ ...current, lat: event.target.value }))}
                />
              </Field>
              <Field label="经度">
                <Input
                  value={draft.lon}
                  placeholder="121.8123"
                  onChange={(event) => setDraft((current) => ({ ...current, lon: event.target.value }))}
                />
              </Field>
            </div>
          )}
        </div>
      </Dialog>
    </Panel>
  )
}
