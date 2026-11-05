import { PlaceIcon } from './placeIcons'
import { AttributeIcon, EmblemIcon, RarityIcon } from './cardIcons'
import { ProtectionIcon } from './protectionIcons'
import { AchievementIcon, achievementIcons } from './achievementIcons'
import { printIcons } from './printIcons'
import type { IconProps } from './base'

export { PlaceIcon, AttributeIcon, RarityIcon, EmblemIcon, ProtectionIcon, AchievementIcon }
export { TaxonIcon } from './taxonIcons'
export { GearIcon } from './gearIcons'
export { PrintIcon } from './printIcons'
export { placeIcons } from './placeIcons'
export { gearIcons } from './gearIcons'
export { taxonIcons } from './taxonIcons'
export { achievementIcons } from './achievementIcons'
export { attributeIcons, rarityIcons, emblemIcons } from './cardIcons'
export { printIcons } from './printIcons'
export { protectionIcons } from './protectionIcons'

/** 成就图标选择器选项 */
export const achievementIconKeys = Object.keys(achievementIcons)

/** 卡背纹章选项 */
export const emblemKeys = ['feather', 'rings', 'stars', 'aperture', 'script'] as const

/** 印花元件选项（与服务端 backPrint 子对象一一对应） */
export const printKeys = [
  'aperture',
  'focusRing',
  'mount',
  'filmstrip',
  'viewfinder',
  'shutter',
  'exifRing',
  'bodySilhouette',
] as const

/** 栖息地标签 → 地点图标 */
export function habitatIconKey(habitat: string | null | undefined): string {
  const text = habitat ?? ''
  if (/湿地|沼泽|滩涂|湖泊|水库|稻田|河流|河口/.test(text)) return 'wetland'
  if (/森林|林|灌丛|竹林|雨林/.test(text)) return 'forest'
  if (/山地|高原|岩|崖|丘陵/.test(text)) return 'mountain'
  if (/海岸|海洋|海岛|近海|港湾/.test(text)) return 'coast'
  if (/草原|农田|荒漠|戈壁|草甸/.test(text)) return 'grassland'
  if (/城市|公园|园林|村庄|建筑/.test(text)) return 'urban'
  return 'pin'
}

/** 类群名称 → 类群图标 */
export function taxonIconKey(group: string | null | undefined): string {
  const text = group ?? ''
  if (/鸟/.test(text)) return 'bird'
  if (/兽|哺乳/.test(text)) return 'mammal'
  if (/虫|昆虫|蝶|蜻蜓/.test(text)) return 'insect'
  if (/爬行|龟|蛇|蜥/.test(text)) return 'reptile'
  if (/两栖|蛙|蝾螈/.test(text)) return 'amphibian'
  return 'bird'
}

/** 保护级别 → 盾牌图标 */
export function protectionIconKey(level: string | null | undefined, isSanyou?: boolean): string {
  if (level && /一级|国家一级/.test(level)) return 'national1'
  if (level && /二级|国家二级/.test(level)) return 'national2'
  if (isSanyou || (level && /三有/.test(level))) return 'sanyou'
  if (level && /^(CR|EN|VU|NT|LC|DD)$/i.test(level.trim())) return level.trim().toUpperCase()
  return 'LC'
}

/** 兜底渲染：按 key 依次在成就/印花/纹章中查找 */
export function GenericIcon({ name, ...props }: IconProps & { name: string }) {
  if (name in printIcons) return <PrintIconWrapper name={name} {...props} />
  if (name in achievementIcons) return <AchievementIcon name={name} {...props} />
  return <EmblemIcon name={name} {...props} />
}

function PrintIconWrapper({ name, ...props }: IconProps & { name: string }) {
  const Component = printIcons[name as keyof typeof printIcons]
  return <Component {...props} />
}
