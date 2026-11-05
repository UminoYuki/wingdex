import { useMemo, useState } from 'react'
import { Award, RefreshCw, Trophy } from 'lucide-react'
import type { AchievementView } from '../api/types'
import { useAchievements, useRefreshAchievements } from '../api/hooks'
import { PageHeader } from '../components/AppShell'
import { AchievementCard } from '../components/AchievementCard'
import { Badge, Button, EmptyState, ErrorState, Panel, Progress, ProgressRing, Segmented, Skeleton, notify } from '../components/ui'
import { percent } from '../lib/format'

type Filter = 'all' | 'unlocked' | 'locked'

/** 成就墙：完成度环 + 分组大徽章 + 进度环 */
export default function AchievementsPage() {
  const achievements = useAchievements()
  const refresh = useRefreshAchievements()
  const [filter, setFilter] = useState<Filter>('all')
  const [group, setGroup] = useState<string>('all')

  const data = achievements.data
  const summary = data?.summary

  const visibleGroups = useMemo(() => {
    const groups = data?.groups ?? []
    const scoped = group === 'all' ? groups : groups.filter((item) => item.key === group)
    if (filter === 'all') return scoped
    return scoped
      .map((entry) => ({
        ...entry,
        items: entry.items.filter((item) => (filter === 'unlocked' ? item.unlocked : !item.unlocked)),
      }))
      .filter((entry) => entry.items.length > 0)
  }, [data?.groups, filter, group])

  const shown = visibleGroups.reduce((acc, entry) => acc + entry.items.length, 0)

  if (achievements.isError) {
    return <ErrorState message="成就数据加载失败，请确认本地服务正在运行" onRetry={() => void achievements.refetch()} />
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="成就墙"
        subtitle="成就只增不减：拍到的物种、补齐的资料、做过的卡片都会留下徽章，新解锁时会自动弹出提示。"
        meta={
          summary ? (
            <>
              <Badge tone="gold" icon={<Trophy className="h-3 w-3" />}>
                {summary.unlocked}/{summary.total} 已解锁
              </Badge>
              {Object.entries(summary.byTier).map(([tier, value]) => (
                <Badge key={tier} tone="neutral">
                  {tier} {value.unlocked}/{value.total}
                </Badge>
              ))}
            </>
          ) : null
        }
        actions={
          <Button
            variant="secondary"
            icon={<RefreshCw className="h-4 w-4" />}
            loading={refresh.isPending}
            onClick={() =>
              refresh.mutate(undefined, {
                onSuccess: (result) => {
                  const unlocked = result?.unlocked ?? []
                  if (unlocked.length) {
                    notify.success(`新解锁 ${unlocked.length} 项成就`, unlocked.join('、'))
                  } else {
                    notify.info('没有新的成就', '继续拍摄与整理，徽章会继续推进')
                  }
                },
              })
            }
          >
            刷新进度
          </Button>
        }
      />

      <Panel
        title="总体完成度"
        subtitle={summary?.latest ? `最近解锁：${summary.latest.name}` : '还没有解锁成就，从第一张照片开始吧'}
        icon={<Award className="h-4 w-4" />}
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-8">
          <div className="flex items-center gap-4">
            <ProgressRing
              value={summary?.unlocked ?? 0}
              max={summary?.total ?? 1}
              size={112}
              thickness={8}
              tone="gold"
              hint={`${summary?.unlocked ?? 0}/${summary?.total ?? 0}`}
            />
            <p className="max-w-sm text-caption leading-relaxed text-fog-200">
              成就按「拍摄记录、物种收集、资料完整、卡片制作、装备与地点、坚持打卡」等维度分组，解锁时间会被永久保留。
            </p>
          </div>

          <div className="flex flex-1 flex-col gap-3">
            {(data?.groups ?? []).slice(0, 4).map((entry) => (
              <div key={entry.key} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-caption">
                  <span className="text-fog-200">{entry.name}</span>
                  <span className="tabular-nums text-fog-300">
                    {entry.unlocked}/{entry.total}
                  </span>
                </div>
                <Progress value={percent(entry.unlocked, entry.total)} tone="moss" />
              </div>
            ))}
          </div>
        </div>
      </Panel>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Segmented
            value={group}
            onValueChange={setGroup}
            options={[
              { value: 'all', label: '全部分组' },
              ...(data?.groups ?? []).map((entry) => ({ value: entry.key, label: entry.name })),
            ]}
          />
        </div>
        <Segmented
          value={filter}
          onValueChange={(value) => setFilter(value as Filter)}
          options={[
            { value: 'all', label: '全部' },
            { value: 'unlocked', label: '已解锁' },
            { value: 'locked', label: '未解锁' },
          ]}
        />
      </div>

      {achievements.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="h-[220px] w-full rounded-lg" />
          ))}
        </div>
      ) : shown === 0 ? (
        <EmptyState
          icon={<Trophy className="h-6 w-6 text-fog-300" />}
          title={filter === 'unlocked' ? '还没有解锁的成就' : '该分组暂无内容'}
          description="换个筛选条件看看，或者先去图鉴墙补几张照片。"
          action={{ label: '重置筛选', onClick: () => { setFilter('all'); setGroup('all') } }}
        />
      ) : (
        visibleGroups.map((entry) => (
          <section key={entry.key} className="flex flex-col gap-3">
            <header className="flex items-baseline justify-between">
              <h2 className="text-title text-fog-100">{entry.name}</h2>
              <span className="text-caption tabular-nums text-fog-300">
                {entry.unlocked}/{entry.total} · {percent(entry.unlocked, entry.total)}%
              </span>
            </header>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {entry.items.map((item) => (
                <AchievementCard key={item.key} item={item as AchievementView} sweep={item.unlocked} />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  )
}
