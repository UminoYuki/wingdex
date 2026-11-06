import type { ReactNode } from 'react'
import type { Card } from '../../api/types'
import { usePrefsStore } from '../../store/prefsStore'
import { GameCard, type GameCardData } from '../GameCard'
import { CardBack } from '../CardBack'
import { Card3D, type Card3DExif } from '../Card3D'
import { FieldCard } from './FieldCard'
import { LensBack } from './LensBack'
import { ScrollCard } from './ScrollCard'
import type { BackSkinId, CardSkinId } from './cardSkin'
import { showsFoil } from './cardSkin'

interface SkinFaceProps {
  card: Card
  data: GameCardData
  exif?: Card3DExif | null
  skin: CardSkinId
  backSkin: BackSkinId
  face: 'front' | 'back'
  /** 典藏卡面在编辑器里要接收图层拖拽，浏览场景关掉 */
  designMode?: boolean
}

/** 按当前皮肤选择正面或背面。典藏正面仍走 GameCard，保证和编辑器、导出同一套数据。 */
export function SkinFace({ card, data, exif, skin, backSkin, face, designMode }: SkinFaceProps) {
  if (face === 'back') {
    if (backSkin === 'lens') {
      return <LensBack exif={exif} serialNo={card.serialNo} />
    }
    return <CardBack card={card} cnName={data.cnName} exif={exif ?? {}} />
  }
  if (skin === 'field') return <FieldCard card={card} data={data} />
  if (skin === 'scroll') return <ScrollCard card={card} data={data} />
  return (
    <AtlasFoil holo={showsFoil(card.rarity, card.holo)}>
      <GameCard card={card} data={data} designMode={designMode} />
    </AtlasFoil>
  )
}

/** 典藏正面 / 档案背面保持 Card3D 的默认渲染，其它皮肤作为替换节点。 */
export function useSkinSlots(card: Card, data: GameCardData, exif?: Card3DExif | null): {
  front?: ReactNode
  back?: ReactNode
} {
  const skin = usePrefsStore((state) => state.cardSkin)
  const backSkin = usePrefsStore((state) => state.backSkin)
  return {
    front:
      skin === 'atlas' ? undefined : (
        <SkinFace card={card} data={data} exif={exif} skin={skin} backSkin={backSkin} face="front" />
      ),
    back:
      backSkin === 'archive' ? undefined : (
        <SkinFace card={card} data={data} exif={exif} skin={skin} backSkin={backSkin} face="back" />
      ),
  }
}

export function SkinnedStage({
  card,
  data,
  exif,
  face,
  onFaceChange,
  autoSway,
  className,
}: {
  card: Card
  data: GameCardData
  exif: Card3DExif
  face?: 'front' | 'back'
  onFaceChange?: (face: 'front' | 'back') => void
  autoSway?: boolean
  className?: string
}) {
  const slots = useSkinSlots(card, data, exif)
  return (
    <Card3D
      card={card}
      data={data}
      exif={exif}
      face={face}
      onFaceChange={onFaceChange}
      autoSway={autoSway}
      className={className}
      front={slots.front}
      back={slots.back}
    />
  )
}

function AtlasFoil({ holo, children }: { holo: boolean; children: ReactNode }) {
  return (
    <div className="relative h-full w-full">
      {children}
      {holo ? <span className="wd-foil" aria-hidden /> : null}
    </div>
  )
}
