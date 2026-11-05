import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layers, Package, Plus, Printer, Sparkles } from 'lucide-react'
import type { CardListItem } from '../api/types'
import { useCardList, useCardStats, useCreateCard, useSpeciesList } from '../api/hooks'
import { PageHeader } from '../components/AppShell'
import { CardViewer } from '../card/CardViewer'
import { GameCard } from '../card/GameCard'
import { exportCardsBatch } from '../lib/exportCard'
import {
  Badge,
  Button,
  Dialog,
  EmptyState,
  ErrorState,
  Field,
  Panel,
  Segmented,
  Select,
  Skeleton,
  StatTile,
  notify,
} from '../components/ui'
import { percent } from '../lib/format'
import { ATTRIBUTE_KEYS, RARITY_STYLES } from '../card/cardTheme'
import { buildCardData } from '../card/cardPreview'

type SortKey = 'recent' | 'stars' | 'serial'

/** 卡组：等比卡墙 + 稀有度/属性筛选 + 生成与批量导出 */
export default function CardsPage() {
  const navigate = useNavigate()
  const [sort, setSort] = useState<SortKey>('recent')
  const [rarity, setRarity] = useState('')
  const [attribute, setAttribute] = useState('')
  const [viewingId, setViewingId] = useState<number | null>(null)
  const [generateOpen, setGenerateOpen] = useState(false)
  const [targetSpecies, setTargetSpecies] = useState('')

  const list = useCardList({
    sort,
    ...(rarity ? { rarity } : {}),
    ...(attribute ? { attribute } : {}),
    limit: 120,
  })
  const stats = useCardStats()
  const species = useSpeciesList({ limit: 200, sort: 'name' })
  const createCard = useCreateCard()

  const cards = list.data?.items ?? []
  const topRarity = useMemo(
    () => [...(stats.data?.rarity ?? [])].sort((a, b) => b.count - a.count)[0] ?? null,
    [stats.data?.rarity],
  )

  const generate = () => {
    const id = Number(targetSpecies)
    if (!Number.isInteger(id) || id <= 0) {
      notify.error('先选择一个物种', '可以从下拉里搜索已有物种')
      return
    }
    createCard.mutate(
      { speciesId: id, autoFetch: true },
      {
        onSuccess: (card) => {
          setGenerateOpen(false)
          setTargetSpecies('')
          notify.success(`已生成「${card.serialNo ?? '新卡片'}」`, '默认采用自动摘要与推荐数值，可进入编辑器微调')
          navigate(`/cards/editor/${card.id}`)
        },
      },
    )
  }

  if (list.isError) {
    return <ErrorState message="卡片数据加载失败，请确认本地服务正在运行" onRetry={() => void list.refetch()} />
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="卡组"
        subtitle="每张动物卡都由物种资料与拍摄记录生成，固定 59:86 比例；进入编辑器可以逐图层调整文字、卡图与卡背印花。"
        meta={
          stats.data ? (
            <>
              <Badge tone="gold" icon={<Layers className="h-3 w-3" />}>
                共 {stats.data.total} 张
              </Badge>
              {stats.data.rarity.slice(0, 3).map((item) => (
                <Badge key={item.name} tone={item.name === 'UR' || item.name === '传说' ? 'gold' : 'neutral'}>
                  {item.name} {item.count}
                </Badge>
              ))}
              {topRarity ? <Badge tone="outline">最常见 {topRarity.name}</Badge> : null}
            </>
          ) : null
        }
        actions={
          <>
            <Button
              variant="secondary"
              icon={<Package className="h-4 w-4" />}
              disabled={!cards.length}
              onClick={() =>
                void exportCardsBatch(cards.map((card) => ({ id: card.id, face: 'front' as const, size: 'lg' as const })))
              }
            >
              批量导出
            </Button>
            <Button icon={<Plus className="h-4 w-4" />} onClick={() => setGenerateOpen(true)}>
              生成卡片
            </Button>
          </>
        }
      />

      {stats.data ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatTile label="卡片总数" value={stats.data.total} hint="含全部稀有度" icon={<Layers className="h-4 w-4" />} />
          <StatTile
            label="属性覆盖"
            value={stats.data.attribute.length}
            hint="八属性中已出现的种类"
            tone="plume"
            icon={<Sparkles className="h-4 w-4" />}
          />
          <StatTile
            label="类群覆盖"
            value={stats.data.group.length}
            hint={stats.data.group.slice(0, 2).map((item) => `${item.name} ${item.count}`).join(' · ') || '暂无统计'}
            tone="moss"
          />
          <StatTile
            label="卡组册"
            value={stats.data.deck.length}
            hint={stats.data.deck.length ? `最大卡组 ${stats.data.deck[0]?.name ?? '—'}` : '还没有创建卡组册'}
            tone="gold"
            icon={<Printer className="h-4 w-4" />}
          />
        </div>
      ) : null}

      <Panel
        title="卡片墙"
        subtitle={`当前筛选命中 ${cards.length} 张 · 悬停抬升，点击查看正反面与导出`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="w-36">
              <Select
                value={rarity}
                options={[
                  { value: '', label: '全部稀有度' },
                  ...Object.keys(RARITY_STYLES).map((item) => ({ value: item, label: item })),
                ]}
                onValueChange={setRarity}
              />
            </div>
            <div className="w-32">
              <Select
                value={attribute}
                options={[{ value: '', label: '全部属性' }, ...ATTRIBUTE_KEYS.map((item) => ({ value: item, label: item }))]}
                onValueChange={setAttribute}
              />
            </div>
            <Segmented
              value={sort}
              onValueChange={(value) => setSort(value as SortKey)}
              options={[
                { value: 'recent', label: '最新' },
                { value: 'stars', label: '星级' },
                { value: 'serial', label: '卡号' },
              ]}
            />
          </div>
        }
      >
        {list.isLoading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-6">
            {Array.from({ length: 12 }).map((_, index) => (
              <Skeleton key={index} className="aspect-[59/86] w-full rounded-lg" />
            ))}
          </div>
        ) : cards.length === 0 ? (
          <EmptyState
            title={rarity || attribute ? '当前筛选没有卡片' : '还没有制作任何动物卡'}
            description={
              rarity || attribute
                ? '试试放宽稀有度或属性筛选，或者为新的物种制作卡片。'
                : '选择物种即可生成第一张卡：会自动填入属性、星级、数值与卡面摘要。'
            }
            action={{ label: '生成卡片', onClick: () => setGenerateOpen(true) }}
            secondaryAction={{ label: '重置筛选', onClick: () => { setRarity(''); setAttribute('') } }}
          />
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-6">
            {cards.map((card) => (
              <CardWallItem key={card.id} card={card} onOpen={() => setViewingId(card.id)} />
            ))}
          </div>
        )}
      </Panel>

      {stats.data && stats.data.recent.length ? (
        <Panel title="最近制作" subtitle="最近生成的 8 张卡片">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-8">
            {stats.data.recent.slice(0, 8).map((card) => (
              <CardWallItem key={card.id} card={card} onOpen={() => setViewingId(card.id)} compact />
            ))}
          </div>
        </Panel>
      ) : null}

      <CardViewer cardId={viewingId} onClose={() => setViewingId(null)} />

      <Dialog
        open={generateOpen}
        onOpenChange={setGenerateOpen}
        title="生成动物卡"
        description="选择物种后会自动采用推荐属性、星级与数值，并调用卡面摘要生成简介"
        footer={
          <>
            <Button variant="ghost" onClick={() => setGenerateOpen(false)}>
              取消
            </Button>
            <Button loading={createCard.isPending} onClick={generate} icon={<Sparkles className="h-4 w-4" />}>
              生成并进入编辑器
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Field label="目标物种" required hint="按中文名搜索，支持输入首字快速过滤">
            <Select
              value={targetSpecies}
              options={[
                { value: '', label: '请选择物种' },
                ...(species.data?.items ?? []).map((item) => ({
                  value: String(item.id),
                  label: `${item.cnName}${item.scientificName ? ` · ${item.scientificName}` : ''}`,
                })),
              ]}
              onValueChange={setTargetSpecies}
            />
          </Field>
          <p className="rounded-md border border-white/[0.06] bg-black/20 px-3 py-2.5 text-caption leading-relaxed text-fog-200">
            卡片生成后会统计该物种的照片数与五星照片数，用于计算 DEF 记录值与资料完整度加成；如果还没有照片，仍可先生成卡片，
            之后再回来切换卡图。
          </p>
        </div>
      </Dialog>
    </div>
  )
}

function CardWallItem({
  card,
  onOpen,
  compact,
}: {
  card: CardListItem
  onOpen: () => void
  compact?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group relative flex w-full flex-col items-stretch gap-2 text-left transition-transform duration-base hover:-translate-y-1"
    >
      {/* w-full 必需：按钮是 flex 容器，卡面靠父级宽度撑出 59/86 比例 */}
      <div className="w-full transition-transform duration-base group-hover:scale-[1.02]">
        <GameCard
          card={card}
          data={{
            ...buildCardData(card, { cnName: card.cnName, scientificName: card.scientificName }, null),
            typeLine: [card.group, card.familyName].filter(Boolean).join(' · '),
            photoId: card.photoThumbId ?? card.photoId,
          }}
        />
      </div>
      {compact ? null : (
        <div className="flex items-center justify-between gap-2 px-0.5">
          <span className="truncate text-caption text-fog-100">{card.cnName}</span>
          <span className="shrink-0 text-micro tabular-nums text-fog-300">
            {card.rarity} · {percent(card.stars, 10)}%
          </span>
        </div>
      )}
    </button>
  )
}
