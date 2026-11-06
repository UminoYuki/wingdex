import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { GearRow } from '../../api/types'
import { Panel } from '../ui'
import { truncate } from '../../lib/format'
import { chartTooltipStyle } from '../../theme/chartChrome'

interface GearBarChartProps {
  rows: GearRow[]
  title: string
  subtitle?: string
  tone?: 'moss' | 'plume'
}

const TONES = {
  moss: ['#57C785', '#3E9E6B'],
  plume: ['#6FB3C9', '#4B7FC9'],
}

/** 装备战绩条形图：机身 / 镜头按物种数排序 */
export function GearBarChart({ rows, title, subtitle, tone = 'moss' }: GearBarChartProps) {
  const data = rows.slice(0, 8).map((row) => ({ ...row, label: truncate(row.name, 18) }))
  const [from, to] = TONES[tone]

  return (
    <Panel title={title} subtitle={subtitle ?? '按拍到的物种数排序'} className="min-h-[300px]">
      {data.length === 0 ? (
        <div className="flex h-[220px] items-center justify-center text-caption text-fog-300">还没有装备数据</div>
      ) : (
        <ResponsiveContainer width="100%" height={Math.max(200, data.length * 38)}>
          <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 8 }}>
            <defs>
              <linearGradient id={`gearFill-${tone}`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={from} stopOpacity={0.85} />
                <stop offset="100%" stopColor={to} stopOpacity={0.6} />
              </linearGradient>
            </defs>
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="label"
              width={132}
              tick={{ fill: 'var(--chart-tick-muted)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={chartTooltipStyle}
              formatter={(value: number, _name, item) => [
                `${value} 种 · ${(item.payload as GearRow).photoCount} 张`,
                '战绩',
              ]}
            />
            <Bar dataKey="speciesCount" radius={[3, 6, 6, 3]} barSize={14}>
              {data.map((row) => (
                <Cell key={row.name} fill={`url(#gearFill-${tone})`} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </Panel>
  )
}
