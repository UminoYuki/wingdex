import path from 'node:path'
import { BrowserWindow, shell } from 'electron'

const DEFAULT_BOUNDS = { width: 1440, height: 940 }

export function createMainWindow(serverUrl: string): BrowserWindow {
  const window = new BrowserWindow({
    ...DEFAULT_BOUNDS,
    minWidth: 1080,
    minHeight: 720,
    show: false,
    backgroundColor: '#0F1512',
    title: 'Wingdex · 生灵图鉴',
    autoHideMenuBar: true,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: false,
      backgroundThrottling: false,
    },
  })

  window.once('ready-to-show', () => window.show())

  window.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url)
    return { action: 'deny' }
  })

  void window.loadURL(serverUrl)
  return window
}

/** 离屏窗口：用于卡片 PNG 截图，尺寸严格等于导出档位 */
export function createOffscreenWindow(width: number, height: number): BrowserWindow {
  return new BrowserWindow({
    width,
    height,
    show: false,
    frame: false,
    backgroundColor: '#0F1512',
    useContentSize: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      offscreen: false,
      backgroundThrottling: false,
    },
  })
}

export async function waitForCardReady(window: BrowserWindow, timeoutMs = 20_000): Promise<void> {
  const started = Date.now()
  while (Date.now() - started < timeoutMs) {
    const ready = await window.webContents.executeJavaScript('window.__cardReady === true', true)
    if (ready) return
    await new Promise((resolve) => setTimeout(resolve, 120))
  }
  throw new Error('卡片渲染超时，请检查字体与图片资源是否可用')
}
