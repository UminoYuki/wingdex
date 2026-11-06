import { useEffect, useMemo, useState } from 'react'
import { Dices, Printer, Shuffle, SkipBack, SkipForward } from 'lucide-react'
import type { CardListItem } from '../api/types'
import { buildCardData } from './cardPreview'
import { Button, Segmented } from '../components/ui'
import { usePrefsStore } from '../store/prefsStore'
import { BACK_SKINS, CARD_SKINS, DECK_VIEWS, type DeckViewId } from './skins/cardSkin'
import { SkinFace } from './skins/SkinFace'
import { shuffleItems } from './pointerTilt'
import { TiltStage } from './TiltStage'

const BINDER_SLOTS = 9

interface DeckBoardProps {
  cards: CardListItem[]
  onOpen: (id: number) => void
}

function cardData(card: CardListItem) {
  return {
    ...buildCardData(card, { cnName: card.cnName, scientificName: card.scientificName }, null),
    typeLine: [card.group, card.familyName].filter(Boolean).join(' · '),
    photoId: card.photoThumbId ?? card.photoId,
  }
}

/** 卡墙 / 展台 / 卡册。洗牌和抽卡只改变当前浏览顺序。 */
export function DeckBoard({ cards, onOpen }: DeckBoardProps) {
  const deckView = usePrefsStore((state) => state.deckView)
  const setDeckView = usePrefsStore((state) => state.setDeckView)
  const cardSkin = usePrefsStore((state) => state.cardSkin)
  const setCardSkin = usePrefsStore((state) => state.setCardSkin)
  const backSkin = usePrefsStore((state) => state.backSkin)
  const setBackSkin = usePrefsStore((state) => state.setBackSkin)

  const [order, setOrder] = useState<number[]>(() => cards.map((card) => card.id))
  const [stageIndex, setStageIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [page, setPage] = useState(0)

  const signature = cards.map((card) => card.id).join(',')
  useEffect(() => {
    setOrder(signature ? signature.split(',').map((id) => Number(id)) : [])
    setStageIndex(0)
    setFlipped(false)
    setPage(0)
  }, [signature])

  const ordered = useMemo(() => {
    const byId = new Map(cards.map((card) => [card.id, card]))
    const ranked = order.map((id) => byId.get(id)).filter((card): card is CardListItem => Boolean(card))
    const seen = new Set(ranked.map((card) => card.id))
    for (const card of cards) {
      if (!seen.has(card.id)) ranked.push(card)
    }
    return ranked
  }, [cards, order])

  const stageCard = ordered[Math.min(stageIndex, Math.max(ordered.length - 1, 0))] ?? null
  const pageCount = Math.max(1, Math.ceil(ordered.length / BINDER_SLOTS))
  const safePage = Math.min(page, pageCount - 1)
  const pageCards = ordered.slice(safePage * BINDER_SLOTS, safePage * BINDER_SLOTS + BINDER_SLOTS)

  const step = (delta: number) => {
    if (!ordered.length) return
    setStageIndex((index) => (index + delta + ordered.length) % ordered.length)
    setFlipped(false)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="no-print flex flex-wrap items-center gap-2">
        <Segmented
          size="sm"
          value={deckView}
          onValueChange={(value) => setDeckView(value as DeckViewId)}
          options={DECK_VIEWS.map((item) => ({ value: item.id, label: item.label }))}
        />
        <Segmented
          size="sm"
          value={cardSkin}
          onValueChange={setCardSkin}
          options={CARD_SKINS.map((item) => ({ value: item.id, label: item.label }))}
        />
        <Segmented
          size="sm"
          value={backSkin}
          onValueChange={setBackSkin}
          options={BACK_SKINS.map((item) => ({ value: item.id, label: item.label }))}
        />
        {deckView === 'binder' ? (
          <Button size="sm" variant="outline" className="no-print" icon={<Printer className="h-3.5 w-3.5" />} onClick={() => window.print()}>
            打印本页
          </Button>
        ) : null}
      </div>
      <p className="no-print text-micro text-fog-300">
        {CARD_SKINS.find((item) => item.id === cardSkin)?.description}。悬停倾斜并扫光，展台点击或回车翻面。皮肤保存在这台浏览器，不改卡片数据。
      </p>

      {deckView === 'wall' ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-6">
          {ordered.map((card) => (
            <button
              key={card.id}
              type="button"
              onClick={() => onOpen(card.id)}
              className="group flex w-full flex-col items-stretch gap-2 text-left"
            >
              <TiltStage passive maxTilt={8} childrenFront={<SkinFace card={card} data={cardData(card)} skin={cardSkin} backSkin={backSkin} face="front" />} childrenBack={<SkinFace card={card} data={cardData(card)} skin={cardSkin} backSkin={backSkin} face="back" />} />
              <span className="flex items-center justify-between gap-2 px-0.5">
                <span className="truncate text-caption text-fog-100">{card.cnName}</span>
                <span className="shrink-0 text-micro tabular-nums text-fog-300">
                  {card.rarity} · {card.attribute}
                </span>
              </span>
            </button>
          ))}
        </div>
      ) : null}

      {deckView === 'stage' && stageCard ? (
        <div className="grid items-center gap-6 lg:grid-cols-[minmax(0,380px)_1fr]">
          <TiltStage
            className="wd-stage"
            flipped={flipped}
            onFlip={() => setFlipped((value) => !value)}
            maxTilt={14}
            label={`${stageCard.cnName}，${flipped ? '背面' : '正面'}。回车翻面，左右方向键换一张。`}
            onNavigate={step}
            childrenFront={<SkinFace card={stageCard} data={cardData(stageCard)} skin={cardSkin} backSkin={backSkin} face="front" />}
            childrenBack={<SkinFace card={stageCard} data={cardData(stageCard)} skin={cardSkin} backSkin={backSkin} face="back" />}
          />
          <StageControls
            name={stageCard.cnName}
            index={Math.min(stageIndex, ordered.length - 1)}
            total={ordered.length}
            flipped={flipped}
            onFlip={() => setFlipped((value) => !value)}
            onPrev={() => step(-1)}
            onNext={() => step(1)}
            onDraw={() => {
              const next = Math.floor(Math.random() * ordered.length)
              setStageIndex(next)
              setFlipped(false)
            }}
            onShuffle={() => {
              setOrder(shuffleItems(ordered.map((card) => card.id)))
              setStageIndex(0)
              setFlipped(false)
            }}
            onOpen={() => onOpen(stageCard.id)}
          />
        </div>
      ) : null}

      {deckView === 'binder' ? (
        <div className="flex flex-col gap-3">
          <div className="wd-binder" aria-label={`卡册第 ${safePage + 1} 页`}>
            {Array.from({ length: BINDER_SLOTS }, (_, slot) => {
              const card = pageCards[slot]
              if (!card) {
                return (
                  <div
                    key={`empty-${slot}`}
                    className="flex aspect-[59/86] items-center justify-center rounded-md border border-dashed border-line/20 text-micro text-fog-300"
                  >
                    空位 {(safePage * BINDER_SLOTS + slot + 1).toString().padStart(2, '0')}
                  </div>
                )
              }
              return (
                <button key={card.id} type="button" className="w-full text-left" onClick={() => onOpen(card.id)}>
                  <TiltStage
                    passive
                    maxTilt={7}
                    childrenFront={<SkinFace card={card} data={cardData(card)} skin={cardSkin} backSkin={backSkin} face="front" />}
                    childrenBack={<SkinFace card={card} data={cardData(card)} skin={cardSkin} backSkin={backSkin} face="back" />}
                  />
                </button>
              )
            })}
          </div>
          <div className="no-print flex items-center justify-center gap-3 text-caption text-fog-200">
            <Button size="sm" variant="ghost" disabled={safePage <= 0} onClick={() => setPage(safePage - 1)}>
              上一页
            </Button>
            <span className="tabular-nums">
              第 {safePage + 1} / {pageCount} 页
            </span>
            <Button size="sm" variant="ghost" disabled={safePage >= pageCount - 1} onClick={() => setPage(safePage + 1)}>
              下一页
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function StageControls({
  name,
  index,
  total,
  flipped,
  onFlip,
  onPrev,
  onNext,
  onDraw,
  onShuffle,
  onOpen,
}: {
  name: string
  index: number
  total: number
  flipped: boolean
  onFlip: () => void
  onPrev: () => void
  onNext: () => void
  onDraw: () => void
  onShuffle: () => void
  onOpen: () => void
}) {
  return (
    <div className="flex flex-col gap-3">
      <div>
        <h3 className="text-title text-fog-100">{name}</h3>
        <p className="text-caption text-fog-300">
          第 {index + 1} / {total} 张 · {flipped ? '背面' : '正面'}。指针跟随倾斜，点击卡片或按回车翻面。
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" icon={<SkipBack className="h-3.5 w-3.5" />} onClick={onPrev}>
          上一张
        </Button>
        <Button size="sm" variant="outline" icon={<SkipForward className="h-3.5 w-3.5" />} onClick={onNext}>
          下一张
        </Button>
        <Button size="sm" variant="secondary" onClick={onFlip}>
          {flipped ? '翻回正面' : '翻到背面'}
        </Button>
        <Button size="sm" variant="secondary" icon={<Dices className="h-3.5 w-3.5" />} onClick={onDraw}>
          抽一张
        </Button>
        <Button size="sm" variant="ghost" icon={<Shuffle className="h-3.5 w-3.5" />} onClick={onShuffle}>
          洗牌
        </Button>
        <Button size="sm" onClick={onOpen}>
          打开详情
        </Button>
      </div>
    </div>
  )
}
