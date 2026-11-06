import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Panel } from '../ui'
import { chartTooltipLabel, chartTooltipStyle } from '../../theme/chartChrome'

interface MonthlyAreaChartProps {
  monthly: Array<{ month: string; photos: number; species: number }>
  title?: string
}

/** 月度拍摄量面积图：照片与新增物种双序列 */
export function MonthlyAreaChart({ monthly, title = '月度拍摄节奏' }: MonthlyAreaChartProps) {
  const data = monthly.map((row) => ({ ...row, label: row.month.slice(2) }))

  return (
    <Panel title={title} subtitle="按月统计出片量与新增物种数" className="min-h-[300px]">
      {data.length === 0 ? (
        <div className="flex h-[220px] items-center justify-center text-caption text-fog-300">还没有拍摄数据</div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
            <defs>
              <linearGradient id="photosFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#57C785" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#57C785" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="speciesFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6FB3C9" stopOpacity={0.45} />
                <stop offset="100%" stopColor="#6FB3C9" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: 'var(--chart-tick)', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'var(--chart-tick)', fontSize: 10 }} axisLine={false} tickLine={false} width={38} />
            <Tooltip contentStyle={chartTooltipStyle} labelStyle={chartTooltipLabel} />
            <Area
              type="monotone"
              dataKey="photos"
              name="照片"
              stroke="#57C785"
              strokeWidth={2}
              fill="url(#photosFill)"
            />
            <Area
              type="monotone"
              dataKey="species"
              name="物种"
              stroke="#6FB3C9"
              strokeWidth={2}
              fill="url(#speciesFill)"
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </Panel>
  )
}
