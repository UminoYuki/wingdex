import type { CardOverride } from '../api/types'

export interface CardPreset {
  key: string
  name: string
  description: string
  holo: boolean
  backTheme: string
  overrides: Record<string, CardOverride>
}

/** 内置四套卡面预设：经典 / 博物 / 暗夜 / 极简 */
export const CARD_PRESETS: CardPreset[] = [
  {
    key: 'classic',
    name: '经典',
    description: '标准配色与金色卡名，接近游戏王的经典官感',
    holo: false,
    backTheme: 'feather',
    // 预设定制的是**卡框配色**（卡名 / 称号 / 卡框）；下半部文本纸面恒为米色纸 + 墨字，
    // 所以不在这里给 typeLine / effect 指定字色，交给 PAPER 默认，免得浅字压在纸面上看不清。
    overrides: {
      name: { color: '#FFF6E0', letterSpacing: 0.02, fontWeight: 700 },
      title: { color: '#E8B04B', letterSpacing: 0.12 },
      typeLine: { letterSpacing: 0.04 },
    },
  },
  {
    key: 'museum',
    name: '博物',
    description: '米色纸感与锈绿条纹，像老式标本图鉴',
    holo: false,
    backTheme: 'rings',
    overrides: {
      name: { color: '#F6F1E2', fontWeight: 700, letterSpacing: 0.04 },
      title: { color: '#C9B24B', italic: true, letterSpacing: 0.16 },
      frame: { color: '#3E4A3F' },
    },
  },
  {
    key: 'night',
    name: '暗夜',
    description: '深墨底 + 幽紫高光，适合夜行性与猛禽',
    holo: true,
    backTheme: 'stars',
    overrides: {
      name: { color: '#E3E8FF', fontWeight: 700 },
      title: { color: '#8A7FA8', letterSpacing: 0.14 },
      frame: { color: '#24406E' },
    },
  },
  {
    key: 'minimal',
    name: '极简',
    description: '留白更多、描边更细，突出照片本身',
    holo: false,
    backTheme: 'custom',
    overrides: {
      name: { color: '#F2F6F3', fontWeight: 600, letterSpacing: 0.08 },
      title: { color: '#9FB0A5', letterSpacing: 0.2, fontScale: 2.6 },
      effect: { fontScale: 2.2 },
      rarity: { effects: { opacity: 0.75 } },
    },
  },
]

export function presetByKey(key: string | null | undefined): CardPreset {
  return CARD_PRESETS.find((preset) => preset.key === key) ?? CARD_PRESETS[0]
}
