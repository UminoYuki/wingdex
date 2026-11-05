import fs from 'node:fs'
import path from 'node:path'
import { createOffscreenWindow, waitForCardReady } from './window'
import { exportDir, resolveDataDir } from './paths'

export const CARD_SIZES = {
  xs: { width: 118, height: 172 },
  sm: { width: 295, height: 430 },
  md: { width: 590, height: 860 },
  lg: { width: 1000, height: 1458 },
  xl: { width: 1500, height: 2187 },
  print: { width: 2000, height: 2916 },
} as const

export type CardSizeKey = keyof typeof CARD_SIZES

export interface CaptureCardOptions {
  id: number
  face?: 'front' | 'back'
  size?: CardSizeKey
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

function buildFileName(options: CaptureCardOptions): string {
  if (options.fileName) return options.fileName.replace(/[^\w.\-\u4e00-\u9fa5]/g, '_')
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '')
  const face = options.face ?? 'front'
  const size = options.size ?? 'lg'
  return `card-${options.id}-${face}-${size}-${stamp}.png`
}

export async function captureCard(serverUrl: string, options: CaptureCardOptions): Promise<CaptureResult> {
  const size = CARD_SIZES[options.size ?? 'lg']
  const params = new URLSearchParams({
    face: options.face ?? 'front',
    size: options.size ?? 'lg',
  })
  if (options.rx !== undefined) params.set('rx', String(options.rx))
  if (options.ry !== undefined) params.set('ry', String(options.ry))
  if (options.bleed !== undefined) params.set('bleed', String(options.bleed))
  if (options.debug) params.set('debug', '1')

  const window = createOffscreenWindow(size.width, size.height)
  try {
    window.webContents.setZoomFactor(1)
    await window.loadURL(`${serverUrl}/#/cards/print/${options.id}?${params.toString()}`)
    await waitForCardReady(window, 25_000)
    // 再等一帧，确保字体与图片完成布局
    await new Promise((resolve) => setTimeout(resolve, 160))
    const image = await window.webContents.capturePage()
    const buffer = image.toPNG()

    const file = buildFileName(options)
    fs.writeFileSync(path.join(exportDir(resolveDataDir()), file), buffer)
    return { file, bytes: buffer.byteLength, width: size.width, height: size.height }
  } finally {
    window.destroy()
  }
}

export async function captureBatch(
  serverUrl: string,
  cards: CaptureCardOptions[],
): Promise<CaptureResult[]> {
  const results: CaptureResult[] = []
  for (const card of cards) {
    results.push(await captureCard(serverUrl, card))
  }
  return results
}
