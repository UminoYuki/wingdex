export interface MorphologyResult {
  lengthCm: string | null
  weightG: string | null
  wingspanCm: string | null
  habitats: string[]
  residenceType: string | null
  diet: string | null
  ecoType: string | null
  distribution: string[]
}

const HABITAT_KEYWORDS: Array<{ tag: string; words: string[] }> = [
  { tag: '湿地', words: ['湿地', '沼泽', '滩涂', '泥滩', '河口', 'marsh', 'wetland', 'mudflat'] },
  { tag: '湖泊', words: ['湖泊', '湖面', '池塘', '水库', 'lake', 'pond', 'reservoir'] },
  { tag: '河流', words: ['河流', '溪流', '河岸', '溪涧', 'river', 'stream', 'creek'] },
  { tag: '森林', words: ['森林', '林下', '阔叶林', '针叶林', '树林', '雨林', 'forest', 'woodland'] },
  { tag: '草原', words: ['草原', '草甸', '草地', '牧场', 'grassland', 'meadow', 'steppe', 'prairie'] },
  { tag: '山地', words: ['山地', '高山', '丘陵', '悬崖', '岩壁', 'mountain', 'alpine', 'cliff'] },
  { tag: '海岸', words: ['海岸', '海滨', '近海', '海洋', '海岛', 'coast', 'marine', 'seashore'] },
  { tag: '农田', words: ['农田', '稻田', '耕地', '果园', 'farmland', 'paddy', 'orchard', 'field'] },
  { tag: '荒漠', words: ['荒漠', '沙漠', '戈壁', 'desert', 'gobi'] },
  { tag: '城市', words: ['城市', '公园', '居民区', '城镇', 'urban', 'park', 'garden', 'town'] },
]

const RESIDENCE_RULES: Array<{ value: string; words: string[] }> = [
  { value: '留鸟', words: ['留鸟', 'resident'] },
  { value: '夏候鸟', words: ['夏候鸟', '夏季繁殖', 'summer visitor'] },
  { value: '冬候鸟', words: ['冬候鸟', '越冬', 'winter visitor'] },
  { value: '旅鸟', words: ['旅鸟', '过境', 'passage migrant'] },
  { value: '迷鸟', words: ['迷鸟', 'vagrant'] },
]

const ECO_RULES: Array<{ value: string; words: string[] }> = [
  { value: '涉禽', words: ['涉禽', '涉水', 'wader', 'wading'] },
  { value: '游禽', words: ['游禽', '潜水', '水面游弋', 'waterfowl', 'diving'] },
  { value: '猛禽', words: ['猛禽', '捕食鼠', '猛禽类', 'raptor', 'bird of prey'] },
  { value: '陆禽', words: ['陆禽', '地栖', 'ground-dwelling', 'terrestrial'] },
  { value: '攀禽', words: ['攀禽', '攀爬', '树栖', 'climbing'] },
  { value: '鸣禽', words: ['鸣禽', '鸣叫', 'songbird', 'passerine'] },
]

const DIET_RULES: Array<{ value: string; words: string[] }> = [
  { value: '鱼虾', words: ['鱼', '虾', 'fish', 'shrimp', 'crustacean', 'amphibian'] },
  { value: '昆虫', words: ['昆虫', '幼虫', 'insect', 'larva', 'arthropod'] },
  { value: '种子果实', words: ['种子', '果实', '浆果', '谷物', 'seed', 'fruit', 'berry', 'grain', 'nectar'] },
  { value: '啮齿类', words: ['鼠', '啮齿', 'rodent', 'vole', 'mammal'] },
  { value: '腐肉', words: ['腐肉', '尸体', 'carrion'] },
  { value: '软体动物', words: ['螺', '贝', '软体', 'mollusc', 'shellfish'] },
]

function cleanNumber(raw: string): string {
  return raw
    .replace(/\s+/g, '')
    .replace(/[–—~]/g, '-')
    .replace(/至/g, '-')
}

function extractMeasure(text: string, labels: string[], unitPattern: string): string | null {
  for (const label of labels) {
    const pattern = new RegExp(
      `${label}\\s*(?:约|约为|大约)?\\s*([0-9]+(?:\\s*[-–~至]\\s*[0-9]+(?:\\.[0-9]+)?)?)\\s*(?:${unitPattern})`,
      'i',
    )
    const hit = text.match(pattern)
    if (hit?.[1]) return cleanNumber(hit[1])
  }
  return null
}

function tagFrom(text: string, rules: Array<{ value: string; words: string[] }>): string | null {
  const lower = text.toLowerCase()
  for (const rule of rules) {
    if (rule.words.some((word) => lower.includes(word.toLowerCase()))) return rule.value
  }
  return null
}

function extractHabitats(text: string): string[] {
  const lower = text.toLowerCase()
  const tags: string[] = []
  for (const item of HABITAT_KEYWORDS) {
    if (item.words.some((word) => lower.includes(word.toLowerCase()))) tags.push(item.tag)
  }
  return tags
}

function extractDistribution(text: string): string[] {
  const hit = text.match(/(?:分布于|见于|主要分布(?:于)?)([^。；\n]{2,80})/)
  if (!hit?.[1]) return []
  return hit[1]
    .split(/[、,，与和及]/)
    .map((item) => item.replace(/等地$|等地区$|一带$/, '').trim())
    .filter((item) => item.length >= 2 && item.length <= 12)
    .slice(0, 10)
}

export function parseMorphology(zhText: string, enText = ''): MorphologyResult {
  const text = `${zhText}\n${enText}`
  return {
    lengthCm: extractMeasure(zhText, ['体长'], '厘米|cm'),
    weightG: extractMeasure(zhText, ['体重'], '克|g|千克|kg'),
    wingspanCm: extractMeasure(zhText, ['翼展', '两翼展开'], '厘米|cm'),
    habitats: extractHabitats(text),
    residenceType: tagFrom(text, RESIDENCE_RULES),
    diet: tagFrom(text, DIET_RULES),
    ecoType: tagFrom(text, ECO_RULES),
    distribution: extractDistribution(zhText),
  }
}

export const HABITAT_TAGS = HABITAT_KEYWORDS.map((item) => item.tag)
