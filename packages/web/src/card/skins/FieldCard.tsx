import type { ReactNode } from 'react'
import type { Card } from '../../api/types'
import type { GameCardData } from '../GameCard'
import { cn } from '../../lib/cn'
import { cardPhotoSrc, habitatVisual, showsFoil } from './cardSkin'
import { rarityLabel } from '../cardTheme'

interface FieldCardProps {
  card: Card
  data: GameCardData
  className?: string
}

function Move({ text, value }: { text: string; value: ReactNode }) {
  if (!text) return null
  return (
    <div className="wd-field-move">
      <p>{text}</p>
      <strong>{value}</strong>
    </div>
  )
}

/** 田野记录卡：栖境色框 + 观察文字。不使用商业卡牌的能量符号或商标。 */
export function FieldCard({ card, data, className }: FieldCardProps) {
  const habitat = habitatVisual(data.attribute ?? card.attribute)
  const photo = cardPhotoSrc(data.photoId ?? card.photoId)
  const foil = showsFoil(card.rarity, card.holo)
  return (
    <article
      className={cn('wd-skin wd-field', className)}
      style={{ background: habitat.frame, color: habitat.ink }}
      data-skin="field"
    >
      {foil ? <span className="wd-foil" aria-hidden /> : null}
      <header className="wd-field-head">
        <span className="wd-field-stage">{rarityLabel(card.rarity)}</span>
        <h3 className="wd-field-name">{data.cnName}</h3>
        <div className="wd-field-stat">
          <b>{card.atk}</b>
          <span>ATK</span>
        </div>
        <span className="wd-field-pip" style={{ background: habitat.pip }} title={data.attribute ?? card.attribute}>
          {data.attribute ?? card.attribute}
        </span>
      </header>
      <div className="wd-field-art">
        {photo ? (
          <img src={photo} alt="" draggable={false} />
        ) : (
          <div className="wd-art-empty">
            <span>生灵图鉴</span>
            <span>尚无卡图</span>
          </div>
        )}
      </div>
      <div className="wd-field-sub">{data.typeLine || data.scientificName || '野外记录'}</div>
      <div className="wd-field-moves">
        <Move text={data.effectText || '还没有物种简介'} value={`DEF ${card.def}`} />
        {data.recordText ? <Move text={data.recordText} value={`${card.stars}★`} /> : null}
      </div>
      <footer className="wd-field-foot">
        <span>
          栖 {data.attribute ?? card.attribute} · 守 {card.def} · ★ {card.stars}
        </span>
        <span>{data.packCode || card.serialNo || 'BA'}</span>
      </footer>
    </article>
  )
}
