import { useCallback, useEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent, ReactNode } from 'react'
import { RotateCcw, Repeat2, ZoomIn } from 'lucide-react'
import type { Card } from '../api/types'
import { cn } from '../lib/cn'
import { useReducedMotion } from '../lib/useReducedMotion'
import { GameCard, type GameCardData } from './GameCard'
import { CardBack } from './CardBack'
import { CARD_RADIUS } from './cardMetrics'
import { useCardDrag } from './useCardDrag'
import { pointerTilt, REST_TILT, type TiltSample } from './pointerTilt'
import { IconButton } from '../components/ui'

export interface Card3DExif {
  cameraModel?: string | null
  lens?: string | null
  focalLength?: number | null
  aperture?: string | null
  shutter?: string | null
  iso?: number | null
}

interface Card3DProps {
  card: Card
  data: GameCardData
  exif: Card3DExif
  className?: string
  /** 受控展示面：传入后由外部切换正反面 */
  face?: 'front' | 'back'
  onFaceChange?: (face: 'front' | 'back') => void
  initialFace?: 'front' | 'back'
  autoSway?: boolean
  zoomable?: boolean
  showControls?: boolean
  onAnglesChange?: (angles: { rx: number; ry: number }) => void
  /** 替换默认典藏正/背面。不传则仍渲染 GameCard / CardBack，导出路径不经过这里。 */
  front?: ReactNode
  back?: ReactNode
}

/** 翻面动画时长：外层 rotateY 的过渡时长（拖拽旋转时不生效） */
const FLIP_MS = 520

/** 纸厚薄片的偏移（相对卡宽 cqw）：两层叠出纸边厚度，永远朝所属那一面的右下角铺开 */
const PAPER_SLICES = [
  { shift: 0.6, alpha: 'bg-black/60' },
  { shift: 1.2, alpha: 'bg-black/40' },
] as const

/**
 * 纸厚薄片：卡是一张纸，纸边只从**朝向观察者那一面**的背后露出来，且永远朝屏幕右下偏移。
 * 必须挂在「所属那一面」的容器里，跟着那一面一起 backface 隐藏：
 * 若像以前那样挂在外层容器上，翻到背面时外层整体 rotateY(180deg) 会把薄片的纵深一起翻转，
 * 薄片就跑到卡面**前面**——既把卡面压暗一大截，又在左上角多出一条错位的深色边，观感就是「重影」。
 * 两面用同一套局部偏移即可：正面朝观察者时按原样朝右下；背面自身已 rotateY(180deg)，
 * 翻到背面后坐标再镜像一次，同样落回屏幕右下（朝向观察者那一面的右下方）。
 * 圆角必须与卡框一致，否则侧边会露出错位的尖角。
 */
function PaperSlices() {
  return (
    <>
      {PAPER_SLICES.map((slice) => (
        <span
          key={slice.shift}
          className={cn('absolute inset-0', slice.alpha)}
          style={{
            borderRadius: `${CARD_RADIUS}cqw`,
            transform: `translate(${slice.shift}cqw, ${slice.shift}cqw)`,
          }}
          aria-hidden
        />
      ))}
    </>
  )
}

/** 纯 CSS 3D 卡片：拖拽旋转、惯性、翻面、缩放、自动摆动、伪光照 */
export function Card3D({
  card,
  data,
  exif,
  className,
  face,
  onFaceChange,
  initialFace = 'front',
  autoSway = true,
  zoomable = true,
  showControls = true,
  onAnglesChange,
  front,
  back,
}: Card3DProps) {
  const reducedMotion = useReducedMotion()
  const [innerFace, setInnerFace] = useState<'front' | 'back'>(face ?? initialFace)
  const [zoom, setZoom] = useState(1)
  const [swaying, setSwaying] = useState(autoSway && !reducedMotion)
  const [glare, setGlare] = useState<TiltSample>(REST_TILT)
  const stageRef = useRef<HTMLDivElement | null>(null)

  const flipped = innerFace === 'back'
  const { angles, dragging, bind, reset, snapTo } = useCardDrag({ onAngleChange: onAnglesChange })
  const useSway = swaying && !dragging && !reducedMotion

  const setFace = useCallback(
    (next: 'front' | 'back') => {
      setInnerFace(next)
      onFaceChange?.(next)
    },
    [onFaceChange],
  )

  const flip = useCallback(() => {
    setSwaying(false)
    setFace(flipped ? 'front' : 'back')
  }, [flipped, setFace])

  useEffect(() => {
    if (face) setInnerFace(face)
  }, [face])

  useEffect(() => {
    const node = stageRef.current
    if (!zoomable || !node) return
    const wheel = (event: WheelEvent) => {
      event.preventDefault()
      /* 摇摆动画期间 transform 不生效（见 useSway 分支），滚轮必须先把摇摆停掉，否则缩放像没反应 */
      setSwaying(false)
      setZoom((value) => Math.max(0.8, Math.min(2.2, Number((value - event.deltaY * 0.0012).toFixed(3)))))
    }
    node.addEventListener('wheel', wheel, { passive: false })
    return () => node.removeEventListener('wheel', wheel)
  }, [zoomable])

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return
      if (event.key === 'f' || event.key === 'F') flip()
      if (event.key === 'r' || event.key === 'R') reset()
      if (event.key === 'ArrowLeft') snapTo({ rx: angles.rx, ry: angles.ry - 24 }, 260)
      if (event.key === 'ArrowRight') snapTo({ rx: angles.rx, ry: angles.ry + 24 }, 260)
      if (event.key === 'ArrowUp') snapTo({ rx: Math.max(-28, angles.rx - 12), ry: angles.ry }, 260)
      if (event.key === 'ArrowDown') snapTo({ rx: Math.min(28, angles.rx + 12), ry: angles.ry }, 260)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [angles.rx, angles.ry, flip, reset, snapTo])

  const trackGlare = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (reducedMotion || event.pointerType === 'touch') return
    const rect = event.currentTarget.getBoundingClientRect()
    setGlare(
      pointerTilt({
        clientX: event.clientX,
        clientY: event.clientY,
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
        maxTilt: 0,
        reducedMotion: false,
      }),
    )
  }

  return (
    <div className={cn('flex flex-col items-center gap-3', className)}>
      <div
        ref={stageRef}
        className="relative w-full"
        style={{ perspective: '1200px' }}
        {...bind}
        onPointerDown={(event) => {
          setSwaying(false)
          bind.onPointerDown(event)
        }}
        onPointerMove={(event) => {
          bind.onPointerMove?.(event)
          trackGlare(event)
        }}
        onPointerLeave={() => {
          bind.onPointerLeave?.()
          setGlare(REST_TILT)
        }}
        onDoubleClick={flip}
      >
        <div
          className={cn(
            'relative w-full',
            dragging ? 'cursor-grabbing' : 'cursor-grab',
            useSway ? 'animate-card-sway' : '',
          )}
          style={{
            transformStyle: 'preserve-3d',
            ...(useSway
              ? {}
              : {
                  transform: `scale(${zoom}) rotateX(${angles.rx}deg) rotateY(${angles.ry + (flipped ? 180 : 0)}deg)`,
                  transition: dragging ? 'none' : `transform ${FLIP_MS}ms cubic-bezier(0.22,1,0.36,1)`,
                }),
          }}
        >
          {/* 卡面、卡背各是一块平面：整面（含纸厚薄片）必须收成同一个平面，
              `backface-visibility: hidden` 才会连薄片一起隐藏——所以这里不能用 preserve-3d */}
          <div className="relative" style={{ backfaceVisibility: 'hidden' }}>
            <PaperSlices />
            {/* renderScale：把 3D 滚轮缩放传给卡面，卡图才会按放大后的实际像素重新取源图（否则 zoom 越大越糊） */}
            {front ?? <GameCard card={card} data={data} holoAngles={angles} renderScale={zoom} />}
            <span
              className="pointer-events-none absolute inset-0"
              style={{
                borderRadius: `${CARD_RADIUS}cqw`,
                background: `linear-gradient(${115 + angles.ry * 0.4}deg, rgba(255,255,255,.07) 0%, transparent 42%, rgba(0,0,0,.13) 100%)`,
              }}
            />
            <GlareSpot sample={glare} />
          </div>

          <div className="absolute inset-0" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
            <PaperSlices />
            {back ?? <CardBack card={card} cnName={data.cnName} exif={exif} />}
            <span
              className="pointer-events-none absolute inset-0"
              style={{
                borderRadius: `${CARD_RADIUS}cqw`,
                background: `linear-gradient(${115 - angles.ry * 0.4}deg, rgba(255,255,255,.06) 0%, transparent 46%, rgba(0,0,0,.15) 100%)`,
              }}
            />
            <GlareSpot sample={glare} />
          </div>
        </div>
      </div>

      {showControls ? (
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          <IconButton label="翻面 (F)" variant="glass" onClick={flip}>
            <Repeat2 className="h-4 w-4" />
          </IconButton>
          <IconButton label="复位 (R)" variant="glass" onClick={reset}>
            <RotateCcw className="h-4 w-4" />
          </IconButton>
          {zoomable ? (
            <IconButton label="恢复原始大小" variant="glass" onClick={() => setZoom(1)}>
              <ZoomIn className="h-4 w-4" />
            </IconButton>
          ) : null}
          <span className="text-micro text-fog-300">
            拖拽旋转 · 悬停扫光 · 双击翻面 · 滚轮缩放（{Math.round(zoom * 100)}%）
          </span>
        </div>
      ) : null}
    </div>
  )
}

function GlareSpot({ sample }: { sample: TiltSample }) {
  return (
    <span
      aria-hidden
      className="wd-glare"
      style={{
        ['--glare-x' as string]: `${sample.glareX}%`,
        ['--glare-y' as string]: `${sample.glareY}%`,
        ['--glare-opacity' as string]: sample.active ? 0.7 : 0,
      }}
    />
  )
}
