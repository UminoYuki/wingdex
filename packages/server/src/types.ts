export type TaxonGroup = '鸟纲' | '哺乳纲' | '两栖纲' | '爬行纲' | '昆虫纲' | '鱼纲'

export type IucnStatus = 'LC' | 'NT' | 'VU' | 'EN' | 'CR' | 'EW' | 'EX' | 'DD' | 'NE'

export type ProtectionLevel =
  | '国家一级'
  | '国家二级'
  | '三有'
  | '地方重点'
  | '无'
  | '未知'

export type FetchStatus = 'pending' | 'ok' | 'partial' | 'failed' | 'manual'

export interface Species {
  id: number
  group: string
  cnName: string
  scientificName: string | null
  enName: string | null
  aliases: string[]
  orderName: string | null
  familyName: string | null
  genusName: string | null
  iucnStatus: IucnStatus | null
  iucnYear: number | null
  cnProtectionLevel: ProtectionLevel | null
  cnProtectionSource: string | null
  isSanyou: boolean
  lengthCm: string | null
  weightG: string | null
  wingspanCm: string | null
  morphologySource: string | null
  distribution: string[]
  habitats: string[]
  residenceType: string | null
  diet: string | null
  ecoType: string | null
  summaryZh: string | null
  summaryEn: string | null
  wikiTitle: string | null
  wikiUrl: string | null
  wikiEnUrl: string | null
  qid: string | null
  wikiImageKey: string | null
  imageCredit: string | null
  soundPath: string | null
  videoPath: string | null
  fetchStatus: FetchStatus
  fetchError: string | null
  fetchedAt: string | null
  coverPhotoId: number | null
  isFavorite: boolean
  isWishlist: boolean
  wishNote: string | null
  note: string | null
  tags: string[]
  createdAt: string
}

export interface Photo {
  id: number
  speciesId: number | null
  filePath: string
  fileName: string
  ext: string | null
  fileSize: number | null
  fileMtime: string | null
  hash: string | null
  width: number | null
  height: number | null
  orientation: number | null
  takenAt: string | null
  cameraMake: string | null
  cameraModel: string | null
  lens: string | null
  focalLen: number | null
  focal35: number | null
  aperture: number | null
  shutter: string | null
  iso: number | null
  exposureComp: number | null
  gpsLat: number | null
  gpsLon: number | null
  gpsAlt: number | null
  placeId: number | null
  placeName: string | null
  isFavorite: boolean
  rating: number
  note: string | null
  tags: string[]
  thumbState: string
  importedAt: string
}

export interface Place {
  id: number
  name: string
  lat: number | null
  lon: number | null
  iconKey: string | null
  note: string | null
  useCount: number
  createdAt: string
}

export type CardAttribute = '林' | '泽' | '原' | '海' | '山' | '空' | '夜' | '都'
export type CardRarity = 'N' | 'R' | 'SR' | 'UR' | 'LEGEND'

export interface PhotoCrop {
  x: number
  y: number
  scale: number
}

/** 图层微调：与 api/routes/cards.ts 的 layerAdjustSchema 保持一致 */
export interface CardLayerAdjust {
  visible?: boolean
  locked?: boolean
  order?: number
  dx?: number
  dy?: number
  scale?: number
  rotate?: number
  color?: string | null
  fontScale?: number
  fontWeight?: number
  italic?: boolean
  letterSpacing?: number
  textAlign?: 'left' | 'center' | 'right'
  effects?: {
    shadow?: boolean
    outline?: boolean
    opacity?: number
    gradient?: string | null
  }
  content?: string | null
}

/** 自由元素层：文本 / 贴纸 / 水印 */
export interface CardCustomLayer {
  id: string
  kind: 'text' | 'sticker' | 'watermark'
  content?: string
  assetKey?: string | null
  x: number
  y: number
  dx?: number
  dy?: number
  scale?: number
  rotate?: number
  color?: string | null
  fontSize?: number
  fontWeight?: number
  opacity?: number
  blendMode?: string
  shadow?: boolean
}

export interface CardBackPrintConfig {
  aperture?: { enabled: boolean; blades: 6 | 9; rotate: number }
  focusRing?: { enabled: boolean; focal?: number }
  mount?: { enabled: boolean }
  filmstrip?: { enabled: boolean }
  viewfinder?: { enabled: boolean }
  shutter?: { enabled: boolean; density?: number }
  exifRing?: { enabled: boolean; text?: string }
  bodySilhouette?: { enabled: boolean; kind?: 'dslr' | 'mirrorless' }
  /** 印花整体强度 0.08–0.85 */
  intensity?: number
  /** 印花配色：暗金 / 枪灰 / 苔绿 */
  tone?: 'gold' | 'gunmetal' | 'moss'
}

export interface Card {
  id: number
  speciesId: number
  title: string | null
  attribute: CardAttribute
  stars: number
  starsSource: string | null
  atk: number
  def: number
  valueSource: string | null
  rarity: CardRarity
  photoId: number | null
  photoCrop: PhotoCrop
  theme: string | null
  preset: string | null
  templateId: number | null
  overrides: Record<string, CardLayerAdjust>
  layers: CardCustomLayer[]
  effectText: string | null
  effectSource: 'auto' | 'manual'
  recordText: string | null
  serialNo: string | null
  showScientific: boolean
  showExif: boolean
  holo: boolean
  backTheme: string
  backEmblem: string | null
  backText: string | null
  backPrint: CardBackPrintConfig
  backGearText: string | null
  deckId: number | null
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface CardTemplate {
  id: number
  name: string
  preset: string | null
  overrides: Record<string, CardLayerAdjust>
  layers: CardCustomLayer[]
  backConfig: Record<string, unknown>
  previewCardId: number | null
  useCount: number
  createdAt: string
  updatedAt: string
}

export interface AchievementState {
  key: string
  unlockedAt: string | null
  progress: number
  target: number
  seen: boolean
}

export interface WikiCandidate {
  title: string
  description: string
  url: string
  qid?: string
  thumbnail?: string
}

export interface WikiDetail {
  title: string
  extract: string
  extractEn: string | null
  enTitle: string | null
  qid: string | null
  scientificName: string | null
  enName: string | null
  orderName: string | null
  familyName: string | null
  genusName: string | null
  iucnStatus: string | null
  iucnYear: number | null
  distribution: string[]
  imageKey: string | null
  imageCredit: string | null
  wikiUrl: string
  wikiEnUrl: string | null
  /** 抓取时被降级的子请求（英文简介 / 维基数据 / 配图），前端据此提示缺失项 */
  warnings: string[]
}
