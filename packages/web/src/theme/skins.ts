/** 三套界面皮肤。默认森绿，与改版前的夜间图鉴一致。 */

export const APP_THEMES = [
  { id: 'journal', label: '手账白', title: '手账素白', hint: '温润纸色，适合日间整理档案' },
  { id: 'forest', label: '森绿', title: '雨林森绿', hint: '既有夜间图鉴的苍翠底色' },
  { id: 'obsidian', label: '暗夜', title: '深空黑曜', hint: '冷调暗底，适合看大图' },
] as const

export type AppThemeId = (typeof APP_THEMES)[number]['id']

export const THEME_STORAGE_KEY = 'wingdex.theme'
export const PREFS_STORAGE_KEY = 'wingdex.prefs'

export function parseTheme(value: string | null | undefined, fallback: AppThemeId = 'forest'): AppThemeId {
  if (value === 'journal' || value === 'forest' || value === 'obsidian') return value
  return fallback
}

export function applyTheme(theme: AppThemeId): void {
  if (typeof document === 'undefined') return
  document.documentElement.dataset.theme = theme
  document.documentElement.style.colorScheme = theme === 'journal' ? 'light' : 'dark'
  document.documentElement.classList.toggle('dark', theme !== 'journal')
}

export function readStoredTheme(): AppThemeId {
  if (typeof localStorage === 'undefined') return 'forest'
  try {
    const raw = localStorage.getItem(PREFS_STORAGE_KEY)
    const fromPrefs = raw ? (JSON.parse(raw) as { theme?: string }).theme : null
    return parseTheme(fromPrefs ?? localStorage.getItem(THEME_STORAGE_KEY))
  } catch {
    return 'forest'
  }
}
