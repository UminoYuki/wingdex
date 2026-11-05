import fs from 'node:fs'
import path from 'node:path'
import { BrowserWindow, app, dialog, ipcMain, shell } from 'electron'
import { applyEnvironment, exportDir, resolveDataDir } from './paths'
import { createMainWindow, createOffscreenWindow, waitForCardReady } from './window'
import { CARD_SIZES, captureBatch, captureCard, type CaptureCardOptions } from './cardExport'
import type { ServerHandle } from '@ba/server'

process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true'
process.env.BA_DESKTOP = '1'

// productName 改为 Wingdex 后，userData 仍固定在旧目录（%APPDATA%/拍鸟图鉴），避免已有数据被孤立
if (app.isPackaged) app.setPath('userData', path.join(app.getPath('appData'), '拍鸟图鉴'))

const env = applyEnvironment()
let serverHandle: ServerHandle | null = null
let mainWindow: BrowserWindow | null = null

const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })
}

async function startEmbeddedServer(): Promise<string> {
  const { startServer } = await import('@ba/server')
  serverHandle = await startServer({ port: Number(process.env.BA_PORT ?? 0), host: '127.0.0.1' })
  return serverHandle.url
}

function registerIpc(serverUrl: string): void {
  ipcMain.handle('app:info', () => ({
    version: app.getVersion(),
    dataDir: resolveDataDir(),
    webDist: env.webDist,
    serverUrl,
    platform: process.platform,
    cardSizes: CARD_SIZES,
  }))

  ipcMain.handle('dialog:selectDirectory', async () => {
    const options = {
      title: '选择照片目录',
      properties: ['openDirectory', 'multiSelections'] as const,
    }
    const result = mainWindow
      ? await dialog.showOpenDialog(mainWindow, { ...options, properties: [...options.properties] })
      : await dialog.showOpenDialog({ ...options, properties: [...options.properties] })
    return result.canceled ? [] : result.filePaths
  })

  ipcMain.handle('card:capture', async (_event, options: CaptureCardOptions) => {
    const result = await captureCard(serverUrl, options)
    broadcast('export:done', result)
    return result
  })

  ipcMain.handle('card:captureBatch', async (_event, options: CaptureCardOptions[]) => {
    const results = await captureBatch(serverUrl, options)
    broadcast('export:done', { files: results.map((item) => item.file) })
    return results
  })

  ipcMain.handle('export:open', async () => {
    const dir = exportDir(resolveDataDir())
    await shell.openPath(dir)
    return dir
  })

  ipcMain.handle('export:reveal', async (_event, file: string) => {
    const dir = exportDir(resolveDataDir())
    const target = path.join(dir, path.basename(file))
    if (!fs.existsSync(target)) return false
    shell.showItemInFolder(target)
    return true
  })

  ipcMain.handle('shell:openExternal', async (_event, url: string) => {
    if (!/^https?:\/\//i.test(url)) return false
    await shell.openExternal(url)
    return true
  })

  ipcMain.on('achievement:notify', () => {
    mainWindow?.flashFrame(true)
  })
}

function broadcast(channel: string, payload: unknown): void {
  for (const window of BrowserWindow.getAllWindows()) {
    window.webContents.send(channel, payload)
  }
}

async function bootstrap(): Promise<void> {
  const serverUrl = await startEmbeddedServer()
  registerIpc(serverUrl)
  mainWindow = createMainWindow(serverUrl)
  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(bootstrap).catch((error: unknown) => {
  const detail = `数据目录：${resolveDataDir()}`
  // 打包后没有控制台，弹窗又只能看不能留，把启动失败同时写进数据目录，方便凭日志排查
  try {
    const logDir = path.join(env.dataDir, 'logs')
    fs.mkdirSync(logDir, { recursive: true })
    fs.appendFileSync(
      path.join(logDir, 'main.log'),
      `[${new Date().toISOString()}] 启动失败\n` +
        `${error instanceof Error ? (error.stack ?? error.message) : String(error)}\n` +
        `${detail}\n\n`,
    )
  } catch {
    // 写日志失败不应掩盖原始启动错误
  }
  void dialog.showMessageBox({
    type: 'error',
    title: 'Wingdex 启动失败',
    message: String(error),
    detail,
  })
  app.exit(1)
})

app.on('window-all-closed', () => {
  app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0 && serverHandle) {
    mainWindow = createMainWindow(serverHandle.url)
  }
})

app.on('before-quit', () => {
  try {
    // 关闭 SQLite 连接，避免 Windows 上残留文件句柄
    void serverHandle?.close()
  } catch (error) {
    console.error('[wingdex] 关闭本地服务失败', error)
  }
})

// 供离屏截图复用，避免 tree-shaking 移除
export { createOffscreenWindow, waitForCardReady }
