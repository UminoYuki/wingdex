import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, Flame, Medal, Sparkles, TrendingUp } from 'lucide-react'
import { mediaUrl } from '../api/client'
import type { Photo } from '../api/types'
import { usePhotos, useStats } from '../api/hooks'
import { PageHeader } from '../components/AppShell'
import { AchievementCard } from '../components/AchievementCard'
import { StatTiles } from '../components/StatTiles'
import { CameraDonut } from '../components/charts/CameraDonut'
import { DistributionBars } from '../components/charts/DistributionBars'
import { GearBarChart } from '../components/charts/GearBarChart'
import { HeatmapCalendar } from '../components/charts/HeatmapCalendar'
import { MonthlyAreaChart } from '../components/charts/MonthlyAreaChart'
import { Badge, Button, EmptyState, ErrorState, Panel, Skeleton } from '../components/ui'
import { formatDate, formatNumber } from '../lib/format'
import { useUiStore } from '../store/uiStore'

/** 拍摄统计：热力日历、月度节奏、装备战绩、分布排行与地点榜 */
export default function StatsPage() {
  const navigate = useNavigate()
  const stats = useStats()
  const openViewer = useUiStore((state) => state.openViewer)
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState(currentYear)
  const [activeDate, setActiveDate] = useState<string | null>(null)

  const years = useMemo(() => {
    const list = stats.data?.years ?? []
    return list.length ? list : [currentYear]
  }, [stats.data?.years, currentYear])

  const cells = useMemo(
    () => (stats.data?.heatmap ?? []).filter((cell) => cell.date.startsWith(String(year))),
    [stats.data?.heatmap, year],
  )

  const dayPhotos = usePhotos(
    activeDate ? { from: activeDate, to: activeDate, order: 'taken_desc', limit: 36 } : { limit: 0 },
  )
  const photos = activeDate ? (dayPhotos.data?.items ?? []) : []

  if (stats.isError) {
    return <ErrorState message="统计数据加载失败，请确认本地服务正在运行" onRetry={() => void stats.refetch()} />
  }

  const overview = stats.data?.overview

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="拍摄统计"
        subtitle="从出片节奏到装备战绩，用数据回看这一年的外拍轨迹；点击热力日历上的任意一天可以翻出当天所有照片。"
        meta={
          overview ? (
            <>
              <Badge tone="moss" icon={<CalendarDays className="h-3 w-3" />}>
                活跃 {overview.activeDays} 天
              </Badge>
              <Badge tone="gold" icon={<Flame className="h-3 w-3" />}>
                连续打卡 {overview.currentStreak} 天
              </Badge>
              <Badge tone="plume" icon={<TrendingUp className="h-3 w-3" />}>
                最长连续 {overview.longestStreak} 天
              </Badge>
              <Badge tone="neutral">五星照片 {overview.fiveStarCount} 张</Badge>
            </>
          ) : null
        }
        actions={
          <Button variant="secondary" icon={<Sparkles className="h-4 w-4" />} onClick={() => navigate('/achievements')}>
            查看成就墙
          </Button>
        }
      />

      {overview ? <StatTiles overview={overview} /> : <Skeleton className="h-[92px] w-full" />}

      <HeatmapCalendar cells={cells} years={years} year={year} onYearChange={setYear} onSelectDate={setActiveDate} />

      {activeDate ? (
        <Panel
          title={`${formatDate(activeDate)} 的拍摄`}
          subtitle={dayPhotos.isLoading ? '正在读取当天照片…' : `共 ${photos.length} 张`}
          actions={
            <Button variant="ghost" size="sm" onClick={() => setActiveDate(null)}>
              收起
            </Button>
          }
        >
          {photos.length === 0 && !dayPhotos.isLoading ? (
            <p className="text-caption text-fog-300">这一天没有照片记录，换一天试试。</p>
          ) : (
            <div className="grid grid-cols-3 gap-2.5 md:grid-cols-6 xl:grid-cols-8">
              {dayPhotos.isLoading
                ? Array.from({ length: 8 }).map((_, index) => <Skeleton key={index} className="aspect-[4/3] w-full" />)
                : photos.map((photo) => (
                    <DayThumb
                      key={photo.id}
                      photo={photo}
                      onOpen={() => openViewer(photos.map((item) => item.id), photos.indexOf(photo))}
                    />
                  ))}
            </div>
          )}
        </Panel>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-2">
        <MonthlyAreaChart monthly={stats.data?.monthly ?? []} />
        <CameraDonut cameras={stats.data?.cameras ?? []} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <GearBarChart rows={stats.data?.lenses ?? []} title="镜头战绩" subtitle="按镜头统计出片量与物种数" tone="plume" />
        <DistributionBars
          title="目级分布"
          subtitle="按目统计已收录物种"
          rows={stats.data?.orders ?? []}
          tone="moss"
          limit={10}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <DistributionBars
          title="保护级别覆盖"
          subtitle="国家重点保护与三有名录占比"
          rows={stats.data?.protections ?? []}
          tone="gold"
        />
        <DistributionBars
          title="栖息地构成"
          subtitle="按物种栖息标签统计"
          rows={stats.data?.habitats ?? []}
          tone="plume"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr]">
        <Panel title="地点榜" subtitle="出片最多的拍摄地点">
          {(stats.data?.places ?? []).length === 0 ? (
            <EmptyState compact title="还没有地点数据" description="照片带 GPS 或指派到地点后，这里会生成排行榜。" />
          ) : (
            <ol className="flex flex-col gap-2">
              {(stats.data?.places ?? []).map((place, index) => (
                <li
                  key={`${place.id ?? 'none'}-${place.name}`}
                  className="flex items-center gap-3 rounded-md border border-line/[0.06] bg-line/[0.02] px-3 py-2"
                >
                  <span className="w-5 text-micro tabular-nums text-fog-300">{index + 1}</span>
                  <span className="min-w-0 flex-1 truncate text-body text-fog-100">{place.name}</span>
                  <Badge tone="moss">{place.photos} 张</Badge>
                  <Badge tone="plume">{place.species} 种</Badge>
                </li>
              ))}
            </ol>
          )}
        </Panel>

        <Panel
          title="最近解锁"
          subtitle="成就进度随照片与卡片自动推进"
          actions={
            <Button variant="ghost" size="sm" icon={<Medal className="h-3.5 w-3.5" />} onClick={() => navigate('/achievements')}>
              全部
            </Button>
          }
        >
          {(stats.data?.recentAchievements ?? []).length === 0 ? (
            <EmptyState compact title="还没有解锁的成就" description="多拍、多录入、多做卡，徽章会陆续亮起来。" />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {(stats.data?.recentAchievements ?? []).map((item) => (
                <AchievementCard key={item.key} item={item} />
              ))}
            </div>
          )}
        </Panel>
      </div>

      {stats.data ? (
        <p className="text-micro text-fog-300">
          统计口径：共 {formatNumber(stats.data.overview.photoCount)} 张照片 · {formatNumber(stats.data.overview.speciesCount)} 个物种 ·{' '}
          {formatNumber(stats.data.overview.placeCount)} 个地点
        </p>
      ) : null}
    </div>
  )
}

function DayThumb({ photo, onOpen }: { photo: Photo; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group relative aspect-[4/3] overflow-hidden rounded-md border border-line/[0.08] bg-ink-800 transition-all duration-fast hover:-translate-y-0.5 hover:border-moss/40"
    >
      <img
        src={mediaUrl.thumb(photo.id, 240)}
        alt={photo.fileName}
        loading="lazy"
        className="h-full w-full object-cover transition-transform duration-slow group-hover:scale-[1.05]"
      />
      <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/70 to-transparent px-1.5 py-1 text-micro text-fog-200">
        {photo.speciesCnName ?? photo.placeName ?? photo.fileName}
      </span>
    </button>
  )
}
