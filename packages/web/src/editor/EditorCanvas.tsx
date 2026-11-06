import { useEffect, useMemo, useRef, useState } from 'react'
import type React from 'react'
import type { Card, Photo, Species } from '../api/types'
import { buildCardData, buildCardExif, composeTypeLine } from '../card/cardPreview'
import { GameCard } from '../card/GameCard'
import { CardBack } from '../card/CardBack'
import { Card3D } from '../card/Card3D'
import { CARD_REGIONS, CARD_RATIO } from '../card/cardMetrics'
import { Button, IconButton, Panel, Segmented, Tooltip } from '../components/ui'
import { SkinFace } from '../card/skins/SkinFace'
import { Grid3x3, Maximize2, Minus, Plus, Ruler, AlertTriangle } from 'lucide-react'
import type { CardDraft, DraftIssue } from './draftTypes'
import { draftToCard } from './draftTypes'
import { usePrefsStore } from '../store/prefsStore'
import { BACK_SKINS, CARD_SKINS } from '../card/skins/cardSkin'

/** 图层 → 参考线区域（用于对齐提示） */
const LAYER_REGION: Record<string, { top: number; bottom: number }> = {
  frame: { top: 0, bottom: 100 },
  title: CARD_REGIONS.title,
  name: CARD_REGIONS.name,
  scientific: CARD_REGIONS.name,
  attribute: CARD_REGIONS.attribute,
  stars: CARD_REGIONS.stars,
  art: CARD_REGIONS.art,
  packCode: CARD_REGIONS.packCode,
  typeLine: CARD_REGIONS.typeLine,
  effect: CARD_REGIONS.effect,
  record: CARD_REGIONS.record,
  atk: CARD_REGIONS.values,
  def: CARD_REGIONS.values,
  serial: CARD_REGIONS.footer,
  rarity: CARD_REGIONS.footer,
  watermark: { top: 36, bottom: 50 },
}

type ViewMode = 'front' | 'back' | '3d'

interface EditorCanvasProps {
  card: Card
  species: Pick<Species, 'cnName' | 'scientificName' | 'group' | 'orderName' | 'familyName' | 'ecoType' | 'residenceType'>
  photo: Photo | null
  draft: CardDraft
  activeLayerId: string | null
  onSelectLayer: (id: string | null) => void
  onLayerMove: (id: string, dx: number, dy: number, commit: boolean) => void
  onFlush: () => void
  issues: DraftIssue[]
}

/** 画布：正反面 / 3D 预览、缩放、网格与参考线、图层拖拽 */
export function EditorCanvas({
  card,
  species,
  photo,
  draft,
  activeLayerId,
  onSelectLayer,
  onLayerMove,
  onFlush,
  issues,
}: EditorCanvasProps) {
  const [view, setView] = useState<ViewMode>('front')
  const [zoom, setZoom] = useState(100)
  const [grid, setGrid] = useState(false)
  const [guides, setGuides] = useState(true)
  const [face, setFace] = useState<'front' | 'back'>('front')
  const cardSkin = usePrefsStore((state) => state.cardSkin)
  const backSkin = usePrefsStore((state) => state.backSkin)
  const setCardSkin = usePrefsStore((state) => state.setCardSkin)
  const setBackSkin = usePrefsStore((state) => state.setBackSkin)

  const stageRef = useRef<HTMLDivElement | null>(null)
  const dragRef = useRef<{ id: string; startX: number; startY: number; baseDx: number; baseDy: number } | null>(null)

  const draftCard = useMemo(() => draftToCard(card, draft), [card, draft])
  const cardData = useMemo(
    () => ({
      ...buildCardData(draftCard, species, photo),
      typeLine: draft.overrides.typeLine?.content ?? composeTypeLine(species),
    }),
    [draftCard, species, photo, draft.overrides.typeLine?.content],
  )
  const exif = useMemo(() => buildCardExif(photo), [photo])

  const handleLayerPointerDown = (id: string, event: React.PointerEvent<HTMLDivElement>) => {
    onSelectLayer(id)
    const override = draft.overrides[id]
    if (override?.locked) return
    dragRef.current = {
      id,
      startX: event.clientX,
      startY: event.clientY,
      baseDx: override?.dx ?? 0,
      baseDy: override?.dy ?? 0,
    }
  }

  useEffect(() => {
    const move = (event: PointerEvent) => {
      const drag = dragRef.current
      if (!drag) return
      const width = stageRef.current?.getBoundingClientRect().width ?? 1
      const dx = drag.baseDx + ((event.clientX - drag.startX) / width) * 100
      const dy = drag.baseDy + ((event.clientY - drag.startY) / width) * 100
      const round = (value: number) => Math.round(Math.max(-60, Math.min(60, value)) * 10) / 10
      onLayerMove(drag.id, round(dx), round(dy), false)
    }
    const up = () => {
      if (!dragRef.current) return
      dragRef.current = null
      onFlush()
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
    }
  }, [onLayerMove, onFlush])

  // 画布宽度同时受缩放与可用高度约束，保证整张卡始终完整可见（比例由 aspectRatio 锁定）
  const width = `min(${Math.round(420 * (zoom / 100))}px, calc((100vh - 320px) * ${CARD_RATIO}))`
  const region = activeLayerId ? LAYER_REGION[activeLayerId] : undefined
  const blockIssues = issues.filter((issue) => ['effect', 'record', 'title'].includes(issue.field))

  useEffect(() => {
    if (view === 'front') setFace('front')
    if (view === 'back') setFace('back')
  }, [view])

  return (
    <Panel
      title="画布预览"
      subtitle={view === '3d' ? '拖拽旋转，双击翻面' : '拖拽图层微调位置，方向键 0.5% 步进'}
      actions={
        <Segmented
          size="sm"
          value={view}
          options={[
            { value: 'front', label: '正面' },
            { value: 'back', label: '背面' },
            { value: '3d', label: '3D' },
          ]}
          onValueChange={(value) => setView(value as ViewMode)}
        />
      }
      footer={
        blockIssues.length ? (
          <div className="flex flex-wrap gap-3">
            {blockIssues.map((issue) => (
              <span key={`${issue.field}-${issue.message}`} className="flex items-center gap-1 text-micro text-alert">
                <AlertTriangle className="h-3 w-3" />
                {issue.message}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-micro text-fog-300">
            所有文本都在容量上限内，导出与打印会使用当前画布看到的样式。
          </p>
        )
      }
    >
      <div className="flex flex-col items-center gap-4">
        <div
          className="flex flex-wrap items-center justify-center gap-2"
          onPointerDown={(event) => event.stopPropagation()}
        >
          <Tooltip label="缩小画布">
            <IconButton size="sm" label="缩小" onClick={() => setZoom((value) => Math.max(50, value - 10))}>
              <Minus className="h-3.5 w-3.5" />
            </IconButton>
          </Tooltip>
          <span className="w-12 text-center text-micro tabular-nums text-fog-200">{zoom}%</span>
          <Tooltip label="放大画布">
            <IconButton size="sm" label="放大" onClick={() => setZoom((value) => Math.min(200, value + 10))}>
              <Plus className="h-3.5 w-3.5" />
            </IconButton>
          </Tooltip>
          <Button
            size="sm"
            variant={grid ? 'primary' : 'ghost'}
            icon={<Grid3x3 className="h-3.5 w-3.5" />}
            onClick={() => setGrid((value) => !value)}
          >
            网格
          </Button>
          <Button
            size="sm"
            variant={guides ? 'primary' : 'ghost'}
            icon={<Ruler className="h-3.5 w-3.5" />}
            onClick={() => setGuides((value) => !value)}
          >
            参考线
          </Button>
          <Button size="sm" variant="ghost" icon={<Maximize2 className="h-3.5 w-3.5" />} onClick={() => setZoom(100)}>
            100%
          </Button>
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
        </div>

        <div
          ref={stageRef}
          className="relative select-none"
          style={{
            width,
            aspectRatio: String(CARD_RATIO),
            perspective: view === '3d' ? '1400px' : undefined,
          }}
        >
          {view === '3d' ? (
            <Card3D
              card={draftCard}
              data={cardData}
              exif={exif}
              face={face}
              onFaceChange={setFace}
              autoSway={false}
              className="w-full"
              front={
                cardSkin === 'atlas' ? undefined : (
                  <SkinFace card={draftCard} data={cardData} exif={exif} skin={cardSkin} backSkin={backSkin} face="front" />
                )
              }
              back={
                backSkin === 'archive' ? undefined : (
                  <SkinFace card={draftCard} data={cardData} exif={exif} skin={cardSkin} backSkin={backSkin} face="back" />
                )
              }
            />
          ) : view === 'front' ? (
            <GameCard
              card={draftCard}
              data={cardData}
              designMode
              activeLayerId={activeLayerId}
              onLayerPointerDown={handleLayerPointerDown}
            />
          ) : (
            <CardBack card={draftCard} cnName={species.cnName} exif={exif} />
          )}

          {grid ? (
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(to right, rgba(255,255,255,0.09) 0 1px, transparent 1px 5%), repeating-linear-gradient(to bottom, rgba(255,255,255,0.09) 0 1px, transparent 1px 5%)',
              }}
            />
          ) : null}

          {guides && region ? (
            <>
              <div
                className="pointer-events-none absolute inset-x-0 border-y border-dashed border-plume/60"
                style={{ top: `${region.top}%`, height: `${region.bottom - region.top}%` }}
              />
              <div className="pointer-events-none absolute inset-0 border border-ember/40" />
            </>
          ) : null}
        </div>

        <p className="text-micro text-fog-300">
          当前图层：{activeLayerId ?? '未选中'} · 缩放 {zoom}% · 正面/背面画布固定为典藏卡，便于改图层。3D 预览跟随「
          {CARD_SKINS.find((item) => item.id === cardSkin)?.label} / {BACK_SKINS.find((item) => item.id === backSkin)?.label}
          」，导出 PNG 与打印仍是典藏卡面，不受倾斜和扫光影响。
        </p>
      </div>
    </Panel>
  )
}
