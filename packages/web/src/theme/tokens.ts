/**
 * 设计令牌唯一来源：颜色/圆角/阴影/动效/字阶/卡片比例。
 * tailwind.config.js 中的语义类名与此保持一致；TS 内联样式（图表、卡面、SVG）一律从此处取色。
 */

export const colors = {
  ink: { 900: '#0F1512', 800: '#16201B', 700: '#1E2A24' },
  moss: { DEFAULT: '#57C785', deep: '#3E9E6B', soft: '#7FD1A5' },
  plume: '#6FB3C9',
  gold: '#E8B04B',
  success: '#4FBF7B',
  danger: '#E5636F',
  fog: { 100: '#E8EFE9', 200: '#9FB0A5', 300: '#6E7F74' },
} as const

export const surfaces = {
  page: colors.ink[900],
  panel: colors.ink[800],
  raised: colors.ink[700],
  glass: 'rgba(255,255,255,0.04)',
  hairline: 'rgba(255,255,255,0.08)',
  strongHairline: 'rgba(255,255,255,0.14)',
} as const

export const gradients = {
  primary: `linear-gradient(135deg, ${colors.moss.DEFAULT}, ${colors.moss.deep})`,
  aurora: `linear-gradient(135deg, ${colors.moss.DEFAULT} 0%, ${colors.plume} 58%, ${colors.gold} 100%)`,
  gold: `linear-gradient(135deg, #8A6412, ${colors.gold} 55%, #FFE3A3)`,
  veil: 'linear-gradient(180deg, rgba(15,21,18,0) 0%, rgba(15,21,18,.72) 62%, rgba(15,21,18,.94) 100%)',
} as const

export const motion = {
  fast: 120,
  base: 200,
  slow: 320,
  flip: 600,
  ease: 'cubic-bezier(0.22,1,0.36,1)',
} as const

export const layout = {
  topNavHeight: 56,
  statusBarHeight: 36,
  contentPaddingX: 24,
  gridGap: 20,
} as const

/** 卡片属性：8 种栖息属性 */
export const ATTRIBUTES = ['林', '泽', '原', '海', '山', '空', '夜', '都'] as const
export type AttributeKey = (typeof ATTRIBUTES)[number]

export const attributeTheme: Record<AttributeKey, { color: string; glow: string; label: string }> = {
  林: { color: '#57C785', glow: 'rgba(87,199,133,.55)', label: '森林与灌丛' },
  泽: { color: '#6FB3C9', glow: 'rgba(111,179,201,.55)', label: '湿地与滩涂' },
  原: { color: '#C9B24B', glow: 'rgba(201,178,75,.55)', label: '草原与农田' },
  海: { color: '#4B7FC9', glow: 'rgba(75,127,201,.55)', label: '海洋与近海' },
  山: { color: '#8A7FA8', glow: 'rgba(138,127,168,.55)', label: '山地与高原' },
  空: { color: '#7FC4E5', glow: 'rgba(127,196,229,.55)', label: '开阔天空' },
  夜: { color: '#6A5C9E', glow: 'rgba(106,92,158,.55)', label: '夜行领域' },
  都: { color: '#9FB0A5', glow: 'rgba(159,176,165,.5)', label: '城市与园林' },
}

/** 稀有度：卡框、闪膜与角标配色 */
export const CARD_RARITIES = ['N', 'R', 'SR', 'UR', 'LEGEND'] as const
export type CardRarity = (typeof CARD_RARITIES)[number]

export const rarityTheme: Record<
  CardRarity,
  { label: string; frame: string; text: string; holo: string; sheen: string }
> = {
  N: {
    label: '普通',
    frame: 'rgba(159,176,165,.55)',
    text: '#E8EFE9',
    holo: 'none',
    sheen: 'rgba(255,255,255,.05)',
  },
  R: {
    label: '稀有',
    frame: 'rgba(200,214,222,.7)',
    text: '#DCE7EF',
    holo: 'linear-gradient(115deg, transparent 32%, rgba(214,232,244,.30) 46%, transparent 60%)',
    sheen: 'rgba(214,232,244,.12)',
  },
  SR: {
    label: '史诗',
    frame: 'rgba(111,179,201,.78)',
    text: '#DCEFF7',
    holo: 'linear-gradient(115deg, transparent 28%, rgba(111,179,201,.42) 44%, rgba(87,199,133,.34) 56%, transparent 72%)',
    sheen: 'rgba(111,179,201,.16)',
  },
  UR: {
    label: '传说稀有',
    frame: 'rgba(232,176,75,.85)',
    text: '#FBE7BF',
    holo: 'linear-gradient(115deg, transparent 24%, rgba(232,176,75,.46) 42%, rgba(255,227,163,.44) 54%, transparent 74%)',
    sheen: 'rgba(232,176,75,.2)',
  },
  LEGEND: {
    label: '神话',
    frame: 'rgba(160,255,214,.9)',
    text: '#E9FFF6',
    holo: 'linear-gradient(115deg, rgba(87,199,133,.42) 18%, rgba(111,179,201,.42) 40%, rgba(232,176,75,.4) 62%, rgba(106,92,158,.42) 82%)',
    sheen: 'rgba(111,179,201,.26)',
  },
}

export const tiers = {
  铜: { from: '#8A5A2B', mid: '#C98A4B', to: '#F0C08A' },
  银: { from: '#6E7F88', mid: '#AEBAC4', to: '#E6EEF4' },
  金: { from: '#8A6412', mid: '#E8B04B', to: '#FFE3A3' },
  传说: { from: '#2F6E4E', mid: '#57C785', to: '#6FB3C9' },
} as const

export type TierKey = keyof typeof tiers

/** 图表配色（recharts） */
export const chartPalette = [
  colors.moss.DEFAULT,
  colors.plume,
  colors.gold,
  colors.moss.soft,
  '#8A7FA8',
  '#7FC4E5',
  '#C9B24B',
  '#6A5C9E',
  colors.success,
  '#9FB0A5',
]

/** 卡片比例：全应用唯一 59:86 */
export const CARD_RATIO = { w: 59, h: 86 } as const
export const CARD_RATIO_VALUE = CARD_RATIO.w / CARD_RATIO.h

export const CARD_SIZES = {
  xs: { width: 118, height: 172 },
  sm: { width: 295, height: 430 },
  md: { width: 590, height: 860 },
  lg: { width: 1000, height: 1458 },
  xl: { width: 1500, height: 2187 },
  print: { width: 2000, height: 2916 },
} as const

export type CardSizeKey = keyof typeof CARD_SIZES

/** 卡面文本容量（硬约束，与服务端 cardRules.ts 一致） */
export const TEXT_LIMITS = {
  title: 12,
  cnName: 10,
  typeLine: 22,
  effect: 90,
  effectLines: 4,
  record: 50,
  recordLines: 2,
  effectTotal: 140,
  backText: 20,
} as const

export const zIndex = {
  nav: 40,
  statusBar: 40,
  overlay: 60,
  dialog: 70,
  toast: 90,
} as const
