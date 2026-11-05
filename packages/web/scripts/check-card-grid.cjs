// 卡面格线/字号静态自检：直接读 cardMetrics.ts 与 GameCard.tsx 的常量，避免手抄数字。
// 运行：npm run check:grid（内部用 tsx 加载 TS 常量）
//
// 守护的不变量（卡面版式按游戏王怪兽卡规格表校准：卡 59×86mm，1mm = 1.1628% 卡高）：
//   1. 卡图窗是 49×49mm 正方（57.0% 卡高 / 83.05% 卡宽）并居中
//   2. 星级是卡名下方独立一行；属性徽记与卡名同行；称号与卡名重复时卡面不重复渲染
//   3. 文本外框是一整个框（19mm）：类型行 / 简介 / 拍摄记录 / ATK·DEF 都在框内且自上而下铺排
//   4. 每个区间（含文本外框整体）装得下内容：字号 × 行数 + 内边距 + 描边 ≤ 区间高度
//   5. 卡名条内部（称号/卡名/学名）不打架
//   6. 每行字数口径与卡宽、服务端 CARD_LINE_CHARS 一致
//   7. 卡包编号浮标压在卡图右下角内侧，不越出卡图、不压文本框
const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '../../..')
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8')

function loadWebMetrics() {
  try {
    return require(path.join(root, 'packages/web/src/card/cardMetrics.ts'))
  } catch (error) {
    throw new Error(`无法加载 cardMetrics.ts：${error.message}（本脚本需用 tsx 运行：npm run check:grid）`)
  }
}

function loadServerLineChars() {
  try {
    return require(path.join(root, 'packages/server/src/config.ts')).CARD_LINE_CHARS
  } catch {
    const source = read('packages/server/src/config.ts')
    const block = source.slice(source.indexOf('CARD_LINE_CHARS'))
    return {
      effect: Number(/effect:\s*(\d+)/.exec(block)[1]),
      record: Number(/record:\s*(\d+)/.exec(block)[1]),
    }
  }
}

const metrics = loadWebMetrics()
const {
  ART_ASPECT,
  ART_INSET,
  ART_WIDTH,
  ATTRIBUTE_BADGE,
  CARD_BORDER,
  CARD_PADDING,
  CARD_RADIUS,
  CARD_RATIO,
  CARD_REGIONS,
  FRAME_LINE,
  FRAME_LINE_RADIUS,
  HEADER_OFFSETS,
  TEXT_BOX_INSET,
  TEXT_BOX_PADDING,
  TEXT_INSET,
  TEXT_METRICS,
} = metrics
const serverLineChars = loadServerLineChars()
const gameCard = read('packages/web/src/card/GameCard.tsx')
/** 卡框圆角出现在卡面 / 卡背 / 3D / 闪膜 / 自由图层 / 主题解析 / 编辑器网格等多处，全部必须取自 CARD_RADIUS */
const radiusFiles = [
  'packages/web/src/card/CardBack.tsx',
  'packages/web/src/card/Card3D.tsx',
  'packages/web/src/card/CardLayers.tsx',
  'packages/web/src/card/HoloLayer.tsx',
  'packages/web/src/card/resolveCardStyle.ts',
  'packages/web/src/editor/EditorCanvas.tsx',
].map((file) => ({ file, source: read(file) }))

const failures = []
const checks = []
const check = (name, pass, detail) => {
  checks.push(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? `  → ${detail}` : ''}`)
  if (!pass) failures.push(name)
}
const round = (v, n = 2) => Number(v.toFixed(n))

/** 卡高换算成 cqw：1% 卡高 = (100 / CARD_RATIO) / 100 卡宽 */
const unitsPerHeightPct = 100 / CARD_RATIO
const regionUnits = (id) => ((CARD_REGIONS[id].bottom - CARD_REGIONS[id].top) / 100) * unitsPerHeightPct
const heightPctToUnits = (pct) => (pct / 100) * unitsPerHeightPct
/** 中文字形墨迹高度约为字号的 0.95（行盒另有半行距） */
const ink = (size) => size * 0.95

/** 从 GameCard.tsx 按正则取实现里的内边距/描边（cqw），避免与实现脱节 */
function pick(pattern, label) {
  const match = pattern.exec(gameCard)
  if (!match) throw new Error(`GameCard.tsx 中未匹配到${label}：${pattern}`)
  return match.slice(1).map(Number)
}

// 文本外框：框体描边 + 框内首行上距（外框顶 → 类型行顶）/ 末行下距（ATK·DEF 底 → 外框底）
const [textBoxBorder] = pick(/absolute border-\[([\d.]+)cqw\]/, '文本外框描边')
const [dividerBorder, dividerGap] = pick(/justify-end gap-\[[\d.]+cqw\] border-t-\[([\d.]+)cqw\] pt-\[([\d.]+)cqw\]/, '框内分隔线')
const boxTopGap = heightPctToUnits(CARD_REGIONS.typeLine.top - CARD_REGIONS.textBox.top)
const boxBottomGap = heightPctToUnits(CARD_REGIONS.textBox.bottom - CARD_REGIONS.values.bottom)

// 1) 卡图窗：与游戏王怪兽卡一致 —— 49×49mm 正方形、占卡高 57.0%、水平居中
const artHeightUnits = regionUnits('art')
check('卡图窗高:宽 = 1:1（卡图规格 49×49mm）', ART_ASPECT === 1, `ART_ASPECT = ${ART_ASPECT}`)
check(
  '卡图窗按比例推导宽度一致',
  Math.abs(artHeightUnits / ART_WIDTH - ART_ASPECT) < 1e-9,
  `实际 ${round(artHeightUnits / ART_WIDTH, 4)}（高 ${round(artHeightUnits)}cqw / 宽 ${round(ART_WIDTH)}cqw）`,
)
check(
  '卡图窗占卡高 57.0%（49mm / 86mm）',
  Math.abs(CARD_REGIONS.art.bottom - CARD_REGIONS.art.top - 57.0) < 0.02,
  `${round(CARD_REGIONS.art.bottom - CARD_REGIONS.art.top)}%`,
)
check('卡图窗占 83.05% 卡宽（49mm / 59mm）', Math.abs(ART_WIDTH - 83.05) < 0.2, `${round(ART_WIDTH)}% 卡宽`)
check('卡图窗水平居中', Math.abs(ART_INSET * 2 + ART_WIDTH - 100) < 1e-9, `左右内缩各 ${round(ART_INSET)}%`)
check('文本外框与卡图左右对齐', TEXT_INSET === ART_INSET, `TEXT_INSET = ART_INSET = ${round(ART_INSET)}%`)
check(
  '框内图层左右内缩 = 外框内缩 + 内边距',
  Math.abs(TEXT_BOX_INSET - (TEXT_INSET + TEXT_BOX_PADDING)) < 1e-9,
  `TEXT_BOX_INSET = ${round(TEXT_BOX_INSET)}%`,
)
const boxInsetCount = (gameCard.match(/TEXT_BOX_INSET/g) ?? []).length
check(
  '框内四行都按 TEXT_BOX_INSET 内缩',
  boxInsetCount >= 4 && !/layer\('(typeLine|effect|record)'\)[\s\S]{0,200}TEXT_INSET%/.test(gameCard),
  `引用 ${boxInsetCount} 处`,
)

// 1b) 卡框三层（底色 / 外描边 / 内细线）圆角同心：内层圆角 = 外层圆角 − 内缩，否则四角会出现错位缺口
check(
  '卡框内细线圆角与外框同心',
  Math.abs(FRAME_LINE_RADIUS - Math.max(0, CARD_RADIUS - FRAME_LINE.inset)) < 1e-9,
  `CARD_RADIUS ${CARD_RADIUS} − inset ${FRAME_LINE.inset} → ${round(FRAME_LINE_RADIUS)}cqw`,
)
check(
  '内细线不被外描边压住',
  FRAME_LINE.inset > CARD_BORDER,
  `内缩 ${FRAME_LINE.inset}cqw > 外描边 ${CARD_BORDER}cqw`,
)
// 1c) 直角：真实游戏王卡四角 90°，卡面任何一层都不许再手写圆角（属性徽记是圆，例外）
const handWrittenRadius = [
  { file: 'GameCard.tsx', source: gameCard },
  ...radiusFiles,
].filter(({ source }) => /rounded-\[[\d.]+cqw\]/.test(source))
check(
  '卡片四角是直角（真实游戏王卡为 90°）',
  CARD_RADIUS === 0 && FRAME_LINE_RADIUS === 0 && !/rounded-\[[\d.]+cqw\]/.test(gameCard),
  `CARD_RADIUS ${CARD_RADIUS} / FRAME_LINE_RADIUS ${FRAME_LINE_RADIUS}cqw：卡面 / 卡背 / 3D 薄片 / 闪膜 / 自由图层 / 编辑器网格全部直角`,
)
check(
  '卡框各层圆角都取自常量（无手写半径）',
  /FRAME_LINE_RADIUS/.test(gameCard) && /CARD_RADIUS/.test(gameCard) && handWrittenRadius.length === 0,
  handWrittenRadius.length
    ? `仍写死圆角：${handWrittenRadius.map((item) => item.file).join(', ')}`
    : '卡面 / 卡背 / 3D 薄片 / 闪膜 / 自由图层 / 主题解析 / 编辑器网格都走 CARD_RADIUS 与 FRAME_LINE_RADIUS',
)
check(
  '卡背内板与外框同心',
  (() => {
    const back = radiusFiles.find((item) => item.file.endsWith('CardBack.tsx')).source
    return /FRAME_LINE_RADIUS/.test(back) && /FRAME_LINE\.inset/.test(back)
  })(),
  '卡背内板 inset/radius 与卡面同源，翻面后四角不会出现错位缺口',
)

// 1d) 文本纸面：真实游戏王卡无论卡框配色，下半部恒为米色纸 + 深墨字（预设只改卡框，不改纸面字色）
const presets = read('packages/web/src/card/presets.ts')
check(
  '文本框是米色纸面 + 墨色字',
  /PAPER\.face/.test(gameCard) &&
    /PAPER\.edge/.test(gameCard) &&
    /ink\.(type|effect|record|value|label|rule)/.test(gameCard),
  '纸面 PAPER.face 铺底、PAPER.edge 描边，框内四行文字取 resolved.front.ink（各层 overrides.color 优先）',
)
check(
  '预设只改卡框配色，不给文本框指定浅色字',
  !/effect:\s*\{[^}]*color:/.test(presets),
  '纸面恒定米色，浅色字会看不清；预设改的是 name / title / frame',
)

// 1e) 3D 纸厚薄片：必须挂在「所属那一面」的面容器里，且那一面必须是平面。
// 挂在外层容器上（或面容器带 preserve-3d）时，翻面后薄片的纵深会被一起翻转而跑到卡面**前面**：
// 卡面被压暗一大截，左上角还多出一条错位的深色边——就是「重影」。
const card3d = read('packages/web/src/card/Card3D.tsx')
const paperSlices = (card3d.match(/<PaperSlices \/>/g) ?? []).length
const faceStyles = [...card3d.matchAll(/style=\{\{([^}]*backfaceVisibility: 'hidden'[^}]*)\}\}/g)].map((m) => m[1])
check(
  '纸厚薄片挂在各自那一面内（随该面一起 backface 隐藏）',
  paperSlices === 2 && faceStyles.length === 2,
  `两面各挂一套薄片：<PaperSlices /> ${paperSlices} 处 / 带 backface 的面容器 ${faceStyles.length} 个`,
)
check(
  '正反面容器是平面（不带 preserve-3d）',
  faceStyles.length === 2 && faceStyles.every((style) => !/preserve-3d/.test(style)),
  faceStyles.some((style) => /preserve-3d/.test(style))
    ? '带 preserve-3d 时 backface-visibility 只管该元素自身，薄片会漏出来压暗卡面'
    : '整面（含薄片）收成同一平面，翻面时一起隐藏',
)
check(
  '纸厚薄片只用平面偏移（不用 translateZ）',
  /const PAPER_SLICES = \[[\s\S]*?\] as const/.test(card3d) && !/translateZ/.test(card3d),
  'flatten 后的面里 translateZ 无效，且纵深一旦被翻面翻转就会浮到卡面前面',
)

// 1f) 卡图取图档位：渲染宽度 × 2 × 放大倍率，小图走缩略图、大图按宽度取原图切片（照片不清的主要来源）
check(
  '卡图按渲染宽度分档取图（含原图切片）',
  /artSourceNeed\(/.test(gameCard) &&
    /mediaUrl\.thumb\(photoId, 1600\)/.test(gameCard) &&
    /mediaUrl\.full\(photoId, need\)/.test(gameCard),
  '≤240 / 640 / 1600 走缩略图档，更大按宽度取服务端原图切片（jpeg q88），不再固定用 640 缩略图撑大图',
)
check(
  '详情页 3D 缩放传进卡面（放大后重新取高清源图）',
  /<GameCard[^>]*renderScale=\{zoom\}/.test(card3d) && /renderScale\?: number/.test(gameCard),
  'transform: scale() 不改变实测宽度，滚轮放大后卡图必须按实际像素加档，否则越放越糊',
)

// 2) 星级是卡名下方独立一行（真实游戏王卡版式）
check(
  '星级独立成行且在卡名之下',
  CARD_REGIONS.stars.top >= CARD_REGIONS.name.bottom && CARD_REGIONS.stars.bottom <= CARD_REGIONS.art.top,
  `name ${CARD_REGIONS.name.top}–${CARD_REGIONS.name.bottom}% → stars ${CARD_REGIONS.stars.top}–${CARD_REGIONS.stars.bottom}% → art ${CARD_REGIONS.art.top}%`,
)
check(
  '属性徽记与卡名同行',
  CARD_REGIONS.name.top === CARD_REGIONS.attribute.top && CARD_REGIONS.name.bottom === CARD_REGIONS.attribute.bottom,
  `name/attribute ${CARD_REGIONS.name.top}–${CARD_REGIONS.name.bottom}%`,
)
check(
  '星级字号容得下',
  TEXT_METRICS.starSize <= regionUnits('stars'),
  `${TEXT_METRICS.starSize}cqw ≤ 星级区 ${round(regionUnits('stars'))}cqw`,
)
check(
  '称号与卡名重复时不重复渲染',
  /showTitle/.test(gameCard) && /titleText !== resolved\.texts\.name\.trim\(\)/.test(gameCard),
  '称号等于卡名时卡面只留卡名（编辑器内仍可见）',
)

// 3) 区域纵向顺序：文本外框是容器，与相邻区间不交叉；框内四行按序铺满
//    称号按游戏王卡版式写在卡名条之内（卡名之上），故不进入「互不交叉」序列，另外单查包含关系。
const order = ['name', 'stars', 'art', 'textBox', 'footer']
const sorted = order.map((id) => ({ id, ...CARD_REGIONS[id] })).sort((a, b) => a.top - b.top)
const overlaps = sorted.filter((region, index) => index > 0 && region.top < sorted[index - 1].bottom).map((r) => r.id)
check(
  '外层区间按顺序排布不交叉',
  overlaps.length === 0,
  overlaps.length ? overlaps.join(', ') : `格线自 0% 递增到 ${CARD_REGIONS.footer.bottom}%`,
)
check('页脚不越界', CARD_REGIONS.footer.bottom <= 100, `底部 ${CARD_REGIONS.footer.bottom}%`)
check(
  '称号在卡名条之内（写在卡名之上）',
  CARD_REGIONS.title.top >= CARD_REGIONS.name.top && CARD_REGIONS.title.bottom <= CARD_REGIONS.name.bottom,
  `title ${CARD_REGIONS.title.top}–${CARD_REGIONS.title.bottom}% ⊂ name ${CARD_REGIONS.name.top}–${CARD_REGIONS.name.bottom}%`,
)

// 3b) 卡包编号浮标（对应游戏王卡卡图右下角的卡包编号）：压在卡图右下角内侧
check(
  '卡包编号压在卡图右下角内侧',
  CARD_REGIONS.packCode.top >= CARD_REGIONS.art.top &&
    CARD_REGIONS.packCode.bottom <= CARD_REGIONS.art.bottom &&
    CARD_REGIONS.packCode.bottom <= CARD_REGIONS.textBox.top,
  `packCode ${CARD_REGIONS.packCode.top}–${CARD_REGIONS.packCode.bottom}% 落在卡图 ${CARD_REGIONS.art.top}–${CARD_REGIONS.art.bottom}% 内且不压文本框（${CARD_REGIONS.textBox.top}%）`,
)
check(
  '卡包编号不参与外层区间排布',
  !order.includes('packCode'),
  '它有意压在卡图右下角，不能混进「不交叉」自检的区间序列',
)
check(
  '卡包编号画在纸面之后（不被文本框盖住）',
  gameCard.indexOf("layer('packCode')") > gameCard.indexOf('data-card="textbox"'),
  'packCode 图层排在纸面/文本框之后，压在卡图之上仍可见',
)
check(
  '卡包编号自带深色描边（压在明暗不定的照片上也读得清）',
  /PACK_CODE_SHADOW/.test(gameCard) && /textShadow:\s*PACK_CODE_SHADOW/.test(gameCard),
  '浅字 + 深描边，同游戏王卡卡包编号的印法',
)
check(
  '卡包编号靠卡图右边内侧',
  new RegExp(`layer\\('packCode'\\)[\\s\\S]{0,200}?right: \`\\$\\{ART_INSET`).test(gameCard),
  `右内缩由 ART_INSET（${round(ART_INSET)}%）推导，不手写数字`,
)

const innerOrder = ['typeLine', 'effect', 'record', 'values']
const innerOutside = innerOrder.filter(
  (id) => CARD_REGIONS[id].top < CARD_REGIONS.textBox.top || CARD_REGIONS[id].bottom > CARD_REGIONS.textBox.bottom,
)
check(
  '类型行 / 简介 / 拍摄记录 / ATK·DEF 都在文本外框内',
  innerOutside.length === 0,
  innerOutside.length
    ? `越界：${innerOutside.join(', ')}`
    : `textBox ${CARD_REGIONS.textBox.top}–${CARD_REGIONS.textBox.bottom}%，框内 ${innerOrder.map((id) => `${id} ${CARD_REGIONS[id].top}–${CARD_REGIONS[id].bottom}%`).join(' → ')}`,
)
const innerSorted = innerOrder.map((id) => ({ id, ...CARD_REGIONS[id] })).sort((a, b) => a.top - b.top)
const innerOverlaps = innerSorted.filter((r, i) => i > 0 && r.top < innerSorted[i - 1].bottom).map((r) => r.id)
check('框内四行不交叉', innerOverlaps.length === 0, innerOverlaps.join(', ') || '类型行 → 简介 → 拍摄记录 → ATK·DEF')
check(
  '拍摄记录紧接简介（不漂在框中间）',
  CARD_REGIONS.record.top === CARD_REGIONS.effect.bottom &&
    /layer\('record'\)[\s\S]{0,240}?regionCap\('record'\)/.test(gameCard) &&
    !/layer\('record'\)[\s\S]{0,240}?(items-end|items-center)/.test(gameCard),
  `简介止于 ${CARD_REGIONS.effect.bottom}%、记录起于 ${CARD_REGIONS.record.top}%：三行文本自上排，留白统一堆在框底分隔线之上（同真实卡）`,
)

// 4) 每个区间都要装得下内容：字号 × 行数 + 内边距 + 描边 ≤ 区间高度
const typeLineNeed = TEXT_METRICS.typeSize * 1.15
const effectNeed = TEXT_METRICS.effectMaxLines * TEXT_METRICS.effectLine
const recordNeed = TEXT_METRICS.recordMaxLines * TEXT_METRICS.recordSize * 1.32
const valuesNeed = TEXT_METRICS.valueSize * 1.15 + dividerBorder + dividerGap
const fits = [
  ['称号 1 行', ink(TEXT_METRICS.titleSize) + heightPctToUnits(HEADER_OFFSETS.title), regionUnits('title')],
  ['卡名 1 行', ink(TEXT_METRICS.nameSize) + heightPctToUnits(HEADER_OFFSETS.name), regionUnits('name')],
  ['属性徽记', ATTRIBUTE_BADGE + heightPctToUnits(HEADER_OFFSETS.attribute), regionUnits('attribute')],
  ['卡包编号浮标 1 行', TEXT_METRICS.packCodeSize * 1.15, regionUnits('packCode')],
  ['类型行 1 行（框内首行，无独立内边距）', typeLineNeed, regionUnits('typeLine')],
  ['物种简介 4 行（框内，无独立内边距）', effectNeed, regionUnits('effect')],
  ['拍摄记录 2 行（框内，无独立内边距）', recordNeed, regionUnits('record')],
  ['分隔线 + ATK·DEF 行', valuesNeed, regionUnits('values')],
  ['页脚', TEXT_METRICS.footerSize * 1.2 + 1, regionUnits('footer')],
]
for (const [label, need, available] of fits) {
  check(`${label}不溢出所属区间`, need <= available, `需要 ${round(need)}cqw ≤ 区间 ${round(available)}cqw`)
}
// 文本外框整体：上距 + 类型行 + 间距 + 简介 + 拍摄记录 + 间距 + 分隔线&ATK·DEF + 下距 + 上下描边
const boxNeed =
  boxTopGap +
  typeLineNeed +
  heightPctToUnits(CARD_REGIONS.effect.top - CARD_REGIONS.typeLine.bottom) +
  effectNeed +
  recordNeed +
  heightPctToUnits(CARD_REGIONS.values.top - CARD_REGIONS.record.bottom) +
  valuesNeed +
  boxBottomGap +
  textBoxBorder * 2
check(
  '文本外框装得下框内全部内容',
  boxNeed <= regionUnits('textBox'),
  `需要 ${round(boxNeed)}cqw ≤ 外框 ${round(regionUnits('textBox'))}cqw（余量 ${round(regionUnits('textBox') - boxNeed)}cqw）`,
)

// 5) 卡名条内部不打架：称号 → 卡名 → 学名 → 卡图
const titleBottom = heightPctToUnits(CARD_REGIONS.title.top + HEADER_OFFSETS.title) + ink(TEXT_METRICS.titleSize)
const nameTop = heightPctToUnits(CARD_REGIONS.name.top + HEADER_OFFSETS.name)
const nameBottom = nameTop + ink(TEXT_METRICS.nameSize)
const scientificTop = heightPctToUnits(CARD_REGIONS.name.bottom - HEADER_OFFSETS.scientific)
const scientificBottom = scientificTop + ink(TEXT_METRICS.scientificSize)
check('称号不与卡名相撞', titleBottom <= nameTop, `称号底 ${round(titleBottom)}cqw ≤ 卡名顶 ${round(nameTop)}cqw`)
check('学名接在卡名之下', scientificTop >= nameBottom, `学名顶 ${round(scientificTop)}cqw ≥ 卡名底 ${round(nameBottom)}cqw`)
check(
  '学名不越过卡图窗',
  scientificBottom <= heightPctToUnits(CARD_REGIONS.art.top),
  `学名底 ${round(scientificBottom)}cqw ≤ 卡图顶 ${round(heightPctToUnits(CARD_REGIONS.art.top))}cqw`,
)

// 6) 行宽与字数口径：卡面与服务端必须一致
const textWidth = 100 - TEXT_BOX_INSET * 2
check(
  '物种简介每行字数口径可用',
  TEXT_METRICS.effectCharsPerLine * TEXT_METRICS.effectSize <= textWidth,
  `${TEXT_METRICS.effectCharsPerLine} 字 × ${TEXT_METRICS.effectSize}cqw = ${round(TEXT_METRICS.effectCharsPerLine * TEXT_METRICS.effectSize)}cqw ≤ 文本宽 ${round(textWidth)}cqw`,
)
check(
  '拍摄记录每行字数口径可用',
  TEXT_METRICS.recordCharsPerLine * TEXT_METRICS.recordSize <= textWidth,
  `${TEXT_METRICS.recordCharsPerLine} 字 × ${TEXT_METRICS.recordSize}cqw = ${round(TEXT_METRICS.recordCharsPerLine * TEXT_METRICS.recordSize)}cqw ≤ 文本宽 ${round(textWidth)}cqw`,
)
check(
  '服务端与前端每行字数一致',
  serverLineChars.effect === TEXT_METRICS.effectCharsPerLine &&
    serverLineChars.record === TEXT_METRICS.recordCharsPerLine,
  `server effect=${serverLineChars.effect}/record=${serverLineChars.record}，web effect=${TEXT_METRICS.effectCharsPerLine}/record=${TEXT_METRICS.recordCharsPerLine}`,
)

// 7) 卡名条左右：卡名不比卡图更靠内，10 字不截断
const nameRightPct = Number(/layer\('name'\)[\s\S]{0,240}?right: '(\d+)%'/.exec(gameCard)[1])
const nameWidth = ((100 - CARD_PADDING - nameRightPct) / 100) * (100 - CARD_PADDING * 2)
check('卡名条比卡图更靠边', CARD_PADDING < ART_INSET, `CARD_PADDING ${CARD_PADDING}% < ART_INSET ${round(ART_INSET)}%`)
check(
  '卡名 10 字不截断',
  TEXT_METRICS.nameSize * 10 <= nameWidth,
  `10 字 ≈ ${round(TEXT_METRICS.nameSize * 10)}cqw（字距收紧后更窄）≤ 可用 ${round(nameWidth)}cqw`,
)

// 8) ATK·DEF 成对右对齐在框内（真实游戏王卡是同一行右端）
const valuesRow = /justify-end gap-\[[\d.]+cqw\][\s\S]{0,1600}?<\/div>/.exec(gameCard)
check(
  'ATK/DEF 成对右对齐在同一行',
  Boolean(valuesRow) && /layer\('atk'\)/.test(valuesRow[0]) && /layer\('def'\)/.test(valuesRow[0]),
  '两个图层都在右对齐的数值行容器内',
)
check(
  'ATK/DEF 参与行内布局（非绝对定位）',
  Boolean(valuesRow) && !/className="absolute[^"]*"[\s\S]{0,120}layer\('(atk|def)'\)/.test(valuesRow[0]) &&
    (valuesRow[0].match(/className="relative flex/g) ?? []).length === 2,
  '两图层均为行内 relative 项',
)

console.log(checks.join('\n'))
console.log(`\n${failures.length === 0 ? '卡面格线自检全部通过' : `卡面格线自检失败 ${failures.length} 项：${failures.join('、')}`}`)
process.exitCode = failures.length === 0 ? 0 : 1
