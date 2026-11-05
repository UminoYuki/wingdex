export interface CaptureCardOptions {
  id: number
  face?: 'front' | 'back'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'print'
  rx?: number
  ry?: number
  bleed?: number
  debug?: boolean
  fileName?: string
}

export interface CaptureResult {
  file: string
  bytes: number
  width: number
  height: number
}

export interface DesktopBridge {
  isDesktop: true
  getInfo: () => Promise<{
    version: string
    dataDir: string
    webDist: string
    serverUrl: string
    platform: string
    cardSizes: Record<string, { width: number; height: number }>
  }>
  selectDirectory: () => Promise<string[]>
  captureCard: (options: CaptureCardOptions) => Promise<CaptureResult>
  captureBatch: (options: CaptureCardOptions[]) => Promise<CaptureResult[]>
  openExportDir: () => Promise<string>
  revealExport: (file: string) => Promise<boolean>
  openExternal: (url: string) => Promise<boolean>
  onAchievement: (handler: (payload: unknown) => void) => () => void
}

declare global {
  interface Window {
    birdAtlas?: DesktopBridge
    /** 打印路由在渲染完成后置位，主进程据此截图 */
    __cardReady?: boolean
  }
}
