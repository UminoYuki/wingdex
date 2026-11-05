import { NavLink } from 'react-router-dom'
import {
  BarChart3,
  Camera,
  Feather,
  Heart,
  ImagePlus,
  Layers,
  Map,
  Medal,
  PlusCircle,
  Settings,
  Sparkles,
} from 'lucide-react'
import { cn } from '../lib/cn'
import { Badge, Button } from './ui'
import { useHealth, useScanStatus } from '../api/hooks'
import { useUiStore } from '../store/uiStore'

export const NAV_ITEMS = [
  { to: '/', label: '图鉴墙', icon: Layers, end: true },
  { to: '/cards', label: '卡组', icon: Sparkles },
  { to: '/map', label: '足迹地图', icon: Map },
  { to: '/stats', label: '拍摄统计', icon: BarChart3 },
  { to: '/achievements', label: '成就', icon: Medal },
  { to: '/wishlist', label: '想拍清单', icon: Heart },
  { to: '/inbox', label: '导入待分类', icon: ImagePlus },
]

export function TopNav() {
  const { data: health } = useHealth()
  const { data: scan } = useScanStatus()
  const openQuickCreate = useUiStore((state) => state.openQuickCreate)

  return (
    <header className="fixed inset-x-0 top-0 z-40 h-14 border-b border-white/[0.07] bg-ink-900/85 backdrop-blur-xl">
      <div className="mx-auto flex h-full w-full max-w-[1560px] items-center gap-5 px-6">
        <NavLink to="/" className="flex shrink-0 items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-moss-deep via-moss to-plume text-ink-900 shadow-elev-1">
            <Feather className="h-4 w-4" />
          </span>
          <span className="flex flex-col leading-none">
            <span className="text-body font-semibold tracking-tight text-fog-100">生灵图鉴</span>
            <span className="text-micro text-fog-300">Wingdex</span>
          </span>
        </NavLink>

        <nav className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto scrollbar-none">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'group relative flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-caption transition-all duration-base ease-natural',
                  isActive ? 'bg-moss/12 text-moss-soft' : 'text-fog-200 hover:bg-white/[0.05] hover:text-fog-100',
                )
              }
            >
              <item.icon className="h-3.5 w-3.5" />
              {item.label}
              {item.to === '/inbox' && scan?.running ? (
                <span className="ml-0.5 h-1.5 w-1.5 animate-pulse rounded-full bg-amber-gold" />
              ) : null}
            </NavLink>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <Badge tone="moss" icon={<Camera className="h-3 w-3" />}>
            {health ? `${health.counts.photos} 张` : '——'}
          </Badge>
          <NavLink
            to="/settings"
            title="设置"
            className={({ isActive }) =>
              cn(
                'flex h-8 w-8 items-center justify-center rounded-md transition-colors duration-base',
                isActive ? 'bg-moss/12 text-moss-soft' : 'text-fog-200 hover:bg-white/[0.06] hover:text-fog-100',
              )
            }
          >
            <Settings className="h-4 w-4" />
          </NavLink>
          <Button size="sm" variant="primary" icon={<PlusCircle className="h-3.5 w-3.5" />} onClick={openQuickCreate}>
            录入物种
          </Button>
        </div>
      </div>
    </header>
  )
}
