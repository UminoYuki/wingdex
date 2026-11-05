/** 与 server/src/types.ts 及各路由响应保持一致的领域类型 */

export type FetchStatus = 'pending' | 'ok' | 'failed' | 'partial'

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
  iucnStatus: string | null
  iucnYear: number | null
  cnProtectionLevel: string | null
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

export interface SpeciesWithStats extends Species {
  photoCount: number
  photoIds: number[]
  firstSeenAt: string | null
  lastSeenAt: string | null
  placeNames: string[]
  cameraCount: number
  cardCount: number
  /** 已建卡片的星级，无卡片时为 null */
  stars: number | null
  starScore: number
  starDetail: string
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
  /** 列表接口补充字段 */
  speciesCnName?: string | null
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

/** 卡图裁切：x/y 为归一化焦点（0–1，0.5 为居中），scale 为放大倍数 1–3 */
export interface CardCrop {
  x: number
  y: number
  scale: number
}

/** 图层微调：与 server api/routes/cards.ts 的 layerAdjustSchema 一致 */
export interface CardOverride {
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
export interface CardLayer {
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

export interface CardBackPrint {
  aperture?: { enabled: boolean; blades: 6 | 9; rotate: number }
  focusRing?: { enabled: boolean; focal?: number }
  mount?: { enabled: boolean }
  filmstrip?: { enabled: boolean }
  viewfinder?: { enabled: boolean }
  shutter?: { enabled: boolean; density?: number }
  exifRing?: { enabled: boolean; text?: string }
  bodySilhouette?: { enabled: boolean; kind?: 'dslr' | 'mirrorless' }
  intensity?: number
  tone?: BackPrintTone
}

export type BackPrintTone = 'gold' | 'gunmetal' | 'moss'

export type CardFaces = {
  overrides?: Record<string, CardOverride>
  layers?: CardLayer[]
  backOverrides?: Record<string, CardOverride>
}

export interface Card {
  id: number
  speciesId: number
  title: string | null
  attribute: string
  stars: number
  starsSource: string | null
  atk: number
  def: number
  valueSource: string | null
  rarity: string
  photoId: number | null
  photoCrop: CardCrop
  theme: string | null
  preset: string | null
  templateId: number | null
  overrides: Record<string, CardOverride>
  layers: CardLayer[]
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
  backPrint: CardBackPrint
  backGearText: string | null
  deckId: number | null
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface CardListItem extends Card {
  cnName: string
  scientificName: string | null
  group: string | null
  familyName: string | null
  attributeColorKey: string
  photoThumbId: number | null
}

export interface CardStats {
  total: number
  rarity: Array<{ name: string; count: number }>
  attribute: Array<{ name: string; count: number }>
  group: Array<{ name: string; count: number }>
  deck: Array<{ id: number; name: string; count: number }>
  stars: Array<{ stars: number; count: number }>
  recent: CardListItem[]
}

export interface CardTemplate {
  id: number
  name: string
  preset: string
  overrides: Record<string, CardOverride>
  layers: CardLayer[]
  backConfig: Record<string, unknown>
  previewCardId: number | null
  createdAt: string
  updatedAt: string
}

export interface Deck {
  id: number
  name: string
  description: string | null
  coverCardId: number | null
  sortOrder: number
  createdAt: string
  cardCount?: number
}

export interface CardDefaults {
  card: Partial<Card>
  species: SpeciesWithStats
  photo: Photo | null
  suggested: {
    attribute: string
    stars: number
    atk: number
    def: number
    rarity: string
    title: string
    effectText: string
    recordText: string
    serialNo: string
  }
}

export interface DistributionRow {
  name: string
  species: number
  photos: number
}

export interface GearRow {
  name: string
  photoCount: number
  speciesCount: number
  share: number
}

export interface HeatmapCell {
  date: string
  count: number
}

export interface StatsBundle {
  overview: {
    speciesCount: number
    photoCount: number
    placeCount: number
    familyCount: number
    orderCount: number
    cardCount: number
    wishlistCount: number
    wishlistAchieved: number
    favoriteCount: number
    cameraCount: number
    lensCount: number
    fiveStarCount: number
    fiveStarRate: number
    currentStreak: number
    longestStreak: number
    activeDays: number
    protectionCoverage: { national1: number; national2: number; sanyou: number; iucnThreatened: number }
  }
  groups: DistributionRow[]
  orders: DistributionRow[]
  families: DistributionRow[]
  protections: DistributionRow[]
  residences: DistributionRow[]
  habitats: DistributionRow[]
  cameras: GearRow[]
  lenses: GearRow[]
  monthly: Array<{ month: string; photos: number; species: number }>
  heatmap: HeatmapCell[]
  places: Array<{ id: number | null; name: string; photos: number; species: number; lat: number | null; lon: number | null }>
  recentAchievements: AchievementView[]
  years: number[]
}

export interface AchievementView {
  key: string
  name: string
  description: string
  group: string
  tier: '铜' | '银' | '金' | '传说'
  iconKey: string
  progress: number
  target: number
  unlocked: boolean
  unlockedAt: string | null
}

export interface AchievementGroup {
  key: string
  name: string
  items: AchievementView[]
  unlocked: number
  total: number
}

export interface AchievementSummary {
  unlocked: number
  total: number
  byTier: Record<string, { unlocked: number; total: number }>
  latest: AchievementView | null
}

export interface AchievementsResponse {
  summary: AchievementSummary
  groups: AchievementGroup[]
  items: AchievementView[]
}

export interface SpeciesListResponse {
  items: SpeciesWithStats[]
  total: number
}

export interface PhotoListResponse {
  items: Photo[]
  total: number
}

export interface Facets {
  groups: Array<{ value: string; count: number }>
  orders: Array<{ value: string; count: number }>
  families: Array<{ value: string; count: number }>
  protections: Array<{ value: string; count: number }>
  habitats: Array<{ value: string; count: number }>
  cameras: Array<{ value: string; count: number }>
  lenses: Array<{ value: string; count: number }>
}

export interface WikiCandidate {
  title: string
  description: string | null
  snippet: string | null
  qid: string | null
  lang?: string
}

export interface WikiDetail {
  title: string
  extract: string
  extractEn: string | null
  description?: string | null
  qid: string | null
  wikiUrl: string
  enUrl: string | null
  imageKey: string | null
  scientificName: string | null
  orderName: string | null
  familyName: string | null
  genusName: string | null
  iucnStatus: string | null
  iucnYear: number | null
  distribution?: string[]
  habitats?: string[]
  enName?: string | null
  /** 服务端抓取时被降级的子请求（英文简介 / 维基数据 / 配图） */
  warnings?: string[]
}

export interface Morphology {
  lengthCm: string | null
  weightG: string | null
  wingspanCm: string | null
  source: string | null
  habitats?: string[]
  distribution?: string[]
}

export interface ProtectionMatch {
  level: string | null
  source: string | null
  isSanyou: boolean
}

/** 服务端返回 { text, truncated, chars }；老版本可能是纯字符串 */
export type CardSummary = string | { text: string; truncated: boolean; chars: number }

export function cardSummaryText(value: CardSummary | null | undefined): string {
  if (!value) return ''
  return typeof value === 'string' ? value : value.text ?? ''
}

export interface WikiPreview {
  candidates: WikiCandidate[]
  detail: WikiDetail | null
  morphology: Morphology | null
  cardSummary: CardSummary | null
}

/** 与服务端 scanService.scanDirectory 的返回值一致 */
export interface ScanResult {
  jobId: number
  root: string
  total: number
  imported: number
  duplicated: number
  failed: number
}

export interface ScanStatus {
  running: boolean
  processed: number
  total: number
  startedAt: string | null
  lastResult: ScanResult | null
  latestJob: Record<string, unknown> | null
  jobs: Array<Record<string, unknown>>
}

export interface LibraryRoot {
  id: number
  path: string
  note: string | null
  photoCount: number
  lastScanAt: string | null
}

export interface ExportFile {
  name: string
  size: number
  createdAt: string
  url: string
}

export interface SettingsResponse {
  name: string
  version: string
  dataDir: string
  portableDataDir: boolean
  dbPath: string
  port: number
  host: string
  desktop: boolean
  env: Record<'BA_DATA_DIR' | 'BA_PORT' | 'BA_HOST' | 'BA_USER_AGENT', string | null>
}

export interface HealthResponse {
  ok: boolean
  version: string
  dataDir: string
  counts: { species: number; photos: number; cards: number; places: number }
}

export interface GeoPoint {
  id: number
  name: string
  lat: number
  lon: number
  photos: number
  species: number
}

export interface GeoResponse {
  type: 'FeatureCollection'
  features: Array<{
    type: 'Feature'
    properties: { name: string; iso?: string; id?: string }
    geometry: unknown
  }>
}

/** 卡面文本容量（与服务端 cardRules.ts 一致） */
export const CARD_TEXT_LIMITS = {
  title: 12,
  cnName: 10,
  typeLine: 22,
  effect: 90,
  record: 50,
  effectTotal: 140,
  backText: 20,
} as const
