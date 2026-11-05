import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bird, Camera, FolderInput, Images, Plus, Sparkles, Wand2 } from 'lucide-react'
import type { Photo, SpeciesWithStats } from '../api/types'
import { useSpeciesList, useStats, useToggleSpeciesFlag } from '../api/hooks'
import type { SpeciesFilters } from '../api/hooks'
import { mediaUrl } from '../api/client'
import { PageHeader } from '../components/AppShell'
import { FilterBar } from '../components/FilterBar'
import { SpeciesCard } from '../components/SpeciesCard'
import { StatTiles } from '../components/StatTiles'
import { Badge, Button, EmptyState, ErrorState, IconButton, Skeleton, notify } from '../components/ui'
import { useInfinitePhotos } from '../hooks/useInfinitePhotos'
import { useUiStore } from '../store/uiStore'
import { cn } from '../lib/cn'
import { formatDate, formatNumber } from '../lib/format'

/** 图鉴墙：概览统计 + 筛选条 + 物种卡片墙 / 拍摄日志流 */
export function AtlasPage() {
  const navigate = useNavigate()
  const [filters, setFilters] = useState<SpeciesFilters>({ sort: 'recent', limit: 60 })
  const view = useUiStore((state) => state.atlasView)
  const setView = useUiStore((state) => state.setAtlasView)
  const openViewer = useUiStore((state) => state.openViewer)
  const openQuickCreate = useUiStore((state) => state.openQuickCreate)

  const stats = useStats()
  const list = useSpeciesList(filters)

  const items = list.data?.items ?? []
  const isEmpty = !list.isLoading && items.length === 0

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="我的生灵图鉴"
        subtitle="把外拍遇到的每一次相遇收进本地图鉴：照片只索引原图，资料来自维基与 Wikidata，卡片可以自由重排。"
        meta={
          stats.data ? (
            <>
              <Badge tone="moss">已收录 {formatNumber(stats.data.overview.speciesCount)} 种</Badge>
              <Badge tone="plume">连续打卡 {stats.data.overview.currentStreak} 天</Badge>
              <Badge tone="gold">想拍达成 {stats.data.overview.wishlistAchieved}/{stats.data.overview.wishlistCount}</Badge>
            </>
          ) : null
        }
        actions={
          <>
            <Button variant="outline" icon={<FolderInput className="h-4 w-4" />} onClick={() => navigate('/inbox')}>
              导入待分类
            </Button>
            <Button variant="secondary" icon={<Wand2 className="h-4 w-4" />} onClick={openQuickCreate}>
              快捷录入
            </Button>
            <Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={() => navigate('/species/new')}>
              录入物种
            </Button>
          </>
        }
      />

      {stats.data ? <StatTiles overview={stats.data.overview} /> : <Skeleton className="h-[86px] w-full" />}

      <FilterBar
        filters={filters}
        onChange={setFilters}
        view={view}
        onViewChange={setView}
        total={list.data?.total}
      />

      {list.isError ? (
        <ErrorState message={list.error instanceof Error ? list.error.message : '图鉴加载失败'} onRetry={() => void list.refetch()} />
      ) : isEmpty ? (
        <EmptyState
          icon={<Bird className="h-5 w-5" />}
          title="图鉴还空着，先扫描一次照片目录吧"
          description="扫描只读取原图并建立索引，不会移动或复制你的文件。扫描完成后在「导入待分类」里把照片指派给物种即可。"
          action={{ label: '去导入照片', onClick: () => navigate('/inbox'), icon: <FolderInput className="h-4 w-4" /> }}
          secondaryAction={{ label: '手动录入物种', onClick: () => navigate('/species/new') }}
        />
      ) : view === 'grid' ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
          {list.isLoading
            ? Array.from({ length: 10 }).map((_, index) => <Skeleton key={index} className="aspect-[59/86] w-full" />)
            : items.map((species) => (
                <SpeciesTile
                  key={species.id}
                  species={species}
                  onCreateCard={() => navigate(`/cards/editor/new?speciesId=${species.id}`)}
                />
              ))}
        </div>
      ) : (
        <PhotoStream onOpen={(ids, index) => openViewer(ids, index)} />
      )}
    </div>
  )
}

/** 单个物种卡片：收藏 / 想拍 / 建卡 三个动作各自持有 mutation */
function SpeciesTile({ species, onCreateCard }: { species: SpeciesWithStats; onCreateCard: () => void }) {
  const toggle = useToggleSpeciesFlag(species.id)
  return (
    <SpeciesCard
      species={species}
      onToggleFavorite={(next) => toggle.mutate({ isFavorite: next }, { onSuccess: () => notify.success(next ? '已加入收藏' : '已取消收藏', species.cnName) })}
      onToggleWishlist={(next) => toggle.mutate({ isWishlist: next }, { onSuccess: () => notify.success(next ? '已加入想拍清单' : '已移出想拍清单', species.cnName) })}
      onCreateCard={onCreateCard}
    />
  )
}

/** 拍摄日志流：日期分组 + 照片网格 + 滚动加载 */
function PhotoStream({ onOpen }: { onOpen: (ids: number[], index: number) => void }) {
  const stream = useInfinitePhotos({ order: 'taken_desc' })
  const sentinel = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const node = sentinel.current
    if (!node) return
    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting && stream.hasNextPage && !stream.isFetchingNextPage) void stream.fetchNextPage()
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [stream])

  const photos = useMemo(() => stream.data?.pages.flatMap((page) => page.items) ?? [], [stream.data])
  const ids = useMemo(() => photos.map((photo) => photo.id), [photos])

  if (stream.isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
        {Array.from({ length: 12 }).map((_, index) => (
          <Skeleton key={index} className="aspect-[4/3] w-full" />
        ))}
      </div>
    )
  }

  if (photos.length === 0) {
    return (
      <EmptyState
        icon={<Images className="h-5 w-5" />}
        title="还没有照片"
        description="扫描目录后，照片会按拍摄时间倒序出现在这里，方便快速回顾最近的外拍成果。"
      />
    )
  }

  const groups = groupByDay(photos)

  return (
    <div className="flex flex-col gap-6">
      {groups.map((group) => (
        <section key={group.day} className="flex flex-col gap-3">
          <header className="flex items-center gap-3">
            <h2 className="text-title text-fog-100">{group.day}</h2>
            <Badge tone="neutral">{group.photos.length} 张</Badge>
            <span className="h-px flex-1 bg-white/[0.07]" />
            <span className="text-micro text-fog-300">
              {group.places.length > 0 ? group.places.join(' · ') : '未标注地点'}
            </span>
          </header>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
            {group.photos.map((photo) => (
              <button
                key={photo.id}
                type="button"
                onClick={() => onOpen(ids, ids.indexOf(photo.id))}
                className="group relative aspect-[4/3] overflow-hidden rounded-md border border-white/[0.08] bg-ink-800 transition-all duration-fast hover:-translate-y-0.5 hover:border-moss/40 hover:shadow-elev-2"
              >
                <img
                  src={mediaUrl.thumb(photo.id, 640)}
                  alt={photo.fileName}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-slow group-hover:scale-[1.04]"
                />
                <span className="absolute inset-x-0 bottom-0 flex items-center gap-1.5 bg-gradient-to-t from-black/75 to-transparent px-2 py-1.5">
                  <Camera className="h-3 w-3 text-plume" />
                  <span className="truncate text-micro text-fog-200">
                    {[photo.cameraModel, photo.focalLen ? `${photo.focalLen}mm` : null].filter(Boolean).join(' · ') || '无参数'}
                  </span>
                </span>
                {photo.speciesId === null ? (
                  <span className="absolute right-1.5 top-1.5 rounded bg-amber-gold/85 px-1.5 py-0.5 text-micro text-ink-900">
                    待分类
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        </section>
      ))}

      <div ref={sentinel} className="flex items-center justify-center py-4">
        {stream.hasNextPage ? (
          <Button variant="ghost" size="sm" loading={stream.isFetchingNextPage} onClick={() => void stream.fetchNextPage()}>
            加载更早的照片
          </Button>
        ) : (
          <span className="text-micro text-fog-300">已经到底了 · 共 {formatNumber(photos.length)} 张</span>
        )}
      </div>
    </div>
  )
}

function groupByDay(photos: Photo[]) {
  const buckets = new Map<string, { day: string; photos: Photo[]; places: string[] }>()
  for (const photo of photos) {
    const day = photo.takenAt ? formatDate(photo.takenAt) : '未记录时间'
    const bucket = buckets.get(day) ?? { day, photos: [], places: [] }
    bucket.photos.push(photo)
    if (photo.placeName && !bucket.places.includes(photo.placeName)) bucket.places.push(photo.placeName)
    buckets.set(day, bucket)
  }
  return [...buckets.values()]
}

export default AtlasPage
