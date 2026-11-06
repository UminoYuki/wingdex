import type { CSSProperties, KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent, ReactNode } from 'react'
import { useState } from 'react'
import { cn } from '../lib/cn'
import { useReducedMotion } from '../lib/useReducedMotion'
import { pointerTilt, REST_TILT, type TiltSample } from './pointerTilt'

interface TiltStageProps {
  flipped?: boolean
  onFlip?: () => void
  /** 卡墙里只跟随指针，点击交给外层按钮。 */
  passive?: boolean
  maxTilt?: number
  className?: string
  label?: string
  onNavigate?: (delta: number) => void
  childrenFront: ReactNode
  childrenBack: ReactNode
}

function glareStyle(sample: TiltSample): CSSProperties {
  return {
    ['--glare-x' as string]: `${sample.glareX}%`,
    ['--glare-y' as string]: `${sample.glareY}%`,
    ['--glare-opacity' as string]: sample.active ? 0.72 : 0,
  }
}

/** 指针倾斜、径向闪光与 180° 翻面。触控不倾斜，避免和页面滚动抢手势。 */
export function TiltStage({
  flipped = false,
  onFlip,
  passive = false,
  maxTilt = 12,
  className,
  label,
  onNavigate,
  childrenFront,
  childrenBack,
}: TiltStageProps) {
  const reducedMotion = useReducedMotion()
  const [tilt, setTilt] = useState<TiltSample>(REST_TILT)

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'touch') return
    const rect = event.currentTarget.getBoundingClientRect()
    setTilt(
      pointerTilt({
        clientX: event.clientX,
        clientY: event.clientY,
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
        maxTilt,
        reducedMotion,
      }),
    )
  }

  const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (passive) return
    if ((event.key === 'Enter' || event.key === ' ') && onFlip) {
      event.preventDefault()
      onFlip()
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      onNavigate?.(-1)
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      onNavigate?.(1)
    }
  }

  const transform = `rotateX(${tilt.rx}deg) rotateY(${(flipped ? 180 : 0) + tilt.ry}deg)`

  return (
    <div
      className={cn('wd-tilt', passive ? '' : 'wd-tilt-stage', className)}
      onPointerMove={onPointerMove}
      onPointerLeave={() => setTilt(REST_TILT)}
      onClick={passive ? undefined : onFlip}
      onKeyDown={onKeyDown}
      role={passive ? undefined : 'button'}
      tabIndex={passive ? undefined : 0}
      aria-pressed={passive ? undefined : flipped}
      aria-label={passive ? undefined : label}
    >
      <div className="wd-tilt-inner" style={{ transform }}>
        <div className="wd-tilt-face">
          {childrenFront}
          <span className="wd-glare" style={glareStyle(tilt)} aria-hidden />
        </div>
        <div className="wd-tilt-face wd-tilt-back">
          {childrenBack}
          <span className="wd-glare" style={glareStyle(tilt)} aria-hidden />
        </div>
      </div>
    </div>
  )
}
