import { ArrowDown, ArrowUp, Eye, EyeOff, Lock, LockOpen, Plus, RotateCcw, Trash2, Type, Droplet, Sticker } from 'lucide-react'
import type { Card } from '../api/types'
import { BACK_LAYERS, FRONT_LAYERS, layerMeta } from '../card/layerSchema'
import { Badge, Button, IconButton, Panel, Tooltip } from '../components/ui'
import type { CardDraft } from './draftTypes'

interface LayerPanelProps {
  card: Card
  draft: CardDraft
  activeLayerId: string | null
  onSelect: (id: string) => void
  onToggleVisible: (id: string, visible: boolean) => void
  onToggleLock: (id: string, locked: boolean) => void
  onReorder: (id: string, delta: -1 | 1) => void
  onResetLayer: (id: string) => void
  onRemoveCustom: (id: string) => void
  onAddCustom: (kind: 'text' | 'sticker' | 'watermark') => void
}

/** 左侧图层面板：正面 16 层 + 背面 4 层 + 自由元素层 */
export function LayerPanel({
  card,
  draft,
  activeLayerId,
  onSelect,
  onToggleVisible,
  onToggleLock,
  onReorder,
  onResetLayer,
  onRemoveCustom,
  onAddCustom,
}: LayerPanelProps) {
  const ids = FRONT_LAYERS.map((meta) => meta.id)

  return (
    <Panel
      title="图层"
      subtitle="显示 / 锁定 / 层级顺序，拖动图层名可定位微调"
      actions={<Badge tone="neutral">{FRONT_LAYERS.length + BACK_LAYERS.length + draft.layers.length} 层</Badge>}
    >
      <div className="flex max-h-[520px] flex-col gap-4 overflow-y-auto pr-1">
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between px-1 pb-1">
            <span className="text-micro uppercase tracking-widest text-fog-300">正面图层</span>
            <span className="text-micro text-fog-300">层序自上而下</span>
          </div>
          {[...FRONT_LAYERS].reverse().map((meta) => (
            <LayerRow
              key={meta.id}
              id={meta.id}
              label={meta.label}
              hint={meta.hint}
              maxChars={meta.maxChars}
              content={contentOf(meta.id, draft, card)}
              override={draft.overrides[meta.id]}
              active={activeLayerId === meta.id}
              fallbackOrder={ids.indexOf(meta.id)}
              onSelect={onSelect}
              onToggleVisible={onToggleVisible}
              onToggleLock={onToggleLock}
              onReorder={onReorder}
              onResetLayer={onResetLayer}
            />
          ))}
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between px-1 pb-1">
            <span className="text-micro uppercase tracking-widest text-fog-300">卡背图层</span>
          </div>
          {[...BACK_LAYERS].reverse().map((meta) => (
            <LayerRow
              key={meta.id}
              id={meta.id}
              label={meta.label}
              hint={meta.hint}
              maxChars={meta.maxChars}
              content={
                meta.id === 'backText'
                  ? draft.backText || draft.overrides.backText?.content || ''
                  : ''
              }
              override={draft.overrides[meta.id]}
              active={activeLayerId === meta.id}
              fallbackOrder={ids.indexOf(meta.id)}
              onSelect={onSelect}
              onToggleVisible={onToggleVisible}
              onToggleLock={onToggleLock}
              onReorder={onReorder}
              onResetLayer={onResetLayer}
            />
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-micro uppercase tracking-widest text-fog-300">自由元素 · {draft.layers.length}/12</span>
            <div className="flex items-center gap-1">
              <Tooltip label="新增文本层">
                <IconButton size="sm" label="新增文本层" onClick={() => onAddCustom('text')}>
                  <Type className="h-3.5 w-3.5" />
                </IconButton>
              </Tooltip>
              <Tooltip label="新增贴纸层">
                <IconButton size="sm" label="新增贴纸层" onClick={() => onAddCustom('sticker')}>
                  <Sticker className="h-3.5 w-3.5" />
                </IconButton>
              </Tooltip>
              <Tooltip label="新增水印层">
                <IconButton size="sm" label="新增水印层" onClick={() => onAddCustom('watermark')}>
                  <Droplet className="h-3.5 w-3.5" />
                </IconButton>
              </Tooltip>
            </div>
          </div>

          {draft.layers.length === 0 ? (
            <p className="px-1 text-micro leading-relaxed text-fog-300">
              还没有自由元素。可以加一行签名、一枚印章，或一个低透明度水印。
            </p>
          ) : (
            draft.layers.map((layer) => {
              const meta = layerMeta(layer.id)
              return (
                <div
                  key={layer.id}
                  className={`flex items-center gap-2 rounded-md border px-2 py-1.5 transition-colors duration-fast ${
                    activeLayerId === layer.id
                      ? 'border-ember/60 bg-ember/10'
                      : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05]'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onSelect(layer.id)}
                    className="flex min-w-0 flex-1 items-center gap-2 text-left"
                  >
                    <span className="text-micro text-fog-200">
                      {layer.kind === 'text' ? '文本' : layer.kind === 'sticker' ? '贴纸' : '水印'}
                    </span>
                    <span className="truncate text-caption text-fog-100">
                      {layer.content || layer.assetKey || meta.label}
                    </span>
                  </button>
                  <IconButton size="sm" label="删除自由元素" onClick={() => onRemoveCustom(layer.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </IconButton>
                </div>
              )
            })
          )}

          <Button size="sm" variant="ghost" icon={<Plus className="h-3.5 w-3.5" />} onClick={() => onAddCustom('text')}>
            添加文本 / 日期 / 标语
          </Button>
        </div>
      </div>
    </Panel>
  )
}

function contentOf(id: string, draft: CardDraft, card: Card): string {
  const overrideContent = draft.overrides[id]?.content
  if (typeof overrideContent === 'string') return overrideContent
  if (id === 'title') return draft.title
  if (id === 'effect') return draft.effectText
  if (id === 'record') return draft.recordText
  if (id === 'atk') return String(draft.atk)
  if (id === 'def') return String(draft.def)
  if (id === 'serial') return card.serialNo ?? ''
  return ''
}

interface LayerRowProps {
  id: string
  label: string
  hint?: string
  maxChars?: number
  content: string
  override: CardDraft['overrides'][string] | undefined
  active: boolean
  fallbackOrder: number
  onSelect: (id: string) => void
  onToggleVisible: (id: string, visible: boolean) => void
  onToggleLock: (id: string, locked: boolean) => void
  onReorder: (id: string, delta: -1 | 1) => void
  onResetLayer: (id: string) => void
}

function LayerRow({
  id,
  label,
  hint,
  maxChars,
  content,
  override,
  active,
  fallbackOrder,
  onSelect,
  onToggleVisible,
  onToggleLock,
  onReorder,
  onResetLayer,
}: LayerRowProps) {
  const visible = override?.visible !== false
  const locked = Boolean(override?.locked)
  const over = typeof maxChars === 'number' && content.length > maxChars

  return (
    <div
      className={`group flex items-center gap-1.5 rounded-md border px-2 py-1.5 transition-colors duration-fast ${
        active ? 'border-ember/60 bg-ember/10' : 'border-transparent hover:bg-white/[0.05]'
      }`}
      title={hint}
    >
      <button
        type="button"
        onClick={() => onSelect(id)}
        className="flex min-w-0 flex-1 items-center gap-2 text-left"
      >
        <span className={`truncate text-caption ${visible ? 'text-fog-100' : 'text-fog-300 line-through'}`}>{label}</span>
        {typeof maxChars === 'number' ? (
          <span className={`shrink-0 text-micro tabular-nums ${over ? 'text-alert' : 'text-fog-300'}`}>
            {content.length}/{maxChars}
          </span>
        ) : null}
        <span className="ml-auto shrink-0 text-micro tabular-nums text-fog-300">
          {override?.order ?? fallbackOrder}
        </span>
      </button>

      <IconButton size="sm" label="显示或隐藏图层" onClick={() => onToggleVisible(id, !visible)}>
        {visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
      </IconButton>
      <IconButton size="sm" label="锁定图层" onClick={() => onToggleLock(id, !locked)}>
        {locked ? <Lock className="h-3.5 w-3.5" /> : <LockOpen className="h-3.5 w-3.5" />}
      </IconButton>
      <div className="flex flex-col">
        <button
          type="button"
          onClick={() => onReorder(id, 1)}
          className="text-fog-300 transition-colors hover:text-fog-100"
          aria-label="上移图层"
        >
          <ArrowUp className="h-3 w-3" />
        </button>
        <button
          type="button"
          onClick={() => onReorder(id, -1)}
          className="text-fog-300 transition-colors hover:text-fog-100"
          aria-label="下移图层"
        >
          <ArrowDown className="h-3 w-3" />
        </button>
      </div>
      <IconButton size="sm" label="重置图层" onClick={() => onResetLayer(id)}>
        <RotateCcw className="h-3.5 w-3.5" />
      </IconButton>
    </div>
  )
}
