import { cn } from '../lib/cn'
import { formatMetric } from '../lib/format'

interface RangeBarProps {
  label: string
  /** 形态数据来自维基正文抽取，可能是 "12-15" 这类字符串 */
  value: number | string | null
  min: number
  max: number
  unit: string
  /** 参考刻度，如家麻雀体长 */
  markers?: Array<{ value: number; label: string }>
  tone?: 'moss' | 'plume' | 'gold'
  className?: string
}

/** 解析量规数值：支持 "12-15"、"≈40"、40 等写法，取首个可用数字 */
function parseMetric(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === '') return null
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  const matched = String(value).match(/\d+(?:\.\d+)?/)
  if (!matched) return null
  const parsed = Number(matched[0])
  return Number.isFinite(parsed) ? parsed : null
}

const toneClass = {
  moss: 'from-moss-deep to-moss',
  plume: 'from-[#4B7FC9] to-plume',
  gold: 'from-[#8A6412] to-amber-gold',
}

/** 形态量规条：体长/体重/翼展的区间可视化 */
export function RangeBar({ label, value, min, max, unit, markers = [], tone = 'moss', className }: RangeBarProps) {
  const numeric = parseMetric(value)
  const ratio = numeric === null ? 0 : Math.max(0.02, Math.min(1, (numeric - min) / (max - min)))

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-caption text-fog-200">{label}</span>
        <span className={cn('text-body tabular-nums', numeric === null ? 'text-fog-300' : 'text-fog-100')}>
          {numeric === null ? formatMetric(null, unit) : formatMetric(value, unit)}
        </span>
      </div>
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-line/[0.07]">
        <div
          className={cn('h-full rounded-full bg-gradient-to-r transition-all duration-slow ease-natural', toneClass[tone])}
          style={{ width: `${ratio * 100}%` }}
        />
        {markers.map((marker) => {
          const markerRatio = Math.max(0, Math.min(1, (marker.value - min) / (max - min)))
          return (
            <span
              key={marker.label}
              title={marker.label}
              className="absolute top-0 h-full w-px bg-line/35"
              style={{ left: `${markerRatio * 100}%` }}
            />
          )
        })}
      </div>
      <div className="flex justify-between text-micro text-fog-300">
        <span>
          {min}
          {unit}
        </span>
        <span>
          {max}
          {unit}
        </span>
      </div>
    </div>
  )
}
