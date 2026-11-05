import { useId } from 'react'
import type { Card } from '../api/types'
import { cn } from '../lib/cn'
import { CARD_RADIUS, CARD_RATIO, FRAME_LINE, FRAME_LINE_RADIUS } from './cardMetrics'
import { backThemeBackground, PRINT_TONES, rarityKey, RARITY_STYLES } from './cardTheme'
import { isLayerVisible, normalizeBackPrint, overrideStyle } from './layerSchema'
import { CardBackPrints } from './CardBackPrints'
import { EmblemIcon } from '../icons/registry'

interface CardBackProps {
  card: Card
  cnName: string
  exif: {
    cameraModel?: string | null
    lens?: string | null
    focalLength?: number | null
    aperture?: string | null
    shutter?: string | null
    iso?: number | null
  }
  className?: string
}

/** 卡背：底纹主题 + 纹章 + 镜头印花 + 弧形文字 */
export function CardBack({ card, cnName, exif, className }: CardBackProps) {
  const arcId = `back-arc-${useId().replace(/[:]/g, '')}`
  const config = normalizeBackPrint(card.backPrint)
  const tone = PRINT_TONES[config.tone ?? 'gold'] ?? PRINT_TONES.gold
  const rarity = RARITY_STYLES[card.holo ? '传说' : rarityKey(card.rarity)]
  const overrides = card.overrides ?? {}
  const visible = (id: string) => isLayerVisible(overrides[id])
  const layerStyle = (id: string) => overrideStyle(overrides[id])

  return (
    <div
      className={cn('relative aspect-[59/86] w-full select-none overflow-hidden', className)}
      style={{ aspectRatio: CARD_RATIO, containerType: 'size', borderRadius: `${CARD_RADIUS}cqw` }}
    >
      <div className="absolute inset-0" style={{ background: rarity.frame, borderRadius: `${CARD_RADIUS}cqw` }} />

      {visible('backBase') ? (
        <div
          className="absolute overflow-hidden"
          style={{
            ...layerStyle('backBase'),
            inset: `${FRAME_LINE.inset}cqw`,
            borderRadius: `${FRAME_LINE_RADIUS}cqw`,
            background: `linear-gradient(160deg, #14211B 0%, #0E1714 52%, #16241E 100%)`,
          }}
        >
          <span className="absolute inset-0 block" style={{ background: backThemeBackground(card.backTheme), opacity: 0.85 }} />
          <span className="absolute inset-0 block bg-[radial-gradient(circle_at_50%_38%,rgba(87,199,133,0.14),transparent_62%)]" />
        </div>
      ) : null}

      {visible('backPrints') ? (
        <div className="absolute inset-0" style={layerStyle('backPrints')}>
          <CardBackPrints config={config} exif={exif} />
        </div>
      ) : null}

      {visible('backEmblem') ? (
        <div
          className="absolute left-1/2 top-[30%] flex -translate-x-1/2 flex-col items-center gap-[1.4cqw]"
          style={layerStyle('backEmblem')}
        >
          <span
            className="flex items-center justify-center rounded-full border-[0.4cqw]"
            style={{
              width: '20cqw',
              height: '20cqw',
              borderColor: tone.line,
              background: 'radial-gradient(circle at 40% 32%, rgba(255,255,255,.14), rgba(0,0,0,.42))',
            }}
          >
            <EmblemIcon name={card.backEmblem || 'feather'} size={0} className="h-[11cqw] w-[11cqw]" style={{ color: tone.text }} />
          </span>
        </div>
      ) : null}

      <svg viewBox="0 0 100 60" className="absolute inset-x-0 top-[6%] h-[16%] w-full" aria-hidden>
        <defs>
          <path id={arcId} d="M14,52 Q50,4 86,52" fill="none" />
        </defs>
        <text fill={tone.text} fontSize="4.2" letterSpacing="1.1" textAnchor="middle" opacity={0.92}>
          <textPath href={`#${arcId}`} startOffset="50%">
            生灵图鉴 · WINGDEX
          </textPath>
        </text>
      </svg>

      <div className="absolute inset-x-[8%] top-[56%] flex flex-col items-center gap-[1.2cqw]">
        <span className="text-[4.6cqw] font-semibold tracking-[0.18em]" style={{ color: tone.text }}>
          {cnName}
        </span>
        <span className="h-[0.25cqw] w-[42%]" style={{ background: tone.faint }} />
        <span className="text-[2.2cqw] tracking-[0.3em] text-white/70">{card.serialNo ?? 'NO. —'}</span>
      </div>

      {visible('backText') ? (
        <p
          className="absolute inset-x-[10%] bottom-[9%] text-center text-[2.1cqw] leading-[1.4] tracking-wide text-white/[0.72]"
          style={layerStyle('backText')}
        >
          {card.backText || card.backGearText || '摄于野外 · 本地收藏'}
        </p>
      ) : null}
    </div>
  )
}
