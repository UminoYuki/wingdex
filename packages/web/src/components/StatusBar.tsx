import { CircleDot, Database, HardDriveDownload, Loader2, Sparkles, TrendingUp } from 'lucide-react'
import { cn } from '../lib/cn'
import { useHealth, useScanStatus, useStats } from '../api/hooks'
import { formatDate } from '../lib/format'
import { useUiStore } from '../store/uiStore'

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="text-fog-300">{label}</span>
      <span className="tabular-nums text-fog-100">{value}</span>
    </span>
  )
}

export function StatusBar() {
  const { data: health } = useHealth()
  const { data: stats } = useStats()
  const { data: scan } = useScanStatus()
  const openViewer = useUiStore((state) => state.viewer)

  const isDesktop = Boolean(window.birdAtlas)

  return (
    <footer className="fixed inset-x-0 bottom-0 z-40 h-9 border-t border-white/[0.07] bg-ink-900/88 backdrop-blur-xl">
      <div className="mx-auto flex h-full w-full max-w-[1560px] items-center justify-between gap-4 px-6 text-micro text-fog-200">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <CircleDot className={cn('h-3 w-3', health ? 'text-success' : 'text-danger')} />
            <span className="text-fog-300">本地引擎</span>
            <span className="text-fog-100">{health ? '运行中' : '未连接'}</span>
          </span>
          <Metric label="物种" value={stats?.overview.speciesCount ?? health?.counts.species ?? 0} />
          <Metric label="照片" value={stats?.overview.photoCount ?? health?.counts.photos ?? 0} />
          <Metric label="卡片" value={stats?.overview.cardCount ?? health?.counts.cards ?? 0} />
          <Metric label="地点" value={stats?.overview.placeCount ?? health?.counts.places ?? 0} />
        </div>

        <div className="flex items-center gap-4">
          {scan?.running ? (
            <span className="flex items-center gap-1.5 text-amber-gold">
              <Loader2 className="h-3 w-3 animate-spin" />
              正在扫描 {scan.processed}/{scan.total || '—'}
            </span>
          ) : scan?.lastResult ? (
            <span className="flex items-center gap-1.5">
              <HardDriveDownload className="h-3 w-3 text-fog-300" />
              上次导入 {scan.lastResult.imported} 张 · {formatDate(new Date().toISOString())}
            </span>
          ) : null}

          {stats?.overview.currentStreak ? (
            <span className="flex items-center gap-1.5">
              <TrendingUp className="h-3 w-3 text-moss" />
              连续 {stats.overview.currentStreak} 天
            </span>
          ) : null}

          {stats?.recentAchievements?.length ? (
            <span className="flex max-w-[280px] items-center gap-1.5 truncate">
              <Sparkles className="h-3 w-3 text-amber-gold" />
              <span className="truncate text-fog-100">{stats.recentAchievements[stats.recentAchievements.length - 1].name}</span>
            </span>
          ) : null}

          {openViewer ? <span className="text-fog-300">查看照片中</span> : null}

          <span className="flex items-center gap-1.5" title={health?.dataDir ?? '未连接'}>
            <Database className="h-3 w-3 text-fog-300" />
            {isDesktop ? '桌面模式' : '浏览器模式'} · v{health?.version ?? '0.1.0'}
          </span>
        </div>
      </div>
    </footer>
  )
}
