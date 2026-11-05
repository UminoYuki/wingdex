/** 通用格式化工具：日期、数值、字数与量规单位 */

export function formatDate(value: string | null | undefined, withTime = false): string {
  if (!value) return '未记录'
  const date = new Date(value.includes('T') ? value : value.replace(' ', 'T'))
  if (Number.isNaN(date.getTime())) return value
  const pad = (n: number) => String(n).padStart(2, '0')
  const base = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
  return withTime ? `${base} ${pad(date.getHours())}:${pad(date.getMinutes())}` : base
}

export function formatClock(value: string | null | undefined): string {
  return formatDate(value).slice(5)
}

export function relativeTime(value: string | null | undefined): string {
  if (!value) return '尚未'
  const date = new Date(value.includes('T') ? value : value.replace(' ', 'T'))
  const diff = Date.now() - date.getTime()
  if (Number.isNaN(diff)) return '尚未'
  const minute = 60_000
  const hour = 60 * minute
  const day = 24 * hour
  if (diff < minute) return '刚刚'
  if (diff < hour) return `${Math.floor(diff / minute)} 分钟前`
  if (diff < day) return `${Math.floor(diff / hour)} 小时前`
  if (diff < 30 * day) return `${Math.floor(diff / day)} 天前`
  return formatDate(value)
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const size = bytes / 1024 ** index
  return `${size >= 10 || index === 0 ? Math.round(size) : size.toFixed(1)} ${units[index]}`
}

export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '--'
  return value.toLocaleString('zh-CN')
}

export function formatMetric(value: string | number | null | undefined, unit: string): string {
  if (value === null || value === undefined || value === '') return `未记录`
  return `${value}${unit}`
}

export function percent(value: number, total: number): number {
  if (!total) return 0
  return Math.max(0, Math.min(100, Math.round((value / total) * 100)))
}

/** EXIF 数值格式：f/4、1/1000s、ISO 800、600mm */
export function formatAperture(value: string | number | null | undefined): string | null {
  if (value === null || value === undefined || value === '') return null
  const text = String(value)
  return text.startsWith('f/') ? text : `f/${text}`
}

export function formatShutter(value: string | null | undefined): string | null {
  if (!value) return null
  return value.endsWith('s') ? value : `${value}s`
}

export function formatFocal(value: number | string | null | undefined): string | null {
  if (value === null || value === undefined || value === '') return null
  return `${value}mm`
}

export function formatGps(lat: number | null | undefined, lon: number | null | undefined): string | null {
  if (lat === null || lat === undefined || lon === null || lon === undefined) return null
  return `${lat.toFixed(4)}, ${lon.toFixed(4)}`
}

export function countChars(text: string): number {
  return Array.from(text ?? '').length
}

export function truncate(text: string, limit: number): string {
  const chars = Array.from(text ?? '')
  return chars.length <= limit ? text : `${chars.slice(0, limit - 1).join('')}…`
}

export function initialOf(name: string): string {
  return Array.from(name ?? '').slice(0, 1).join('') || '鸟'
}

export function uid(prefix = 'id'): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}-${Date.now().toString(36)}`
}
