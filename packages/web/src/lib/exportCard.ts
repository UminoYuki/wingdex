import { notify } from '../components/ui'
import { errorMessage } from '../api/client'

export type CardSizeKey = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'print'

export interface ExportCardOptions {
  id: number
  face?: 'front' | 'back'
  size?: CardSizeKey
  rx?: number
  ry?: number
  bleed?: number
  debug?: boolean
  fileName?: string
}

export interface ExportCardResult {
  file: string
  bytes: number
  width: number
  height: number
}

/** 导出单张卡片 PNG：网页模式走提示，桌面模式走离屏截图 IPC */
export function exportCardPng(options: ExportCardOptions): Promise<ExportCardResult | null> {
  const bridge = window.birdAtlas
  if (!bridge) {
    notify.info('网页模式不支持导出', '请在 Electron 桌面应用中导出 PNG 或打印拼版')
    return Promise.resolve(null)
  }

  return bridge
    .captureCard(options)
    .then((result) => {
      notify.success(`已导出 ${Math.round(result.bytes / 1024)} KB`, result.file, {
        action: { label: '打开目录', onClick: () => void bridge.openExportDir() },
      })
      return result
    })
    .catch((error: unknown) => {
      console.error('导出卡片失败', error)
      notify.error('导出失败', errorMessage(error))
      return null
    })
}

/** 批量导出卡片（桌面模式走 IPC 批量截图 + 打包 Zip） */
export function exportCardsBatch(options: ExportCardOptions[]): Promise<ExportCardResult[] | null> {
  const bridge = window.birdAtlas
  if (!bridge) {
    notify.info('网页模式不支持批量导出', '请在 Electron 桌面应用中导出卡片包')
    return Promise.resolve(null)
  }
  if (!options.length) {
    notify.info('没有可导出的卡片', '先筛选出要导出的卡片再试')
    return Promise.resolve(null)
  }

  return bridge
    .captureBatch(options)
    .then((results) => {
      const bytes = results.reduce((acc, item) => acc + (item.bytes ?? 0), 0)
      notify.success(`已导出 ${results.length} 张卡片`, `合计 ${Math.round(bytes / 1024)} KB`, {
        action: { label: '打开目录', onClick: () => void bridge.openExportDir() },
      })
      return results
    })
    .catch((error: unknown) => {
      console.error('批量导出卡片失败', error)
      notify.error('批量导出失败', errorMessage(error))
      return null
    })
}

/** 打开导出目录（桌面模式） */
export function openExportDir(): void {
  const bridge = window.birdAtlas
  if (!bridge) {
    notify.info('网页模式无法打开目录')
    return
  }
  void bridge.openExportDir().then((dir) => notify.info('导出目录', dir))
}

/** 在系统文件管理器中定位导出文件 */
export function revealExport(file: string): void {
  const bridge = window.birdAtlas
  if (!bridge) return
  void bridge.revealExport(file).then((ok) => {
    if (!ok) notify.error('文件不存在', file)
  })
}
