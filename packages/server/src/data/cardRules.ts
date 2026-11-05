import type {
  CardAttribute,
  CardBackPrintConfig,
  CardRarity,
  ProtectionLevel,
} from '../types'
import { starProtectionBonus } from '../services/protectionService'

export const CARD_RATIO = { w: 59, h: 86 }

export const ATTRIBUTES: CardAttribute[] = ['林', '泽', '原', '海', '山', '空', '夜', '都']

export const PRESET_IDS = ['classic', 'museum', 'midnight', 'minimal'] as const
export type PresetId = (typeof PRESET_IDS)[number]

/** 类群 → 默认属性 */
const FAMILY_RULES: Array<{ match: RegExp; attribute: CardAttribute }> = [
  { match: /鹭科|鹈形目|鹳科|鹮科|秧鸡科|翠鸟科|佛法僧科/, attribute: '泽' },
  { match: /鸭科|䴙䴘科|鸥科|燕鸥科|鸬鹚科|潜鸟科|鹈鹕科/, attribute: '海' },
  { match: /鹰科|隼科|鹗科/, attribute: '空' },
  { match: /鸱鸮科/, attribute: '夜' },
  { match: /雉科|松鸡科|鸨科|沙鸡科/, attribute: '原' },
  { match: /山雀科|莺科|鸫科|鹟科|绣眼科|雀科|燕科|椋鸟科/, attribute: '林' },
  { match: /岩鹨科|旋木雀科|䴓科|戴菊科/, attribute: '山' },
  { match: /绣眼鸟科城市|麻雀科|鸦科/, attribute: '都' },
]

const ECO_RULES: Array<{ match: string; attribute: CardAttribute }> = [
  { match: '涉禽', attribute: '泽' },
  { match: '游禽', attribute: '海' },
  { match: '猛禽', attribute: '空' },
  { match: '陆禽', attribute: '原' },
  { match: '鸣禽', attribute: '林' },
]

const HABITAT_RULES: Array<{ match: string; attribute: CardAttribute }> = [
  { match: '湿地', attribute: '泽' },
  { match: '湖泊', attribute: '泽' },
  { match: '河流', attribute: '泽' },
  { match: '海岸', attribute: '海' },
  { match: '森林', attribute: '林' },
  { match: '草原', attribute: '原' },
  { match: '农田', attribute: '原' },
  { match: '山地', attribute: '山' },
  { match: '荒漠', attribute: '原' },
  { match: '城市', attribute: '都' },
]

const NOCTURNAL_ORDERS = new Set(['鸮形目'])

export interface AttributeInput {
  orderName?: string | null
  familyName?: string | null
  ecoType?: string | null
  habitats?: string[]
  group?: string | null
}

export function inferAttribute(input: AttributeInput): CardAttribute {
  if (input.orderName && NOCTURNAL_ORDERS.has(input.orderName)) return '夜'

  const family = input.familyName ?? ''
  for (const rule of FAMILY_RULES) {
    if (rule.match.test(family)) return rule.attribute
  }

  const eco = input.ecoType ?? ''
  for (const rule of ECO_RULES) {
    if (eco.includes(rule.match)) return rule.attribute
  }

  const habitats = input.habitats ?? []
  for (const rule of HABITAT_RULES) {
    if (habitats.includes(rule.match)) return rule.attribute
  }

  const group = input.group ?? ''
  if (group.includes('哺乳')) return '原'
  if (group.includes('爬行') || group.includes('两栖')) return '泽'
  if (group.includes('昆虫')) return '林'
  if (group.includes('鱼')) return '海'
  return '林'
}

const IUCN_BASE: Record<string, number> = {
  CR: 7,
  EN: 6,
  VU: 5,
  NT: 3,
  LC: 2,
  DD: 2,
  NE: 1,
}

export interface StarInput {
  iucnStatus?: string | null
  protectionLevel?: ProtectionLevel | null
  isSanyou?: boolean
  photoCount: number
  isFirstRecord?: boolean
  wishlistAchieved?: boolean
}

export interface DerivedValue {
  value: number
  detail: string
}

export function computeStars(input: StarInput): DerivedValue {
  const base = IUCN_BASE[input.iucnStatus ?? 'NE'] ?? 2
  const protection = starProtectionBonus(input.protectionLevel ?? null, Boolean(input.isSanyou))
  const count = input.photoCount
  let countBonus = 0
  if (count <= 0) countBonus = 0
  else if (count === 1) countBonus = 2
  else if (count <= 3) countBonus = 1
  else if (count >= 10) countBonus = -1

  const first = input.isFirstRecord ? 1 : 0
  const wish = input.wishlistAchieved ? 1 : 0
  const raw = base + protection + countBonus + first + wish
  const value = Math.max(1, Math.min(10, Math.round(raw * 2) / 2))

  const detail = [
    `IUCN ${input.iucnStatus ?? 'NE'} +${base}`,
    protection ? `保护 +${protection}` : '保护 +0',
    countBonus ? `记录修正 ${countBonus > 0 ? '+' : ''}${countBonus}` : '记录修正 0',
    first ? '首次记录 +1' : null,
    wish ? '想拍达成 +1' : null,
  ]
    .filter(Boolean)
    .join(' / ')

  return { value, detail }
}

export interface ValueInput {
  stars: number
  protectionLevel?: ProtectionLevel | null
  photoCount: number
  fiveStarCount: number
  profileCompleteness: number
  hasBehaviorShot: boolean
}

export function computeAtk(input: ValueInput): DerivedValue {
  const protectionBonus =
    input.protectionLevel === '国家一级' ? 500 : input.protectionLevel === '国家二级' ? 300 : 0
  const penalty = 50 * Math.min(input.photoCount, 6)
  const raw = input.stars * 300 + protectionBonus - penalty
  return {
    value: Math.max(0, Math.min(4000, Math.round(raw))),
    detail: `星级×300 + 保护 ${protectionBonus} − 记录惩罚 ${penalty}`,
  }
}

export function computeDef(input: ValueInput): DerivedValue {
  const raw =
    input.photoCount * 120 +
    input.fiveStarCount * 200 +
    Math.round(input.profileCompleteness * 800) +
    (input.hasBehaviorShot ? 300 : 0)
  return {
    value: Math.max(0, Math.min(4000, Math.round(raw))),
    detail: '照片×120 + 五星×200 + 完整度×800 + 行为照 300',
  }
}

export function computeRarity(stars: number, holo = false): CardRarity {
  if (stars >= 10) return 'LEGEND'
  if (stars >= 8) return 'UR'
  if (stars >= 6) return 'SR'
  if (stars >= 4) return 'R'
  return holo ? 'R' : 'N'
}

export function buildSerialNo(id: number): string {
  return `BA-${String(id).padStart(4, '0')}`
}

export function defaultBackPrint(): CardBackPrintConfig {
  return {
    aperture: { enabled: false, blades: 9, rotate: 0 },
    focusRing: { enabled: false },
    mount: { enabled: false },
    filmstrip: { enabled: false },
    viewfinder: { enabled: false },
    shutter: { enabled: false, density: 8 },
    exifRing: { enabled: false, text: '' },
    bodySilhouette: { enabled: false, kind: 'dslr' },
    intensity: 0.6,
    tone: 'gold',
  }
}

export interface GearAggregate {
  cameraModel: string | null
  lens: string | null
  focalLen: number | null
  aperture: number | null
  shutter: string | null
  iso: number | null
  kind: 'dslr' | 'mirrorless'
}

export function buildBackPrintDefaults(gear: GearAggregate): CardBackPrintConfig {
  const print = defaultBackPrint()
  const hasGear = Boolean(gear.cameraModel || gear.lens)
  print.aperture = { enabled: hasGear, blades: 9, rotate: 0 }
  print.mount = { enabled: hasGear }
  print.focusRing = { enabled: Boolean(gear.focalLen), focal: gear.focalLen ?? undefined }
  print.exifRing = {
    enabled: hasGear,
    text: [
      gear.aperture ? `f/${gear.aperture}` : null,
      gear.shutter ? `${gear.shutter}s` : null,
      gear.iso ? `ISO ${gear.iso}` : null,
      gear.focalLen ? `${Math.round(gear.focalLen)}mm` : null,
    ]
      .filter(Boolean)
      .join(' · '),
  }
  print.bodySilhouette = { enabled: hasGear, kind: gear.kind }
  return print
}

export function buildGearText(gear: GearAggregate): string {
  return [gear.cameraModel, gear.lens].filter(Boolean).join(' · ').slice(0, 40)
}

export function detectBodyKind(cameraModel: string | null): 'dslr' | 'mirrorless' {
  if (!cameraModel) return 'dslr'
  return /Z ?[5-9]|EOS R|A7|A1|A9|X-T|X-H|OM-1|Z ?f|Z ?fc/i.test(cameraModel)
    ? 'mirrorless'
    : 'dslr'
}
