/** 卡片尺寸与区域网格的唯一来源：卡面、卡背、3D、导出共用 */

export const CARD_RATIO = 59 / 86

export type CardSizeKey = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'print'

export interface CardSize {
  width: number
  height: number
  label: string
  usage: string
}

export const CARD_SIZES: Record<CardSizeKey, CardSize> = {
  xs: { width: 118, height: 172, label: 'XS', usage: '卡组墙缩略' },
  sm: { width: 295, height: 430, label: 'S', usage: '列表与侧栏' },
  md: { width: 590, height: 860, label: 'M', usage: '卡片详情' },
  lg: { width: 1000, height: 1458, label: 'L', usage: '导出标准' },
  xl: { width: 1500, height: 2187, label: 'XL', usage: '高清导出' },
  print: { width: 2000, height: 2916, label: 'PRINT', usage: '打印拼版源图' },
}

export const CARD_SIZE_KEYS = Object.keys(CARD_SIZES) as CardSizeKey[]

/**
 * 区域网格（纵向百分比，相对卡高）：top/bottom 为上下边界。
 * 数值直接换算自游戏王怪兽卡版面规格表（卡 59×86mm，1mm = 1.1628% 卡高）：
 *   卡名条 7.5mm（1.40–10.12%）、星级行 4.5mm（10.12–15.35%，独立一行右对齐）、
 *   卡图 49×49mm 正方（15.58–72.56% 卡高 → 83.05% 卡宽）、
 *   文本外框 19mm（72.56–94.65%）：真实游戏王卡的类型行、简介、拍摄记录与 ATK/DEF 同在一个框内，
 *   框内自上而下为 类型行 73.00–75.90%、简介 76.15–85.80%（4 行）、拍摄记录 85.80–89.80%（2 行）、
 *   分隔线 + 右对齐 ATK/DEF 90.20–94.10%；卡包编号浮在卡图右下角内侧（69.6–72.2%）；
 *   底部信息栏 3.5mm（95.12–99.19%）：左侧密字卡号、右侧稀有度 / 防伪方标。
 *   框内三行文本一律自上排（贴合上一行），留白统一堆在框底分隔线之上，与真实卡一致。
 * 每个区间的高度都必须容得下对应字号 × 行数（含内边距与描边），改动前先按 cqw 换算核对。
 */
export const CARD_REGIONS = {
  /** 称号（与卡名重复时卡面自动隐藏，真实游戏王卡卡名之上没有文字）：占卡名条上沿 */
  title: { top: 1.4, bottom: 3.4 },
  /** 卡名 + 学名（卡名条 7.5mm） */
  name: { top: 1.4, bottom: 10.12 },
  /** 属性徽记（真实游戏王卡在卡名条右上角，直径 6.5mm） */
  attribute: { top: 1.4, bottom: 10.12 },
  /** 星级（真实游戏王卡是卡名下方独立一行，单颗直径约 4mm，右对齐） */
  stars: { top: 10.12, bottom: 15.35 },
  /** 卡图框（49×49mm 正方 = 57.0% 卡高 × 83.05% 卡宽） */
  art: { top: 15.58, bottom: 72.56 },
  /** 文本外框（非图层，仅作外框装饰与自检基准）：类型行 / 简介 / 拍摄记录 / ATK·DEF 都在框内（19mm） */
  textBox: { top: 72.56, bottom: 94.65 },
  /** 类型行（框内首行，加粗正体） */
  typeLine: { top: 73.0, bottom: 75.9 },
  /** 框内简介（4 行 × effectLine） */
  effect: { top: 76.15, bottom: 85.8 },
  /** 框内拍摄记录（2 行，弱化小字，紧接简介） */
  record: { top: 85.8, bottom: 89.8 },
  /** 框内分隔线 + ATK/DEF 行（右对齐，同真实游戏王卡）：行高 3.7×1.15 + 分隔线 0.25 + 上距 0.5 = 5.01 ≤ 5.69cqw */
  values: { top: 90.2, bottom: 94.1 },
  /** 卡包编号浮标（对应真实游戏王卡卡图右下角的卡包编号，压在卡图右下角内侧） */
  packCode: { top: 69.6, bottom: 72.2 },
  /** 底部信息栏（卡号 / 稀有度，对应真实游戏王卡卡框底部的密字编号与防伪方标）：3.5mm */
  footer: { top: 95.12, bottom: 99.19 },
} as const

/** 卡名条左右内缩（相对卡宽 %）：真实游戏王卡卡名条宽 51mm（左右各留 4mm），比卡图更靠边 */
export const CARD_PADDING = 5.0

/** 属性徽记直径（相对卡宽 cqw）：真实游戏王卡卡名条右上角的属性标直径约 6.5mm */
export const ATTRIBUTE_BADGE = 10.5
/** 卡图窗高:宽 = 1 : 1（真实游戏王卡卡图接近正方形） */
export const ART_ASPECT = 1
/** 卡图窗宽度（相对卡宽 %）：由卡图区域高度与比例推导，不写死左右内缩 */
export const ART_WIDTH = ((CARD_REGIONS.art.bottom - CARD_REGIONS.art.top) / 100 / CARD_RATIO / ART_ASPECT) * 100
/** 卡图窗左右内缩（相对卡宽 %），使卡图窗在卡面水平居中 */
export const ART_INSET = (100 - ART_WIDTH) / 2
/**
 * 卡图窗描边厚度（相对卡宽 %）：真实游戏王卡的深色画框**画在卡图之外**（卡图本身仍是
 * 83.05% × 57.0% 的 49×49mm 方正区域），所以这圈描边用向外扩散的 box-shadow 实现，不占用网格。
 */
export const ART_FRAME = 1.7
/** 文本外框左右内缩（相对卡宽 %）：真实游戏王卡的文字框与卡图左右对齐 */
export const TEXT_INSET = ART_INSET
/** 文本外框内边距（cqw = 卡宽 %） */
export const TEXT_BOX_PADDING = 1.6
/** 框内图层左右内缩（相对卡宽 %）：外框内缩 + 内边距 */
export const TEXT_BOX_INSET = TEXT_INSET + TEXT_BOX_PADDING
/**
 * 卡名条内的层内偏移（相对卡名条上下沿，% 卡高）：
 * 称号下移避开卡框内描边；卡名与属性徽记贴在卡名条上沿；学名贴着卡名条下沿向上收。
 */
export const HEADER_OFFSETS = {
  title: 0.3,
  name: 2.0,
  attribute: 0.75,
  scientific: 1.89,
} as const

/**
 * 卡框圆角（相对卡宽 %）：真实游戏王卡四角是**直角**（90°），所以恒为 0。
 * 卡面 / 卡背 / 3D 纸厚薄片 / 闪膜 / 自由图层 / 主题解析 / 编辑器网格全部取自这里，
 * 卡图窗、文本纸面、页脚徽记也一律直角——只有属性徽记是圆。
 */
export const CARD_RADIUS = 0
/** 描边宽度（相对卡宽 %） */
export const CARD_BORDER = 1.2
/**
 * 卡框内细线（相对卡宽 %）：与外框同心，内圆角 = CARD_RADIUS − inset。
 * 圆角必须同心，否则四个角会出现细线偏离外框的「缺口」观感。
 */
export const FRAME_LINE = { inset: 1.6, width: 0.35 } as const
/** 卡框内细线圆角（相对卡宽 %）：由外框圆角与内缩推导，禁止手写；直角卡不外圆则为 0 */
export const FRAME_LINE_RADIUS = Math.max(0, CARD_RADIUS - FRAME_LINE.inset)
/**
 * 卡框最外圈提亮描边（相对卡宽 %）：描边本身是深色，深色背景（详情页 / 3D 视图）下
 * 四角会与背景糊在一起、看着像被裁掉，加一道极细的亮边把卡片轮廓勾出来。
 */
export const CARD_RIM = 0.12

/**
 * 文本排版（相对卡宽 cqw；lg 档 1cqw = 10px）。
 * 字号按真实游戏王卡密度校准：卡名 ≈ 3.4mm/59mm ≈ 5.8cqw，效果文字 ≈ 1.7mm ≈ 2.9cqw，
 * ATK/DEF ≈ 2.2mm ≈ 3.7cqw，密字编号 ≈ 1.3mm ≈ 2.2cqw，星级单颗直径 ≈ 3.7mm ≈ 6.2cqw；
 * 效果框内宽 79.9cqw，4 行（行高 3.4cqw = 13.6cqw）填满 9.5% 卡高。
 */
export const TEXT_METRICS = {
  titleSize: 2.0,
  nameSize: 6.0,
  /** 学名（贴卡名条下沿的小字） */
  scientificSize: 2.1,
  attributeSize: 3.0,
  /** 星级单颗直径：真实游戏王卡约 4mm，一行 4.5mm 装得下 */
  starSize: 6.2,
  typeSize: 3.0,
  effectSize: 2.9,
  /** 效果框行高：4 × 3.4 = 13.6cqw ≤ effect 区间 9.5% 卡高（13.84cqw） */
  effectLine: 3.4,
  recordSize: 2.1,
  valueSize: 3.7,
  footerSize: 2.2,
  raritySize: 2.0,
  /** 卡包编号浮标（卡图右下角，对应游戏王卡的卡包编号） */
  packCodeSize: 2.4,
  watermarkSize: 2.0,
  placeholderSize: 2.2,
  effectMaxLines: 4,
  recordMaxLines: 2,
  /** 效果框每行可容纳中文字数（文本宽 79.86cqw ÷ 2.9cqw ≈ 27.5，保守取 26；与服务端 CARD_LINE_CHARS 一致） */
  effectCharsPerLine: 26,
  /** 拍摄记录每行可容纳字数口径（文本宽 79.86cqw ÷ 2.1cqw ≈ 38，取 34 留余量；与服务端 CARD_LINE_CHARS 一致） */
  recordCharsPerLine: 34,
} as const

/** 行数截断样式：与 TEXT_METRICS.effectMaxLines / recordMaxLines 同源，避免「校验 4 行、显示被截」 */
export function clampLines(lines: number): {
  display: string
  WebkitBoxOrient: 'vertical'
  WebkitLineClamp: number
  overflow: string
} {
  return { display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: lines, overflow: 'hidden' }
}

/** 按中文字宽估算行数（口径与服务端 cardValidation.estimateLines 一致：中文 1、ASCII 0.55） */
export function estimateLines(text: string | null | undefined, charsPerLine: number): number {
  const clean = (text ?? '').replace(/\r/g, '')
  if (!clean) return 0
  return clean
    .split('\n')
    .map((line) => {
      const weight = [...line].reduce(
        (acc, char) => acc + (/[\u4e00-\u9fa5，。！？；：、（）「」]/.test(char) ? 1 : 0.55),
        0,
      )
      return Math.max(1, Math.ceil(weight / charsPerLine))
    })
    .reduce((acc, value) => acc + value, 0)
}

/**
 * 卡图源图需求宽度（px）：卡图窗渲染宽度 × 2（视网膜屏）× 放大倍率（裁切放大 × 外层 scale，最多 2.2 倍）。
 * ≤ 1600 走缩略图（webp，最长边口径）；更大档位向服务端按宽度取原图切片（jpeg q88），
 * 这样 lg / xl / print 导出与详情页放大都不会拿小缩略图硬撑成糊图。
 * 结果按 10px（缩略图档）/ 100px（原图切片档）取整：服务端切片按需求宽度落盘缓存，
 * 取整后连续缩放（滚轮）才不会攒出一堆几乎一样的缓存文件。
 */
export const THUMB_LADDER = [240, 640, 1600] as const

export function artSourceNeed(artWidthPx: number, renderScale = 1): number {
  const scale = Math.min(2.2, Math.max(1, renderScale))
  const raw = Math.max(0, artWidthPx) * 2 * scale
  if (raw <= THUMB_LADDER[2]) return Math.max(THUMB_LADDER[0], Math.ceil(raw / 10) * 10)
  return Math.min(3000, Math.ceil(raw / 100) * 100)
}

/** 卡面渲染所需的最小数据（避免渲染层依赖完整 Card 类型） */
export interface CardFaceData {
  cnName: string
  scientificName: string | null
  title: string
  attribute: string
  stars: number
  atk: number
  def: number
  rarity: string
  typeLine: string
  effectText: string
  recordText: string
  serialNo: string
  /** 卡包编号浮标（对应游戏王卡卡图右下角的短码）：拍摄日期，无日期时回落卡号 */
  packCode: string
  showScientific: boolean
  showExif: boolean
  holo: boolean
  photoId: number | null
  photoCrop: { x: number; y: number; scale: number } | null
  backText: string
  backTheme: string
  backEmblem: string
}

/** 单行文本按卡宽换算像素（用于画布校验与实际导出字号） */
export function ratioToPx(width: number, ratio: number): number {
  return (width * ratio) / 100
}

/** 卡图裁切：x/y 为归一化焦点（0.5 居中），转换为中心对齐的 CSS transform */
export function cropTransform(crop: CardFaceData['photoCrop']): string {
  if (!crop) return 'scale(1)'
  const scale = Math.min(3, Math.max(1, crop.scale ?? 1))
  const offsetX = (0.5 - crop.x) * 100
  const offsetY = (0.5 - crop.y) * 100
  return `translate(${offsetX.toFixed(2)}%, ${offsetY.toFixed(2)}%) scale(${scale.toFixed(3)})`
}
