import { useState } from 'react'
import { Copy, Layers, Save, Trash2 } from 'lucide-react'
import type { CardTemplate } from '../api/types'
import { CARD_PRESETS } from '../card/presets'
import { Badge, Button, Dialog, Input, Panel, Skeleton, notify } from '../components/ui'
import { formatDate } from '../lib/format'
import type { CardDraft } from './draftTypes'

export type ResetScope = 'card' | 'layer' | 'back' | 'crop'

interface PresetPickerProps {
  draft: CardDraft
  activeLayerId: string | null
  templates: CardTemplate[] | undefined
  loadingTemplates: boolean
  savingTemplate: boolean
  duplicating: boolean
  onApplyPreset: (key: string) => void
  onSaveTemplate: (name: string) => void
  onApplyTemplate: (template: CardTemplate) => void
  onDeleteTemplate: (id: number) => void
  onReset: (scope: ResetScope) => void
  onDuplicate: () => void
}

/** 预设、我的模板与四种粒度的重置 */
export function PresetPicker({
  draft,
  activeLayerId,
  templates,
  loadingTemplates,
  savingTemplate,
  duplicating,
  onApplyPreset,
  onSaveTemplate,
  onApplyTemplate,
  onDeleteTemplate,
  onReset,
  onDuplicate,
}: PresetPickerProps) {
  const [templateName, setTemplateName] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)

  const submitTemplate = () => {
    const name = templateName.trim()
    if (!name) {
      notify.info('给模板起个名字', '例如：湿地鹭类 · 金框')
      return
    }
    onSaveTemplate(name)
    setTemplateName('')
    setDialogOpen(false)
  }

  return (
    <Panel
      title="预设与模板"
      subtitle={`当前预设：${CARD_PRESETS.find((preset) => preset.key === draft.preset)?.name ?? '未指定'}`}
      actions={<Badge tone="plume">{draft.templateId ? `模板 #${draft.templateId}` : '未套用模板'}</Badge>}
    >
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-2">
          {CARD_PRESETS.map((preset) => (
            <button
              key={preset.key}
              type="button"
              onClick={() => onApplyPreset(preset.key)}
              className={`flex flex-col gap-1 rounded-md border px-3 py-2 text-left transition-all duration-base hover:-translate-y-0.5 ${
                draft.preset === preset.key
                  ? 'border-ember/60 bg-ember/10'
                  : 'border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.05]'
              }`}
            >
              <span className="text-caption text-fog-100">{preset.name}</span>
              <span className="text-micro leading-relaxed text-fog-300">{preset.description}</span>
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-micro uppercase tracking-widest text-fog-300">我的模板</span>
            <Button size="sm" variant="secondary" icon={<Save className="h-3.5 w-3.5" />} onClick={() => setDialogOpen(true)}>
              存为模板
            </Button>
          </div>

          {loadingTemplates ? (
            <Skeleton className="h-16 w-full" />
          ) : !templates || templates.length === 0 ? (
            <p className="text-micro leading-relaxed text-fog-300">
              还没有模板。把调好的卡面存成模板，之后可以一键套用到其它卡片，并解锁「卡牌设计师」成就。
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {templates.map((template) => (
                <li
                  key={template.id}
                  className="flex items-center gap-2 rounded-md border border-white/[0.07] bg-white/[0.02] px-2 py-1.5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-caption text-fog-100">{template.name}</p>
                    <p className="text-micro text-fog-300">
                      {template.preset} · {formatDate(template.updatedAt, true)}
                    </p>
                  </div>
                  <Button size="sm" variant="ghost" icon={<Layers className="h-3.5 w-3.5" />} onClick={() => onApplyTemplate(template)}>
                    套用
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={<Trash2 className="h-3.5 w-3.5" />}
                    onClick={() => onDeleteTemplate(template.id)}
                  >
                    删除
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onReset('card')}
            disabled={!draft}
          >
            重置整卡
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onReset('layer')} disabled={!activeLayerId}>
            重置当前图层
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onReset('back')}>
            仅重置卡背
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onReset('crop')}>
            仅重置裁切
          </Button>
          <Button
            size="sm"
            variant="secondary"
            icon={<Copy className="h-3.5 w-3.5" />}
            loading={duplicating}
            onClick={onDuplicate}
          >
            复制为新版本
          </Button>
        </div>
      </div>

      <Dialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title="存为模板"
        description="保存当前预设、图层微调、自由元素与卡背配置"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>
              取消
            </Button>
            <Button loading={savingTemplate} onClick={submitTemplate}>
              保存模板
            </Button>
          </>
        }
      >
        <label className="flex flex-col gap-1.5">
          <span className="text-caption text-fog-100">模板名称</span>
          <Input
            value={templateName}
            placeholder="例如：湿地鹭类 · 金框"
            onChange={(event) => setTemplateName(event.target.value)}
          />
        </label>
      </Dialog>
    </Panel>
  )
}
