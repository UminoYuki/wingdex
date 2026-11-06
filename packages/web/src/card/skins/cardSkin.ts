import { mediaUrl } from '../../api/client'

/** 浏览用卡面皮肤。不写入卡片记录，导出与编辑画布仍用典藏卡面。 */
export const CARD_SKINS = [
  { id: 'atlas', label: '典藏', description: '现有图鉴卡面：属性框、星级、攻防与卡图窗' },
  { id: 'field', label: '图鉴', description: '田野记录卡：栖境色框、观察文字与记录值' },
  { id: 'scroll', label: '卷轴', description: '通栏影像、竖题名牌、勾玉与技能卷' },
] as const

export type CardSkinId = (typeof CARD_SKINS)[number]['id']

export const BACK_SKINS = [
  { id: 'archive', label: '档案', description: '现有印花卡背：纹章、镜头印与弧形题名' },
  { id: 'lens', label: '镜头', description: '长焦镜筒浮雕、滚花环与镀膜反光' },
] as const

export type BackSkinId = (typeof BACK_SKINS)[number]['id']

export const DECK_VIEWS = [
  { id: 'wall', label: '卡墙' },
  { id: 'stage', label: '展台' },
  { id: 'binder', label: '卡册' },
] as const

export type DeckViewId = (typeof DECK_VIEWS)[number]['id']

export function parseCardSkin(value: string | null | undefined): CardSkinId {
  if (value === 'atlas' || value === 'field' || value === 'scroll') return value
  return 'atlas'
}

export function parseBackSkin(value: string | null | undefined): BackSkinId {
  if (value === 'archive' || value === 'lens') return value
  return 'archive'
}

export function parseDeckView(value: string | null | undefined): DeckViewId {
  if (value === 'wall' || value === 'stage' || value === 'binder') return value
  return 'wall'
}

export interface HabitatVisual {
  frame: string
  ink: string
  pip: string
  paper: string
}

/** 八栖境配色。几何色块，不使用商业卡牌的能量符号。 */
const HABITATS: Record<string, HabitatVisual> = {
  林: {
    frame: 'linear-gradient(155deg, #e7f8ee 0%, #8fd7ad 46%, #1b5c3c 100%)',
    ink: '#10281c',
    pip: '#1b5c3c',
    paper: '#f4f7f2',
  },
  泽: {
    frame: 'linear-gradient(155deg, #e5f6fb 0%, #7ec4dc 46%, #1d5f7a 100%)',
    ink: '#102430',
    pip: '#1d5f7a',
    paper: '#f3f7f8',
  },
  原: {
    frame: 'linear-gradient(155deg, #fbf6df 0%, #e2c56a 46%, #8a6416 100%)',
    ink: '#2c220c',
    pip: '#8a6416',
    paper: '#fbf8ef',
  },
  海: {
    frame: 'linear-gradient(155deg, #e7eefb 0%, #7ea4dc 46%, #243e78 100%)',
    ink: '#101828',
    pip: '#243e78',
    paper: '#f4f6fb',
  },
  山: {
    frame: 'linear-gradient(155deg, #f6efe6 0%, #c4a27a 46%, #6a4630 100%)',
    ink: '#2a1c14',
    pip: '#6a4630',
    paper: '#f8f4ee',
  },
  空: {
    frame: 'linear-gradient(155deg, #e9f8fb 0%, #8fd4e2 46%, #1d6d7c 100%)',
    ink: '#102428',
    pip: '#1d6d7c',
    paper: '#f3fafb',
  },
  夜: {
    frame: 'linear-gradient(155deg, #efeaf8 0%, #b4a4d8 46%, #433468 100%)',
    ink: '#1c1630',
    pip: '#433468',
    paper: '#f6f4fa',
  },
  都: {
    frame: 'linear-gradient(155deg, #f4f2ee 0%, #c4c0b6 46%, #5c5852 100%)',
    ink: '#221f1c',
    pip: '#5c5852',
    paper: '#f7f6f3',
  },
}

export function habitatVisual(attribute: string | null | undefined): HabitatVisual {
  return HABITATS[attribute ?? ''] ?? HABITATS['林']!
}

export function cardPhotoSrc(photoId: number | null | undefined): string | null {
  if (!photoId) return null
  return mediaUrl.thumb(photoId, 640)
}

/** 卷轴勾玉数量：1–5 星照实显示，更高星级折半后不超过 5。 */
export function scrollBeadCount(stars: number): number {
  const n = Number.isFinite(stars) ? Math.round(stars) : 4
  if (n <= 5) return Math.max(1, n)
  return Math.max(1, Math.min(5, Math.round(n / 2)))
}

export function showsFoil(rarity: string | null | undefined, holo: boolean | null | undefined): boolean {
  if (holo) return true
  return rarity === 'UR' || rarity === '传说' || rarity === 'LEGEND' || rarity === 'SR'
}

export function lensCaption(exif: {
  lens?: string | null
  focalLength?: number | null
  aperture?: string | null
} | null | undefined): string {
  if (exif?.lens) return exif.lens
  const focal = exif?.focalLength ? `${Math.round(exif.focalLength)}mm` : '600mm'
  const aperture = exif?.aperture ? exif.aperture.replace(/^f\/?/i, 'F/') : 'F/4'
  return `${focal} ${aperture.startsWith('F/') ? aperture : `F/${aperture}`} ED`
}
