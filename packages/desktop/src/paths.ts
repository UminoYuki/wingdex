import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { app } from 'electron'

/** 打包后 resources 目录（asar 外），开发态为包根目录 */
function resourceRoot(): string {
  if (app.isPackaged) return process.resourcesPath
  return path.resolve(__dirname, '..')
}

function isWritable(dir: string): boolean {
  try {
    fs.mkdirSync(dir, { recursive: true })
    fs.accessSync(dir, fs.constants.W_OK)
    return true
  } catch {
    return false
  }
}

/**
 * 便携版 exe 的真实所在目录。
 * electron-builder 的 portable 目标会把程序解包到临时目录再启动，
 * 此时 app.getPath('exe') 指向临时副本（退出即删），必须用 PORTABLE_EXECUTABLE_DIR
 * 取回用户双击的那个 exe 的目录，否则数据会随临时目录一起丢失。
 */
function portableExeDir(): string | null {
  const dir = process.env.PORTABLE_EXECUTABLE_DIR
  return dir ? path.resolve(dir) : null
}

/** 数据目录优先级：BA_DATA_DIR → 便携 exe 同目录 .data → %APPDATA%/BirdAtlas */
export function resolveDataDir(): string {
  const explicit = process.env.BA_DATA_DIR
  if (explicit) {
    const dir = path.resolve(explicit)
    if (isWritable(dir)) return dir
  }

  if (!app.isPackaged) {
    // 开发态：沿用仓库根 .data（与 `npm run dev` 的服务端默认一致，可复用演示数据），
    // 不去写 node_modules 里 electron.exe 旁边的目录
    const repo = path.resolve(__dirname, '..', '..', '..', '.data')
    if (isWritable(repo)) return repo
  } else {
    // 打包后：exe 同目录 .data（便携，方便整个文件夹拷走）
    for (const base of [portableExeDir(), path.dirname(app.getPath('exe'))]) {
      if (!base) continue
      const portable = path.join(base, '.data')
      if (isWritable(portable)) return portable
    }
  }

  const roaming = path.join(app.getPath('userData'), 'data')
  if (isWritable(roaming)) return roaming

  return path.join(os.homedir(), '.bird-atlas')
}

export function resolveWebDist(): string {
  const candidates = [
    process.env.BA_WEB_DIST,
    path.join(resourceRoot(), 'web'),
    path.join(resourceRoot(), '..', 'web', 'dist'),
    path.resolve(__dirname, '..', '..', 'web', 'dist'),
  ].filter((value): value is string => Boolean(value))

  return candidates.find((dir) => fs.existsSync(path.join(dir, 'index.html'))) ?? candidates[0]
}

export function resolveTempDir(dataDir: string): string {
  const dir = path.join(dataDir, '.tmp')
  fs.mkdirSync(dir, { recursive: true })
  return dir
}

export function exportDir(dataDir: string): string {
  const dir = path.join(dataDir, 'exports')
  fs.mkdirSync(dir, { recursive: true })
  return dir
}

export function applyEnvironment(): { dataDir: string; webDist: string } {
  const dataDir = resolveDataDir()
  const webDist = resolveWebDist()
  const temp = resolveTempDir(dataDir)

  process.env.BA_DATA_DIR = dataDir
  process.env.BA_WEB_DIST = webDist
  process.env.TEMP = temp
  process.env.TMP = temp

  return { dataDir, webDist }
}
