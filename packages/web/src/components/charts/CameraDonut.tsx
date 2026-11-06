import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import type { GearRow } from '../../api/types'
import { Panel } from '../ui'
import { truncate } from '../../lib/format'
import { chartTooltipStyle } from '../../theme/chartChrome'

interface CameraDonutProps {
  cameras: GearRow[]
  title?: string
}

const COLORS = ['#57C785', '#6FB3C9', '#E8B04B', '#8A7FA8', '#4B7FC9', '#7FD1A5']

/** 机身出片占比环形图 */
export function CameraDonut({ cameras, title = '机身出片占比' }: CameraDonutProps) {
  const data = cameras.slice(0, 6).map((row) => ({ name: row.name, value: row.photoCount, share: row.share }))

  return (
    <Panel title={title} subtitle="按照片数量统计机身使用情况">
      {data.length === 0 ? (
        <div className="flex h-[240px] items-center justify-center text-caption text-fog-300">还没有机身数据</div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={data} dataKey="value" innerRadius={58} outerRadius={86} paddingAngle={3} stroke="none">
                {data.map((entry, index) => (
                  <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={chartTooltipStyle}
                formatter={(value: number, name) => [`${value} 张`, name]}
              />
            </PieChart>
          </ResponsiveContainer>
          <ul className="grid w-full grid-cols-2 gap-1.5">
            {data.map((row, index) => (
              <li key={row.name} className="flex items-center gap-1.5 text-micro text-fog-200">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: COLORS[index % COLORS.length] }} />
                <span className="clamp-1">{truncate(row.name, 16)}</span>
                <span className="ml-auto tabular-nums text-fog-300">{row.share}%</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Panel>
  )
}
