import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const APP_DIR = path.resolve(__dirname, '..', '..', '..')

function ensureDir(dir: string): string {
  fs.mkdirSync(dir, { recursive: true })
  return dir
}

/** 真实写入并删除一个探针文件，任何一步失败都视为不可写，交给下一级回退目录 */
function isWritable(dir: string): boolean {
  const probe = path.join(dir, `.write-probe-${process.pid}-${Date.now()}`)
  try {
    fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(probe, 'ok')
    fs.unlinkSync(probe)
    return true
  } catch {
    try {
      if (fs.existsSync(probe)) fs.unlinkSync(probe)
    } catch {
      /* ignore */
    }
    return false
  }
}

function resolveDataDir(): { dir: string; portable: boolean } {
  const fromEnv = process.env.BA_DATA_DIR
  if (fromEnv) return { dir: ensureDir(path.resolve(fromEnv)), portable: true }

  const portable = path.join(APP_DIR, '.data')
  if (isWritable(portable)) return { dir: ensureDir(portable), portable: true }

  // 回退目录名沿用 BirdAtlas，改名 Wingdex 后老数据仍在原处
  const fallback = path.join(
    process.env.APPDATA ?? path.join(os.homedir(), '.config'),
    'BirdAtlas',
  )
  return { dir: ensureDir(fallback), portable: false }
}

const resolved = resolveDataDir()

export const APP_NAME = 'Wingdex · 生灵图鉴'
export const APP_VERSION = '0.1.0'

export const config = {
  appDir: APP_DIR,
  dataDir: resolved.dir,
  portableDataDir: resolved.portable,
  dbPath: path.join(resolved.dir, 'atlas.db'),
  cacheDir: ensureDir(path.join(resolved.dir, 'cache')),
  thumbDir: ensureDir(path.join(resolved.dir, 'cache', 'thumbs')),
  wikiImageDir: ensureDir(path.join(resolved.dir, 'cache', 'wiki')),
  assetDir: ensureDir(path.join(resolved.dir, 'cache', 'assets')),
  exportDir: ensureDir(path.join(resolved.dir, 'exports')),
  logDir: ensureDir(path.join(resolved.dir, 'logs')),
  tempDir: ensureDir(path.join(resolved.dir, 'tmp')),
  port: Number(process.env.BA_PORT ?? 5176),
  host: process.env.BA_HOST ?? '127.0.0.1',
  /**
   * 维基媒体按 UA 政策识别客户端：不带联系方式（URL 或邮箱）的 UA 会被当作未识别客户端，
   * 所有 API 请求直接返回 429（HTTP 429 + retry-after），表现为「维基资料抓取失败」。
   * 可用 BA_USER_AGENT 覆盖（例如自建代理/镜像需要标注自己的联系信息）。
   */
  userAgent:
    process.env.BA_USER_AGENT ??
    `Wingdex/${APP_VERSION} (+https://github.com/UminoYuki/wingdex)`,
  wikiConcurrency: 2,
  fetchTimeoutMs: 10_000,
  fetchRetries: 2,
  /** 重试等待上限：超过这个时长说明被限流窗口拦住，直接给出可读提示而不是长时间卡住界面 */
  fetchRetryMaxWaitMs: 10_000,
} as const

export const CARD_TEXT_LIMITS = {
  title: 12,
  cnName: 10,
  typeLine: 22,
  effect: 90,
  record: 50,
  backText: 20,
  effectTotal: 140,
} as const

export const CARD_LINE_LIMITS = {
  effect: 4,
  record: 2,
} as const

/**
 * 行数换算口径：每行可容纳的中文字数。
 * 与 web 端 TEXT_METRICS.effectCharsPerLine / recordCharsPerLine 必须保持一致，
 * 卡面格线与字数上限同时变更时两者一起改。
 */
export const CARD_LINE_CHARS = {
  /** 效果框文字宽 79.86cqw ÷ 2.9cqw 字号 ≈ 27.5，保守取 26 字 */
  effect: 26,
  /** 拍摄记录 2.1cqw 字号，含 ASCII 半宽权重 */
  record: 34,
} as const

export type AppConfig = typeof config
