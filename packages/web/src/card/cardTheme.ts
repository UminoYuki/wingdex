/** 卡牌配色与稀有度视觉：卡面、卡背、3D、导出统一读取 */

export const ATTRIBUTE_COLORS: Record<string, { start: string; end: string; text: string }> = {
  林: { start: '#2F6E4E', end: '#57C785', text: '#0F1512' },
  泽: { start: '#2C5F73', end: '#6FB3C9', text: '#0F1512' },
  原: { start: '#6E5A18', end: '#C9B24B', text: '#0F1512' },
  海: { start: '#27406E', end: '#4B7FC9', text: '#E8EFE9' },
  山: { start: '#4A4460', end: '#8A7FA8', text: '#E8EFE9' },
  空: { start: '#356B84', end: '#7FC4E5', text: '#0F1512' },
  夜: { start: '#3A3163', end: '#6A5C9E', text: '#E8EFE9' },
  都: { start: '#5C6864', end: '#9FB0A5', text: '#0F1512' },
}

export const ATTRIBUTE_KEYS = Object.keys(ATTRIBUTE_COLORS)

export type RarityKey = 'N' | 'R' | 'SR' | 'UR' | '传说'

export interface RarityStyle {
  label: string
  /** 卡框渐变 */
  frame: string
  /** 卡名文字色 */
  nameColor: string
  /** 是否闪光膜 */
  foil: boolean
  glow: string
}

export const RARITY_STYLES: Record<RarityKey, RarityStyle> = {
  N: {
    label: 'N',
    frame: 'linear-gradient(150deg, #6E7F74 0%, #46534C 45%, #8B9990 100%)',
    nameColor: '#E8EFE9',
    foil: false,
    glow: 'none',
  },
  R: {
    label: 'R',
    frame: 'linear-gradient(150deg, #7C8A94 0%, #4A5560 42%, #C3CFD8 100%)',
    nameColor: '#F4F9FF',
    foil: true,
    glow: '0 0 14px rgba(174,186,196,.28)',
  },
  SR: {
    label: 'SR',
    frame: 'linear-gradient(150deg, #4E7BA6 0%, #2E4C6E 44%, #9ECBF0 100%)',
    nameColor: '#EAF4FF',
    foil: true,
    glow: '0 0 18px rgba(111,179,201,.34)',
  },
  UR: {
    label: 'UR',
    frame: 'linear-gradient(150deg, #8A6412 0%, #E8B04B 46%, #FFE3A3 100%)',
    nameColor: '#FFF6E0',
    foil: true,
    glow: '0 0 22px rgba(232,176,75,.42)',
  },
  传说: {
    label: '传说',
    frame: 'linear-gradient(130deg, #2F6E4E 0%, #57C785 32%, #6FB3C9 64%, #8A6412 100%)',
    nameColor: '#FFFFFF',
    foil: true,
    glow: '0 0 26px rgba(87,199,133,.45)',
  },
}

/**
 * 文本纸面与卡图窗描边：真实游戏王卡无论卡框配色如何，下半部永远是一块**米色纸面 + 深墨字**，
 * 卡图窗则是一圈深色外描边加深色内衬。这里恒定，不随稀有度变化。
 */
export const PAPER = {
  /** 纸面底色（自上而下微渐变，模拟纸张受光） */
  face: 'linear-gradient(180deg, #F7EAD8 0%, #EEDDC4 56%, #E2CDB0 100%)',
  /** 纸面外描边：比卡框更深，纸面才会从卡框上「浮」起来 */
  edge: 'rgba(30,18,6,0.62)',
  /** 纸面内高光（左上受光边） */
  bevel: 'rgba(255,255,255,0.5)',
  /** 正文墨色（类型行 / 物种简介 / ATK·DEF 数值） */
  ink: '#2A1F14',
  /** 弱化墨色（拍摄记录） */
  inkSoft: 'rgba(42,31,20,0.6)',
  /** 标签墨色（ATK/ DEF/ 前缀） */
  inkLabel: 'rgba(42,31,20,0.72)',
  /** 框内分隔线 */
  rule: 'rgba(42,31,20,0.5)',
  /** 卡图窗画框（参考卡实测是一圈青灰色，不是纯黑；比卡框深一档才读得出「画框」） */
  artFrame: '#3A4759',
  /** 卡图窗内亮线（紧贴画框里侧的一圈浅色） */
  artBevel: 'rgba(255,255,255,0.3)',
} as const

export function rarityKey(value: string | null | undefined): RarityKey {
  if (value && value in RARITY_STYLES) return value as RarityKey
  return 'N'
}

export function attributeColor(attribute: string | null | undefined) {
  return ATTRIBUTE_COLORS[attribute ?? '林'] ?? ATTRIBUTE_COLORS['林']
}

/** 卡背底纹主题 */
export type BackThemeKey = 'feather' | 'rings' | 'stars' | 'aperture' | 'custom'

export const BACK_THEMES: Array<{ key: BackThemeKey; label: string; description: string }> = [
  { key: 'feather', label: '羽脉', description: '羽轴与羽枝的细密纹路，最贴近图鉴气质' },
  { key: 'rings', label: '年轮', description: '同心圆年轮，象征时间与生长' },
  { key: 'stars', label: '星图', description: '点阵星图，深夜观鸟的夜空' },
  { key: 'aperture', label: '光圈', description: '光圈叶片几何，摄影感最强' },
  { key: 'custom', label: '自定义', description: '使用自选底纹强度与色调' },
]

export function backThemeBackground(theme: string): string {
  switch (theme) {
    case 'rings':
      return 'repeating-radial-gradient(circle at 50% 42%, rgba(255,255,255,.05) 0 1px, transparent 1px 16px)'
    case 'stars':
      return 'radial-gradient(circle at 22% 28%, rgba(255,255,255,.16) 0 1px, transparent 1.5px), radial-gradient(circle at 68% 62%, rgba(255,255,255,.12) 0 1px, transparent 1.5px), radial-gradient(circle at 44% 78%, rgba(255,255,255,.1) 0 1px, transparent 1.5px)'
    case 'aperture':
      return 'conic-gradient(from 0deg at 50% 50%, rgba(255,255,255,.06) 0deg 30deg, transparent 30deg 60deg)'
    case 'feather':
    default:
      return 'repeating-linear-gradient(115deg, rgba(255,255,255,.045) 0 2px, transparent 2px 13px)'
  }
}

/** 印花色调 */
export const PRINT_TONES = {
  gold: { line: '#E8B04B', faint: 'rgba(232,176,75,0.32)', text: '#FFE3A3' },
  gunmetal: { line: '#9FB0A5', faint: 'rgba(159,176,165,0.28)', text: '#D6E0DA' },
  moss: { line: '#57C785', faint: 'rgba(87,199,133,0.30)', text: '#D6F5E4' },
} as const

export type PrintToneKey = keyof typeof PRINT_TONES
