import { Heart, ImageIcon, Sparkles, Star, Target, Wand2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { SpeciesWithStats } from '../api/types'
import { MosaicCover } from './MosaicCover'
import { Badge, IconButton, Tooltip } from './ui'
import { ProtectionIcon, protectionIconKey, taxonIconKey, TaxonIcon } from '../icons/registry'
import { cn } from '../lib/cn'
import { truncate } from '../lib/format'

interface SpeciesCardProps {
  species: SpeciesWithStats
  onToggleFavorite?: (next: boolean) => void
  onToggleWishlist?: (next: boolean) => void
  onCreateCard?: (speciesId: number) => void
  className?: string
}

const shieldTone = (level: string | null): 'danger' | 'gold' | 'moss' | 'neutral' => {
  if (!level) return 'neutral'
  if (/一级/.test(level)) return 'danger'
  if (/二级/.test(level)) return 'gold'
  if (/三有/.test(level)) return 'moss'
  return 'neutral'
}

export function SpeciesCard({ species, onToggleFavorite, onToggleWishlist, onCreateCard, className }: SpeciesCardProps) {
  const navigate = useNavigate()
  const shield = protectionIconKey(species.cnProtectionLevel, species.isSanyou)

  return (
    <article
      className={cn(
        'lift group relative flex aspect-[59/86] w-full flex-col overflow-hidden rounded-lg border border-white/[0.08] bg-ink-800 shadow-elev-1 hover:border-moss/40 hover:shadow-elev-3',
        className,
      )}
    >
      <button
        type="button"
        onClick={() => navigate(`/species/${species.id}`)}
        className="absolute inset-0 z-10 cursor-pointer"
        aria-label={`查看 ${species.cnName}`}
      />

      <div className="absolute inset-0">
        <MosaicCover photoIds={species.photoIds} name={species.cnName} />
      </div>

      <div className="relative z-20 flex items-start justify-between gap-2 p-3">
        <div className="flex flex-col gap-1">
          {species.cnProtectionLevel || species.isSanyou ? (
            <Badge tone={shieldTone(species.cnProtectionLevel)} icon={<ProtectionIcon name={shield} size={12} />}>
              {species.cnProtectionLevel ?? '三有'}
            </Badge>
          ) : null}
          {species.firstSeenAt ? (
            <Tooltip label={`首次记录于 ${species.firstSeenAt}`}>
              <span className="inline-flex w-fit items-center gap-1 rounded-full border border-amber-gold/40 bg-amber-gold/12 px-1.5 py-0.5 text-micro text-amber-gold">
                <Sparkles className="h-3 w-3" /> 首次记录
              </span>
            </Tooltip>
          ) : null}
        </div>

        <div className="flex flex-col items-end gap-1 opacity-0 transition-opacity duration-base group-hover:opacity-100">
          {onToggleFavorite ? (
            <IconButton
              size="sm"
              variant="glass"
              label={species.isFavorite ? '取消收藏' : '收藏'}
              onClick={(event) => {
                event.stopPropagation()
                onToggleFavorite(!species.isFavorite)
              }}
              className={species.isFavorite ? 'text-danger' : undefined}
            >
              <Heart className={cn('h-3.5 w-3.5', species.isFavorite && 'fill-current')} />
            </IconButton>
          ) : null}
          {onToggleWishlist ? (
            <IconButton
              size="sm"
              variant="glass"
              label={species.isWishlist ? '移出想拍清单' : '加入想拍清单'}
              onClick={(event) => {
                event.stopPropagation()
                onToggleWishlist(!species.isWishlist)
              }}
              className={species.isWishlist ? 'text-plume' : undefined}
            >
              <Target className="h-3.5 w-3.5" />
            </IconButton>
          ) : null}
          {onCreateCard ? (
            <IconButton
              size="sm"
              variant="glass"
              label="制作动物卡"
              onClick={(event) => {
                event.stopPropagation()
                onCreateCard(species.id)
              }}
            >
              <Wand2 className="h-3.5 w-3.5" />
            </IconButton>
          ) : null}
        </div>
      </div>

      <div className="relative z-20 mt-auto flex flex-col gap-1.5 p-3">
        <div className="flex items-center gap-1.5">
          <TaxonIcon name={taxonIconKey(species.group)} size={13} className="text-moss" />
          <span className="text-micro uppercase tracking-wide text-fog-300">{species.group ?? '未分类'}</span>
        </div>
        <h3 className="clamp-1 text-title font-semibold leading-tight tracking-tight text-white drop-shadow">
          {truncate(species.cnName, 12)}
        </h3>
        {species.scientificName ? (
          <p className="clamp-1 text-micro italic text-fog-200">{species.scientificName}</p>
        ) : null}

        <div className="flex items-center justify-between pt-0.5">
          <span className="flex items-center gap-1 text-micro text-amber-gold">
            <Star className="h-3 w-3 fill-current" />
            <span className="tabular-nums">{species.starScore.toFixed(1)}</span>
          </span>
          <span className="flex items-center gap-2 text-micro text-fog-200">
            <span className="flex items-center gap-1">
              <ImageIcon className="h-3 w-3" />
              {species.photoCount}
            </span>
            {species.cardCount > 0 ? (
              <span className="flex items-center gap-1 text-plume">
                <Sparkles className="h-3 w-3" />
                {species.cardCount}
              </span>
            ) : null}
          </span>
        </div>
      </div>
    </article>
  )
}
