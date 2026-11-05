import { useEffect, useMemo } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import type { Card } from '../api/types'
import { useCard } from '../api/hooks'
import { CardBack } from '../card/CardBack'
import { GameCard } from '../card/GameCard'
import { buildCardData, buildCardExif, composeTypeLine } from '../card/cardPreview'
import { ART_WIDTH, CARD_SIZES, type CardSizeKey } from '../card/cardMetrics'

/**
 * 离屏打印/导出路由：/cards/print/:id?face=front|back&size=lg&rx=0&ry=0&bleed=0&debug=1
 * 无导航与页面内边距，尺寸严格等于档位像素，供 Electron capturePage 截图。
 */
export default function CardPrintPage() {
  const { id } = useParams()
  const [search] = useSearchParams()
  const cardId = Number(id)
  const card = useCard(Number.isInteger(cardId) && cardId > 0 ? cardId : null)

  const face = search.get('face') === 'back' ? 'back' : 'front'
  const sizeKey = (search.get('size') ?? 'lg') as CardSizeKey
  const size = CARD_SIZES[sizeKey] ?? CARD_SIZES.lg
  const bleed = Math.max(0, Number(search.get('bleed') ?? 0))
  const rx = Number(search.get('rx') ?? 0)
  const ry = Number(search.get('ry') ?? 0)
  const debug = search.get('debug') === '1'

  const data = card.data
  const cardData = useMemo(
    () =>
      data
        ? { ...buildCardData(data.card, data.species, data.photo), typeLine: composeTypeLine(data.species) }
        : null,
    [data],
  )

  /**
   * 图片加载完成后再置位，供主进程判断可以截图。
   * 卡图现在按导出档位取原图切片（xl / print 可达 2–3MB），只等固定 240ms 会截到还没解码的空白卡图，
   * 所以这里等所有 <img> 的 load/error 与字体就绪，再多留一帧。
   */
  useEffect(() => {
    const flags = window as unknown as { __cardReady?: boolean }
    flags.__cardReady = false
    if (!data || !cardData) return
    let cancelled = false
    const waitImage = (img: HTMLImageElement) =>
      img.complete
        ? Promise.resolve()
        : new Promise<void>((resolve) => {
            img.addEventListener('load', () => resolve(), { once: true })
            img.addEventListener('error', () => resolve(), { once: true })
          })
    const timer = window.setTimeout(() => {
      const images = Array.from(document.images).map(waitImage)
      Promise.all([...images, document.fonts?.ready ?? Promise.resolve()])
        .then(() => new Promise((resolve) => window.setTimeout(resolve, 120)))
        .then(() => {
          if (!cancelled) flags.__cardReady = true
        })
    }, 240)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [data, cardData, face, sizeKey, rx, ry])

  useEffect(() => {
    document.body.style.margin = '0'
    document.body.style.background = debug ? '#101613' : 'transparent'
  }, [debug])

  if (!data || !cardData) {
    return (
      <div
        className="flex items-center justify-center bg-ink-900 text-caption text-fog-300"
        style={{ width: size.width, height: size.height }}
      >
        卡片渲染中…
      </div>
    )
  }

  const card0: Card = data.card

  return (
    <div
      style={{
        width: size.width + bleed * 2,
        height: size.height + bleed * 2,
        padding: bleed,
        background: debug ? '#101613' : 'transparent',
        perspective: rx || ry ? 1200 : undefined,
      }}
    >
      <div
        style={{
          width: size.width,
          height: size.height,
          transform: rx || ry ? `rotateX(${rx}deg) rotateY(${ry}deg)` : undefined,
          transformStyle: rx || ry ? 'preserve-3d' : undefined,
        }}
      >
        {face === 'front' ? (
          <GameCard
            card={card0}
            data={cardData}
            /* 导出按实际卡图窗像素宽取图：xl / print 档位要原图切片，否则放大就是糊的 */
            artWidthPx={(size.width * ART_WIDTH) / 100}
          />
        ) : (
          <CardBack card={card0} cnName={cardData.cnName} exif={buildCardExif(data.photo)} />
        )}
      </div>
      {debug ? (
        <div className="pointer-events-none fixed left-2 top-2 rounded-sm bg-black/70 px-2 py-1 text-micro text-fog-200">
          {face} · {sizeKey} · {size.width}×{size.height}
          {bleed ? ` · 出血 ${bleed}px` : ''}
        </div>
      ) : null}
    </div>
  )
}

