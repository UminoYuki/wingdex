import { cn } from '../lib/cn'
import { CARD_RADIUS } from './cardMetrics'

interface HoloLayerProps {
  rarity: string
  /** 3D 悬浮角度（deg），用于让闪光跟随视角 */
  rx?: number
  ry?: number
  className?: string
}

const HOLO_GRADIENT: Record<string, string> = {
  传说: 'conic-gradient(from 210deg at 50% 50%, rgba(87,199,133,.35), rgba(111,179,201,.32), rgba(232,176,75,.34), rgba(138,127,168,.3), rgba(87,199,133,.35))',
  UR: 'linear-gradient(115deg, rgba(232,176,75,.34), rgba(255,227,163,.12) 38%, rgba(232,176,75,.3) 62%, rgba(255,227,163,.16))',
  SR: 'linear-gradient(115deg, rgba(111,179,201,.3), rgba(158,203,240,.08) 42%, rgba(111,179,201,.26) 68%, rgba(158,203,240,.12))',
  R: 'linear-gradient(115deg, rgba(195,207,216,.24), rgba(255,255,255,.05) 50%, rgba(195,207,216,.2))',
  N: 'none',
}

/** 闪膜层：稀有度越高炫彩越强，可随 3D 视角偏移 */
export function HoloLayer({ rarity, rx = 0, ry = 0, className }: HoloLayerProps) {
  const gradient = HOLO_GRADIENT[rarity] ?? HOLO_GRADIENT.R
  if (gradient === 'none') return null

  return (
    <span
      aria-hidden
      className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}
      style={{ mixBlendMode: 'color-dodge', opacity: 0.4, borderRadius: `${CARD_RADIUS}cqw` }}
    >
      <span
        className="absolute inset-[-20%] block animate-holo-shift"
        style={{
          background: gradient,
          backgroundSize: '260% 260%',
          backgroundPosition: `${50 + ry * 1.6}% ${50 - rx * 1.6}%`,
        }}
      />
      <span
        className="absolute inset-0 block"
        style={{
          background: `linear-gradient(${105 + ry}deg, transparent 32%, rgba(255,255,255,.20) 46%, transparent 60%)`,
        }}
      />
    </span>
  )
}
