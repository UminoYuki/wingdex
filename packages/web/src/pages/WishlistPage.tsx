import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, Plus, Target, Telescope } from 'lucide-react'
import { useUpdateSpeciesFlags, useWishlist } from '../api/hooks'
import { PageHeader } from '../components/AppShell'
import { WishlistBoard } from '../components/WishlistBoard'
import { Badge, Button, EmptyState, ErrorState, Panel, Segmented, Skeleton, StatTile, notify } from '../components/ui'
import { percent } from '../lib/format'

type Scope = 'all' | 'pending' | 'achieved'

/** 想拍清单：目标卡网格 + 达成进度环 */
export default function WishlistPage() {
  const navigate = useNavigate()
  const wishlist = useWishlist()
  const flags = useUpdateSpeciesFlags()
  const [scope, setScope] = useState<Scope>('all')

  const items = wishlist.data?.items ?? []
  const achieved = useMemo(() => items.filter((item) => item.photoCount > 0), [items])
  const pending = useMemo(() => items.filter((item) => item.photoCount === 0), [items])
  const visible = scope === 'all' ? items : scope === 'achieved' ? achieved : pending

  if (wishlist.isError) {
    return <ErrorState message="想拍清单加载失败，请确认本地服务正在运行" onRetry={() => void wishlist.refetch()} />
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="想拍清单"
        subtitle="把还没拍到的目标物种先记下来，拍到照片并指派给它之后会自动标记达成，成为一份可勾选的拍摄任务。"
        meta={
          items.length ? (
            <>
              <Badge tone="plume" icon={<Target className="h-3 w-3" />}>
                目标 {items.length} 种
              </Badge>
              <Badge tone="moss" icon={<Camera className="h-3 w-3" />}>
                已达成 {achieved.length} 种
              </Badge>
              <Badge tone="neutral">达成率 {percent(achieved.length, items.length)}%</Badge>
            </>
          ) : null
        }
        actions={
          <>
            <Button variant="secondary" icon={<Telescope className="h-4 w-4" />} onClick={() => navigate('/map')}>
              看足迹分布
            </Button>
            <Button icon={<Plus className="h-4 w-4" />} onClick={() => navigate('/species/new')}>
              新增目标物种
            </Button>
          </>
        }
      />

      {items.length ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatTile label="目标物种" value={items.length} hint="清单里的全部物种" icon={<Target className="h-4 w-4" />} />
          <StatTile
            label="已达成"
            value={achieved.length}
            hint={`占清单 ${percent(achieved.length, items.length)}%`}
            tone="moss"
            icon={<Camera className="h-4 w-4" />}
          />
          <StatTile label="待拍摄" value={pending.length} hint="还没有照片记录" tone="gold" icon={<Telescope className="h-4 w-4" />} />
          <StatTile
            label="已收录照片"
            value={items.reduce((acc, item) => acc + item.photoCount, 0)}
            hint="清单物种的累计照片"
            tone="plume"
          />
        </div>
      ) : null}

      <Panel
        title="目标卡"
        subtitle="卡片上的进度环表示是否已经拍到；悬停卡片可以标记达成或移出清单"
        actions={
          <Segmented
            value={scope}
            onValueChange={(value) => setScope(value as Scope)}
            options={[
              { value: 'all', label: '全部' },
              { value: 'pending', label: `待拍 ${pending.length}` },
              { value: 'achieved', label: `已达成 ${achieved.length}` },
            ]}
          />
        }
      >
        {wishlist.isLoading ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-[300px] w-full rounded-lg" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <EmptyState
            compact
            title={scope === 'achieved' ? '还没有达成的目标' : scope === 'pending' ? '所有目标都拍到了' : '想拍清单还是空的'}
            description={
              scope === 'pending'
                ? '你已经把清单上的物种都拍到了，可以再加几个新目标。'
                : '在物种详情页点击「想拍」即可加入清单，也可以直接新建一个目标物种。'
            }
            action={{ label: '新增目标物种', onClick: () => navigate('/species/new') }}
          />
        ) : (
          <WishlistBoard
            items={visible}
            onRemove={(id) => {
              const species = items.find((item) => item.id === id)
              flags.mutate(
                { id, isWishlist: false },
                { onSuccess: () => notify.success(`已把「${species?.cnName ?? '该物种'}」移出想拍清单`) },
              )
            }}
            onAchieve={(id) => {
              const species = items.find((item) => item.id === id)
              notify.info('指派照片即可达成', `把拍到的照片指派给「${species?.cnName ?? '该物种'}」，进度环会自动点亮`)
              navigate(`/species/${id}`)
            }}
            emptyAction={{ label: '新增目标物种', onClick: () => navigate('/species/new') }}
          />
        )}
      </Panel>

      <Panel title="使用小贴士">
        <ul className="flex flex-col gap-1.5 text-caption leading-relaxed text-fog-200">
          <li>· 录入物种时打开「加入想拍清单」，可以顺便写下期望的季节与地点（想拍理由）。</li>
          <li>· 导入待分类照片后，把照片指派给该物种，想拍即视为达成，并计入成就进度。</li>
          <li>· 达成时间取照片的最早拍摄时间，方便回溯是哪一次外拍完成了目标。</li>
        </ul>
      </Panel>
    </div>
  )
}
