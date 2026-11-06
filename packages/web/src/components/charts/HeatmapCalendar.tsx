import { useMemo } from 'react'
import type { HeatmapCell } from '../../api/types'
import { Panel, Segmented } from '../ui'
import { cn } from '../../lib/cn'

interface HeatmapCalendarProps {
  cells: HeatmapCell[]
  years: number[]
  year: number
  onYearChange: (year: number) => void
  onSelectDate?: (date: string) => void
}

function level(count: number): number {
  if (count <= 0) return 0
  if (count === 1) return 1
  if (count <= 3) return 2
  if (count <= 6) return 3
  return 4
}

const LEVEL_CLASS = [
  'bg-line/[0.05]',
  'bg-moss/25',
  'bg-moss/45',
  'bg-moss/70',
  'bg-moss',
]

/** 年度拍摄热力日历（贡献图） */
export function HeatmapCalendar({ cells, years, year, onYearChange, onSelectDate }: HeatmapCalendarProps) {
  const { weeks, monthLabels, total } = useMemo(() => {
    const map = new Map(cells.filter((cell) => cell.date.startsWith(String(year))).map((cell) => [cell.date, cell.count]))
    const start = new Date(`${year}-01-01T00:00:00`)
    const end = new Date(`${year}-12-31T00:00:00`)
    const grid: Array<Array<{ date: string; count: number } | null>> = []
    const labels: Array<{ index: number; label: string }> = []

    const cursor = new Date(start)
    cursor.setDate(cursor.getDate() - cursor.getDay())
    let weekIndex = 0
    let lastMonth = -1
    let sum = 0

    while (cursor <= end) {
      const week: Array<{ date: string; count: number } | null> = []
      for (let day = 0; day < 7; day += 1) {
        const inRange = cursor >= start && cursor <= end
        const iso = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`
        week.push(inRange ? { date: iso, count: map.get(iso) ?? 0 } : null)
        if (inRange) {
          sum += map.get(iso) ?? 0
          if (cursor.getMonth() !== lastMonth && cursor.getDate() <= 7) {
            lastMonth = cursor.getMonth()
            if (Math.abs(weekIndex - (labels.at(-1)?.index ?? -99)) > 2) {
              labels.push({ index: weekIndex, label: `${cursor.getMonth() + 1}月` })
            }
          }
        }
        cursor.setDate(cursor.getDate() + 1)
      }
      grid.push(week)
      weekIndex += 1
    }

    return { weeks: grid, monthLabels: labels, total: sum }
  }, [cells, year])

  return (
    <Panel
      title="拍摄热力日历"
      subtitle={`全年共 ${total} 张照片，颜色越深代表当天出片越多`}
      actions={
        years.length > 1 ? (
          <Segmented
            size="sm"
            value={String(year)}
            onValueChange={(value) => onYearChange(Number(value))}
            options={years.slice(0, 4).map((item) => ({ value: String(item), label: String(item) }))}
          />
        ) : null
      }
    >
      <div className="flex flex-col gap-2 overflow-x-auto scrollbar-none">
        <div className="flex min-w-[720px] gap-[3px] pl-6 text-micro text-fog-300">
          {weeks.map((_, index) => {
            const marker = monthLabels.find((label) => label.index === index)
            return (
              <span key={index} className="w-[13px] shrink-0">
                {marker ? marker.label : ''}
              </span>
            )
          })}
        </div>
        <div className="flex min-w-[720px] gap-[3px]">
          <div className="flex w-6 shrink-0 flex-col justify-between py-0.5 text-micro text-fog-300">
            <span>一</span>
            <span>三</span>
            <span>五</span>
            <span>日</span>
          </div>
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-[3px]">
              {week.map((cell, dayIndex) => (
                <button
                  key={dayIndex}
                  type="button"
                  disabled={!cell}
                  title={cell ? `${cell.date}：${cell.count} 张` : undefined}
                  onClick={() => cell && onSelectDate?.(cell.date)}
                  className={cn(
                    'h-[13px] w-[13px] rounded-[3px] transition-colors duration-fast',
                    cell ? LEVEL_CLASS[level(cell.count)] : 'bg-transparent',
                    cell && onSelectDate ? 'cursor-pointer hover:ring-1 hover:ring-moss/60' : 'cursor-default',
                  )}
                />
              ))}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-end gap-1.5 text-micro text-fog-300">
          <span>少</span>
          {LEVEL_CLASS.map((tone) => (
            <span key={tone} className={cn('h-[11px] w-[11px] rounded-[3px]', tone)} />
          ))}
          <span>多</span>
        </div>
      </div>
    </Panel>
  )
}
