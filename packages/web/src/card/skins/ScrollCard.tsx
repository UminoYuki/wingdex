import { useId } from 'react'
import type { Card } from '../../api/types'
import type { GameCardData } from '../GameCard'
import { cn } from '../../lib/cn'
import { cardPhotoSrc, scrollBeadCount, showsFoil } from './cardSkin'
import { rarityLabel } from '../cardTheme'

interface ScrollCardProps {
  card: Card
  data: GameCardData
  className?: string
}

function Bead() {
  const id = `jade-${useId().replace(/:/g, '')}`
  return (
    <svg className="wd-bead" viewBox="0 0 24 32" aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#a7f3d0" />
          <stop offset="45%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#064e3b" />
        </linearGradient>
      </defs>
      <path
        d="M12 2 C18 2 22 6.5 22 12.5 C22 19 17 25 11 30.5 C9.5 32 7.5 31 8.5 29 C10 24.5 12 20 11 17 C10 14 8 13 5 13 C2.5 13 2 11 2 9 C2 4.5 6.5 2 12 2 Z"
        fill={`url(#${id})`}
        stroke="#fef08a"
        strokeWidth="1.1"
      />
      <circle cx="12" cy="9" r="2.1" fill="#064e3b" stroke="#fef08a" strokeWidth="0.6" />
    </svg>
  )
}

/** 卷轴卡：通栏照片、竖题与技能卷。印章文案是图鉴自己的「真鉴」，不借用商业作品名称。 */
export function ScrollCard({ card, data, className }: ScrollCardProps) {
  const photo = cardPhotoSrc(data.photoId ?? card.photoId)
  const beads = scrollBeadCount(card.stars)
  const foil = showsFoil(card.rarity, card.holo)
  const skill = data.effectText || '出没于这一栖境，留下可核对的观察。'
  return (
    <article className={cn('wd-skin wd-scroll', className)} data-skin="scroll">
      <div className="wd-scroll-art">
        {photo ? <img src={photo} alt="" draggable={false} /> : <div className="wd-art-empty">尚无卡图</div>}
        <div className="wd-scroll-scrim" />
      </div>
      {foil ? <span className="wd-foil" aria-hidden /> : null}
      <span className="wd-scroll-corner tl" />
      <span className="wd-scroll-corner tr" />
      <span className="wd-scroll-corner bl" />
      <span className="wd-scroll-corner br" />
      <div className="wd-scroll-seal">{data.attribute ?? card.attribute}</div>
      <div className="wd-scroll-name">
        <span className="wd-scroll-ribbon">{rarityLabel(card.rarity)}</span>
        <h3 className="wd-scroll-title">{data.cnName}</h3>
        <span className="wd-scroll-mark">真鉴</span>
      </div>
      <div className="wd-scroll-beads" title={`${beads} 枚勾玉`}>
        {Array.from({ length: beads }, (_, index) => (
          <Bead key={index} />
        ))}
      </div>
      <div className="wd-scroll-panel">
        <div className="wd-scroll-skill">
          <b>【观察】</b>
          <span>{skill}</span>
        </div>
        {data.recordText ? (
          <div className="wd-scroll-skill">
            <b>【定格】</b>
            <span>{data.recordText}</span>
          </div>
        ) : null}
        <div className="wd-scroll-meta">
          <span>ATK {card.atk} / DEF {card.def}</span>
          <span>{card.serialNo || data.packCode}</span>
        </div>
      </div>
    </article>
  )
}
