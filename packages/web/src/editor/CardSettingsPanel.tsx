import { Calculator, ImageIcon } from 'lucide-react'
import type { Card, Photo } from '../api/types'
import { mediaUrl } from '../api/client'
import { ART_ASPECT } from '../card/cardMetrics'
import { ATTRIBUTE_KEYS, RARITY_STYLES, type RarityKey } from '../card/cardTheme'
import { Button, Panel, Select, Slider, Switch, Tooltip } from '../components/ui'
import type { CardDraft } from './draftTypes'

interface CardSettingsPanelProps {
  card: Card
  draft: CardDraft
  photos: Photo[]
  recalculating: boolean
  onPatch: (updater: Partial<CardDraft>, label: string) => void
  onRecalc: () => void
}

/** 数值与卡图：属性、星级、ATK/DEF、稀有度、卡图选择与裁切 */
export function CardSettingsPanel({ card, draft, photos, recalculating, onPatch, onRecalc }: CardSettingsPanelProps) {
  return (
    <Panel
      title="数值与卡图"
      subtitle={`数值来源：${card.valueSource ?? '自动规则'} · 星级来源：${card.starsSource ?? '自动规则'}`}
      actions={
        <Tooltip label="按保护级别、记录次数与照片质量重算星级与数值">
          <Button size="sm" variant="secondary" icon={<Calculator className="h-3.5 w-3.5" />} loading={recalculating} onClick={onRecalc}>
            重算
          </Button>
        </Tooltip>
      }
    >
      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-micro text-fog-300">属性</span>
            <Select
              size="sm"
              value={draft.attribute}
              options={ATTRIBUTE_KEYS.map((key) => ({ value: key, label: `${key} 系` }))}
              onValueChange={(value) => onPatch({ attribute: value }, '修改属性')}
            />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-micro text-fog-300">稀有度</span>
            <Select
              size="sm"
              value={draft.rarity}
              options={Object.keys(RARITY_STYLES).map((key) => ({ value: key, label: RARITY_STYLES[key as RarityKey].label }))}
              onValueChange={(value) => onPatch({ rarity: value }, '修改稀有度')}
            />
          </div>
        </div>

        <Slider
          label="星级"
          min={1}
          max={10}
          step={1}
          value={draft.stars}
          format={(value) => `★ ${value} / 10`}
          onValueChange={(value) => onPatch({ stars: value }, '调整星级')}
        />

        <div className="grid grid-cols-2 gap-3">
          <Slider
            label="ATK 珍稀值"
            min={0}
            max={4000}
            step={50}
            value={draft.atk}
            format={(value) => String(value)}
            onValueChange={(value) => onPatch({ atk: value }, '调整 ATK')}
          />
          <Slider
            label="DEF 记录值"
            min={0}
            max={4000}
            step={50}
            value={draft.def}
            format={(value) => String(value)}
            onValueChange={(value) => onPatch({ def: value }, '调整 DEF')}
          />
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <Switch label="闪膜" hint="开启镭射碎光" checked={draft.holo} onCheckedChange={(checked) => onPatch({ holo: checked }, '切换闪膜')} />
          <Switch
            label="显示学名"
            checked={draft.showScientific}
            onCheckedChange={(checked) => onPatch({ showScientific: checked }, '切换学名显示')}
          />
          <Switch
            label="卡背 EXIF 环"
            checked={draft.showExif}
            onCheckedChange={(checked) => onPatch({ showExif: checked }, '切换卡背 EXIF')}
          />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-micro uppercase tracking-widest text-fog-300">卡图 · {photos.length} 张候选</span>
            <span className="text-micro text-fog-300">点击缩略图即刻替换</span>
          </div>

          {photos.length === 0 ? (
            <p className="text-micro leading-relaxed text-fog-300">
              这个物种还没有照片，卡面会使用占位图。去「待分类」把照片指派给该物种后再回来选图。
            </p>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {photos.map((photo) => (
                <button
                  key={photo.id}
                  type="button"
                  onClick={() => onPatch({ photoId: photo.id }, '更换卡图')}
                  className={`relative overflow-hidden rounded-md border transition-all duration-base hover:-translate-y-0.5 ${
                    draft.photoId === photo.id ? 'border-ember ring-1 ring-ember/50' : 'border-line/[0.07]'
                  }`}
                  style={{ aspectRatio: '4 / 3' }}
                >
                  <img src={mediaUrl.thumb(photo.id, 240)} alt={photo.fileName} className="h-full w-full object-cover" loading="lazy" />
                  {photo.rating >= 5 ? (
                    <span className="absolute right-1 top-1 rounded-sm bg-black/60 px-1 text-micro text-ember">★5</span>
                  ) : null}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <span className="flex items-center gap-2 text-micro uppercase tracking-widest text-fog-300">
            <ImageIcon className="h-3.5 w-3.5" />
            裁切（竖幅取景框 1:{ART_ASPECT}）
          </span>
          <div className="grid grid-cols-3 gap-3">
            <Slider
              label="水平取景"
              min={0}
              max={1}
              step={0.01}
              value={draft.photoCrop.x}
              format={(value) => `${Math.round(value * 100)}%`}
              onValueChange={(value) => onPatch({ photoCrop: { ...draft.photoCrop, x: value } }, '调整裁切')}
            />
            <Slider
              label="垂直取景"
              min={0}
              max={1}
              step={0.01}
              value={draft.photoCrop.y}
              format={(value) => `${Math.round(value * 100)}%`}
              onValueChange={(value) => onPatch({ photoCrop: { ...draft.photoCrop, y: value } }, '调整裁切')}
            />
            <Slider
              label="放大"
              min={1}
              max={3}
              step={0.05}
              value={draft.photoCrop.scale}
              format={(value) => `${value.toFixed(2)}×`}
              onValueChange={(value) => onPatch({ photoCrop: { ...draft.photoCrop, scale: value } }, '调整裁切')}
            />
          </div>
        </div>
      </div>
    </Panel>
  )
}
