export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'legend'

export type AchievementCategory =
  | 'collection'
  | 'taxon'
  | 'protection'
  | 'gear'
  | 'time'
  | 'place'
  | 'quality'
  | 'card'
  | 'atlas'

export interface AchievementDef {
  key: string
  name: string
  description: string
  category: AchievementCategory
  tier: AchievementTier
  target: number
  metric: string
  icon: string
}

export const CATEGORY_LABELS: Record<AchievementCategory, string> = {
  collection: '收集之路',
  taxon: '类群探索',
  protection: '守护珍稀',
  gear: '装备战绩',
  time: '时间坚持',
  place: '足迹版图',
  quality: '影像品质',
  card: '卡片工坊',
  atlas: '图鉴经营',
}

export const ACHIEVEMENTS: AchievementDef[] = [
  // 收集之路
  { key: 'first-species', name: '开卷之鸟', description: '录入第一个物种', category: 'collection', tier: 'bronze', target: 1, metric: 'speciesCount', icon: 'feather' },
  { key: 'species-ten', name: '十羽成谱', description: '图鉴收录 10 个物种', category: 'collection', tier: 'bronze', target: 10, metric: 'speciesCount', icon: 'book' },
  { key: 'species-fifty', name: '半个百灵', description: '图鉴收录 50 个物种', category: 'collection', tier: 'silver', target: 50, metric: 'speciesCount', icon: 'book-open' },
  { key: 'species-hundred', name: '百鸟争鸣', description: '图鉴收录 100 个物种', category: 'collection', tier: 'gold', target: 100, metric: 'speciesCount', icon: 'trophy' },
  { key: 'species-three-hundred', name: '观鸟老手', description: '图鉴收录 300 个物种', category: 'collection', tier: 'legend', target: 300, metric: 'speciesCount', icon: 'crown' },
  { key: 'photo-thousand', name: '万次快门', description: '累计导入 1000 张照片', category: 'collection', tier: 'gold', target: 1000, metric: 'photoCount', icon: 'camera' },

  // 类群探索
  { key: 'bird-30', name: '百啭千声', description: '拍到 30 种鸟类', category: 'taxon', tier: 'silver', target: 30, metric: 'birdCount', icon: 'bird' },
  { key: 'mammal-first', name: '兽径初遇', description: '记录第一种哺乳动物', category: 'taxon', tier: 'bronze', target: 1, metric: 'mammalCount', icon: 'paw' },
  { key: 'reptile-first', name: '鳞光一闪', description: '记录第一种爬行动物', category: 'taxon', tier: 'bronze', target: 1, metric: 'reptileCount', icon: 'lizard' },
  { key: 'amphibian-first', name: '雨夜蛙声', description: '记录第一种两栖动物', category: 'taxon', tier: 'bronze', target: 1, metric: 'amphibianCount', icon: 'frog' },
  { key: 'insect-first', name: '微观视界', description: '记录第一种昆虫', category: 'taxon', tier: 'bronze', target: 1, metric: 'insectCount', icon: 'bug' },
  { key: 'fish-first', name: '临水观鳞', description: '记录第一种鱼类', category: 'taxon', tier: 'bronze', target: 1, metric: 'fishCount', icon: 'fish' },
  { key: 'family-ten', name: '科级图谱', description: '覆盖 10 个科', category: 'taxon', tier: 'silver', target: 10, metric: 'familyCount', icon: 'sitemap' },

  // 守护珍稀
  { key: 'iucn-vu', name: '易危之影', description: '记录一种 IUCN 易危物种', category: 'protection', tier: 'silver', target: 1, metric: 'vuCount', icon: 'shield-vu' },
  { key: 'iucn-en', name: '濒危之诺', description: '记录一种 IUCN 濒危物种', category: 'protection', tier: 'gold', target: 1, metric: 'enCount', icon: 'shield-en' },
  { key: 'iucn-cr', name: '极危守望', description: '记录一种极危物种', category: 'protection', tier: 'legend', target: 1, metric: 'crCount', icon: 'shield-cr' },
  { key: 'national-first', name: '国一之重', description: '记录一种国家一级保护动物', category: 'protection', tier: 'legend', target: 1, metric: 'national1Count', icon: 'shield-1' },
  { key: 'national-second', name: '国二之光', description: '记录 3 种国家二级保护动物', category: 'protection', tier: 'gold', target: 3, metric: 'national2Count', icon: 'shield-2' },
  { key: 'sanyou-ten', name: '三有名录', description: '记录 10 种「三有」物种', category: 'protection', tier: 'silver', target: 10, metric: 'sanyouCount', icon: 'shield-leaf' },

  // 装备战绩
  { key: 'gear-first', name: '初握长焦', description: '首张带完整 EXIF 的照片入库', category: 'gear', tier: 'bronze', target: 1, metric: 'exifPhotoCount', icon: 'camera' },
  { key: 'gear-bodies', name: '机身收藏家', description: '使用过 3 台机身', category: 'gear', tier: 'silver', target: 3, metric: 'cameraCount', icon: 'bodies' },
  { key: 'gear-lenses', name: '镜头行囊', description: '使用过 5 支镜头', category: 'gear', tier: 'silver', target: 5, metric: 'lensCount', icon: 'lens' },
  { key: 'gear-600', name: '长焦狙击', description: '用 600mm 以上焦段拍到 10 个物种', category: 'gear', tier: 'gold', target: 10, metric: 'tele600Species', icon: 'tele' },

  // 时间坚持
  { key: 'streak-3', name: '三日出勤', description: '连续拍摄 3 天', category: 'time', tier: 'bronze', target: 3, metric: 'streakMax', icon: 'flame' },
  { key: 'streak-7', name: '一周不辍', description: '连续拍摄 7 天', category: 'time', tier: 'silver', target: 7, metric: 'streakMax', icon: 'calendar' },
  { key: 'streak-30', name: '月度全勤', description: '连续拍摄 30 天', category: 'time', tier: 'legend', target: 30, metric: 'streakMax', icon: 'crown-time' },
  { key: 'dawn-patrol', name: '晨昏守候', description: '在清晨 4–8 点拍摄 30 次', category: 'time', tier: 'silver', target: 30, metric: 'dawnCount', icon: 'sunrise' },
  { key: 'night-owl', name: '夜行观察者', description: '记录 3 种鸮形目或夜行物种', category: 'time', tier: 'gold', target: 3, metric: 'nocturnalCount', icon: 'moon' },

  // 足迹版图
  { key: 'place-first', name: '第一处据点', description: '建立第一个拍摄地点', category: 'place', tier: 'bronze', target: 1, metric: 'placeCount', icon: 'pin' },
  { key: 'place-ten', name: '十方足迹', description: '积累 10 个拍摄地点', category: 'place', tier: 'gold', target: 10, metric: 'placeCount', icon: 'map' },

  // 影像品质
  { key: 'five-star-first', name: '满意之作', description: '打出一张五星照片', category: 'quality', tier: 'bronze', target: 1, metric: 'fiveStarCount', icon: 'star' },
  { key: 'five-star-twenty', name: '佳作集锦', description: '累计 20 张五星照片', category: 'quality', tier: 'gold', target: 20, metric: 'fiveStarCount', icon: 'stars' },
  { key: 'behavior-shot', name: '行为记录者', description: '记录 5 张取食/求偶/育雏等行为照', category: 'quality', tier: 'silver', target: 5, metric: 'behaviorCount', icon: 'behavior' },

  // 卡片工坊
  { key: 'card-first', name: '首张卡片', description: '生成第一张动物卡', category: 'card', tier: 'bronze', target: 1, metric: 'cardCount', icon: 'card' },
  { key: 'card-decade', name: '卡组初成', description: '卡组达到 10 张', category: 'card', tier: 'silver', target: 10, metric: 'cardCount', icon: 'deck' },
  { key: 'card-ur', name: '闪卡大师', description: '拥有 3 张 UR 及以上稀有度卡片', category: 'card', tier: 'gold', target: 3, metric: 'urCardCount', icon: 'holo' },
  { key: 'card-back', name: '双面收藏家', description: '为 5 张卡配置卡背文字与印花', category: 'card', tier: 'silver', target: 5, metric: 'cardBackCount', icon: 'card-back' },
  { key: 'card-gear', name: '器械印记', description: '10 张卡的卡背带入镜头印花', category: 'card', tier: 'bronze', target: 10, metric: 'cardGearCount', icon: 'aperture' },
  { key: 'card-designer', name: '卡牌设计师', description: '保存 1 个自定义模板', category: 'card', tier: 'silver', target: 1, metric: 'templateCount', icon: 'palette' },

  // 图鉴经营
  { key: 'wishlist-first', name: '心愿清单', description: '把 3 个物种加入想拍清单', category: 'atlas', tier: 'bronze', target: 3, metric: 'wishlistCount', icon: 'list' },
  { key: 'wishlist-achieved', name: '圆梦时刻', description: '完成 5 个想拍目标', category: 'atlas', tier: 'gold', target: 5, metric: 'wishlistAchieved', icon: 'check' },
  { key: 'wiki-complete', name: '资料管家', description: '10 个物种资料完整度 ≥ 80%', category: 'atlas', tier: 'silver', target: 10, metric: 'completeSpeciesCount', icon: 'wiki' },
  { key: 'favorite-ten', name: '心水之选', description: '收藏 10 个物种', category: 'atlas', tier: 'bronze', target: 10, metric: 'favoriteCount', icon: 'heart' },
]

export const ACHIEVEMENT_MAP = new Map(ACHIEVEMENTS.map((item) => [item.key, item]))
export const ACHIEVEMENT_TOTAL = ACHIEVEMENTS.length
