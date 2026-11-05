import { getDb } from '../../db'
import { one, all, type Row } from '../../db/queries'
import { streakFromDays } from '../statsService'

function num(value: unknown): number {
  return value == null ? 0 : Number(value)
}

/** 资料完整度：9 个关键字段，评分 ≥ 0.8 视为完整 */
const COMPLETENESS_PARTS = [
  'scientific_name',
  'order_name',
  'family_name',
  'iucn_status',
  'summary_zh',
  'wiki_image_key',
  'length_cm',
  'habitats',
  'distribution',
]

const COMPLETENESS_SQL = COMPLETENESS_PARTS.map(
  (column) => `(CASE WHEN ${column} IS NOT NULL AND ${column} != '' THEN 1 ELSE 0 END)`,
).join(' + ')

export function computeMetrics(): Record<string, number> {
  const db = getDb()
  const row = one<Row>(
    db,
    `SELECT
      (SELECT COUNT(*) FROM species) AS species_count,
      (SELECT COUNT(*) FROM photos) AS photo_count,
      (SELECT COUNT(DISTINCT family_name) FROM species WHERE family_name IS NOT NULL) AS family_count,
      (SELECT COUNT(*) FROM species WHERE grp = '鸟纲' AND cover_photo_id IS NOT NULL) AS bird_count,
      (SELECT COUNT(*) FROM species WHERE grp = '哺乳纲' AND cover_photo_id IS NOT NULL) AS mammal_count,
      (SELECT COUNT(*) FROM species WHERE grp = '爬行纲' AND cover_photo_id IS NOT NULL) AS reptile_count,
      (SELECT COUNT(*) FROM species WHERE grp = '两栖纲' AND cover_photo_id IS NOT NULL) AS amphibian_count,
      (SELECT COUNT(*) FROM species WHERE grp = '昆虫纲' AND cover_photo_id IS NOT NULL) AS insect_count,
      (SELECT COUNT(*) FROM species WHERE grp = '鱼纲' AND cover_photo_id IS NOT NULL) AS fish_count,
      (SELECT COUNT(*) FROM species WHERE iucn_status = 'VU') AS vu_count,
      (SELECT COUNT(*) FROM species WHERE iucn_status = 'EN') AS en_count,
      (SELECT COUNT(*) FROM species WHERE iucn_status = 'CR') AS cr_count,
      (SELECT COUNT(*) FROM species WHERE cn_protection_level = '国家一级') AS national1_count,
      (SELECT COUNT(*) FROM species WHERE cn_protection_level = '国家二级') AS national2_count,
      (SELECT COUNT(*) FROM species WHERE is_sanyou = 1) AS sanyou_count,
      (SELECT COUNT(*) FROM photos WHERE camera_model IS NOT NULL AND lens IS NOT NULL AND aperture IS NOT NULL) AS exif_photo_count,
      (SELECT COUNT(DISTINCT camera_model) FROM photos WHERE camera_model IS NOT NULL) AS camera_count,
      (SELECT COUNT(DISTINCT lens) FROM photos WHERE lens IS NOT NULL) AS lens_count,
      (SELECT COUNT(DISTINCT species_id) FROM photos WHERE focal_35 >= 600 AND species_id IS NOT NULL) AS tele600_species,
      (SELECT COUNT(*) FROM photos WHERE taken_at IS NOT NULL AND CAST(substr(taken_at, 12, 2) AS INTEGER) BETWEEN 4 AND 8) AS dawn_count,
      (SELECT COUNT(*) FROM species WHERE (order_name = '鸮形目' OR eco_type LIKE '%夜%') AND cover_photo_id IS NOT NULL) AS nocturnal_count,
      (SELECT COUNT(*) FROM places) AS place_count,
      (SELECT COUNT(*) FROM photos WHERE rating >= 5) AS five_star_count,
      (SELECT COUNT(*) FROM photos WHERE tags LIKE '%行为%' OR tags LIKE '%繁殖%' OR tags LIKE '%求偶%' OR tags LIKE '%育雏%' OR tags LIKE '%取食%') AS behavior_count,
      (SELECT COUNT(*) FROM cards) AS card_count,
      (SELECT COUNT(*) FROM cards WHERE rarity IN ('UR', 'LEGEND')) AS ur_card_count,
      (SELECT COUNT(*) FROM cards WHERE (back_text IS NOT NULL AND back_text != '') OR (back_print IS NOT NULL AND back_print NOT IN ('', '{}'))) AS card_back_count,
      (SELECT COUNT(*) FROM cards WHERE back_gear_text IS NOT NULL AND back_gear_text != '') AS card_gear_count,
      (SELECT COUNT(*) FROM card_templates) AS template_count,
      (SELECT COUNT(*) FROM species WHERE is_wishlist = 1) AS wishlist_count,
      (SELECT COUNT(*) FROM species WHERE is_wishlist = 1 AND cover_photo_id IS NOT NULL) AS wishlist_achieved,
      (SELECT COUNT(*) FROM species WHERE (${COMPLETENESS_SQL}) >= 8) AS complete_species_count,
      (SELECT COUNT(*) FROM species WHERE is_favorite = 1) AS favorite_count`,
  )

  const days = all<{ day: string }>(
    db,
    `SELECT DISTINCT substr(taken_at, 1, 10) AS day FROM photos WHERE taken_at IS NOT NULL ORDER BY day ASC`,
  ).map((item) => item.day)
  const { longest } = streakFromDays(days)

  return {
    speciesCount: num(row?.species_count),
    photoCount: num(row?.photo_count),
    familyCount: num(row?.family_count),
    birdCount: num(row?.bird_count),
    mammalCount: num(row?.mammal_count),
    reptileCount: num(row?.reptile_count),
    amphibianCount: num(row?.amphibian_count),
    insectCount: num(row?.insect_count),
    fishCount: num(row?.fish_count),
    vuCount: num(row?.vu_count),
    enCount: num(row?.en_count),
    crCount: num(row?.cr_count),
    national1Count: num(row?.national1_count),
    national2Count: num(row?.national2_count),
    sanyouCount: num(row?.sanyou_count),
    exifPhotoCount: num(row?.exif_photo_count),
    cameraCount: num(row?.camera_count),
    lensCount: num(row?.lens_count),
    tele600Species: num(row?.tele600_species),
    dawnCount: num(row?.dawn_count),
    nocturnalCount: num(row?.nocturnal_count),
    placeCount: num(row?.place_count),
    fiveStarCount: num(row?.five_star_count),
    behaviorCount: num(row?.behavior_count),
    cardCount: num(row?.card_count),
    urCardCount: num(row?.ur_card_count),
    cardBackCount: num(row?.card_back_count),
    cardGearCount: num(row?.card_gear_count),
    templateCount: num(row?.template_count),
    wishlistCount: num(row?.wishlist_count),
    wishlistAchieved: num(row?.wishlist_achieved),
    completeSpeciesCount: num(row?.complete_species_count),
    favoriteCount: num(row?.favorite_count),
    streakMax: longest,
  }
}
