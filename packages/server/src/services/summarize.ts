import { CARD_TEXT_LIMITS } from '../config'
import type { Photo, Place } from '../types'

const PRIORITY_WORDS = ['体长', '翼展', '体重', '栖息', '分布', '习性', '食性', '繁殖', '群居', '迁徙']

const WIKI_NOISE = [
  /\[[^\]]*\]/g,
  /（[^）]{0,40}(?:参考|来源|注|拉丁|学名)[^）]{0,40}）/g,
  /\(\s*(?:[A-Z][a-z]+\.?\s*){1,4}\d{3,4}\s*\)/g,
  /\s+/g,
]

function stripNoise(text: string): string {
  let out = text
  for (const pattern of WIKI_NOISE) out = out.replace(pattern, '')
  out = out.replace(/\([^)]{0,40}\)/g, '')
  return out.replace(/\s+/g, '').trim()
}

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[。！？；;!?])/)
    .map((item) => item.trim())
    .filter((item) => item.length > 1)
}

function score(sentence: string): number {
  return PRIORITY_WORDS.reduce((acc, word) => acc + (sentence.includes(word) ? 1 : 0), 0)
}

export interface SummaryResult {
  text: string
  truncated: boolean
  chars: number
}

/**
 * 卡面摘要：参考游戏王效果文本密度（≤90 字，最多 4 行）。
 * 按句累加，保留含关键词的句子，在完整句边界收尾。
 */
export function summarizeForCard(
  source: string | null,
  limit = CARD_TEXT_LIMITS.effect,
): SummaryResult {
  const text = stripNoise(source ?? '')
  if (!text) return { text: '', truncated: false, chars: 0 }
  if (text.length <= limit) return { text, truncated: false, chars: text.length }

  const sentences = splitSentences(text)
  const ranked = sentences
    .map((sentence, index) => ({ sentence, index, score: score(sentence) }))
    .sort((a, b) => b.score - a.score || a.index - b.index)

  const picked: string[] = []
  let length = 0
  for (const item of ranked) {
    if (length + item.sentence.length > limit) continue
    if (item.sentence.length < 6) continue
    picked.push(item.sentence)
    length += item.sentence.length
    if (length >= limit - 8) break
  }

  if (picked.length === 0) {
    return {
      text: `${text.slice(0, limit - 1)}…`,
      truncated: true,
      chars: limit,
    }
  }

  const ordered = sentences.filter((sentence) => picked.includes(sentence))
  return { text: ordered.join(''), truncated: true, chars: ordered.join('').length }
}

/** 按句截断到上限（保持句子完整，不使用省略号） */
export function trimBySentence(text: string, limit: number): string {
  const clean = stripNoise(text)
  if (clean.length <= limit) return clean
  const sentences = splitSentences(clean)
  let out = ''
  for (const sentence of sentences) {
    if ((out + sentence).length > limit) break
    out += sentence
  }
  return out || clean.slice(0, limit)
}

/** 移除括号补充内容，得到更紧凑的卡面文本 */
export function stripParentheses(text: string): string {
  return text
    .replace(/（[^）]*）/g, '')
    .replace(/\([^)]*\)/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

function formatDate(value: string | null): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value.slice(0, 10)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** 拍摄记录：第一行时间地点，第二行器材，均可手改 */
export function buildRecordText(photo: Photo | null, place: Place | null, noteWords = 12): string {
  if (!photo) return ''
  const parts = [formatDate(photo.takenAt)].filter(Boolean)
  const placeLabel = place?.name ?? photo.placeName
  if (placeLabel) parts.push(placeLabel)

  const gear: string[] = []
  const focal = photo.focalLen ? `${Math.round(photo.focalLen)}mm` : ''
  const body = photo.cameraModel ? photo.cameraModel.replace(/^NIKON |^Canon |^SONY /i, '') : ''
  if (focal) gear.push(focal)
  if (photo.aperture) gear.push(`f/${photo.aperture}`)
  if (body) gear.push(body)
  else if (photo.lens) gear.push(photo.lens.slice(0, 14))

  const lines = [parts.join(' · '), gear.join(' ')].filter(Boolean)
  const text = lines.join('\n')
  if (text.length <= CARD_TEXT_LIMITS.record) return text

  const clipped = lines
    .map((line) => line.slice(0, Math.max(6, noteWords + 8)))
    .join('\n')
  return clipped.slice(0, CARD_TEXT_LIMITS.record)
}

export function countLines(text: string, charsPerLine: number): number {
  if (!text) return 0
  return text
    .split('\n')
    .map((line) => Math.max(1, Math.ceil(line.length / charsPerLine)))
    .reduce((acc, value) => acc + value, 0)
}
