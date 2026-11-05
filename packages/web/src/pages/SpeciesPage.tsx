import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CalendarClock, Heart, Layers, Pencil, RefreshCw, Sparkles, Star, Trash2 } from 'lucide-react'
import { mediaUrl } from '../api/client'
import {
  useAssignPhotos,
  useCardList,
  useDeleteSpecies,
  useRefreshSpecies,
  useSpecies,
  useSpeciesPhotos,
  useToggleSpeciesFlag,
  useUpdateSpecies,
} from '../api/hooks'
import { PageHeader } from '../components/AppShell'
import { GameCard } from '../card/GameCard'
import { buildCardData } from '../card/cardPreview'
import { CARD_SIZES } from '../card/cardMetrics'
import { PhotoGrid } from '../components/PhotoGrid'
import { SoundPlaceholder } from '../components/SoundPlaceholder'
import { SpeciesInfoPanel } from '../components/SpeciesInfoPanel'
import { WikiPanel } from '../components/WikiPanel'
import { Badge, Button, Dialog, EmptyState, ErrorState, IconButton, Panel, Skeleton } from '../components/ui'
import { cn } from '../lib/cn'
import { formatDate, formatNumber } from '../lib/format'
import { useUiStore } from '../store/uiStore'

const EMPTY = '—'

/** 物种详情：头图 + 完整资料面板 + 照片网格 + 已建卡片 */
export default function SpeciesPage() {
  const { id } = useParams()
  const speciesId = Number(id)
  const navigate = useNavigate()
  const openViewer = useUiStore((state) => state.openViewer)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const { data: species, isLoading, isError, error, refetch } = useSpecies(speciesId)
  const photosQuery = useSpeciesPhotos(speciesId)
  const cardsQuery = useCardList({ speciesId, limit: 24 })
  const toggleFlag = useToggleSpeciesFlag(speciesId)
  const updateSpecies = useUpdateSpecies(speciesId)
  const refreshSpecies = useRefreshSpecies(speciesId)
  const deleteSpecies = useDeleteSpecies()
  const assignPhotos = useAssignPhotos()

  const photos = photosQuery.data?.items ?? []
  const cards = cardsQuery.data?.items ?? []
  const heroPhotoId = useMemo(
    () => (species ? species.coverPhotoId ?? species.photoIds[0] ?? null : null),
    [species],
  )

  if (isLoading) {
    return (
      <div className="flex flex-col gap-5">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-56 w-full rounded-lg" />
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
          <Skeleton className="h-72 rounded-lg" />
          <Skeleton className="h-72 rounded-lg" />
        </div>
      </div>
    )
  }

  if (isError || !species) {
    return (
      <ErrorState
        message={`物种资料加载失败：${error instanceof Error ? error.message : '请确认本地服务已启动'}`}
        onRetry={() => void refetch()}
      />
    )
  }

  const firstSeen = species.firstSeenAt ? formatDate(species.firstSeenAt) : EMPTY
  const lastSeen = species.lastSeenAt ? formatDate(species.lastSeenAt) : EMPTY

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={species.cnName}
        subtitle={[species.scientificName, species.enName].filter(Boolean).join(' · ') || '学名待补录'}
        meta={
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="moss">{species.group}</Badge>
            {species.orderName ? <Badge tone="neutral">{species.orderName}</Badge> : null}
            {species.familyName ? <Badge tone="neutral">{species.familyName}</Badge> : null}
            <Badge tone="gold" icon={<Star className="h-3 w-3" />}>
              {species.starScore} 星
            </Badge>
            <span className="text-caption text-fog-300">
              {formatNumber(species.photoCount)} 张照片 · {formatNumber(species.cardCount)} 张卡片
            </span>
          </div>
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <IconButton label="返回图鉴墙" variant="ghost" onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4" />
            </IconButton>
            <Button
              variant="ghost"
              icon={<Heart className={cn('h-4 w-4', species.isFavorite && 'fill-danger text-danger')} />}
              onClick={() => toggleFlag.mutate({ isFavorite: !species.isFavorite })}
            >
              {species.isFavorite ? '已收藏' : '收藏'}
            </Button>
            <Button
              variant="ghost"
              icon={<Layers className="h-4 w-4" />}
              onClick={() => toggleFlag.mutate({ isWishlist: !species.isWishlist })}
            >
              {species.isWishlist ? '移出想拍' : '加入想拍'}
            </Button>
            <Button variant="secondary" icon={<Pencil className="h-4 w-4" />} onClick={() => navigate(`/species/${species.id}/edit`)}>
              编辑资料
            </Button>
            <Button
              icon={<Sparkles className="h-4 w-4" />}
              disabled={species.photoCount === 0}
              onClick={() => navigate(`/cards/editor/new?speciesId=${species.id}`)}
            >
              制作卡片
            </Button>
            <IconButton label="删除物种" variant="ghost" onClick={() => setConfirmOpen(true)}>
              <Trash2 className="h-4 w-4" />
            </IconButton>
          </div>
        }
      />

      <section className="relative overflow-hidden rounded-lg border border-white/[0.08] bg-ink-800">
        {heroPhotoId ? (
          <img
            src={mediaUrl.thumb(heroPhotoId, 1600)}
            alt={species.cnName}
            className="h-[260px] w-full object-cover opacity-85 md:h-[340px]"
          />
        ) : (
          <div className="flex h-[200px] w-full items-center justify-center bg-gradient-to-br from-ink-700 to-ink-900 text-caption text-fog-300">
            尚无照片，去「导入待分类」指派几张吧
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-900 via-ink-900/40 to-transparent" />
        <div className="absolute inset-x-6 bottom-5 flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-display text-fog-100">{species.cnName}</span>
            <span className="text-caption italic text-fog-200">{species.scientificName ?? '学名待补录'}</span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-caption text-fog-200">
            <span className="flex items-center gap-1.5">
              <CalendarClock className="h-3.5 w-3.5" />
              首次 {firstSeen} · 最近 {lastSeen}
            </span>
            <span>{species.placeNames.slice(0, 3).join('、') || '地点待补录'}</span>
          </div>
        </div>
      </section>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex flex-col gap-5">
          <Panel
            title="照片记录"
            subtitle={`${formatNumber(species.photoCount)} 张 · ${species.cameraCount} 台机身`}
            actions={
              <Button
                variant="ghost"
                size="sm"
                icon={<RefreshCw className="h-3.5 w-3.5" />}
                loading={photosQuery.isFetching}
                onClick={() => void photosQuery.refetch()}
              >
                刷新
              </Button>
            }
          >
            {photosQuery.isLoading ? (
              <PhotoGrid photos={[]} loading />
            ) : photos.length === 0 ? (
              <EmptyState
                icon={<Layers className="h-5 w-5" />}
                title="还没有这个物种的照片"
                description="去「导入待分类」把已拍摄的照片指派给这个物种，图鉴与卡片都会立刻更新。"
                action={{ label: '去指派照片', onClick: () => navigate('/inbox') }}
              />
            ) : (
              <PhotoGrid photos={photos} onOpen={(index) => openViewer(photos.map((photo) => photo.id), index)} />
            )}
          </Panel>

          <Panel
            title="我的卡片"
            subtitle={cards.length ? `${cards.length} 张已制作的动物卡` : '还没有为这个物种制作卡片'}
            actions={
              <Button
                variant="ghost"
                size="sm"
                icon={<Sparkles className="h-3.5 w-3.5" />}
                disabled={species.photoCount === 0}
                onClick={() => navigate(`/cards/editor/new?speciesId=${species.id}`)}
              >
                制作卡片
              </Button>
            }
          >
            {cards.length === 0 ? (
              <EmptyState
                icon={<Sparkles className="h-5 w-5" />}
                title="尚未制卡"
                description="卡片会自动带上物种简介、拍摄记录、星级与稀有度，再进编辑器逐层微调。"
              />
            ) : (
              <div className="flex flex-wrap gap-4">
                {cards.map((card) => (
                  <button
                    key={card.id}
                    type="button"
                    style={{ width: CARD_SIZES.xs.width }}
                    className="cursor-pointer rounded-lg p-1 transition-transform duration-200 hover:-translate-y-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moss/60"
                    onClick={() => navigate(`/cards/${card.id}`)}
                  >
                    <GameCard
                      card={card}
                      data={buildCardData(card, species, photos.find((photo) => photo.id === card.photoId) ?? null)}
                    />
                    <span className="mt-2 block truncate text-center text-micro text-fog-200">
                      {card.rarity} · {card.serialNo ?? '未编号'}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </Panel>
        </div>

        <div className="flex flex-col gap-5">
          <SpeciesInfoPanel species={species} />
          <WikiPanel
            species={species}
            refetching={refreshSpecies.isPending}
            onRefetch={() => refreshSpecies.mutate({})}
          />
          <SoundPlaceholder speciesId={species.id} kind="sound" filePath={species.soundPath} />
          <Panel title="栖息环境" subtitle={`${species.habitats.length} 个标签`}>
            <div className="flex flex-wrap gap-2">
              {species.habitats.length ? (
                species.habitats.map((habitat) => (
                  <Badge key={habitat} tone="plume">
                    {habitat}
                  </Badge>
                ))
              ) : (
                <span className="text-caption text-fog-300">待补录栖息环境</span>
              )}
            </div>
            {species.note ? (
              <p className="mt-4 whitespace-pre-wrap text-caption leading-relaxed text-fog-200">{species.note}</p>
            ) : null}
          </Panel>
        </div>
      </div>

      <Dialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="删除这个物种？"
        description={`「${species.cnName}」的 ${species.photoCount} 张照片会回到待分类池，已制作的 ${species.cardCount} 张卡片会一并删除。`}
        width="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setConfirmOpen(false)}>
              取消
            </Button>
            <Button
              variant="danger"
              loading={deleteSpecies.isPending}
              onClick={() =>
                deleteSpecies.mutate(species.id, {
                  onSuccess: () => {
                    if (species.photoIds.length) assignPhotos.mutate({ photoIds: species.photoIds, speciesId: null })
                    updateSpecies.reset()
                    navigate('/')
                  },
                })
              }
            >
              确认删除
            </Button>
          </div>
        }
      >
        <p className="text-caption text-fog-200">
          原始照片文件不会被删除，只解除关联；如需保留卡片，请先在卡组页导出。
        </p>
      </Dialog>
    </div>
  )
}
