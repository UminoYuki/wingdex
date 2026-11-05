import { useEffect, useRef, useState } from 'react'
import type { CSSProperties, PointerEvent as ReactPointerEvent, ReactNode } from 'react'
import { Feather } from 'lucide-react'
import type { Card } from '../api/types'
import { mediaUrl } from '../api/client'
import { cn } from '../lib/cn'
import {
  ART_FRAME,
  ART_INSET,
  ART_WIDTH,
  ATTRIBUTE_BADGE,
  CARD_BORDER,
  CARD_PADDING,
  CARD_RADIUS,
  CARD_RATIO,
  CARD_RIM,
  CARD_REGIONS,
  FRAME_LINE,
  FRAME_LINE_RADIUS,
  HEADER_OFFSETS,
  TEXT_BOX_INSET,
  TEXT_INSET,
  TEXT_METRICS,
  artSourceNeed,
  clampLines,
  cropTransform,
} from './cardMetrics'
import { resolveCardStyle, type ResolveContext, type ResolvedLayer } from './resolveCardStyle'
import { PAPER } from './cardTheme'
import { StarRow } from './StarRow'
import { HoloLayer } from './HoloLayer'
import { CardLayers } from './CardLayers'

/**
 * 卡名立体描边：真实游戏王卡卡名是「亮色字心 + 深色描边 + 投影」，压在卡框渐变上仍然跳出来。
 * CSS 没有真正的描边，用一圈极小偏移的投影近似。
 */
const NAME_SHADOW = [
  '0 0 0.35cqw rgba(0,0,0,.5)',
  '-0.14cqw -0.14cqw 0 rgba(0,0,0,.45)',
  '0.14cqw -0.14cqw 0 rgba(0,0,0,.45)',
  '-0.14cqw 0.14cqw 0 rgba(0,0,0,.45)',
  '0.14cqw 0.14cqw 0 rgba(0,0,0,.45)',
  '0 0.24cqw 0.4cqw rgba(0,0,0,.55)',
].join(', ')

/**
 * 卡包编号浮标：压在卡图上（明暗不定）又贴着米色纸面，颜色必须自带深色描边，
 * 否则在亮照片上会糊成一片——参考卡上的卡包编号也是「浅字 + 深描边」。
 */
const PACK_CODE_COLOR = 'rgba(246,241,229,0.96)'
const PACK_CODE_SHADOW =
  '-0.1cqw 0 0 rgba(14,11,8,0.9), 0.1cqw 0 0 rgba(14,11,8,0.9), 0 -0.1cqw 0 rgba(14,11,8,0.9), 0 0.1cqw 0 rgba(14,11,8,0.9), 0 0.16cqw 0.42cqw rgba(0,0,0,0.55)'

/** 区域网格是版式唯一来源：图层位置全部由 CARD_REGIONS 推导 */
type RegionId = keyof typeof CARD_REGIONS

/** 文本类图层：只定上边界，由内容决定高度 */
function regionTop(id: RegionId): CSSProperties {
  return { top: `${CARD_REGIONS[id].top}%` }
}

/** 盒状图层：上边界 + 网格高度（卡图等固定高度） */
function regionBox(id: RegionId): CSSProperties {
  const region = CARD_REGIONS[id]
  return { top: `${region.top}%`, height: `${region.bottom - region.top}%` }
}

/** 盒状图层：上边界 + 网格最大高度（文本溢出裁切） */
function regionCap(id: RegionId): CSSProperties {
  const region = CARD_REGIONS[id]
  return { top: `${region.top}%`, maxHeight: `${region.bottom - region.top}%` }
}

export interface GameCardData {
  cnName: string
  scientificName: string | null
  title?: string
  attribute?: string
  stars?: number
  typeLine: string
  effectText: string
  recordText: string
  photoId?: number | null
  exifLine?: string | null
  /** 卡包编号浮标（拍摄日期，无日期时回落卡号） */
  packCode: string
}

interface GameCardProps {
  card: Card
  data: GameCardData
  className?: string
  /** 编辑器：当前选中的图层 */
  activeLayerId?: string | null
  onLayerPointerDown?: (id: string, event: ReactPointerEvent<HTMLDivElement>) => void
  /** 3D 视角联动闪光 */
  holoAngles?: { rx: number; ry: number }
  designMode?: boolean
  /** 卡图窗渲染宽度（px）：导出/预览已知尺寸时传入，首帧即取对应档位的高清源图 */
  artWidthPx?: number
  /** 外层放大倍率（详情页 3D 滚轮缩放）：transform: scale() 不改变实测宽度，卡图源图必须按它加档 */
  renderScale?: number
}

interface LayerBoxProps {
  layer?: ResolvedLayer
  style?: CSSProperties
  className?: string
  children: ReactNode
  active?: boolean
  designMode?: boolean
  onLayerPointerDown?: (id: string, event: ReactPointerEvent<HTMLDivElement>) => void
}

function LayerBox({ layer, style, className, children, active, designMode, onLayerPointerDown }: LayerBoxProps) {
  if (!layer || !layer.visible) return null
  return (
    <div
      onPointerDown={designMode ? (event) => onLayerPointerDown?.(layer.id, event) : undefined}
      className={cn(
        'absolute',
        designMode ? 'cursor-move' : 'pointer-events-none',
        active ? 'outline outline-[1.5px] outline-moss/70' : '',
        className,
      )}
      style={{ ...style, ...layer.style }}
      data-layer={layer.id}
    >
      {children}
    </div>
  )
}

/**
 * 卡面根节点实测宽度（px）：卡图源图档位按「渲染宽度 × 卡图宽占比」换算。
 * 导出路径由调用方直接传 artWidthPx（首帧就拿高清，避免先糊后清的闪烁）。
 */
function useCardWidthPx(ref: { current: HTMLDivElement | null }): number {
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const node = ref.current
    if (!node) return
    const measure = () => setWidth(node.clientWidth)
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(measure)
    observer.observe(node)
    return () => observer.disconnect()
  }, [ref])
  return width
}

/** 卡图源图：≤1600 走缩略图档位，更大档位按宽度取原图切片（导出才不会糊） */
function artSourceUrl(photoId: number, need: number): string {
  if (need <= 240) return mediaUrl.thumb(photoId, 240)
  if (need <= 640) return mediaUrl.thumb(photoId, 640)
  if (need <= 1600) return mediaUrl.thumb(photoId, 1600)
  return mediaUrl.full(photoId, need)
}

/** 卡面渲染：默认规则 + 预设 + 图层微调的唯一渲染入口（正/背/3D/导出共用） */
export function GameCard({
  card,
  data,
  className,
  activeLayerId,
  onLayerPointerDown,
  holoAngles,
  designMode,
  artWidthPx,
  renderScale = 1,
}: GameCardProps) {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const measuredWidth = useCardWidthPx(rootRef)
  const ctx: ResolveContext = {
    cnName: data.cnName,
    scientificName: data.scientificName,
    title: data.title ?? card.title ?? '',
    attribute: data.attribute ?? card.attribute,
    stars: data.stars ?? card.stars,
    typeLine: data.typeLine,
    effectText: data.effectText ?? '',
    recordText: data.recordText ?? '',
    atk: card.atk,
    def: card.def,
    serialNo: card.serialNo ?? '',
    packCode: data.packCode ?? '',
    rarity: card.rarity,
    backText: card.backText ?? '',
    holo: card.holo,
    exifLine: data.exifLine ?? null,
  }

  const resolved = resolveCardStyle(card, ctx)
  const layer = (id: string) => resolved.front.layers.find((item) => item.id === id)
  const photoId = data.photoId ?? card.photoId ?? null
  /** 卡图源图按渲染宽度取：默认实测（首帧未量到时给个中等档位），导出/预览直接用传入的像素宽 */
  const artWidth = artWidthPx ?? (measuredWidth > 0 ? (measuredWidth * ART_WIDTH) / 100 : 320)
  /** 放大倍率：裁切放大 × 外层 scale（详情页滚轮缩放用的是 transform，实测宽度不变，必须显式乘上） */
  const artScale = (card.photoCrop?.scale ?? 1) * renderScale
  const artSrc = photoId ? artSourceUrl(photoId, artSourceNeed(artWidth, artScale)) : ''

  /**
   * 称号与卡名重复时卡面不重复渲染：真实游戏王卡卡名之上没有第二行文字。
   * 编辑器（designMode）内始终渲染，便于选中与微调。
   */
  const titleText = resolved.texts.title.trim()
  const showTitle = titleText.length > 0 && (designMode === true || titleText !== resolved.texts.name.trim())

  return (
    <div
      ref={rootRef}
      className={cn('relative aspect-[59/86] w-full select-none overflow-hidden bg-ink-800', className)}
      style={{
        aspectRatio: CARD_RATIO,
        containerType: 'size',
        borderRadius: `${CARD_RADIUS}cqw`,
        boxShadow: resolved.front.rarity.glow === 'none' ? '0 0.6cqw 1.8cqw rgba(0,0,0,.55)' : resolved.front.rarity.glow,
      }}
    >
      {/* 卡框：底色 + 外描边 + 内细线。三者圆角必须同心（内层圆角 = 外层圆角 − 内缩），
          否则四个角会出现细线与外框错位的「缺口」观感 */}
      <LayerBox layer={layer('frame')} style={{ position: 'absolute', inset: 0 }} className="!pointer-events-none">
        <span
          className="absolute inset-0 block"
          style={{
            background: resolved.front.frame.background,
            borderRadius: `${CARD_RADIUS}cqw`,
          }}
        />
        <span
          className="absolute inset-0 block"
          style={{
            borderRadius: `${CARD_RADIUS}cqw`,
            border: `${CARD_BORDER}cqw solid rgba(0, 0, 0, 0.35)`,
            boxShadow: `inset 0 0 0 ${CARD_RIM}cqw rgba(255, 255, 255, 0.16)`,
          }}
        />
        <span
          className="absolute block"
          style={{
            inset: `${FRAME_LINE.inset}cqw`,
            borderRadius: `${FRAME_LINE_RADIUS}cqw`,
            border: `${FRAME_LINE.width}cqw solid rgba(255, 255, 255, 0.15)`,
          }}
        />
      </LayerBox>

      <div className="absolute inset-0">
        {/* 卡名凹槽板：真实游戏王卡的卡名（与学名）压在一块上沿压暗、下沿提亮的凹槽板上 */}
        <div
          className="pointer-events-none absolute"
          style={{
            top: `${CARD_REGIONS.name.top}%`,
            height: `${CARD_REGIONS.name.bottom - CARD_REGIONS.name.top}%`,
            left: `${CARD_PADDING - 0.9}%`,
            right: '16.5%',
            background: 'linear-gradient(180deg, rgba(0,0,0,.24) 0%, rgba(0,0,0,.06) 44%, rgba(255,255,255,.1) 100%)',
            boxShadow: 'inset 0 0.35cqw 0.6cqw rgba(0,0,0,.35), inset 0 -0.2cqw 0 rgba(255,255,255,.14)',
          }}
        />

        {showTitle ? (
          <LayerBox
            layer={layer('title')}
            style={{
              top: `${CARD_REGIONS.title.top + HEADER_OFFSETS.title}%`,
              left: `${CARD_PADDING}%`,
              right: `${CARD_PADDING}%`,
              textShadow: '0 0 0.3cqw rgba(0,0,0,.5)',
            }}
            className="clamp-1 text-center font-medium tracking-widest"
            active={activeLayerId === 'title'}
            designMode={designMode}
            onLayerPointerDown={onLayerPointerDown}
          >
            {resolved.texts.title}
          </LayerBox>
        ) : null}

        <LayerBox
          layer={layer('name')}
          style={{ top: `${CARD_REGIONS.name.top + HEADER_OFFSETS.name}%`, left: `${CARD_PADDING}%`, right: '26%' }}
          className="clamp-1 font-bold tracking-tight"
          active={activeLayerId === 'name'}
          designMode={designMode}
          onLayerPointerDown={onLayerPointerDown}
        >
          <span style={{ color: resolved.front.nameColor, textShadow: NAME_SHADOW }}>{resolved.texts.name}</span>
        </LayerBox>

        {card.showScientific && resolved.texts.scientific ? (
          <LayerBox
            layer={layer('scientific')}
            style={{ top: `${CARD_REGIONS.name.bottom - HEADER_OFFSETS.scientific}%`, left: `${CARD_PADDING}%`, right: '30%' }}
            className="clamp-1 italic"
            active={activeLayerId === 'scientific'}
            designMode={designMode}
            onLayerPointerDown={onLayerPointerDown}
          >
            <span className="text-white/55" style={{ textShadow: '0 0 0.3cqw rgba(0,0,0,.5)' }}>
              {resolved.texts.scientific}
            </span>
          </LayerBox>
        ) : null}

        <LayerBox
          layer={layer('stars')}
          style={{ ...regionBox('stars'), right: `${CARD_PADDING}%` }}
          className="flex items-center justify-end"
          active={activeLayerId === 'stars'}
          designMode={designMode}
          onLayerPointerDown={onLayerPointerDown}
        >
          <StarRow stars={ctx.stars} size={TEXT_METRICS.starSize} />
        </LayerBox>

        <LayerBox
          layer={layer('attribute')}
          style={{ top: `${CARD_REGIONS.attribute.top + HEADER_OFFSETS.attribute}%`, right: `${CARD_PADDING}%` }}
          active={activeLayerId === 'attribute'}
          designMode={designMode}
          onLayerPointerDown={onLayerPointerDown}
        >
          <span
            className="inline-flex items-center justify-center rounded-full font-bold"
            style={{
              width: `${ATTRIBUTE_BADGE}cqw`,
              height: `${ATTRIBUTE_BADGE}cqw`,
              fontSize: `${TEXT_METRICS.attributeSize}cqw`,
              background: `radial-gradient(circle at 32% 26%, ${resolved.front.attribute.start}, ${resolved.front.attribute.end})`,
              color: resolved.front.attribute.text,
              boxShadow: '0 0.25cqw 0.7cqw rgba(0,0,0,.5), inset 0 0 0 0.4cqw rgba(255,255,255,.28)',
            }}
            title={`属性 ${resolved.texts.attribute}`}
          >
            {resolved.texts.attribute}
          </span>
        </LayerBox>
      </div>

      {/* 卡图窗：真实游戏王卡的画框画在卡图**之外**（卡图本身仍是网格里的方正区域），
          用向外扩散的 box-shadow 画框 + 紧贴里侧一圈浅色亮线，直角 */}
      <LayerBox
        layer={layer('art')}
        style={{
          ...regionBox('art'),
          left: `${ART_INSET}%`,
          right: `${ART_INSET}%`,
          boxShadow: `0 0 0 ${ART_FRAME}cqw ${PAPER.artFrame}, inset 0 0 0 0.2cqw ${PAPER.artBevel}, 0 ${ART_FRAME}cqw 0.9cqw rgba(0,0,0,.4)`,
        }}
        className="overflow-hidden bg-ink-900"
        active={activeLayerId === 'art'}
        designMode={designMode}
        onLayerPointerDown={onLayerPointerDown}
      >
        {photoId ? (
          <img
            src={artSrc}
            alt={ctx.cnName}
            className="h-full w-full object-cover"
            style={{ transform: cropTransform(card.photoCrop), transformOrigin: 'center' }}
          />
        ) : (
          <span className="flex h-full w-full flex-col items-center justify-center gap-[0.8cqw] bg-gradient-to-br from-ink-700 to-ink-900 text-white/35">
            <Feather style={{ width: '5cqw', height: '5cqw' }} />
            <span style={{ fontSize: `${TEXT_METRICS.placeholderSize}cqw` }}>待补充照片</span>
          </span>
        )}
      </LayerBox>

      {/* 文本外框：真实游戏王卡的类型行、效果文本、拍摄记录与 ATK/DEF 同在一个**米色纸面**框内，
          纸面是深墨字的地基（仅外框装饰，不参与图层） */}
      <div
        data-card="textbox"
        className="absolute border-[0.4cqw]"
        style={{
          top: `${CARD_REGIONS.textBox.top}%`,
          height: `${CARD_REGIONS.textBox.bottom - CARD_REGIONS.textBox.top}%`,
          left: `${TEXT_INSET}%`,
          right: `${TEXT_INSET}%`,
          background: PAPER.face,
          borderColor: PAPER.edge,
          boxShadow: `inset 0 0.28cqw 0 ${PAPER.bevel}, inset 0 0 0 0.75cqw rgba(0,0,0,.05), 0 0.3cqw 0.7cqw rgba(0,0,0,.42)`,
        }}
      />

      {/* 卡包编号：真实游戏王卡在卡图右下角浮着一串编号（如 DOOD-JP012），
          这里压在卡图右下角内侧（画框之上、纸面之上），既不挡照片主体也不压类型行；
          画在文本框之后，才不会被纸面盖住 */}
      <LayerBox
        layer={layer('packCode')}
        style={{
          ...regionTop('packCode'),
          right: `${ART_INSET + 0.9}%`,
          maxWidth: '52%',
        }}
        className="clamp-1 font-mono font-semibold tracking-[0.14em]"
        active={activeLayerId === 'packCode'}
        designMode={designMode}
        onLayerPointerDown={onLayerPointerDown}
      >
        <span style={{ color: PACK_CODE_COLOR, textShadow: PACK_CODE_SHADOW }}>{resolved.texts.packCode}</span>
      </LayerBox>

      <LayerBox
        layer={layer('typeLine')}
        style={{ ...regionTop('typeLine'), left: `${TEXT_BOX_INSET}%`, right: `${TEXT_BOX_INSET}%` }}
        className="clamp-1 font-bold tracking-wide"
        active={activeLayerId === 'typeLine'}
        designMode={designMode}
        onLayerPointerDown={onLayerPointerDown}
      >
        <span style={{ color: resolved.front.ink.type }}>{resolved.texts.typeLine}</span>
      </LayerBox>

      <LayerBox
        layer={layer('effect')}
        style={{ ...regionCap('effect'), left: `${TEXT_BOX_INSET}%`, right: `${TEXT_BOX_INSET}%` }}
        className="overflow-hidden"
        active={activeLayerId === 'effect'}
        designMode={designMode}
        onLayerPointerDown={onLayerPointerDown}
      >
        {/* 真实游戏王卡的效果文本是正体（不斜），压在纸面上用墨色 */}
        <p
          style={{
            ...clampLines(TEXT_METRICS.effectMaxLines),
            lineHeight: `${TEXT_METRICS.effectLine}cqw`,
            color: resolved.front.ink.effect,
          }}
        >
          {resolved.texts.effect}
        </p>
      </LayerBox>

      <LayerBox
        layer={layer('record')}
        style={{ ...regionCap('record'), left: `${TEXT_BOX_INSET}%`, right: `${TEXT_BOX_INSET}%` }}
        className="overflow-hidden"
        active={activeLayerId === 'record'}
        designMode={designMode}
        onLayerPointerDown={onLayerPointerDown}
      >
        <p
          style={{
            ...clampLines(TEXT_METRICS.recordMaxLines),
            lineHeight: `${TEXT_METRICS.recordSize * 1.32}cqw`,
            color: resolved.front.ink.record,
          }}
        >
          {resolved.texts.record}
        </p>
      </LayerBox>

      {/* 框内分隔线 + ATK/DEF：同真实游戏王卡，成对右对齐在纸面底部、墨色细线压在上方 */}
      <div
        className="absolute flex items-baseline justify-end gap-[1.2cqw] border-t-[0.25cqw] pt-[0.5cqw]"
        style={{
          top: `${CARD_REGIONS.values.top}%`,
          left: `${TEXT_BOX_INSET}%`,
          right: `${TEXT_BOX_INSET}%`,
          borderColor: resolved.front.ink.rule,
        }}
      >
        <LayerBox
          layer={layer('atk')}
          className="relative flex items-baseline gap-[0.25cqw] font-bold"
          active={activeLayerId === 'atk'}
          designMode={designMode}
          onLayerPointerDown={onLayerPointerDown}
        >
          <span style={{ color: resolved.front.ink.label }}>ATK/</span>
          <span className="tabular-nums" style={{ color: resolved.front.ink.value }}>
            {ctx.atk}
          </span>
        </LayerBox>

        <LayerBox
          layer={layer('def')}
          className="relative flex items-baseline gap-[0.25cqw] font-bold"
          active={activeLayerId === 'def'}
          designMode={designMode}
          onLayerPointerDown={onLayerPointerDown}
        >
          <span style={{ color: resolved.front.ink.label }}>DEF/</span>
          <span className="tabular-nums" style={{ color: resolved.front.ink.value }}>
            {ctx.def}
          </span>
        </LayerBox>
      </div>

      <LayerBox
        layer={layer('serial')}
        style={{ ...regionTop('footer'), left: `${TEXT_INSET}%` }}
        className="font-medium tabular-nums tracking-[0.2em] text-white/70"
        active={activeLayerId === 'serial'}
        designMode={designMode}
        onLayerPointerDown={onLayerPointerDown}
      >
        {resolved.texts.serial}
      </LayerBox>

      <LayerBox
        layer={layer('rarity')}
        style={{ ...regionTop('footer'), right: `${TEXT_INSET}%` }}
        active={activeLayerId === 'rarity'}
        designMode={designMode}
        onLayerPointerDown={onLayerPointerDown}
      >
        <span
          className="border-[0.25cqw] bg-black/30 px-[1.2cqw] py-[0.2cqw] font-semibold tracking-widest"
          style={{
            fontSize: `${TEXT_METRICS.raritySize}cqw`,
            borderColor: resolved.front.rarity.nameColor,
            color: resolved.front.rarity.nameColor,
          }}
        >
          {resolved.front.rarity.label}
        </span>
      </LayerBox>

      <LayerBox
        layer={layer('watermark')}
        style={{ top: '40%', left: '10%', fontSize: `${TEXT_METRICS.watermarkSize}cqw` }}
        className="rotate-[-24deg] tracking-[0.4em] text-white/25"
      >
        WINGDEX · 生灵图鉴
      </LayerBox>

      <CardLayers layers={card.layers} />

      {layer('holo')?.visible ? (
        <HoloLayer rarity={resolved.front.rarity.key} rx={holoAngles?.rx} ry={holoAngles?.ry} />
      ) : null}
    </div>
  )
}
