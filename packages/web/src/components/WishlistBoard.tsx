import { Check, Target, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { SpeciesWithStats } from '../api/types'
import { MosaicCover } from './MosaicCover'
import { Badge, EmptyState, IconButton, ProgressRing } from './ui'
import { PlaceIcon } from '../icons/registry'
import { formatDate } from '../lib/format'

interface WishlistBoardProps {
  items: SpeciesWithStats[]
  onRemove?: (id: number) => void
  onAchieve?: (id: number) => void
  emptyAction?: { label: string; onClick: () => void }
}

/** 想拍清单板：目标卡 + 达成进度环 + 备注 */
export function WishlistBoard({ items, onRemove, onAchieve, emptyAction }: WishlistBoardProps) {
  const navigate = useNavigate()

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<Target className="h-5 w-5" />}
        title="想拍清单还是空的"
        description="在物种详情页点击「想拍」把目标物种加进来，拍到后会自动标记达成，成为你的拍摄任务清单。"
        action={emptyAction ? { label: emptyAction.label, onClick: emptyAction.onClick } : undefined}
      />
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
      {items.map((species) => {
        const achieved = species.photoCount > 0
        return (
          <article
            key={species.id}
            className="lift group relative flex flex-col overflow-hidden rounded-lg border border-line/[0.08] bg-ink-800 shadow-elev-1 hover:border-plume/40"
          >
            <button
              type="button"
              onClick={() => navigate(`/species/${species.id}`)}
              className="absolute inset-0 z-10 cursor-pointer"
              aria-label={`查看 ${species.cnName}`}
            />
            <div className="relative aspect-[4/3] w-full overflow-hidden">
              <MosaicCover photoIds={species.photoIds} name={species.cnName} />
              <div className="absolute right-2 top-2 z-20">
                <ProgressRing
                  value={achieved ? 1 : 0}
                  max={1}
                  size={44}
                  thickness={5}
                  tone={achieved ? 'moss' : 'plume'}
                  label={achieved ? '✓' : '0'}
                />
              </div>
            </div>

            <div className="flex flex-1 flex-col gap-1.5 p-3">
              <div className="flex items-center gap-1.5">
                <Badge tone={achieved ? 'moss' : 'plume'} icon={achieved ? <Check className="h-3 w-3" /> : <Target className="h-3 w-3" />}>
                  {achieved ? '已达成' : '待拍摄'}
                </Badge>
                {species.distribution.length ? (
                  <Badge tone="outline" icon={<PlaceIcon name="pin" size={11} />}>
                    {species.distribution.slice(0, 3).join('、')}
                  </Badge>
                ) : null}
              </div>
              <h3 className="clamp-1 text-body font-medium text-fog-100">{species.cnName}</h3>
              <p className="clamp-1 text-micro italic text-fog-300">{species.scientificName ?? '学名待补录'}</p>
              <p className="clamp-2 text-caption leading-relaxed text-fog-200">
                {species.wishNote ?? '还没有写下拍摄计划，可以在编辑页补充期望的地点与季节。'}
              </p>
              <div className="mt-auto flex items-center justify-between pt-1 text-micro text-fog-300">
                <span>{achieved ? `首次拍到 ${formatDate(species.firstSeenAt)}` : `加入于 ${formatDate(species.createdAt)}`}</span>
                <span className="flex items-center gap-1 opacity-0 transition-opacity duration-base group-hover:opacity-100">
                  {onAchieve && !achieved ? (
                    <IconButton
                      size="sm"
                      variant="glass"
                      label="标记达成"
                      onClick={(event) => {
                        event.stopPropagation()
                        onAchieve(species.id)
                      }}
                    >
                      <Check className="h-3.5 w-3.5" />
                    </IconButton>
                  ) : null}
                  {onRemove ? (
                    <IconButton
                      size="sm"
                      variant="glass"
                      label="移出清单"
                      onClick={(event) => {
                        event.stopPropagation()
                        onRemove(species.id)
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </IconButton>
                  ) : null}
                </span>
              </div>
            </div>
          </article>
        )
      })}
    </div>
  )
}
