import { useRef } from 'react'
import { ImagePlus, Plus, Trash2, Upload } from 'lucide-react'
import type { CardLayer } from '../api/types'
import { mediaUrl } from '../api/client'
import { useStickers, useUploadSticker, type StickerAsset } from '../api/hooks'
import { Button, Input, Panel, Segmented, Select, Slider, Skeleton, Switch, notify } from '../components/ui'
import type { CardDraft } from './draftTypes'

interface StickerToolProps {
  draft: CardDraft
  activeLayerId: string | null
  onAdd: (kind: 'text' | 'sticker' | 'watermark') => void
  onUpdate: (id: string, patch: Partial<CardLayer>, label: string) => void
  onRemove: (id: string) => void
  onSelect: (id: string) => void
}

/** 自由元素编辑：文本 / 本地贴纸 / 水印 */
export function StickerTool({ draft, activeLayerId, onAdd, onUpdate, onRemove, onSelect }: StickerToolProps) {
  const stickers = useStickers()
  const upload = useUploadSticker()
  const fileRef = useRef<HTMLInputElement | null>(null)

  const layer = draft.layers.find((item) => item.id === activeLayerId) ?? null

  const handleUpload = (file: File | undefined) => {
    if (!file) return
    if (file.size > 1_500_000) {
      notify.error('贴纸过大', '请使用 1.5MB 以内的 PNG，透明背景效果最好')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = String(reader.result ?? '')
      upload.mutate(
        { name: file.name.replace(/\.[^.]+$/, '').slice(0, 40), dataUrl },
        {
          onSuccess: (asset) => {
            notify.success('贴纸已入库', `${asset.name} · 可在任意卡面复用`)
            if (layer) onUpdate(layer.id, { assetKey: asset.key, kind: 'sticker' }, '更换贴纸')
            else onAdd('sticker')
          },
        },
      )
    }
    reader.readAsDataURL(file)
  }

  return (
    <Panel
      title="自由元素"
      subtitle="签名、日期、印章与低透明度水印"
      actions={
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" icon={<Plus className="h-3.5 w-3.5" />} onClick={() => onAdd('text')}>
            文本
          </Button>
          <Button size="sm" variant="ghost" icon={<ImagePlus className="h-3.5 w-3.5" />} onClick={() => onAdd('sticker')}>
            贴纸
          </Button>
        </div>
      }
    >
      {!layer ? (
        <p className="text-caption leading-relaxed text-fog-200">
          在左侧「自由元素」里选中一层后即可编辑；文本层适合写签名与日期，贴纸层可以使用本地 PNG 印章，水印层默认低透明度贴底。
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <Segmented
              size="sm"
              value={layer.kind}
              options={[
                { value: 'text', label: '文本' },
                { value: 'sticker', label: '贴纸' },
                { value: 'watermark', label: '水印' },
              ]}
              onValueChange={(value) => onUpdate(layer.id, { kind: value as CardLayer['kind'] }, '切换元素类型')}
            />
            <Button size="sm" variant="ghost" icon={<Trash2 className="h-3.5 w-3.5" />} onClick={() => onRemove(layer.id)}>
              删除
            </Button>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="flex items-center justify-between">
              <span className="text-caption text-fog-100">文字内容</span>
              <span className={`text-micro tabular-nums ${(layer.content ?? '').length > 60 ? 'text-alert' : 'text-fog-300'}`}>
                {(layer.content ?? '').length}/60
              </span>
            </span>
            <Input
              value={layer.content ?? ''}
              placeholder="例如：2025 春季迁徙 · 摄于崇明东滩"
              invalid={(layer.content ?? '').length > 60}
              onChange={(event) => onUpdate(layer.id, { content: event.target.value }, '修改自由文本')}
            />
          </label>

          {layer.kind === 'sticker' ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-micro uppercase tracking-widest text-fog-300">贴纸库</span>
                <Button
                  size="sm"
                  variant="ghost"
                  icon={<Upload className="h-3.5 w-3.5" />}
                  loading={upload.isPending}
                  onClick={() => fileRef.current?.click()}
                >
                  上传本地贴纸
                </Button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/webp,image/jpeg"
                  className="hidden"
                  onChange={(event) => handleUpload(event.target.files?.[0])}
                />
              </div>

              {stickers.isLoading ? (
                <Skeleton className="h-16 w-full" />
              ) : (stickers.data?.items ?? []).length === 0 ? (
                <p className="text-micro leading-relaxed text-fog-300">
                  还没有贴纸。上传透明底 PNG 徽章或印章，之后可在全部卡片上复用。
                </p>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {(stickers.data?.items ?? []).map((asset: StickerAsset) => (
                    <button
                      key={asset.key}
                      type="button"
                      onClick={() => onUpdate(layer.id, { assetKey: asset.key }, '更换贴纸')}
                      className={`flex flex-col items-center gap-1 rounded-md border p-1 transition-colors duration-fast ${
                        layer.assetKey === asset.key ? 'border-ember/60 bg-ember/10' : 'border-white/[0.07] hover:bg-white/[0.05]'
                      }`}
                    >
                      <img
                        src={mediaUrl.asset(asset.key)}
                        alt={asset.name}
                        className="h-10 w-10 object-contain"
                        loading="lazy"
                      />
                      <span className="w-full truncate text-micro text-fog-300">{asset.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-3">
            <Slider
              label="水平位置"
              min={0}
              max={100}
              step={1}
              value={layer.x ?? 50}
              format={(value) => `${value}%`}
              onValueChange={(value) => onUpdate(layer.id, { x: value }, '调整自由元素水平位置')}
            />
            <Slider
              label="垂直位置"
              min={0}
              max={100}
              step={1}
              value={layer.y ?? 50}
              format={(value) => `${value}%`}
              onValueChange={(value) => onUpdate(layer.id, { y: value }, '调整自由元素垂直位置')}
            />
            <Slider
              label="缩放"
              min={0.2}
              max={3}
              step={0.05}
              value={layer.scale ?? 1}
              format={(value) => `${value.toFixed(2)}×`}
              onValueChange={(value) => onUpdate(layer.id, { scale: value }, '调整自由元素缩放')}
            />
            <Slider
              label="旋转"
              min={-180}
              max={180}
              step={1}
              value={layer.rotate ?? 0}
              format={(value) => `${value}°`}
              onValueChange={(value) => onUpdate(layer.id, { rotate: value }, '调整自由元素旋转')}
            />
            <Slider
              label="字号"
              min={6}
              max={40}
              step={0.5}
              value={layer.fontSize ?? 6}
              format={(value) => `${value} cqw`}
              onValueChange={(value) => onUpdate(layer.id, { fontSize: value }, '调整自由元素字号')}
            />
            <Slider
              label="透明度"
              min={0}
              max={1}
              step={0.05}
              value={layer.opacity ?? 1}
              format={(value) => `${Math.round(value * 100)}%`}
              onValueChange={(value) => onUpdate(layer.id, { opacity: value }, '调整自由元素透明度')}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <span className="text-micro text-fog-300">位置锚点</span>
              <Select
                size="sm"
                value={layer.kind === 'watermark' ? 'bottom' : 'center'}
                options={[
                  { value: 'center', label: '居中（卡片中心）' },
                  { value: 'bottom', label: '贴底（右下角）' },
                ]}
                onValueChange={(value) =>
                  onUpdate(
                    layer.id,
                    value === 'bottom' ? { x: 78, y: 92, kind: 'watermark' } : { x: 50, y: 50 },
                    '调整自由元素锚点',
                  )
                }
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-micro text-fog-300">混合模式</span>
              <Select
                size="sm"
                value={layer.blendMode ?? 'normal'}
                options={[
                  { value: 'normal', label: '正常' },
                  { value: 'screen', label: '滤色（提亮）' },
                  { value: 'multiply', label: '正片叠底' },
                  { value: 'overlay', label: '叠加' },
                ]}
                onValueChange={(value) => onUpdate(layer.id, { blendMode: value }, '调整混合模式')}
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Switch
              label="投影"
              checked={Boolean(layer.shadow)}
              onCheckedChange={(checked) => onUpdate(layer.id, { shadow: checked }, '切换自由元素投影')}
            />
            <button
              type="button"
              onClick={() => onSelect(layer.id)}
              className="text-micro text-plume transition-colors hover:text-fog-100"
            >
              已在画布中选中该元素
            </button>
          </div>
        </div>
      )}
    </Panel>
  )
}
