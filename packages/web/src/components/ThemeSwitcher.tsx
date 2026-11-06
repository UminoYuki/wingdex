import { cn } from '../lib/cn'
import { usePrefsStore } from '../store/prefsStore'
import { APP_THEMES, type AppThemeId } from '../theme/skins'

const DOT: Record<AppThemeId, string> = {
  journal: 'bg-[#d8d2c4] ring-1 ring-black/20',
  forest: 'bg-[#48c78e]',
  obsidian: 'bg-[#4a5568] ring-1 ring-line/30',
}

/** 顶栏、设置与编辑器共用的三皮肤切换。选择写入本地并立即换色。 */
export function ThemeSwitcher({ className }: { className?: string }) {
  const theme = usePrefsStore((state) => state.theme)
  const setTheme = usePrefsStore((state) => state.setTheme)

  return (
    <div
      role="radiogroup"
      aria-label="界面主题"
      className={cn('flex items-center rounded-md border border-line/15 bg-ink-800/80 p-0.5', className)}
    >
      {APP_THEMES.map((item) => {
        const active = theme === item.id
        return (
          <button
            key={item.id}
            type="button"
            role="radio"
            aria-checked={active}
            title={`${item.title}：${item.hint}`}
            onClick={() => setTheme(item.id)}
            className={cn(
              'flex items-center gap-1 rounded-[5px] px-1.5 py-1 text-micro transition-colors duration-fast',
              active ? 'bg-ink-700 text-fog-100 shadow-elev-1' : 'text-fog-300 hover:text-fog-100',
            )}
          >
            <span className={cn('h-2 w-2 rounded-full', DOT[item.id])} aria-hidden />
            <span className="hidden xl:inline">{item.label}</span>
            <span className="sr-only xl:hidden">{item.label}</span>
          </button>
        )
      })}
    </div>
  )
}
