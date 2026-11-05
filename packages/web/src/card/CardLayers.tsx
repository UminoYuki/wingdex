import type { CardLayer } from '../api/types'
import { mediaUrl } from '../api/client'
import { cn } from '../lib/cn'
import { CARD_RADIUS } from './cardMetrics'

interface CardLayersProps {
  layers: CardLayer[]
  className?: string
}

/** 自由图层：自定义文本 / 贴纸 / 水印，均以卡宽百分比定位 */
export function CardLayers({ layers, className }: CardLayersProps) {
  if (layers.length === 0) return null

  return (
    <div
      className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}
      style={{ borderRadius: `${CARD_RADIUS}cqw` }}
    >
      {layers.map((layer) => (
        <div
          key={layer.id}
          data-layer={layer.id}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-pre-wrap text-center"
          style={{
            transform: `translate(-50%, -50%) translate(${layer.dx ?? 0}cqw, ${layer.dy ?? 0}cqw) scale(${layer.scale ?? 1}) rotate(${layer.rotate ?? 0}deg)`,
            color: layer.color ?? undefined,
            fontSize: layer.fontSize === undefined ? undefined : `${layer.fontSize}cqw`,
            fontWeight: layer.fontWeight,
            opacity: layer.opacity ?? 1,
            mixBlendMode: (layer.blendMode ?? 'normal') as never,
            textShadow: layer.shadow ? '0 0.25cqw 0.7cqw rgba(0,0,0,0.7)' : undefined,
          }}
        >
          {layer.kind === 'text' ? (
            <span>{layer.content}</span>
          ) : layer.assetKey ? (
            <img src={mediaUrl.asset(layer.assetKey)} alt={layer.content ?? '贴纸'} className="max-w-[40cqw]" />
          ) : null}
        </div>
      ))}
    </div>
  )
}
