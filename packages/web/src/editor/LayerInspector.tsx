import { Lock, LockOpen, RotateCcw, Sparkles } from 'lucide-react'
import type { CardOverride } from '../api/types'
import { layerMeta } from '../card/layerSchema'
import { TEXT_METRICS } from '../card/cardMetrics'
import { Button, Panel, Segmented, Select, Slider, Switch, Tooltip } from '../components/ui'
import type { CardDraft } from './draftTypes'

const COLOR_SWATCHES = [
  '#E8EFE9',
  '#9FB0A5',
  '#2A1F14',
  '#FFF6E0',
  '#E8B04B',
  '#57C785',
  '#6FB3C9',
  '#E5636F',
  '#8A7FA8',
  '#0F1512',
]

const GRADIENTS: Array<{ label: string; value: string | null }> = [
  { label: '无', value: null },
  { label: '蜜金', value: 'linear-gradient(92deg, #FFE3A3 0%, #E8B04B 52%, #C98A4B 100%)' },
  { label: '苔影', value: 'linear-gradient(92deg, #D8F5E3 0%, #57C785 55%, #3E9E6B 100%)' },
  { label: '羽青', value: 'linear-gradient(92deg, #E2F4FA 0%, #6FB3C9 58%, #4B7FC9 100%)' },
]

interface LayerInspectorProps {
  draft: CardDraft
  layerId: string | null
  onPatch: (id: string, patch: CardOverride, label: string) => void
  onResetLayer: (id: string) => void
  onResetLayerGroup: () => void
}

/** 右侧检查器：位置/缩放/旋转/颜色/字体/效果 + 单图层重置 */
export function LayerInspector({ draft, layerId, onPatch, onResetLayer, onResetLayerGroup }: LayerInspectorProps) {
  if (!layerId) {
    return (
      <Panel title="图层检查器" subtitle="选中左侧任意图层后开始微调">
        <p className="text-caption leading-relaxed text-fog-200">
          编辑器把卡面拆成 20 个可控图层，选中后可以调整偏移、缩放、旋转、颜色、字体与阴影；所有改动都会进入撤销栈，最多保留 60 步。
        </p>
      </Panel>
    )
  }

  const meta = layerMeta(layerId)
  const override: CardOverride = draft.overrides[layerId] ?? {}
  const patch = (next: Partial<CardOverride>, label: string) => onPatch(layerId, { ...override, ...next }, label)
  const defaultFont = meta.fontSize ?? TEXT_METRICS.effectSize
  const isText = meta.kind === 'text'

  return (
    <Panel
      title={`检查器 · ${meta.label}`}
      subtitle={meta.hint ?? '位置与外观微调'}
      actions={
        <div className="flex items-center gap-1">
          <Tooltip label={override.locked ? '解锁图层' : '锁定图层'}>
            <Button
              size="sm"
              variant={override.locked ? 'primary' : 'ghost'}
              icon={override.locked ? <Lock className="h-3.5 w-3.5" /> : <LockOpen className="h-3.5 w-3.5" />}
              onClick={() => patch({ locked: !override.locked }, override.locked ? '解锁图层' : '锁定图层')}
            >
              {override.locked ? '已锁定' : '未锁定'}
            </Button>
          </Tooltip>
          <Button size="sm" variant="ghost" icon={<RotateCcw className="h-3.5 w-3.5" />} onClick={() => onResetLayer(layerId)}>
            重置本层
          </Button>
        </div>
      }
      footer={
        <Button size="sm" variant="secondary" icon={<Sparkles className="h-3.5 w-3.5" />} onClick={onResetLayerGroup}>
          重置整组（正面 / 卡背）
        </Button>
      }
    >
      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-2 gap-3">
          <Slider
            label="水平偏移"
            min={-60}
            max={60}
            step={0.5}
            value={override.dx ?? 0}
            format={(value) => `${value.toFixed(1)} cqw`}
            onValueChange={(value) => patch({ dx: value }, '调整水平偏移')}
          />
          <Slider
            label="垂直偏移"
            min={-60}
            max={60}
            step={0.5}
            value={override.dy ?? 0}
            format={(value) => `${value.toFixed(1)} cqw`}
            onValueChange={(value) => patch({ dy: value }, '调整垂直偏移')}
          />
          <Slider
            label="缩放"
            min={0.6}
            max={1.6}
            step={0.02}
            value={override.scale ?? 1}
            format={(value) => `${value.toFixed(2)}×`}
            onValueChange={(value) => patch({ scale: value }, '调整缩放')}
          />
          <Slider
            label="旋转"
            min={-15}
            max={15}
            step={0.5}
            value={override.rotate ?? 0}
            format={(value) => `${value.toFixed(1)}°`}
            onValueChange={(value) => patch({ rotate: value }, '调整旋转')}
          />
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-micro uppercase tracking-widest text-fog-300">颜色</span>
          <div className="flex flex-wrap items-center gap-2">
            {COLOR_SWATCHES.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => patch({ color }, '调整颜色')}
                className={`h-6 w-6 rounded-full border transition-transform duration-fast hover:scale-110 ${
                  override.color === color ? 'border-ember ring-1 ring-ember/60' : 'border-white/20'
                }`}
                style={{ background: color }}
                aria-label={`使用颜色 ${color}`}
              />
            ))}
            <input
              type="color"
              value={override.color ?? '#E8EFE9'}
              onChange={(event) => patch({ color: event.target.value }, '调整颜色')}
              className="h-6 w-9 cursor-pointer rounded-sm border border-white/15 bg-transparent"
              aria-label="自定义颜色"
            />
            <Button size="sm" variant="ghost" onClick={() => patch({ color: null }, '清除颜色')}>
              跟随预设
            </Button>
          </div>
        </div>

        {isText ? (
          <div className="flex flex-col gap-4">
            <Slider
              label={`字号（基准 ${defaultFont.toFixed(1)} cqw）`}
              min={0.6}
              max={2}
              step={0.02}
              value={override.fontScale ?? 1}
              format={(value) => `${value.toFixed(2)}× 基准字号`}
              onValueChange={(value) => patch({ fontScale: value }, '调整字号')}
            />

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-micro text-fog-300">字重</span>
                <Select
                  size="sm"
                  value={String(override.fontWeight ?? 500)}
                  options={[
                    { value: '300', label: '细 300' },
                    { value: '400', label: '常规 400' },
                    { value: '500', label: '中等 500' },
                    { value: '600', label: '半粗 600' },
                    { value: '700', label: '粗体 700' },
                    { value: '900', label: '特粗 900' },
                  ]}
                  onValueChange={(value) => patch({ fontWeight: Number(value) }, '调整字重')}
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-micro text-fog-300">对齐</span>
                <Segmented
                  size="sm"
                  value={override.textAlign ?? 'center'}
                  options={[
                    { value: 'left', label: '左' },
                    { value: 'center', label: '中' },
                    { value: 'right', label: '右' },
                  ]}
                  onValueChange={(value) => patch({ textAlign: value as 'left' | 'center' | 'right' }, '调整对齐')}
                />
              </div>
            </div>

            <Slider
              label="字距"
              min={-0.06}
              max={0.3}
              step={0.01}
              value={override.letterSpacing ?? 0}
              format={(value) => `${value.toFixed(2)} em`}
              onValueChange={(value) => patch({ letterSpacing: value }, '调整字距')}
            />

            <div className="grid grid-cols-2 items-center gap-3">
              <Switch
                label="斜体"
                checked={Boolean(override.italic)}
                onCheckedChange={(checked) => patch({ italic: checked }, '切换斜体')}
              />
              <div className="flex flex-col gap-1">
                <span className="text-micro text-fog-300">渐变文字</span>
                <Select
                  size="sm"
                  value={override.effects?.gradient ?? ''}
                  options={GRADIENTS.map((item) => ({ value: item.value ?? '', label: item.label }))}
                  onValueChange={(value) => patch({ effects: { ...override.effects, gradient: value || null } }, '调整渐变')}
                />
              </div>
            </div>
          </div>
        ) : null}

        <div className="flex flex-col gap-3">
          <span className="text-micro uppercase tracking-widest text-fog-300">效果</span>
          <Switch
            label="文字阴影"
            hint="深色卡面上的可读性保险"
            checked={Boolean(override.effects?.shadow)}
            onCheckedChange={(checked) => patch({ effects: { ...override.effects, shadow: checked } }, '切换阴影')}
          />
          <Switch
            label="描边"
            hint="给浅色背景上的文字加一圈暗边"
            checked={Boolean(override.effects?.outline)}
            onCheckedChange={(checked) => patch({ effects: { ...override.effects, outline: checked } }, '切换描边')}
          />
          <Slider
            label="不透明度"
            min={0.05}
            max={1}
            step={0.05}
            value={override.effects?.opacity ?? 1}
            format={(value) => `${Math.round(value * 100)}%`}
            onValueChange={(value) => patch({ effects: { ...override.effects, opacity: value } }, '调整不透明度')}
          />
        </div>
      </div>
    </Panel>
  )
}
