import fs from 'node:fs'
import path from 'node:path'
import archiver from 'archiver'
import sharp from 'sharp'
import { config } from '../config'
import { logger } from '../logger'
import { ApiError } from '../api/utils'
import { CARD_RATIO } from '../data/cardRules'
import { safeKey } from './mediaService'

const A4 = { width: 2480, height: 3508, margin: 90, gap: 26, columns: 3, rows: 3 }

export interface ExportFile {
  file: string
  bytes: number
  mtime: string
  url: string
}

function describe(file: string): ExportFile {
  const full = path.join(config.exportDir, file)
  const stat = fs.statSync(full)
  return {
    file,
    bytes: stat.size,
    mtime: stat.mtime.toISOString(),
    url: `/api/media/export/${encodeURIComponent(file)}`,
  }
}

export function listExports(): ExportFile[] {
  if (!fs.existsSync(config.exportDir)) return []
  return fs
    .readdirSync(config.exportDir)
    .filter((name) => /\.(png|jpe?g|zip)$/i.test(name))
    .map(describe)
    .sort((a, b) => b.mtime.localeCompare(a.mtime))
}

function exportPath(file: string): string {
  return path.join(config.exportDir, path.basename(safeKey(file)))
}

export function saveExport(fileName: string, buffer: Buffer): ExportFile {
  const name = `${path.basename(fileName, path.extname(fileName))}${path.extname(fileName) || '.png'}`
  const target = exportPath(name)
  fs.writeFileSync(target, buffer)
  logger.info({ file: name, bytes: buffer.byteLength }, '写入导出文件')
  return describe(path.basename(target))
}

export function saveExportFromDataUrl(fileName: string, dataUrl: string): ExportFile {
  const match = /^data:image\/(png|jpeg);base64,(.+)$/i.exec(dataUrl)
  if (!match) throw new ApiError(400, '导出内容必须是 png/jpeg 的 base64 数据')
  const ext = match[1].toLowerCase() === 'png' ? '.png' : '.jpg'
  return saveExport(`${path.basename(fileName, path.extname(fileName))}${ext}`, Buffer.from(match[2], 'base64'))
}

export function deleteExport(file: string): void {
  const target = exportPath(file)
  if (!fs.existsSync(target)) throw new ApiError(404, '导出文件不存在')
  fs.unlinkSync(target)
}

function cropMarksSvg(cellW: number, cellH: number, offsets: Array<{ left: number; top: number }>, bleed: number): Buffer {
  const lines = offsets
    .map(({ left, top }) => {
      const size = 18
      const gap = 6 + bleed
      const x0 = left - gap
      const x1 = left + cellW + gap
      const y0 = top - gap
      const y1 = top + cellH + gap
      return `
        <path d="M${x0} ${y0 + size} L${x0} ${y0} L${x0 + size} ${y0}" />
        <path d="M${x1 - size} ${y0} L${x1} ${y0} L${x1} ${y0 + size}" />
        <path d="M${x0} ${y1 - size} L${x0} ${y1} L${x0 + size} ${y1}" />
        <path d="M${x1 - size} ${y1} L${x1} ${y1} L${x1} ${y1 - size}" />`
    })
    .join('')

  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${A4.width}" height="${A4.height}">
      <g stroke="#1a1a1a" stroke-width="2" fill="none">${lines}</g>
    </svg>`,
  )
}

export interface SheetOptions {
  files: string[]
  mirrorBack?: boolean
  bleed?: number
  marks?: boolean
  columns?: number
}

/** A4 拼版：默认 3×3，含裁切角标；双面打印时偶数行水平镜像 */
export async function buildSheet(options: SheetOptions): Promise<ExportFile> {
  const files = options.files.filter((file) => fs.existsSync(exportPath(file)))
  if (!files.length) throw new ApiError(400, '请先选择要拼版的卡片导图')

  const columns = Math.min(Math.max(options.columns ?? A4.columns, 1), 4)
  const rows = Math.min(Math.ceil(files.length / columns), A4.rows)
  const bleed = Math.min(Math.max(options.bleed ?? 0, 0), 40)
  const cellH = Math.floor((A4.height - 2 * A4.margin - (A4.rows - 1) * A4.gap) / A4.rows)
  const cellW = Math.round(cellH * (CARD_RATIO.w / CARD_RATIO.h))
  const offsets: Array<{ left: number; top: number }> = []
  const composites: sharp.OverlayOptions[] = []

  for (const [index, file] of files.entries()) {
    const row = Math.floor(index / columns)
    const col = index % columns
    if (row >= A4.rows) break
    const left = A4.margin + col * (cellW + A4.gap)
    const top = A4.margin + row * (cellH + A4.gap)
    offsets.push({ left, top })

    let image = sharp(exportPath(file)).flatten({ background: '#ffffff' })
    if (options.mirrorBack && row % 2 === 1) image = image.flop()
    const buffer = await image
      .resize(cellW - bleed * 2, cellH - bleed * 2, { fit: 'cover' })
      .png()
      .toBuffer()
    composites.push({ input: buffer, left: left + bleed, top: top + bleed })
  }

  if (options.marks !== false) {
    composites.push({ input: cropMarksSvg(cellW, cellH, offsets, bleed), left: 0, top: 0 })
  }

  const buffer = await sharp({
    create: {
      width: A4.width,
      height: A4.height,
      channels: 3,
      background: '#ffffff',
    },
  })
    .composite(composites)
    .png({ compressionLevel: 9 })
    .toBuffer()

  return saveExport(`A4_${rows}x${columns}_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '')}.png`, buffer)
}

export async function zipExports(files: string[], zipName?: string): Promise<ExportFile> {
  const existing = files.filter((file) => fs.existsSync(exportPath(file)))
  if (!existing.length) throw new ApiError(400, '没有可打包的导出文件')

  const name = zipName
    ? `${path.basename(zipName, '.zip')}.zip`
    : `bird-atlas-cards-${Date.now().toString(36)}.zip`
  const target = exportPath(name)

  await new Promise<void>((resolve, reject) => {
    const output = fs.createWriteStream(target)
    const archive = archiver('zip', { zlib: { level: 9 } })
    output.on('close', () => resolve())
    archive.on('error', (error) => reject(error))
    archive.pipe(output)
    for (const file of existing) archive.file(exportPath(file), { name: file })
    void archive.finalize()
  })

  return describe(path.basename(target))
}

export function cleanupExports(keepDays = 30): number {
  const cutoff = Date.now() - keepDays * 86_400_000
  let removed = 0
  for (const item of listExports()) {
    if (Date.parse(item.mtime) < cutoff) {
      fs.unlinkSync(exportPath(item.file))
      removed += 1
    }
  }
  return removed
}
