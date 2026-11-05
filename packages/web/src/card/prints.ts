/** 卡背镜头印花几何：全部为纯函数，输出 0–100 百分比坐标，供 SVG 直接使用 */

export interface Point {
  x: number
  y: number
}

export interface LineSegment {
  x1: number
  y1: number
  x2: number
  y2: number
}

const round = (value: number) => Math.round(value * 100) / 100

/** 光圈叶片多边形路径（以 50,50 为中心，viewBox 0 0 100 100） */
export function apertureBladePaths(blades = 7, radius = 34, innerRadius = 6): string[] {
  const safeBlades = Math.max(5, Math.min(9, Math.round(blades)))
  const step = (Math.PI * 2) / safeBlades

  return Array.from({ length: safeBlades }, (_, index) => {
    const start = index * step
    const end = start + step * 0.92
    const points: Point[] = [
      { x: 50 + Math.cos(start) * radius, y: 50 + Math.sin(start) * radius },
      { x: 50 + Math.cos(end) * radius, y: 50 + Math.sin(end) * radius },
      { x: 50 + Math.cos(end - step * 0.25) * innerRadius, y: 50 + Math.sin(end - step * 0.25) * innerRadius },
      { x: 50 + Math.cos(start - step * 0.25) * innerRadius, y: 50 + Math.sin(start - step * 0.25) * innerRadius },
    ]
    return `${points.map((point, i) => `${i === 0 ? 'M' : 'L'}${round(point.x)},${round(point.y)}`).join(' ')} Z`
  })
}

/** 焦段刻度环：每 30° 一个长刻度，其余为短刻度 */
export function focusTicks(count = 36, radiusInner = 40, radiusOuter = 45): Array<LineSegment & { major: boolean }> {
  const safeCount = Math.max(12, Math.min(72, Math.round(count)))
  return Array.from({ length: safeCount }, (_, index) => {
    const angle = (index / safeCount) * Math.PI * 2 - Math.PI / 2
    const major = index % 6 === 0
    const outer = major ? radiusOuter : radiusOuter - 2
    return {
      x1: round(50 + Math.cos(angle) * radiusInner),
      y1: round(50 + Math.sin(angle) * radiusInner),
      x2: round(50 + Math.cos(angle) * outer),
      y2: round(50 + Math.sin(angle) * outer),
      major,
    }
  })
}

/** 胶片齿孔：左右两侧各一排 */
export function sprocketHoles(count = 14): Point[] {
  const safeCount = Math.max(6, Math.min(40, Math.round(count)))
  const holes: Point[] = []
  for (let index = 0; index < safeCount; index += 1) {
    const y = 6 + (index / (safeCount - 1)) * 88
    holes.push({ x: 4.2, y: round(y) })
    holes.push({ x: 95.8, y: round(y) })
  }
  return holes
}

/** 卡口三爪 */
export function mountClaws(): string[] {
  const blade = (angle: number) => {
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    const p = (r: number, offset = 0) => ({
      x: round(50 + cos * r - sin * offset),
      y: round(50 + sin * r + cos * offset),
    })
    const a = p(14, -3.4)
    const b = p(26, -1.2)
    const c = p(26, 1.2)
    const d = p(14, 3.4)
    return `M${a.x},${a.y} L${b.x},${b.y} L${c.x},${c.y} L${d.x},${d.y} Z`
  }
  return [blade(-Math.PI / 2), blade(Math.PI / 6), blade((Math.PI * 5) / 6)]
}

/** 取景框角标 */
export function viewfinderCorners(length = 12, inset = 8): LineSegment[] {
  const a = inset
  const b = 100 - inset
  return [
    { x1: a, y1: a, x2: a + length, y2: a },
    { x1: a, y1: a, x2: a, y2: a + length },
    { x1: b, y1: a, x2: b - length, y2: a },
    { x1: b, y1: a, x2: b, y2: a + length },
    { x1: a, y1: b, x2: a + length, y2: b },
    { x1: a, y1: b, x2: a, y2: b - length },
    { x1: b, y1: b, x2: b - length, y2: b },
    { x1: b, y1: b, x2: b, y2: b - length },
  ]
}

/** 快门帘幕：竖向条纹 */
export function shutterSlats(count = 18): Array<Point & { width: number }> {
  const safeCount = Math.max(8, Math.min(40, Math.round(count)))
  const step = 100 / safeCount
  return Array.from({ length: safeCount }, (_, index) => ({
    x: round(index * step),
    y: 0,
    width: round(step * 0.42),
  }))
}

/** EXIF 微缩文字环：单行短参数，供卡背光圈外圈环绕文字 */
export function exifRingText(exif: {
  cameraModel?: string | null
  lens?: string | null
  focalLength?: number | null
  aperture?: string | null
  shutter?: string | null
  iso?: number | null
}): string {
  const parts = [
    exif.cameraModel,
    exif.lens,
    exif.focalLength ? `${exif.focalLength}mm` : null,
    exif.aperture ? (String(exif.aperture).startsWith('f/') ? exif.aperture : `f/${exif.aperture}`) : null,
    exif.shutter,
    exif.iso ? `ISO${exif.iso}` : null,
  ].filter(Boolean) as string[]

  return parts.join('  ·  ').slice(0, 72)
}
