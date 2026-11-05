import { useCallback, useEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { useReducedMotion } from '../lib/useReducedMotion'

export interface CardAngles {
  rx: number
  ry: number
}

interface UseCardDragOptions {
  disabled?: boolean
  /** 初始角度 */
  initial?: CardAngles
  onAngleChange?: (angles: CardAngles) => void
}

const MAX_RX = 28
const INERTIA = 0.94
const DEFAULT_ANGLES: CardAngles = { rx: 6, ry: 0 }

/** 3D 卡片拖拽：拖拽旋转 + 惯性衰减 + 角度限制，角度写回供闪光层联动 */
export function useCardDrag({ disabled, initial = DEFAULT_ANGLES, onAngleChange }: UseCardDragOptions = {}) {
  const reducedMotion = useReducedMotion()
  const [angles, setAngles] = useState<CardAngles>(initial)
  const [dragging, setDragging] = useState(false)
  const velocity = useRef<CardAngles>({ rx: 0, ry: 0 })
  const last = useRef<{ x: number; y: number } | null>(null)
  const frame = useRef<number | null>(null)
  const anglesRef = useRef(angles)
  anglesRef.current = angles

  const publish = useCallback(
    (next: CardAngles) => {
      const clamped = { rx: Math.max(-MAX_RX, Math.min(MAX_RX, next.rx)), ry: next.ry }
      setAngles(clamped)
      onAngleChange?.(clamped)
    },
    [onAngleChange],
  )

  const stopLoop = useCallback(() => {
    if (frame.current !== null) {
      cancelAnimationFrame(frame.current)
      frame.current = null
    }
  }, [])

  const startLoop = useCallback(() => {
    stopLoop()
    const step = () => {
      const v = velocity.current
      if (Math.abs(v.rx) < 0.04 && Math.abs(v.ry) < 0.04) {
        velocity.current = { rx: 0, ry: 0 }
        frame.current = null
        return
      }
      v.rx *= INERTIA
      v.ry *= INERTIA
      publish({ rx: anglesRef.current.rx + v.rx, ry: anglesRef.current.ry + v.ry })
      frame.current = requestAnimationFrame(step)
    }
    frame.current = requestAnimationFrame(step)
  }, [publish, stopLoop])

  useEffect(() => stopLoop, [stopLoop])

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (disabled) return
      event.currentTarget.setPointerCapture(event.pointerId)
      last.current = { x: event.clientX, y: event.clientY }
      velocity.current = { rx: 0, ry: 0 }
      setDragging(true)
      stopLoop()
    },
    [disabled, stopLoop],
  )

  const onPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (disabled || !last.current) return
      const dx = event.clientX - last.current.x
      const dy = event.clientY - last.current.y
      last.current = { x: event.clientX, y: event.clientY }
      velocity.current = { rx: -dy * 0.35, ry: dx * 0.45 }
      publish({ rx: anglesRef.current.rx - dy * 0.45, ry: anglesRef.current.ry + dx * 0.55 })
    },
    [disabled, publish],
  )

  const endDrag = useCallback(() => {
    if (!last.current) return
    last.current = null
    setDragging(false)
    /* 系统偏好减少动态效果时不做惯性衰减，直接停住 */
    if (reducedMotion) {
      velocity.current = { rx: 0, ry: 0 }
      return
    }
    startLoop()
  }, [reducedMotion, startLoop])

  const snapTo = useCallback(
    (target: CardAngles, duration = 480) => {
      velocity.current = { rx: 0, ry: 0 }
      stopLoop()
      const from = anglesRef.current
      const startAt = performance.now()
      const tick = () => {
        const progress = Math.min(1, (performance.now() - startAt) / duration)
        const eased = 1 - Math.pow(1 - progress, 3)
        publish({ rx: from.rx + (target.rx - from.rx) * eased, ry: from.ry + (target.ry - from.ry) * eased })
        if (progress < 1) frame.current = requestAnimationFrame(tick)
      }
      frame.current = requestAnimationFrame(tick)
    },
    [publish, stopLoop],
  )

  const reset = useCallback(() => snapTo(initial), [initial, snapTo])

  return {
    angles,
    dragging,
    bind: {
      onPointerDown,
      onPointerMove,
      onPointerUp: endDrag,
      onPointerCancel: endDrag,
      onPointerLeave: endDrag,
    },
    reset,
    snapTo,
  }
}
