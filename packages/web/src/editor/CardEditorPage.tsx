import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Download, Redo2, Save, Undo2 } from 'lucide-react'
import type { Card, CardLayer, CardOverride, CardTemplate, Photo } from '../api/types'
import { presetByKey } from '../card/presets'
import {
  useApplyTemplate,
  useCard,
  useCreateTemplate,
  useDeleteTemplate,
  useDuplicateCard,
  useRecalcCard,
  useRegenerateCardTexts,
  useTemplates,
  useUpdateCard,
} from '../api/hooks'
import { PageHeader } from '../components/AppShell'
import { ThemeSwitcher } from '../components/ThemeSwitcher'
import { Badge, Button, Dialog, ErrorState, Segmented, Skeleton, Switch, notify } from '../components/ui'
import { exportCardPng } from '../lib/exportCard'
import { BackPanel } from './BackPanel'
import { CardSettingsPanel } from './CardSettingsPanel'
import { EditorCanvas } from './EditorCanvas'
import { LayerInspector } from './LayerInspector'
import { LayerPanel } from './LayerPanel'
import { PresetPicker, type ResetScope } from './PresetPicker'
import { StickerTool } from './StickerTool'
import { TextLayerTool } from './TextLayerTool'
import { createCustomLayer, cardToDraft, draftToPayload, validateDraft, type CardDraft } from './draftTypes'
import { useEditorDraft } from './useEditorDraft'

/** 卡片编辑器：图层化微调 + 字数校验 + 预设模板 + 导出 */
export default function CardEditorPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const cardId = Number(id)
  const valid = Number.isInteger(cardId) && cardId > 0

  const detail = useCard(valid ? cardId : null)
  const history = useEditorDraft(null)
  const { draft, apply, flush, undo, redo, canUndo, canRedo, reset, markSaved } = history

  const [activeLayerId, setActiveLayerId] = useState<string | null>(null)
  const [loadedId, setLoadedId] = useState<number | null>(null)
  const [exportOpen, setExportOpen] = useState(false)
  const [exportFace, setExportFace] = useState<'front' | 'back'>('front')
  const [exportSize, setExportSize] = useState<'lg' | 'xl'>('lg')
  const [exportBleed, setExportBleed] = useState(false)
  const [exportDebug, setExportDebug] = useState(false)

  const update = useUpdateCard(cardId)
  const regenerate = useRegenerateCardTexts(cardId)
  const recalc = useRecalcCard(cardId)
  const duplicate = useDuplicateCard()
  const templates = useTemplates()
  const createTemplate = useCreateTemplate()
  const applyTemplate = useApplyTemplate()
  const deleteTemplate = useDeleteTemplate()

  const card = detail.data?.card ?? null
  const issues = useMemo(() => (draft ? validateDraft(draft) : []), [draft])
  const dirty = history.dirty

  useEffect(() => {
    if (card && loadedId !== card.id) {
      reset(cardToDraft(card), '载入卡片')
      setLoadedId(card.id)
    }
  }, [card, loadedId, reset])

  const save = useCallback(
    (options: { silent?: boolean } = {}) => {
      if (!draft) return
      if (issues.length) {
        notify.error('还有超限文本', issues[0].message)
        return
      }
      update.mutate(draftToPayload(draft), {
        onSuccess: (saved) => {
          reset(cardToDraft(saved), '已保存')
          markSaved()
          if (!options.silent) notify.success('卡片已保存', '卡面、卡背与图层微调都已写入数据库')
        },
        onError: (error) => notify.error('保存失败', error instanceof Error ? error.message : '请检查本地服务'),
      })
    },
    [draft, issues, markSaved, reset, update],
  )

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const typing = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable
      const meta = event.ctrlKey || event.metaKey

      if (meta && event.key.toLowerCase() === 'z') {
        event.preventDefault()
        if (event.shiftKey) redo()
        else undo()
        return
      }
      if (meta && event.key.toLowerCase() === 'y') {
        event.preventDefault()
        redo()
        return
      }
      if (meta && event.key.toLowerCase() === 's') {
        event.preventDefault()
        save()
        return
      }
      if (typing || !activeLayerId) return
      const step = event.shiftKey ? 5 : 0.5
      const moves: Record<string, [number, number]> = {
        ArrowLeft: [-step, 0],
        ArrowRight: [step, 0],
        ArrowUp: [0, -step],
        ArrowDown: [0, step],
      }
      const move = moves[event.key]
      if (!move) return
      event.preventDefault()
      const current = draft?.overrides[activeLayerId] ?? {}
      apply(
        (prev) => ({
          ...prev,
          overrides: {
            ...prev.overrides,
            [activeLayerId]: {
              ...current,
              dx: clamp(current.dx ?? 0, move[0]),
              dy: clamp(current.dy ?? 0, move[1]),
            },
          },
        }),
        '方向键微调',
      )
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [activeLayerId, apply, draft?.overrides, redo, save, undo])

  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      if (!dirty) return
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [dirty])

  const patchOverride = useCallback(
    (layerId: string, patch: CardOverride, label: string) => {
      apply(
        (prev) => ({
          ...prev,
          overrides: { ...prev.overrides, [layerId]: { ...(prev.overrides[layerId] ?? {}), ...patch } },
        }),
        label,
      )
    },
    [apply],
  )

  const patchLayer = useCallback(
    (layerId: string, patch: Partial<CardLayer>, label: string) => {
      apply(
        (prev) => ({
          ...prev,
          layers: prev.layers.map((layer) => (layer.id === layerId ? { ...layer, ...patch } : layer)),
        }),
        label,
      )
    },
    [apply],
  )

  const resetScope = (scope: ResetScope) => {
    if (!card || !draft) return
    if (scope === 'card') {
      reset(cardToDraft(card), '重置整卡')
      return
    }
    if (scope === 'layer') {
      if (!activeLayerId) return
      apply(
        (prev) => {
          const next = { ...prev.overrides }
          delete next[activeLayerId]
          return { ...prev, overrides: next }
        },
        '重置当前图层',
      )
      return
    }
    if (scope === 'back') {
      const original = cardToDraft(card)
      apply(
        {
          backTheme: original.backTheme,
          backEmblem: original.backEmblem,
          backPrint: original.backPrint,
          backText: original.backText,
        },
        '重置卡背',
      )
      return
    }
    apply({ photoCrop: { ...card.photoCrop } }, '重置裁切')
  }

  if (!valid) {
    return <ErrorState message="卡片编号无效" onRetry={() => navigate('/cards')} />
  }
  if (detail.isError) {
    return <ErrorState message="卡片加载失败，请确认本地服务正在运行" onRetry={() => void detail.refetch()} />
  }

  const photos: Photo[] = detail.data?.photos ?? []
  const species = detail.data?.species ?? null
  const photo = detail.data?.photo ?? null

  if (!card || !species || !draft) {
    return (
      <div className="flex flex-col gap-5">
        <Skeleton className="h-12 w-72" />
        <div className="grid gap-5 xl:grid-cols-[300px_minmax(0,1fr)_340px]">
          <Skeleton className="h-[520px] w-full" />
          <Skeleton className="h-[640px] w-full" />
          <Skeleton className="h-[560px] w-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title={`编辑器 · ${species.cnName}`}
        subtitle="所有调整进入撤销栈，Ctrl+Z 撤销、Ctrl+Shift+Z 重做、Ctrl+S 保存；方向键以 0.5% 步进微调选中图层。"
        meta={
          <>
            <Badge tone="gold">{draft.rarity}</Badge>
            <Badge tone="plume">{draft.attribute}</Badge>
            <Badge tone="neutral">★ {draft.stars}</Badge>
            {dirty ? <Badge tone="danger">未保存</Badge> : <Badge tone="success">已保存</Badge>}
            {issues.length ? <Badge tone="danger">{issues.length} 项超限</Badge> : null}
          </>
        }
        actions={
          <>
            <ThemeSwitcher />
            <Button variant="ghost" icon={<ArrowLeft className="h-4 w-4" />} onClick={() => navigate(`/cards/${cardId}`)}>
              返回详情
            </Button>
            <Button variant="ghost" icon={<Undo2 className="h-4 w-4" />} disabled={!canUndo} onClick={undo}>
              撤销
            </Button>
            <Button variant="ghost" icon={<Redo2 className="h-4 w-4" />} disabled={!canRedo} onClick={redo}>
              重做
            </Button>
            <Button variant="secondary" icon={<Download className="h-4 w-4" />} onClick={() => setExportOpen(true)}>
              导出
            </Button>
            <Button icon={<Save className="h-4 w-4" />} loading={update.isPending} onClick={() => save()}>
              保存
            </Button>
          </>
        }
      />

      <div className="grid items-start gap-5 xl:grid-cols-[300px_minmax(0,1fr)_340px]">
        <div className="flex flex-col gap-5">
          <LayerPanel
            card={card}
            draft={draft}
            activeLayerId={activeLayerId}
            onSelect={setActiveLayerId}
            onToggleVisible={(layerId, visible) => patchOverride(layerId, { visible }, visible ? '显示图层' : '隐藏图层')}
            onToggleLock={(layerId, locked) => patchOverride(layerId, { locked }, locked ? '锁定图层' : '解锁图层')}
            onReorder={(layerId, delta) => {
              const current = draft.overrides[layerId]?.order ?? 0
              patchOverride(layerId, { order: Math.max(0, Math.min(40, current + delta)) }, '调整图层顺序')
            }}
            onResetLayer={(layerId) =>
              apply(
                (prev) => {
                  const next = { ...prev.overrides }
                  delete next[layerId]
                  return { ...prev, overrides: next }
                },
                '重置图层',
              )
            }
            onRemoveCustom={(layerId) =>
              apply((prev) => ({ ...prev, layers: prev.layers.filter((layer) => layer.id !== layerId) }), '删除自由元素')
            }
            onAddCustom={(kind) => {
              if (draft.layers.length >= 12) {
                notify.info('自由元素已满', '最多 12 层，先删掉不用的再添加')
                return
              }
              const layer = createCustomLayer(kind, draft.layers.length + 1)
              apply((prev) => ({ ...prev, layers: [...prev.layers, layer] }), '新增自由元素')
              setActiveLayerId(layer.id)
            }}
          />
          <PresetPicker
            draft={draft}
            activeLayerId={activeLayerId}
            templates={templates.data?.items}
            loadingTemplates={templates.isLoading}
            savingTemplate={createTemplate.isPending}
            duplicating={duplicate.isPending}
            onApplyPreset={(key) => {
              const preset = presetByKey(key)
              apply({ preset: preset.key, holo: preset.holo, backTheme: preset.backTheme }, `套用预设：${preset.name}`)
            }}
            onSaveTemplate={(name) => {
              if (dirty) {
                notify.info('先保存卡片', '模板会保存数据库里的最终样式，已为你保存后再存模板')
                save({ silent: true })
              }
              createTemplate.mutate(
                { name, cardId },
                { onSuccess: () => notify.success('模板已保存', `「${name}」可在任意卡片上套用`) },
              )
            }}
            onApplyTemplate={(template: CardTemplate) => {
              applyTemplate.mutate(
                { id: template.id, cardId },
                {
                  onSuccess: async () => {
                    const fresh = await detail.refetch()
                    if (fresh.data) {
                      reset(cardToDraft(fresh.data.card), `套用模板：${template.name}`)
                      setLoadedId(fresh.data.card.id)
                    }
                    notify.success('模板已套用', template.name)
                  },
                },
              )
            }}
            onDeleteTemplate={(templateId) =>
              deleteTemplate.mutate(templateId, { onSuccess: () => notify.info('模板已删除') })
            }
            onReset={resetScope}
            onDuplicate={() =>
              duplicate.mutate(cardId, {
                onSuccess: (created) => {
                  notify.success('已复制为新版本', created.serialNo ?? `#${created.id}`)
                  navigate(`/cards/editor/${created.id}`)
                },
              })
            }
          />
        </div>

        <div className="flex flex-col gap-5">
          <EditorCanvas
            card={card}
            species={species}
            photo={photo}
            draft={draft}
            activeLayerId={activeLayerId}
            onSelectLayer={setActiveLayerId}
            onLayerMove={(layerId, dx, dy, commit) => {
              apply(
                (prev) => ({
                  ...prev,
                  overrides: { ...prev.overrides, [layerId]: { ...(prev.overrides[layerId] ?? {}), dx, dy } },
                }),
                '拖拽图层',
                commit,
              )
            }}
            onFlush={() => flush('拖拽图层')}
            issues={issues}
          />
          <TextLayerTool
            draft={draft}
            onPatch={(updater, label) => apply(updater, label)}
            onPatchOverride={(layerId, patch, label) => patchOverride(layerId, patch, label)}
            regenerating={regenerate.isPending}
            onRegenerate={() =>
              regenerate.mutate(true, {
                onSuccess: (card) => {
                  apply(
                    { effectText: card.effectText ?? '', recordText: card.recordText ?? '' },
                    '自动精简文本',
                  )
                  notify.success('已按维基导语自动精简', '简介 ≤90 字，记录 ≤50 字')
                },
              })
            }
          />
          <StickerTool
            draft={draft}
            activeLayerId={activeLayerId}
            onAdd={(kind) => {
              const layer = createCustomLayer(kind, draft.layers.length + 1)
              apply((prev) => ({ ...prev, layers: [...prev.layers, layer] }), '新增自由元素')
              setActiveLayerId(layer.id)
            }}
            onUpdate={(layerId, patch, label) => patchLayer(layerId, patch, label)}
            onRemove={(layerId) =>
              apply((prev) => ({ ...prev, layers: prev.layers.filter((layer) => layer.id !== layerId) }), '删除自由元素')
            }
            onSelect={setActiveLayerId}
          />
        </div>

        <div className="flex flex-col gap-5">
          <LayerInspector
            draft={draft}
            layerId={activeLayerId}
            onPatch={patchOverride}
            onResetLayer={(layerId) =>
              apply(
                (prev) => {
                  const next = { ...prev.overrides }
                  delete next[layerId]
                  return { ...prev, overrides: next }
                },
                '重置图层',
              )
            }
            onResetLayerGroup={() => {
              const front = activeLayerId
                ? ['backBase', 'backEmblem', 'backPrints', 'backText'].includes(activeLayerId)
                : false
              apply(
                (prev) => {
                  const next = { ...prev.overrides }
                  for (const key of Object.keys(next)) {
                    if (front ? ['backBase', 'backEmblem', 'backPrints', 'backText'].includes(key) : !key.startsWith('back')) {
                      delete next[key]
                    }
                  }
                  return { ...prev, overrides: next }
                },
                front ? '重置卡背微调' : '重置卡面微调',
              )
            }}
          />
          <CardSettingsPanel
            card={card}
            draft={draft}
            photos={photos}
            recalculating={recalc.isPending}
            onPatch={(updater, label) => apply(updater, label)}
            onRecalc={() =>
              recalc.mutate(undefined, {
                onSuccess: (updated: Card) => {
                  apply({ stars: updated.stars, atk: updated.atk, def: updated.def, rarity: updated.rarity }, '重算数值')
                  notify.success('已按规则重算', `★ ${updated.stars} · ATK ${updated.atk} · DEF ${updated.def}`)
                },
              })
            }
          />
          <BackPanel draft={draft} photo={photo} onPatch={(updater, label) => apply(updater, label)} />
        </div>
      </div>

      <Dialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        title="导出 PNG"
        description="沿用在编辑器里保存的最终样式，桌面模式下由离屏窗口按档位截图"
        footer={
          <>
            <Button variant="ghost" onClick={() => setExportOpen(false)}>
              取消
            </Button>
            <Button
              disabled={dirty}
              onClick={() => {
                void exportCardPng({
                  id: cardId,
                  face: exportFace,
                  size: exportSize,
                  bleed: exportBleed ? 48 : undefined,
                  debug: exportDebug,
                })
              }}
            >
              导出 {exportFace === 'front' ? '正面' : '背面'} · {exportSize.toUpperCase()}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          {dirty ? (
            <p className="text-caption text-ember">有未保存的改动，先点保存再导出，避免导出的还是旧样式。</p>
          ) : null}
          <div className="flex flex-col gap-2">
            <span className="text-micro text-fog-300">导出面</span>
            <Segmented
              value={exportFace}
              options={[
                { value: 'front', label: '正面' },
                { value: 'back', label: '卡背' },
              ]}
              onValueChange={(value) => setExportFace(value as 'front' | 'back')}
            />
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-micro text-fog-300">尺寸档位</span>
            <Segmented
              value={exportSize}
              options={[
                { value: 'lg', label: 'L · 1000×1458' },
                { value: 'xl', label: 'XL · 1500×2187' },
              ]}
              onValueChange={(value) => setExportSize(value as 'lg' | 'xl')}
            />
          </div>
          <Switch
            label="加出血"
            hint="四周各留 48px，便于打印裁切"
            checked={exportBleed}
            onCheckedChange={setExportBleed}
          />
          <Switch label="调试背景" hint="以深色底导出，便于检查边界" checked={exportDebug} onCheckedChange={setExportDebug} />
        </div>
      </Dialog>
    </div>
  )
}

function clamp(base: number, delta: number): number {
  return Math.round(Math.max(-60, Math.min(60, base + delta)) * 10) / 10
}
