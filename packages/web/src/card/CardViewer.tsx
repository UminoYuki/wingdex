import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Download, Images, Pencil, Sparkles, Trash2 } from 'lucide-react'
import { mediaUrl } from '../api/client'
import { useCard, useDeleteCard, usePhotos } from '../api/hooks'
import { exportCardPng } from '../lib/exportCard'
import { Badge, Button, Dialog, EmptyState, Segmented, Skeleton } from '../components/ui'
import { SkinnedStage } from './skins/SkinFace'
import { CARD_RATIO } from './cardMetrics'
import { buildCardData, buildCardExif, composeTypeLine } from './cardPreview'
import { ExifBadgeBar } from '../components/ExifBadgeBar'
import { cn } from '../lib/cn'

interface CardViewerProps {
  cardId: number | null
  onClose: () => void
}

type Face = 'front' | 'back'

/** 卡详情浮层：3D 拖拽看正反面、切换卡图、导出与编辑入口 */
export function CardViewer({ cardId, onClose }: CardViewerProps) {
  const { data, isLoading } = useCard(cardId)
  const navigate = useNavigate()
  const deleteCard = useDeleteCard()
  const [face, setFace] = useState<Face>('front')
  const [photoIndex, setPhotoIndex] = useState(0)
  const { data: photoPool } = usePhotos({ speciesId: data?.card.speciesId ?? undefined, limit: 24 })

  const photos = photoPool?.items ?? []
  const activePhoto = photos[photoIndex] ?? data?.photo ?? null

  const card = useMemo(() => {
    if (!data) return null
    return activePhoto && data.card.photoId !== activePhoto.id ? { ...data.card, photoId: activePhoto.id } : data.card
  }, [data, activePhoto])

  return (
    <Dialog
      open={cardId !== null}
      onOpenChange={(open) => (open ? undefined : onClose())}
      title={data ? `${data.species.cnName} · ${data.card.serialNo}` : '卡片详情'}
      description={data ? `${data.card.rarity} · ${data.card.attribute}属性 · ${data.card.stars} 星` : undefined}
      width="xl"
      footer={
        data ? (
          <div className="flex w-full flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <Badge tone="gold">{data.card.rarity}</Badge>
              <Badge tone="moss">{data.card.attribute}</Badge>
              <Badge tone="plume">ATK {data.card.atk} / DEF {data.card.def}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                icon={<Download className="h-3.5 w-3.5" />}
                onClick={() => void exportCardPng({ id: data.card.id, face, size: 'xl' })}
              >
                导出 PNG
              </Button>
              <Button
                size="sm"
                variant="outline"
                icon={<Trash2 className="h-3.5 w-3.5" />}
                onClick={() => {
                  deleteCard.mutate(data.card.id)
                  onClose()
                }}
              >
                删除
              </Button>
              <Button
                size="sm"
                variant="primary"
                icon={<Pencil className="h-3.5 w-3.5" />}
                onClick={() => navigate(`/cards/editor/${data.card.id}`)}
              >
                进入编辑器
              </Button>
            </div>
          </div>
        ) : null
      }
    >
      {isLoading || !data || !card ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_1fr]">
          <Skeleton className="aspect-[59/86] w-full" />
          <div className="flex flex-col gap-3">
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_1fr]">
          <div className="flex flex-col gap-3">
            <Segmented
              value={face}
              onValueChange={(value) => setFace(value as Face)}
              options={[
                { value: 'front', label: '正面' },
                { value: 'back', label: '背面' },
              ]}
            />
            {/* 卡面宽度同时受列宽与浮层可用高度约束：整张卡（含页脚）始终完整可见 */}
            <div
              className="mx-auto w-full"
              style={{ maxWidth: `min(100%, calc((90vh - 260px) * ${CARD_RATIO}))` }}
            >
              <SkinnedStage
                card={card}
                data={{ ...buildCardData(card, data.species, activePhoto), typeLine: composeTypeLine(data.species) }}
                exif={buildCardExif(activePhoto)}
                face={face}
                onFaceChange={setFace}
                autoSway
              />
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <section className="flex flex-col gap-2">
              <h3 className="flex items-center gap-1.5 text-title text-fog-100">
                <Sparkles className="h-4 w-4 text-amber-gold" /> 物种信息
              </h3>
              <p className="text-caption leading-relaxed text-fog-200">{data.species.summaryZh?.slice(0, 220) ?? '暂无简介'}</p>
              <div className="flex flex-wrap gap-1.5">
                <Badge tone={data.species.iucnStatus ? 'gold' : 'neutral'}>IUCN {data.species.iucnStatus ?? 'DD'}</Badge>
                {data.species.cnProtectionLevel ? <Badge tone="danger">{data.species.cnProtectionLevel}</Badge> : null}
                {data.species.familyName ? <Badge tone="moss">{data.species.familyName}</Badge> : null}
                <Badge tone="outline">照片 {data.editable.photoCount} 张</Badge>
                <Badge tone="outline">五星 {data.editable.fiveStarCount} 张</Badge>
              </div>
            </section>

            <section className="flex flex-col gap-2">
              <h3 className="flex items-center gap-1.5 text-title text-fog-100">
                <Images className="h-4 w-4 text-plume" /> 卡图选择
              </h3>
              {photos.length === 0 ? (
                <EmptyState
                  icon={<Images className="h-5 w-5" />}
                  title="该物种还没有照片"
                  description="先到导入待分类页面把照片指派给这个物种，再回来挑选卡图。"
                />
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {photos.slice(0, 12).map((photo, index) => (
                    <button
                      key={photo.id}
                      type="button"
                      onClick={() => setPhotoIndex(index)}
                      className={cn(
                        'aspect-[4/3] overflow-hidden rounded-md border transition-all duration-fast',
                        index === photoIndex ? 'border-moss shadow-[0_0_0_2px_rgba(87,199,133,.25)]' : 'border-line/[0.08] hover:border-line/25',
                      )}
                    >
                      <img
                        src={mediaUrl.thumb(photo.id, 240)}
                        alt={photo.fileName}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
              <ExifBadgeBar photo={activePhoto} placeName={activePhoto?.placeName ?? null} />
            </section>

            <section className="flex flex-col gap-2">
              <h3 className="text-title text-fog-100">卡面文本</h3>
              <p className="rounded-md border border-line/[0.06] bg-recess p-3 text-caption leading-relaxed text-fog-100">
                {card.effectText}
              </p>
              {card.recordText ? (
                <p className="rounded-md border border-line/[0.06] bg-recess p-3 text-caption leading-relaxed text-fog-200">
                  {card.recordText}
                </p>
              ) : null}
            </section>
          </div>
        </div>
      )}
    </Dialog>
  )
}
