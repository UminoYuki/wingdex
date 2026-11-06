export interface TiltSample {
  rx: number
  ry: number
  glareX: number
  glareY: number
  /** 指针在卡片上，闪光应当亮起 */
  active: boolean
}

export const REST_TILT: TiltSample = { rx: 0, ry: 0, glareX: 50, glareY: 50, active: false }

export interface PointerTiltInput {
  clientX: number
  clientY: number
  left: number
  top: number
  width: number
  height: number
  /** 最大倾斜角（度）。展台略大，卡墙略小。 */
  maxTilt: number
  reducedMotion: boolean
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

/**
 * 指针相对卡片中心的倾斜与闪光位置。
 * 减少动态效果时不倾斜、不亮闪光，避免角度卡住或扫光干扰阅读。
 */
export function pointerTilt(input: PointerTiltInput): TiltSample {
  if (input.reducedMotion || input.width <= 0 || input.height <= 0) {
    return REST_TILT
  }
  const x = input.clientX - input.left
  const y = input.clientY - input.top
  const nx = clamp((x - input.width / 2) / (input.width / 2), -1, 1)
  const ny = clamp((y - input.height / 2) / (input.height / 2), -1, 1)
  const maxTilt = Math.max(0, input.maxTilt)
  const ry = nx * maxTilt
  const rx = -ny * maxTilt
  return {
    ry: ry === 0 ? 0 : ry,
    rx: rx === 0 ? 0 : rx,
    glareX: clamp((x / input.width) * 100, 0, 100),
    glareY: clamp((y / input.height) * 100, 0, 100),
    active: true,
  }
}

/** Fisher–Yates。传入 random 以便测试洗牌可复现，不写数据库。 */
export function shuffleItems<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const next = items.slice()
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1))
    const swap = next[i]
    next[i] = next[j] as T
    next[j] = swap as T
  }
  return next
}
